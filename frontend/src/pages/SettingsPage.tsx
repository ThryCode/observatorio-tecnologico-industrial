import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración del Sistema"
        highlight="Configuración"
        description="Administración de preferencias, usuarios, fuentes de datos y parámetros del observatorio."
        actions={
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            Guardar Cambios
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Preferencias Generales</h3>
            <p className="text-sm text-text-muted mb-4">Configuración de idioma, notificaciones y apariencia.</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Idioma del sistema</p>
                  <p className="text-xs text-text-muted">Idioma predeterminado para la interfaz</p>
                </div>
                <select className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground">
                  <option>Español</option>
                  <option>English</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border-subtle">
                <div>
                  <p className="text-sm font-medium text-foreground">Notificaciones por correo</p>
                  <p className="text-xs text-text-muted">Recibir alertas por correo electrónico</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-border-subtle rounded-full peer peer-checked:bg-accent-orange peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border-subtle">
                <div>
                  <p className="text-sm font-medium text-foreground">Frecuencia de resúmenes</p>
                  <p className="text-xs text-text-muted">Resumen periódico de actividad</p>
                </div>
                <select className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground">
                  <option>Diario</option>
                  <option>Semanal</option>
                  <option>Mensual</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Fuentes de Datos</h3>
            <p className="text-sm text-text-muted mb-4">Gestión de fuentes para la vigilancia tecnológica.</p>
            <div className="space-y-3">
              {['Oficina Cubana de Propiedad Industrial (OCPI)', 'Gaceta Oficial de Cuba', 'ONEI', 'WIPO Patent Database', 'SciELO Cuba'].map((source) => (
                <div key={source} className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">{source}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success-bg text-success">Activa</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Información del Sistema</h3>
            <p className="text-sm text-text-muted mb-4">Estado y versión del observatorio.</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Versión</span><span className="font-mono text-foreground">1.0.0</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Base de datos</span><span className="text-foreground">PostgreSQL 15</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Grafo</span><span className="text-foreground">Neo4j 5.26</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Cache</span><span className="text-foreground">Redis 5.0</span></div>
              <div className="flex justify-between py-2 border-t border-border-subtle"><span className="text-text-muted">Estado</span><span className="text-success font-semibold">Operacional</span></div>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Seguridad</h3>
            <p className="text-sm text-text-muted mb-4">Gestión de acceso y autenticación.</p>
            <div className="space-y-3">
              <Button variant="secondary" size="sm" className="w-full justify-start">Cambiar contraseña</Button>
              <Button variant="secondary" size="sm" className="w-full justify-start">Gestión de sesiones</Button>
              <Button variant="secondary" size="sm" className="w-full justify-start">Logs de acceso</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
