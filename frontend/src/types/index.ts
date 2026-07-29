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
  account_type?: string;
  status?: string;
  rejection_reason?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  professional_profile?: ProfessionalProfile;
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
  fecha_creacion?: string;
  contacto?: string;
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

export type AccountType = 'representante' | 'analista' | 'profesional';

export interface ProfessionalProfile {
  id: string;
  user_id: string;
  especialidad: string;
  grado_cientifico?: string;
  cv_url?: string;
  biografia?: string;
  intereses?: string[];
}

export interface RegisterRequest {
  account_type: AccountType;
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  job_title: string;
  organization_id?: string;
  new_organization_name?: string;
  new_organization_siglas?: string;
  sector_codigo?: string;
  especialidad?: string;
  grado_cientifico?: string;
}

export interface RejectRequest {
  reason: string;
}

export interface PendingUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  account_type?: string;
  phone?: string;
  job_title?: string;
  organization_id?: string;
  status: string;
  rejection_reason?: string;
  approved_at?: string;
  created_at: string;
}

export interface KpiData {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
}

export type IndicatorPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface Indicator {
  id: string;
  name: string;
  code: string;
  description?: string;
  unit: string;
  value: number;
  source: string;
  period: IndicatorPeriod;
  sector_codigo?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export type RegulationCategory = 'law' | 'decree' | 'resolution' | 'standard' | 'other';

export interface Regulation {
  id: string;
  title: string;
  regulation_number: string;
  issuing_body: string;
  publication_date: string;
  effective_date?: string;
  category: RegulationCategory;
  summary?: string;
  full_text_url?: string;
  sector_codigo?: string;
  created_at: string;
  updated_at: string;
}

export interface Technology {
  id: string;
  nombre: string;
  descripcion?: string;
  trl_nivel?: number;
  sector_codigo?: string;
  palabras_clave?: string[];
  referencia_ontologia?: string;
  created_at: string;
  updated_at: string;
}

export interface IndustrialSector {
  codigo: string;
  nombre: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
}

export interface GraphStat {
  label: string;
  count: number;
}

export interface EnterpriseGraphNode {
  id: string;
  type: "person" | "organization";
  label: string;
  role?: string;
  org_id?: string;
  siglas?: string;
}

export interface EnterpriseGraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface EnterpriseGraphResponse {
  nodes: EnterpriseGraphNode[];
  edges: EnterpriseGraphEdge[];
}

export interface FollowCountResponse {
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export interface ProfessionalListItem {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone?: string;
  job_title?: string;
  organization_id?: string;
  profile?: ProfessionalProfile;
}

export interface Alert {
  id: string;
  titulo: string;
  descripcion: string;
  severidad: 'alta' | 'media' | 'baja';
  fecha: string;
  sector?: string;
  leida: boolean;
}

export interface Bulletin {
  id: string;
  titulo: string;
  resumen: string;
  fecha: string;
  categoria: string;
  autor?: string;
  url?: string;
}

export interface CompetitivenessData {
  sector: string;
  puntaje: number;
  variacion: number;
  indicadores: { nombre: string; valor: number }[];
}

export interface ResearchPublication {
  id: string;
  titulo: string;
  autores: string;
  resumen?: string;
  doi?: string;
  journal?: string;
  fecha_publicacion: string;
  palabras_clave?: string[];
  sector_codigo?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

export interface PatentMapSummary {
  tecnologia: string;
  cantidad: number;
  tendencia: 'creciente' | 'estable' | 'decreciente';
}

export interface DashboardKPI {
  label: string;
  value: number;
  unit: string;
  change: number;
  icon: string;
}

export interface TimelineEvent {
  id: string;
  fecha: string;
  titulo: string;
  tipo: 'patente' | 'regulacion' | 'indicador' | 'alerta';
}
