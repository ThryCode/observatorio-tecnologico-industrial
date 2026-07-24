import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSeverityColor } from '@/utils/formatters';
import type { Alert } from '@/types';

const defaultAlerts: Alert[] = [
  { id: '1', titulo: 'Nueva patente en siderurgia detectada', descripcion: 'Se registró una patente internacional en procesos de reducción directa.', severidad: 'media', fecha: '2026-07-08', leida: false },
  { id: '2', titulo: 'Actualización normativa sector químico', descripcion: 'Nueva resolución sobre manejo de sustancias peligrosas publicada.', severidad: 'alta', fecha: '2026-07-07', leida: false },
  { id: '3', titulo: 'Indicador de producción supera umbral', descripcion: 'El índice de producción metalúrgica superó en 15% la meta trimestral.', severidad: 'alta', fecha: '2026-07-06', leida: false },
  { id: '4', titulo: 'Nueva colaboración CTI identificada', descripcion: 'Potencial sinergia entre ICT y EDI en desarrollo de sensores IoT.', severidad: 'baja', fecha: '2026-07-05', leida: false },
  { id: '5', titulo: 'Vencimiento de patente próxima', descripcion: 'La patente CU2024/0001 expira en 30 días.', severidad: 'media', fecha: '2026-07-04', leida: false },
];

interface AlertasTableProps {
  alerts?: Alert[];
}

const severityBadgeVariant: Record<string, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  alta: 'destructive',
  media: 'warning',
  baja: 'default',
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
              <TableHead>Sector</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <div className="font-medium">{alert.titulo}</div>
                  <div className="text-xs text-muted-foreground">{alert.descripcion}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={severityBadgeVariant[alert.severidad] || 'secondary'}>
                    {alert.severidad}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{alert.fecha}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{alert.sector || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
