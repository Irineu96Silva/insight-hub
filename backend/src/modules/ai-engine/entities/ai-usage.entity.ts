import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ai_usage')
export class AiUsage {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column('int')
  tokensUsed: number;

  @Column('decimal', { precision: 10, scale: 6 })
  estimatedCost: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
