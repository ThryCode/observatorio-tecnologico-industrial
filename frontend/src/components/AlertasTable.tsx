import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSeverityColor } from '@/utils/formatters';
import type { Alert } from '@/types';

const defaultAlerts: Alert[] = [
  {
    id: '1',
    title: 'Nueva patente en siderurgia detectada',
    description: 'Se registró una patente internacional en procesos de reducción directa.',
    severity: 'media',
    date: '2026-07-08',
    source: 'Neo4j Graph',
  },
  {
    id: '2',
    title: 'Actualización normativa sector químico',
    description: 'Nueva resolución sobre manejo de sustancias peligrosas publicada.',
    severity: 'alta',
    date: '2026-07-07',
    source: 'Gaceta Oficial',
  },
  {
    id: '3',
    title: 'Indicador de producción supera umbral',
    description: 'El índice de producción metalúrgica superó en 15% la meta trimestral.',
    severity: 'critica',
    date: '2026-07-06',
    source: 'ONEI',
  },
  {
    id: '4',
    title: 'Nueva colaboración CTI identificada',
    description: 'Potencial sinergia entre ICT y EDI en desarrollo de sensores IoT.',
    severity: 'baja',
    date: '2026-07-05',
    source: 'Grafo Conocimiento',
  },
  {
    id: '5',
    title: 'Vencimiento de patente próxima',
    description: 'La patente CU2024/0001 expira en 30 días.',
    severity: 'media',
    date: '2026-07-04',
    source: 'Sistema',
  },
];

interface AlertasTableProps {
  alerts?: Alert[];
}

const severityBadgeVariant: Record<string, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  critica: 'destructive',
  alta: 'warning',
  media: 'default',
  baja: 'secondary',
};

export default function AlertasTable({ alerts }: AlertasTableProps) {
  const items = alerts || defaultAlerts;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Alertas Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alerta</TableHead>
              <TableHead>Severidad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Fuente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-xs text-muted-foreground">{alert.description}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={severityBadgeVariant[alert.severity] || 'secondary'}>
                    {alert.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{alert.date}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{alert.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
