import { Card } from '@/components/ui/card';
import { WifiOff } from 'lucide-react';

export function OfflineFallback() {
  return (
    <Card className="p-8 text-center">
      <WifiOff className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="mb-2 text-xl font-semibold">Sin conexion</h2>
      <p className="text-muted-foreground">
        No hay conexion a internet. Los datos mostrados pueden no estar actualizados.
      </p>
    </Card>
  );
}
