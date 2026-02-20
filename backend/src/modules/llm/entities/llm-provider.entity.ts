import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('llm_providers')
export class LlmProvider {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  /** Nome de exibição (ex: "OpenAI GPT-4o") */
  @Column()
  name: string;

  /** Slug único do provedor (ex: "openai", "openrouter", "anthropic", "groq", "ollama") */
  @Column({ unique: true })
  slug: string;

  /** URL base da API (ex: "https://api.openai.com/v1") */
  @Column()
  base_url: string;

  /** API key encriptada (AES-256-GCM). Null para provedores locais (Ollama) */
  @Column({ nullable: true })
  api_key_encrypted: string;

  /** Modelo padrão para este provedor (ex: "gpt-4o-mini") */
  @Column()
  default_model: string;

  /** Apenas um provedor pode estar ativo por vez */
  @Column({ default: false })
  is_active: boolean;

  /** Configurações extras em JSON (headers, temperature, etc.) */
  @Column({ type: 'jsonb', nullable: true, default: {} })
  extra_config: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
