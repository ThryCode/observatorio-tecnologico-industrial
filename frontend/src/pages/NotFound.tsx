import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="mx-auto max-w-md p-8 text-center">
        <div className="mb-4 text-6xl font-bold text-muted-foreground">404</div>
        <h1 className="mb-2 text-2xl font-bold">Página no encontrada</h1>
        <p className="mb-6 text-muted-foreground">
          La página que busca no existe o fue movida a otra ubicación.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
