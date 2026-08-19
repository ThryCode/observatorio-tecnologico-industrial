import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KPICard from '@/components/KPICard';
import { Users } from 'lucide-react';

describe('KPICard', () => {
  it('renders label and value', () => {
    render(<KPICard label="Organizaciones" value="42" icon={<Users />} />);
    expect(screen.getByText('Organizaciones')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders change with positive type', () => {
    render(<KPICard label="Test" value="10" change="+5%" changeType="positive" icon={<Users />} />);
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('renders change with negative type', () => {
    render(<KPICard label="Test" value="10" change="-3%" changeType="negative" icon={<Users />} />);
    expect(screen.getByText('-3%')).toBeInTheDocument();
  });

  it('renders change with neutral type', () => {
    render(<KPICard label="Test" value="10" change="0%" changeType="neutral" icon={<Users />} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('does not render change when not provided', () => {
    render(<KPICard label="Test" value="10" icon={<Users />} />);
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(<KPICard label="Patentes" value="150" icon={<Users />} />);
    expect(screen.getByRole('region', { name: 'Patentes: 150' })).toBeInTheDocument();
  });
});
