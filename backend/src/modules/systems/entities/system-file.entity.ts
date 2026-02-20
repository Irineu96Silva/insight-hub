
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { System } from './system.entity';

@Entity('system_files')
export class SystemFile {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  system_id: string;

  @ManyToOne(() => System, (system) => system.files)
  @JoinColumn({ name: 'system_id' })
  system: System;

  @Column({ length: 255 })
  filename: string; // disk name

  @Column({ length: 255 })
  original_name: string; // user upload name

  @Column({ length: 100, nullable: true })
  mimetype: string;

  @Column({ type: 'int', nullable: true })
  size: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  uploaded_at: Date;
}
