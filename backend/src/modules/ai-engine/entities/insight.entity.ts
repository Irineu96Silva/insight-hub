
import {
  Entity, PrimaryColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { System } from '../../systems/entities/system.entity';
import { Endpoint } from '../../endpoints/entities/endpoint.entity';

export enum InsightType {
  ANALYSIS = 'analysis',       // Análise geral dos dados
  COMPARISON = 'comparison',   // Comparativo entre unidades/períodos
  ANOMALY = 'anomaly',        // Detecção de anomalias
  FORECAST = 'forecast',      // Previsões/tendências
  CUSTOM = 'custom',          // Pergunta livre do usuário
}

export enum InsightSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  SUCCESS = 'success',
}

@Entity('insights')
export class Insight {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ nullable: true })
  system_id: string;

  @ManyToOne(() => System, { nullable: true })
  @JoinColumn({ name: 'system_id' })
  system: System;

  @Column({ nullable: true })
  endpoint_id: string;

  @ManyToOne(() => Endpoint, { nullable: true })
  @JoinColumn({ name: 'endpoint_id' })
  endpoint: Endpoint;

  @Column({ type: 'enum', enum: InsightType })
  type: InsightType;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'text' })
  content: string; // Resposta formatada da IA (Markdown)

  @Column({ type: 'enum', enum: InsightSeverity, default: InsightSeverity.INFO })
  severity: InsightSeverity;

  @Column({ type: 'jsonb', nullable: true })
  data_snapshot: Record<string, any>; // Snapshot dos dados usados na análise

  @Column({ type: 'text', nullable: true })
  prompt_used: string; // Prompt enviado ao OpenRouter

  @Column({ length: 50 })
  model_used: string; // Ex: "llama3.1"

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
