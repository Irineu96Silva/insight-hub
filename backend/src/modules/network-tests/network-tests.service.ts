import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as net from 'net';
import * as dns from 'dns';
import * as tls from 'tls';
import { NetworkTest, NetworkTestType, NetworkTestStatus } from './entities/network-test.entity';
import { System } from '../systems/entities/system.entity';

@Injectable()
export class NetworkTestsService {
  private readonly logger = new Logger(NetworkTestsService.name);

  constructor(
    @InjectRepository(NetworkTest)
    private testRepo: Repository<NetworkTest>,
    @InjectRepository(System)
    private systemRepo: Repository<System>,
  ) {}

  /**
   * Roda bateria completa de testes para um sistema.
   */
  async runAllTests(systemId: string): Promise<NetworkTest[]> {
    const system = await this.systemRepo.findOne({ where: { id: systemId } });
    if (!system) throw new NotFoundException('Sistema não encontrado');

    const target = system.ip_address || system.base_url;
    if (!target) {
      throw new Error('Sistema não possui IP ou URL configurada para testes.');
    }

    const results: NetworkTest[] = [];

    // HTTP Test
    const httpTarget = system.health_check_url || system.base_url;
    if (httpTarget) {
      results.push(await this.runHttpTest(systemId, httpTarget));
    }

    // Port Test
    if (system.ip_address && system.port) {
      results.push(await this.runPortTest(systemId, system.ip_address, system.port));
    } else if (system.ip_address) {
      results.push(await this.runPortTest(systemId, system.ip_address, 80));
    }

    // DNS Test
    const hostname = this.extractHostname(system.base_url || system.ip_address || '');
    if (hostname && !this.isIpAddress(hostname)) {
      results.push(await this.runDnsTest(systemId, hostname));
    }

    // SSL Test
    if (system.base_url?.startsWith('https://') || system.health_check_url?.startsWith('https://')) {
      const sslHost = this.extractHostname(system.base_url || system.health_check_url || '');
      if (sslHost) {
        results.push(await this.runSslTest(systemId, sslHost));
      }
    }

    return results;
  }

  /**
   * Roda teste individual.
   */
  async runSingleTest(systemId: string, testType: NetworkTestType): Promise<NetworkTest> {
    const system = await this.systemRepo.findOne({ where: { id: systemId } });
    if (!system) throw new NotFoundException('Sistema não encontrado');

    switch (testType) {
      case NetworkTestType.HTTP:
        return this.runHttpTest(systemId, system.health_check_url || system.base_url || '');
      case NetworkTestType.PORT:
        return this.runPortTest(systemId, system.ip_address || this.extractHostname(system.base_url || ''), system.port || 80);
      case NetworkTestType.DNS:
        return this.runDnsTest(systemId, this.extractHostname(system.base_url || system.ip_address || ''));
      case NetworkTestType.SSL:
        return this.runSslTest(systemId, this.extractHostname(system.base_url || ''));
      default:
        throw new Error(`Tipo de teste não suportado: ${testType}`);
    }
  }

  /**
   * Histórico de testes de um sistema.
   */
  async getHistory(systemId: string, limit = 50): Promise<NetworkTest[]> {
    return this.testRepo.find({
      where: { system_id: systemId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Último resultado de cada tipo.
   */
  async getLatest(systemId: string): Promise<NetworkTest[]> {
    const types = Object.values(NetworkTestType);
    const results: NetworkTest[] = [];
    for (const type of types) {
      const latest = await this.testRepo.findOne({
        where: { system_id: systemId, test_type: type },
        order: { created_at: 'DESC' },
      });
      if (latest) results.push(latest);
    }
    return results;
  }

  // =========================================================================
  //  IMPLEMENTAÇÕES DOS TESTES
  // =========================================================================

  private async runHttpTest(systemId: string, url: string): Promise<NetworkTest> {
    const start = Date.now();
    let status = NetworkTestStatus.OK;
    let statusMessage = '';
    let details: Record<string, any> = {};

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true, // Aceita qualquer status
      });
      const elapsed = Date.now() - start;

      details = {
        status_code: response.status,
        response_time_ms: elapsed,
        headers: {
          server: response.headers['server'],
          content_type: response.headers['content-type'],
        },
      };

      if (response.status >= 500) {
        status = NetworkTestStatus.CRITICAL;
        statusMessage = `HTTP ${response.status} — Erro no servidor`;
      } else if (response.status >= 400) {
        status = NetworkTestStatus.WARNING;
        statusMessage = `HTTP ${response.status} — Resposta com erro do cliente`;
      } else if (elapsed > 5000) {
        status = NetworkTestStatus.WARNING;
        statusMessage = `HTTP ${response.status} OK, mas lento (${elapsed}ms)`;
      } else {
        statusMessage = `HTTP ${response.status} OK (${elapsed}ms)`;
      }

      return this.saveResult(systemId, NetworkTestType.HTTP, url, status, elapsed, statusMessage, details);
    } catch (err: any) {
      const elapsed = Date.now() - start;

      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        status = NetworkTestStatus.TIMEOUT;
        statusMessage = 'Timeout — servidor não respondeu em 10s';
      } else if (err.code === 'ECONNREFUSED') {
        status = NetworkTestStatus.CRITICAL;
        statusMessage = 'Conexão recusada — servidor pode estar offline';
      } else if (err.code === 'ENOTFOUND') {
        status = NetworkTestStatus.CRITICAL;
        statusMessage = 'Host não encontrado (DNS falhou)';
      } else {
        status = NetworkTestStatus.CRITICAL;
        statusMessage = `Erro: ${err.message}`;
      }

      details = { error: err.message, code: err.code };
      return this.saveResult(systemId, NetworkTestType.HTTP, url, status, elapsed, statusMessage, details);
    }
  }

