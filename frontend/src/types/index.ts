
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'dev' | 'viewer';
  is_active: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface System {
  id: string;
  name: string;
  slug: string;
  description?: string;
  base_url?: string;
  // Empresa
  company_name?: string;
  cnpj?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  // Infraestrutura
  ip_address?: string;
  port?: number;
  health_check_url?: string;
  environment?: 'production' | 'staging' | 'development';
  criticality?: 'low' | 'medium' | 'high' | 'critical';
  // SLA
  sla_uptime?: number;
  sla_response_time_ms?: number;
  business_hours?: string;
  notes?: string;
  tags?: string[];
  // Auth
  auth_type?: string;
  auth_config?: Record<string, any>;
  // Status
  is_active: boolean;
  created_at: string;
}

export interface Endpoint {
  id: string;
  system_id: string;
  name: string;
  description?: string;
  url_template: string;
  method: string;
  params_schema?: Record<string, any>;
  response_mapping?: Record<string, any>;
  response_type?: 'json' | 'csv';
  schedule_cron?: string;
  is_active: boolean;
  last_collected_at?: string;
  system?: System;
}

export interface SystemFile {
  id: string;
  system_id: string;
  filename: string;
  original_name: string;
  mimetype?: string;
  size?: number;
  description?: string;
  uploaded_at: string;
}

export interface CollectedData {
  id: string;
  endpoint_id: string;
  endpoint?: { id: string; name: string; response_type?: string };
  raw_data: Record<string, any>;
  processed_data?: Record<string, any>;
  params_used?: Record<string, any>;
  csv_raw?: string;
  status: 'success' | 'error' | 'pending';
  error_message?: string;
  collected_at: string;
}

export interface Insight {
  id: string;
  system_id?: string;
  endpoint_id?: string;
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  type: 'analysis' | 'comparison' | 'anomaly' | 'forecast' | 'custom' | 'performance' | 'security' | 'optimization' | 'info' | 'generated';
  created_at: string;
  is_read?: boolean;
  system?: { id: string; name: string };
  endpoint?: { id: string; name: string };
  data_snapshot?: any;
}
