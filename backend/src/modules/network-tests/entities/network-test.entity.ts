import {
  Entity, PrimaryColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { System } from '../../systems/entities/system.entity';

export enum NetworkTestType {
  HTTP = 'HTTP',
  PORT = 'PORT',
  DNS = 'DNS',
  SSL = 'SSL',
}

export enum NetworkTestStatus {
  OK = 'OK',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  TIMEOUT = 'TIMEOUT',
}

@Entity('network_tests')
export class NetworkTest {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  system_id: string;

  @ManyToOne(() => System, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'system_id' })
  system: System;

  @Column({ type: 'enum', enum: NetworkTestType })
  test_type: NetworkTestType;

  @Column({ length: 300 })
  target: string; // IP ou URL testado

  @Column({ type: 'enum', enum: NetworkTestStatus })
  status: NetworkTestStatus;

  @Column({ type: 'int', nullable: true })
  response_time_ms: number;

  @Column({ type: 'text', nullable: true })
  status_message: string; // Mensagem resumida

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>; // Resultado detalhado

  @CreateDateColumn()
  created_at: Date;
}
