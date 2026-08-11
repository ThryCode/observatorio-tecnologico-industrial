# FE-14: i18n Framework (es/en)

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `enhancement`
**Agente:** frontend-coder
**Dependencias:** FE-05 (SettingsPage funcional), FE-13 (dark mode)
**Estimación:** 5 días

---

## Descripción

La aplicación tiene un selector de idioma en SettingsPage pero no está conectado a ningún sistema de internacionalización. Se necesita implementar i18n para soporte español/inglés, ya que la plataforma podría ser usada por organismos internacionales.

## Problema Actual

- Selector de idioma existe pero no funciona
- Todos los textos están hardcodeados en español
- Sin traducciones para contenido dinámico
- Sin date formatting localizado

## Solución Propuesta

### 1. Instalar react-i18next

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

### 2. Configurar i18n

```typescript
// frontend/src/i18n.ts
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import es from "./locales/es.json"
import en from "./locales/en.json"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: "es",
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
```

### 3. Archivos de traducción

```json
// frontend/src/locales/es.json
{
  "nav": {
    "dashboard": "Dashboard",
    "organizations": "Organizaciones",
    "technologies": "Tecnologías",
    "patents": "Patentes",
    "indicators": "Indicadores",
    "regulations": "Normativas",
    "graph": "Grafo",
    "alerts": "Alertas",
    "bulletins": "Boletines",
    "publications": "Publicaciones",
    "settings": "Configuración"
  },
  "common": {
    "search": "Buscar",
    "create": "Crear",
    "edit": "Editar",
    "delete": "Eliminar",
    "save": "Guardar",
    "cancel": "Cancelar",
    "loading": "Cargando...",
    "noData": "No hay datos",
    "error": "Error",
    "success": "Éxito"
  }
}
```

### 4. Uso en componentes

```tsx
import { useTranslation } from "react-i18next"

function MyComponent() {
  const { t } = useTranslation()
  
  return <h1>{t("nav.dashboard")}</h1>
}
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/package.json` | Agregar dependencias i18n |
| `frontend/src/i18n.ts` | **Crear** configuración |
| `frontend/src/locales/es.json` | **Crear** traducciones español |
| `frontend/src/locales/en.json` | **Crear** traducciones inglés |
| `frontend/src/main.tsx` | Importar i18n |
| `frontend/src/components/Sidebar.tsx` | Usar t() para nav items |
| `frontend/src/components/Header.tsx` | Usar t() para header |
| `frontend/src/pages/*.tsx` | Migrar textos hardcodeados |

## Criterios de Aceptación

- [ ] react-i18next instalado y configurado
- [ ] Traducciones ES y EN completas para nav y common
- [ ] Sidebar usa t() para todos los items
- [ ] Header usa t() para textos
- [ ] Selector de idioma en SettingsPage funciona
- [ ] Cambio de idioma actualiza toda la UI
- [ ] Persistencia de idioma en localStorage
- [ ] Fallback a español si falta una traducción
- [ ] Date formatting localizado
- [ ] `npm run lint` pasa

## Notas para el Agente

- Empezar por nav y common (textos estáticos)
- NO traducir contenido dinámico de la base de datos
- Los textos de dominio en español (nombre, siglas) NO se traducen
- La configuración de i18n se importa en main.tsx antes de App
- Esta es una implementación mínima — se puede expandir después
