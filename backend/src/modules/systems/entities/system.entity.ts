
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Endpoint } from '../../endpoints/entities/endpoint.entity';
import { SystemFile } from './system-file.entity';

export enum AuthType {
  NONE = 'none',
  API_KEY = 'api_key',
  BEARER = 'bearer',
  BASIC = 'basic',
}

export enum SystemEnvironment {
  PRODUCTION = 'production',
  STAGING = 'staging',
  DEVELOPMENT = 'development',
}

export enum SystemCriticality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('systems')
export class System {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  // ── Dados Básicos ──
  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 50 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  base_url: string;

  // ── Dados da Empresa ──
  @Column({ length: 200, nullable: true })
  company_name: string;

  @Column({ length: 20, nullable: true })
  cnpj: string;

  @Column({ length: 150, nullable: true })
  contact_name: string;

  @Column({ length: 200, nullable: true })
  contact_email: string;

  @Column({ length: 30, nullable: true })
  contact_phone: string;

  // ── Infraestrutura ──
  @Column({ length: 100, nullable: true })
  ip_address: string;

  @Column({ type: 'int', nullable: true })
  port: number;

  @Column({ length: 500, nullable: true })
  health_check_url: string;

  @Column({ type: 'enum', enum: SystemEnvironment, nullable: true })
  environment: SystemEnvironment;

  @Column({ type: 'enum', enum: SystemCriticality, nullable: true })
  criticality: SystemCriticality;

  // ── SLA & Regras ──
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sla_uptime: number;

  @Column({ type: 'int', nullable: true })
  sla_response_time_ms: number;

  @Column({ length: 100, nullable: true })
  business_hours: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  // ── Autenticação ──
  @Column({ type: 'enum', enum: AuthType, default: AuthType.NONE })
  auth_type: AuthType;

  @Column({ type: 'jsonb', nullable: true })
  auth_config: Record<string, any>;

  // ── Status ──
  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Endpoint, (endpoint) => endpoint.system)
  endpoints: Endpoint[];

  @OneToMany(() => SystemFile, (file) => file.system)
  files: SystemFile[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
