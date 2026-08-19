import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when isLoading', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true, user: null });
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, user: null });
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: 'admin_mindus' } });
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects when role not in requiredRoles', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: 'visitante' } });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute requiredRoles={['admin_mindus']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children when role matches requiredRoles', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: 'admin_mindus' } });
    render(
      <MemoryRouter>
        <ProtectedRoute requiredRoles={['admin_mindus']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
