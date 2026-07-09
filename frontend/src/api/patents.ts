import client, { USE_MOCK } from './client';
import type { Patent, PaginatedResponse } from '@/types';

const MOCK_PATENTS: Patent[] = [
  {
    id: '1',
    title: 'Sistema de monitoreo de eficiencia energética industrial',
    patent_number: 'CU2024/0001',
    applicant: 'MINDUS',
    inventor: 'Juan Pérez, María García',
    filing_date: '2024-01-15',
    publication_date: '2024-06-20',
    status: 'granted',
    abstract: 'Sistema integrado de sensores IoT y análisis de datos para monitorear el consumo energético en plantas industriales.',
    technological_sector: 'SID',
    country: 'Cuba',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-06-20T10:00:00Z',
  },
  {
    id: '2',
    title: 'Proceso de reciclaje de residuos metalúrgicos',
    patent_number: 'CU2024/0002',
    applicant: 'Empresa Metalúrgica',
    inventor: 'Carlos López',
    filing_date: '2024-02-20',
    status: 'examination',
    abstract: 'Método innovador para el reciclaje y aprovechamiento de residuos de la industria metalúrgica.',
    technological_sector: 'MET',
    country: 'Cuba',
    created_at: '2024-02-20T10:00:00Z',
    updated_at: '2024-07-01T10:00:00Z',
  },
  {
    id: '3',
    title: 'Dispositivo de control de calidad para producción electrónica',
    patent_number: 'CU2024/0003',
    applicant: 'Centro de Innovación Tecnológica',
    inventor: 'Ana Martínez, Roberto Díaz',
    filing_date: '2024-03-10',
    publication_date: '2024-08-15',
    status: 'filed',
    abstract: 'Dispositivo automatizado para inspección de calidad en líneas de ensamblaje electrónico.',
    technological_sector: 'ELE',
    country: 'Cuba',
    created_at: '2024-03-10T10:00:00Z',
    updated_at: '2024-03-10T10:00:00Z',
  },
  {
    id: '4',
    title: 'Compuesto biodegradable para envases industriales',
    patent_number: 'CU2024/0004',
    applicant: 'Centro de Estudios Ambientales',
    inventor: 'María Rodríguez',
    filing_date: '2024-04-05',
    status: 'granted',
    abstract: 'Desarrollo de un material compuesto biodegradable para la fabricación de envases industriales.',
    technological_sector: 'QUI',
    country: 'Cuba',
    created_at: '2024-04-05T10:00:00Z',
    updated_at: '2024-09-01T10:00:00Z',
  },
  {
    id: '5',
    title: 'Sistema de automatización para procesos agroindustriales',
    patent_number: 'CU2024/0005',
    applicant: 'ICT',
    inventor: 'Pedro Sánchez, Laura Torres',
    filing_date: '2024-05-12',
    publication_date: '2024-10-20',
    status: 'examination',
    abstract: 'Sistema de control automatizado para procesos de la industria agroalimentaria.',
    technological_sector: 'AUT',
    country: 'Cuba',
    created_at: '2024-05-12T10:00:00Z',
    updated_at: '2024-08-01T10:00:00Z',
  },
  {
    id: '6',
    title: 'Sensor de bajo costo para monitoreo de vibraciones',
    patent_number: 'CU2024/0006',
    applicant: 'EDI',
    inventor: 'José García',
    filing_date: '2024-06-01',
    status: 'filed',
    technological_sector: 'ELE',
    country: 'Cuba',
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2024-06-01T10:00:00Z',
  },
];

export async function getPatents(
  page = 1,
  perPage = 20,
  sector?: string,
  status?: string,
  q?: string,
): Promise<PaginatedResponse<Patent>> {
  if (USE_MOCK) {
    let filtered = [...MOCK_PATENTS];
    if (sector) filtered = filtered.filter((p) => p.technological_sector === sector);
    if (status) filtered = filtered.filter((p) => p.status === status);
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.patent_number.toLowerCase().includes(term) ||
          p.applicant.toLowerCase().includes(term),
      );
    }
    return {
      items: filtered,
      total: filtered.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil(filtered.length / perPage),
    };
  }
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (sector) params.set('sector', sector);
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  const res = await client.get<PaginatedResponse<Patent>>(`/patents?${params}`);
  return res.data;
}
