
import {
  Entity, PrimaryColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Endpoint } from '../../endpoints/entities/endpoint.entity';

export enum CollectionStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
}

@Entity('collected_data')
@Index(['endpoint_id', 'collected_at'])
export class CollectedData {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  endpoint_id: string;

  @ManyToOne(() => Endpoint, (endpoint) => endpoint.collected_data)
  @JoinColumn({ name: 'endpoint_id' })
  endpoint: Endpoint;

  @Column({ type: 'jsonb' })
  raw_data: Record<string, any>; // Resposta bruta da API

  @Column({ type: 'jsonb', nullable: true })
  processed_data: Record<string, any>; // Dados normalizados pós-mapeamento

  @Column({ type: 'jsonb', nullable: true })
  params_used: Record<string, any>; // Ex: { "mes": 1, "ano": 2024 }

  @Column({ type: 'text', nullable: true })
  csv_raw: string; // CSV bruto armazenado para cache

  @Column({ type: 'enum', enum: CollectionStatus })
  status: CollectionStatus;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'timestamp' })
  collected_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
