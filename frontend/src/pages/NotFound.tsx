import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-8">
      <div className="text-border-strong mb-6">
        <Compass className="h-16 w-16" strokeWidth={1.5} />
      </div>
      <p className="text-6xl font-extrabold text-accent-orange mb-2">404</p>
      <h1 className="text-2xl font-bold text-foreground mb-2">Página no encontrada</h1>
      <p className="text-base text-text-muted text-center max-w-sm leading-relaxed mb-8">
        La ruta que buscas no existe o fue movida. Verifica la URL o vuelve al inicio.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver atrás
        </Button>
        <Button onClick={() => navigate('/')}>Ir al inicio</Button>
      </div>
    </div>
  );
}
