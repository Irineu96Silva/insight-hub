
import {
  Entity, PrimaryColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn
} from 'typeorm';
import { System } from '../../systems/entities/system.entity';
import { CollectedData } from '../../data-collector/entities/collected-data.entity';

@Entity('endpoints')
export class Endpoint {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  system_id: string;

  @ManyToOne(() => System, (system) => system.endpoints)
  @JoinColumn({ name: 'system_id' })
  system: System;

  @Column({ length: 100 })
  name: string; // Ex: "Cartões Ativos"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500 })
  url_template: string;
  // Ex: "/ords/gx360_prd/mensageiro/cartoes-ativos/:mes/:ano"
  // Parâmetros dinâmicos são representados por :param

  @Column({ length: 10, default: 'GET' })
  method: string;

  @Column({ type: 'jsonb', nullable: true })
  params_schema: Record<string, any>;
  // Define os parâmetros dinâmicos e seus tipos
  // Ex: { "mes": { "type": "number", "description": "Mês (1-12)" },
  //       "ano": { "type": "number", "description": "Ano (ex: 2024)" } }

  @Column({ type: 'jsonb', nullable: true })
  response_mapping: Record<string, any>;
  // Mapeamento de campos da resposta para nomes amigáveis
  // Ex: { "data_field": "items", "label_field": "unidade", "value_field": "total" }

  @Column({ length: 50, nullable: true })
  schedule_cron: string; // Ex: "0 */6 * * *" (a cada 6 horas)

  @Column({ length: 10, default: 'json' })
  response_type: string; // 'json' ou 'csv'

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_collected_at: Date;

  @OneToMany(() => CollectedData, (data) => data.endpoint)
  collected_data: CollectedData[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
