import PageHeader from '@/components/PageHeader';
import EntityTable from '@/components/EntityTable';

const networkEntities = [
  { id: '1', name: 'Dr. María García López', initials: 'MG', type: 'Directora de I+D — ICT', status: 'active' as const, progress: 95 },
  { id: '2', name: 'Ing. Carlos Pérez Rodríguez', initials: 'CP', type: 'Jefe de Innovación — EDI', status: 'active' as const, progress: 88 },
  { id: '3', name: 'MSc. Ana Martínez Ruiz', initials: 'AM', type: 'Investigadora Senior — CIB', status: 'active' as const, progress: 82 },
  { id: '4', name: 'Dr. Roberto Díaz Sánchez', initials: 'RD', type: 'Director Técnico — LMA', status: 'pending' as const, progress: 60 },
  { id: '5', name: 'Ing. Laura Torres Vega', initials: 'LT', type: 'Especialista CTI — MINDUS', status: 'active' as const, progress: 91 },
  { id: '6', name: 'MSc. José Hernández Cruz', initials: 'JH', type: 'Coordinador de Proyectos — OCyT', status: 'inactive' as const, progress: 45 },
];

export default function Network() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Red Profesional CTI"
        highlight="Profesional"
        description="Directorio de profesionales, investigadores y gestores de ciencia, tecnología e innovación del ecosistema industrial."
      />
      <div className="bg-surface rounded-lg border border-border">
        <EntityTable entities={networkEntities} />
      </div>
    </div>
  );
}
