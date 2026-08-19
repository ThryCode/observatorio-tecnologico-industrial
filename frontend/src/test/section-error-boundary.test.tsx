import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

function ThrowError() {
  throw new Error('Test error');
}

describe('SectionErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <SectionErrorBoundary>
        <div>Content</div>
      </SectionErrorBoundary>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders fallback when error occurs', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SectionErrorBoundary title="Test Section">
        <ThrowError />
      </SectionErrorBoundary>,
    );
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('renders default title when no title prop', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SectionErrorBoundary>
        <ThrowError />
      </SectionErrorBoundary>,
    );
    expect(screen.getByText('Error en esta sección')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('renders error message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SectionErrorBoundary>
        <ThrowError />
      </SectionErrorBoundary>,
    );
    expect(screen.getByText(/No se pudo cargar esta información/)).toBeInTheDocument();
    spy.mockRestore();
  });
});
