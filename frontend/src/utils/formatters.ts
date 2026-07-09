export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-ES').format(num);
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    filed: 'bg-blue-100 text-blue-800',
    examination: 'bg-yellow-100 text-yellow-800',
    granted: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    baja: 'bg-green-100 text-green-800 border-green-300',
    media: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    alta: 'bg-orange-100 text-orange-800 border-orange-300',
    critica: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
}
