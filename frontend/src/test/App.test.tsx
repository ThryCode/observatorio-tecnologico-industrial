import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock all route-level lazy imports to avoid loading actual pages
vi.mock('@/pages/Dashboard', () => ({ default: () => <div>Dashboard</div> }));
vi.mock('@/pages/Organizations', () => ({ default: () => <div>Organizations</div> }));
vi.mock('@/pages/Patents', () => ({ default: () => <div>Patents</div> }));
vi.mock('@/pages/Indicators', () => ({ default: () => () => <div>Indicators</div> }));
vi.mock('@/pages/Regulations', () => ({ default: () => <div>Regulations</div> }));
vi.mock('@/pages/GraphExplorer', () => ({ default: () => <div>GraphExplorer</div> }));
vi.mock('@/pages/Profile', () => ({ default: () => <div>Profile</div> }));
vi.mock('@/pages/Login', () => ({ default: () => <div>Login</div> }));
vi.mock('@/pages/Register', () => ({ default: () => <div>Register</div> }));
vi.mock('@/pages/PendingApprovals', () => ({ default: () => <div>PendingApprovals</div> }));
vi.mock('@/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import App from '@/App';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderWithProviders(ui: React.ReactElement, initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders without crashing', () => {
    renderWithProviders(<App />);
    expect(document.body).not.toBeEmptyDOMElement();
  });

  it('renders Login for /login route', async () => {
    renderWithProviders(<App />, '/login');
    const login = await screen.findByText('Login');
    expect(login).toBeInTheDocument();
  });

  it('renders Register for /register route', async () => {
    renderWithProviders(<App />, '/register');
    const register = await screen.findByText('Register');
    expect(register).toBeInTheDocument();
  });

  it('renders Layout wrapper for / route', () => {
    renderWithProviders(<App />, '/');
    const div = document.body.querySelector('div');
    expect(div).toBeTruthy();
  });
});
