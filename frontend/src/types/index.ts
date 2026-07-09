export type UserRole = 'admin_mindus' | 'rep_cti' | 'analista' | 'cliente' | 'visitante';

export type PatentStatus = 'filed' | 'examination' | 'granted' | 'expired' | 'rejected';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  job_title?: string;
  organization_id?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  nombre: string;
  siglas: string;
  tipo: string;
  sector_codigo?: string;
  pais?: string;
  provincia?: string;
  sitio_web?: string;
  email_contacto?: string;
  created_at: string;
  updated_at: string;
}

export interface Patent {
  id: string;
  title: string;
  patent_number: string;
  applicant: string;
  inventor: string;
  filing_date: string;
  publication_date?: string;
  status: PatentStatus;
  abstract?: string;
  technological_sector?: string;
  country: string;
  technology_id?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface KpiData {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  date: string;
  source: string;
}
