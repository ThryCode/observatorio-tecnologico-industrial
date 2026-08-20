import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'notFound.title': 'Página no encontrada',
        'notFound.message': 'La página que busca no existe o ha sido movida.',
        'notFound.back': 'Volver',
        'notFound.dashboard': 'Dashboard',
      };
      return translations[key] ?? key;
    },
    language: 'es',
    toggleLanguage: vi.fn(),
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

import { NotFound } from '@/pages/NotFound';

describe('NotFound', () => {
  it('renders 404 text', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders page title', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    expect(screen.getByText(/La página que busca no existe/)).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
  });

  it('renders dashboard button', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
  });
});
