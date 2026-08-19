import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { full_name: 'Test User', username: 'testuser', role: 'admin_mindus' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'sidebar.dashboard': 'Dashboard',
        'sidebar.tecnologias': 'Tecnologías',
        'sidebar.patentes': 'Patentes',
        'sidebar.entidadesCti': 'Entidades CTI',
        'sidebar.alertas': 'Alertas',
        'sidebar.boletines': 'Boletines',
        'sidebar.observatorio': 'Observatorio',
        'sidebar.observatorioSubtitle': 'MINDUS',
        'sidebar.principal': 'Principal',
        'sidebar.inteligencia': 'Inteligencia',
        'sidebar.organizacion': 'Organización',
        'sidebar.publicaciones': 'Publicaciones',
        'sidebar.grafoConocimiento': 'Grafo de Conocimiento',
        'sidebar.analisisCompetitividad': 'Análisis de Competitividad',
        'sidebar.mapasPatentes': 'Mapas de Patentes',
        'sidebar.redProfesional': 'Red Profesional',
        'sidebar.miEmpresa': 'Mi Empresa',
        'sidebar.grafoEmpresarial': 'Grafo Empresarial',
        'sidebar.solicitudes': 'Solicitudes',
        'sidebar.configuracion': 'Configuración',
        'sidebar.abrirMenu': 'Abrir menú',
        'sidebar.cerrarMenu': 'Cerrar menú',
        'sidebar.expandirMenu': 'Expandir menú',
        'sidebar.colapsarMenu': 'Colapsar menú',
      };
      return translations[key] || key;
    },
    language: 'es',
  }),
}));

vi.mock('@/hooks/useAlerts', () => ({
  useAlerts: () => ({ data: { items: [] } }),
}));

vi.mock('@/hooks/usePatents', () => ({
  usePatents: () => ({ data: { total: 0 } }),
}));

import Sidebar from '@/components/Sidebar';

describe('Sidebar', () => {
  it('renders observatory title', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Observatorio')).toBeInTheDocument();
  });

  it('renders main navigation items', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tecnologías')).toBeInTheDocument();
    expect(screen.getByText('Patentes')).toBeInTheDocument();
  });

  it('renders intelligence nav items', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Alertas')).toBeInTheDocument();
    expect(screen.getByText('Boletines')).toBeInTheDocument();
  });

  it('renders organization nav items', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Entidades CTI')).toBeInTheDocument();
  });

  it('renders user info', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('highlights active route', () => {
    render(<MemoryRouter initialEntries={['/technologies']}><Sidebar /></MemoryRouter>);
    const techLink = screen.getByText('Tecnologías').closest('a');
    expect(techLink).toHaveAttribute('aria-current', 'page');
  });
});
