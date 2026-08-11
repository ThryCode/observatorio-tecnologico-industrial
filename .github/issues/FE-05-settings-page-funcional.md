# FE-05: SettingsPage — Hacer Funcional

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `ux`, `enhancement`
**Agente:** frontend-coder + backend-coder
**Dependencias:** FE-02 (sistema toast)
**Estimación:** 3 días

---

## Descripción

`SettingsPage.tsx` es actualmente un mockup estático. El selector de idioma no está conectado a i18n, los toggles no se persisten, y los botones de seguridad muestran `alert()`. Se necesita hacer esta página completamente funcional.

## Problema Actual

- Language selector: sin conexión a i18n (solo muestra opciones)
- Email notifications toggle: no se persiste
- Data sources: hardcoded
- System info: muestra "PostgreSQL 15" (debería ser SQLite)
- Security buttons: `alert("Función próximamente")`
- Sin API backend para configuración de usuario

## Solución Propuesta

### Fase 1: Backend — Endpoint de configuración

```python
# backend/app/api/v1/settings.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserSettingsUpdate, UserSettingsResponse

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/me", response_model=UserSettingsResponse)
async def get_my_settings(
    current_user: User = Depends(get_current_user),
):
    return UserSettingsResponse(
        language=current_user.language or "es",
        email_notifications=current_user.email_notifications,
        theme=current_user.theme or "light",
    )

@router.put("/me", response_model=UserSettingsResponse)
async def update_my_settings(
    data: UserSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.language is not None:
        current_user.language = data.language
    if data.email_notifications is not None:
        current_user.email_notifications = data.email_notifications
    if data.theme is not None:
        current_user.theme = data.theme
    await db.commit()
    return UserSettingsResponse(
        language=current_user.language,
        email_notifications=current_user.email_notifications,
        theme=current_user.theme,
    )
```

### Fase 2: Migration — Agregar campos al modelo User

```python
# Nueva migración Alembic
def upgrade():
    op.add_column("users", sa.Column("language", sa.String(5), server_default="es"))
    op.add_column("users", sa.Column("email_notifications", sa.Boolean(), server_default="true"))
    op.add_column("users", sa.Column("theme", sa.String(20), server_default="light"))
```

### Fase 3: Frontend — SettingsPage funcional

```tsx
// frontend/src/pages/SettingsPage.tsx
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/useToast"
import { apiClient } from "@/api/client"
import { PageHeader } from "@/components/PageHeader"
import { Globe, Bell, Shield, Database } from "lucide-react"

export function SettingsPage() {
  const { success, error } = useToast()
  const queryClient = useQueryClient()

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiClient.get("/settings/me"),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put("/settings/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
      success("Configuración actualizada")
    },
    onError: () => error("Error al actualizar configuración"),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" />
      
      {/* Idioma */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Idioma</h3>
        </div>
        <Select
          value={settings?.language || "es"}
          onValueChange={(v) => updateMutation.mutate({ language: v })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="es">Español</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Notificaciones */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Notificaciones</h3>
        </div>
        <div className="flex items-center justify-between">
          <Label>Notificaciones por email</Label>
          <Switch
            checked={settings?.email_notifications ?? true}
            onCheckedChange={(v) => updateMutation.mutate({ email_notifications: v })}
          />
        </div>
      </Card>

      {/* Sistema */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Sistema</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Base de datos: SQLite</p>
          <p>Grafo: Neo4j 5.26</p>
          <p>Caché: Redis 5.0</p>
          <p>Versión: v2.4.0</p>
        </div>
      </Card>
    </div>
  )
}
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `backend/app/models/user.py` | Agregar campos `language`, `email_notifications`, `theme` |
| `backend/app/schemas/user.py` | Crear `UserSettingsUpdate`, `UserSettingsResponse` |
| `backend/app/api/v1/settings.py` | **Crear** endpoint de configuración |
| `backend/app/api/v1/router.py` | Registrar router de settings |
| `backend/alembic/versions/` | Nueva migración para campos |
| `frontend/src/pages/SettingsPage.tsx` | Reescritura completa |
| `frontend/src/api/settings.ts` | **Crear** API client para settings |
| `frontend/src/hooks/useSettings.ts` | **Crear** hook TanStack Query |

## Criterios de Aceptación

- [ ] Endpoint GET /settings/me retorna configuración del usuario
- [ ] Endpoint PUT /settings/me actualiza configuración
- [ ] Migración crea campos language, email_notifications, theme
- [ ] Selector de idioma funciona (guarda en backend)
- [ ] Toggle de notificaciones funciona (guarda en backend)
- [ ] System info muestra "SQLite" (no PostgreSQL)
- [ ] Botones de seguridad muestran toast (no alert())
- [ ] Toast muestra éxito/error tras guardar
- [ ] Configuración persiste entre sesiones
- [ ] `ruff check backend/` pasa
- [ ] `npm run lint` pasa
- [ ] `pytest -v` pasa (tests del endpoint)

## Notas para el Agente

- **Backend:** Seguir patrón de `auth.py` para el endpoint
- **Frontend:** Seguir patrón de `Profile.tsx` para formularios
- Los campos son opcionales (nullable en DB)
- No implementar i18n real aquí — solo guardar la preferencia
- El toggle de theme (dark mode) se implementa en FE-13
