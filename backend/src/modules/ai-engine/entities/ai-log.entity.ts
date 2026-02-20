import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ai_logs')
export class AiLog {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column('text')
  prompt: string;

  @Column('text', { nullable: true })
  response: string;

  @Column('varchar', { nullable: true })
  model: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