  private async runPortTest(systemId: string, host: string, port: number): Promise<NetworkTest> {
    const target = `${host}:${port}`;
    const start = Date.now();

    return new Promise<NetworkTest>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(5000);

      socket.on('connect', () => {
        const elapsed = Date.now() - start;
        socket.destroy();
        resolve(this.saveResult(systemId, NetworkTestType.PORT, target, NetworkTestStatus.OK, elapsed,
          `Porta ${port} aberta (${elapsed}ms)`,
          { host, port, state: 'open' }));
      });

      socket.on('timeout', () => {
        socket.destroy();
        const elapsed = Date.now() - start;
        resolve(this.saveResult(systemId, NetworkTestType.PORT, target, NetworkTestStatus.TIMEOUT, elapsed,
          `Porta ${port} — timeout (possível firewall)`,
          { host, port, state: 'filtered' }));
      });

      socket.on('error', (err: any) => {
        const elapsed = Date.now() - start;
        let status = NetworkTestStatus.CRITICAL;
        let msg = `Porta ${port} fechada: ${err.message}`;
        if (err.code === 'ECONNREFUSED') {
          msg = `Porta ${port} fechada (conexão recusada)`;
        }
        resolve(this.saveResult(systemId, NetworkTestType.PORT, target, status, elapsed, msg,
          { host, port, state: 'closed', error: err.message }));
      });

      socket.connect(port, host);
    });
  }

  private async runDnsTest(systemId: string, hostname: string): Promise<NetworkTest> {
    const start = Date.now();

    return new Promise<NetworkTest>((resolve) => {
      dns.resolve4(hostname, (err, addresses) => {
        const elapsed = Date.now() - start;

        if (err) {
          resolve(this.saveResult(systemId, NetworkTestType.DNS, hostname, NetworkTestStatus.CRITICAL, elapsed,
            `DNS falhou: ${err.message}`,
            { error: err.message, code: err.code }));
        } else {
          resolve(this.saveResult(systemId, NetworkTestType.DNS, hostname, NetworkTestStatus.OK, elapsed,
            `DNS resolvido para ${addresses.join(', ')} (${elapsed}ms)`,
            { addresses, ttl: null }));
        }
      });
    });
  }

  private async runSslTest(systemId: string, hostname: string): Promise<NetworkTest> {
    const start = Date.now();

    return new Promise<NetworkTest>((resolve) => {
      const socket = tls.connect(443, hostname, { servername: hostname }, () => {
        const elapsed = Date.now() - start;
        const cert = socket.getPeerCertificate();
        socket.destroy();

        const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
        const daysLeft = validTo ? Math.ceil((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

        let status = NetworkTestStatus.OK;
        let msg = `SSL válido`;

        if (daysLeft !== null) {
          if (daysLeft < 0) {
            status = NetworkTestStatus.CRITICAL;
            msg = `Certificado SSL EXPIRADO há ${Math.abs(daysLeft)} dias`;
          } else if (daysLeft < 30) {
            status = NetworkTestStatus.WARNING;
            msg = `Certificado SSL expira em ${daysLeft} dias`;
          } else {
            msg = `SSL válido — expira em ${daysLeft} dias`;
          }
        }

        resolve(this.saveResult(systemId, NetworkTestType.SSL, hostname, status, elapsed, msg, {
          subject: cert.subject,
          issuer: cert.issuer,
          valid_from: cert.valid_from,
          valid_to: cert.valid_to,
          days_remaining: daysLeft,
        }));
      });

      socket.setTimeout(10000);
      socket.on('timeout', () => {
        socket.destroy();
        const elapsed = Date.now() - start;
        resolve(this.saveResult(systemId, NetworkTestType.SSL, hostname, NetworkTestStatus.TIMEOUT, elapsed,
          'SSL timeout — não foi possível conectar',
          { error: 'timeout' }));
      });
      socket.on('error', (err: any) => {
        const elapsed = Date.now() - start;
        resolve(this.saveResult(systemId, NetworkTestType.SSL, hostname, NetworkTestStatus.CRITICAL, elapsed,
          `SSL falhou: ${err.message}`,
          { error: err.message }));
      });
    });
  }

  // =========================================================================
  //  UTILS
  // =========================================================================

  private async saveResult(
    systemId: string,
    testType: NetworkTestType,
    target: string,
    status: NetworkTestStatus,
    responseTime: number,
    statusMessage: string,
    details: Record<string, any>,
  ): Promise<NetworkTest> {
    const test = this.testRepo.create({
      system_id: systemId,
      test_type: testType,
      target,
      status,
      response_time_ms: responseTime,
      status_message: statusMessage,
      details,
    });
    this.logger.log(`[${testType}] ${target} → ${status} (${responseTime}ms) — ${statusMessage}`);
    return this.testRepo.save(test);
  }

  private extractHostname(url: string): string {
    try {
      if (!url.includes('://')) url = 'http://' + url;
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  private isIpAddress(str: string): boolean {
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(str);
  }
}
