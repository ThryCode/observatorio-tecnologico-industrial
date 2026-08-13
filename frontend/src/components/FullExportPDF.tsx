import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { DashboardKPI, Patent, Technology, Organization, Regulation, Indicator, Alert, TimelineEvent } from '@/types';
import { pdfColors } from '@/lib/graph-colors';

const S = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: pdfColors.text },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: pdfColors.secondary, marginBottom: 6 },
  meta: { fontSize: 7, color: pdfColors.muted, flexDirection: 'row', justifyContent: 'space-between' },
  toc: { marginBottom: 16, fontSize: 8, color: pdfColors.secondary },
  tocItem: { marginBottom: 1 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 700, borderBottomWidth: 0.5, borderBottomColor: pdfColors.border, paddingBottom: 3, marginBottom: 6 },
  kpiGrid: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  kpiCard: { width: '23%', padding: 6, backgroundColor: pdfColors.cardBg },
  kpiL: { fontSize: 7, color: pdfColors.secondary },
  kpiV: { fontSize: 13, fontWeight: 700 },
  kpiC: { fontSize: 7, marginTop: 1 },
  row: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 0.3, borderBottomColor: pdfColors.rowBorder, fontSize: 8 },
  rowBold: { flexDirection: 'row', paddingVertical: 3, fontSize: 7, color: pdfColors.secondary, fontWeight: 700, borderBottomWidth: 0.5, borderBottomColor: pdfColors.border },
  c1: { width: '8%' },
  c2: { width: '25%' },
  c3: { width: '22%' },
  c4: { width: '15%' },
  c5: { width: '15%' },
  c6: { width: '15%' },
  footer: { position: 'absolute', bottom: 25, left: 40, right: 40, fontSize: 7, color: pdfColors.muted, borderTopWidth: 0.3, borderTopColor: pdfColors.borderLight, paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between' },
});

interface FullExportData {
  kpis: DashboardKPI[];
  patents: Patent[];
  technologies: Technology[];
  organizations: Organization[];
  regulations: Regulation[];
  indicators: Indicator[];
  alerts: Alert[];
  bulletins: { id: string; titulo: string; fecha: string; categoria: string }[];
  industrialSectors: { codigo: string; nombre: string }[];
  timeline: TimelineEvent[];
  generatedAt: string;
}

function Row({ cells, bold }: { cells: string[]; bold?: boolean }) {
  const widths: (keyof typeof S)[] = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
  return (
    <View style={bold ? S.rowBold : S.row}>
      {cells.map((c, i) => (
        <Text key={i} style={S[widths[i]] || S.c1}>{c}</Text>
      ))}
    </View>
  );
}

export default function FullExportPDF(data: FullExportData) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.title}>Informe Completo — Observatorio Tecnológico Industrial</Text>
          <Text style={S.subtitle}>Ministerio de Industrias (MINDUS) · Datos de todas las secciones de información pública</Text>
          <View style={S.meta}>
            <Text>Generado: {data.generatedAt}</Text>
            <Text>CLASIFICACIÓN: USO INTERNO</Text>
          </View>
        </View>

        <View style={S.toc}>
          <Text style={S.tocItem}>1. Indicadores Clave (Dashboard)</Text>
          <Text style={S.tocItem}>2. Patentes</Text>
          <Text style={S.tocItem}>3. Tecnologías</Text>
          <Text style={S.tocItem}>4. Organizaciones CTI</Text>
          <Text style={S.tocItem}>5. Regulaciones</Text>
          <Text style={S.tocItem}>6. Indicadores</Text>
          <Text style={S.tocItem}>7. Alertas</Text>
          <Text style={S.tocItem}>8. Boletines</Text>
          <Text style={S.tocItem}>9. Sectores Industriales</Text>
          <Text style={S.tocItem}>10. Actividad Reciente</Text>
        </View>

        {/* 1. KPIs */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>1. Indicadores Clave</Text>
          <View style={S.kpiGrid}>
            {data.kpis.map((k, i) => (
              <View key={i} style={S.kpiCard}>
                <Text style={S.kpiL}>{k.label}</Text>
                <Text style={S.kpiV}>{k.value.toLocaleString()}</Text>
                <Text style={[S.kpiC, { color: k.change >= 0 ? pdfColors.accent : pdfColors.danger }]}>
                  {k.change >= 0 ? '+' : ''}{k.change}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Patentes */}
        <View style={S.section} wrap={false}>
          <Text style={S.sectionTitle}>2. Patentes ({data.patents.length})</Text>
          <Row bold cells={['#', 'Título', 'Solicitante', 'Número', 'Estado']} />
          {data.patents.slice(0, 10).map((p, i) => (
            <Row key={p.id} cells={[String(i + 1), p.title, p.applicant, p.patent_number, p.status]} />
          ))}
        </View>

        {/* 3. Tecnologías */}
        <View style={S.section} wrap={false}>
          <Text style={S.sectionTitle}>3. Tecnologías ({data.technologies.length})</Text>
          <Row bold cells={['#', 'Nombre', 'TRL', 'Sector', 'Palabras Clave']} />
          {data.technologies.slice(0, 10).map((t, i) => (
            <Row key={t.id} cells={[String(i + 1), t.nombre, String(t.trl_nivel ?? '-'), t.sector_codigo || '-', (t.palabras_clave || []).join(', ')]} />
          ))}
        </View>

        {/* 4. Organizaciones */}
        <View style={S.section} wrap={false}>
          <Text style={S.sectionTitle}>4. Organizaciones CTI ({data.organizations.length})</Text>
          <Row bold cells={['#', 'Nombre', 'Siglas', 'Tipo', 'Provincia']} />
          {data.organizations.slice(0, 10).map((o, i) => (
            <Row key={o.id} cells={[String(i + 1), o.nombre, o.siglas, o.tipo, o.provincia || '-']} />
          ))}
        </View>

        {/* 5. Regulaciones */}
        <View style={S.section} wrap={false}>
          <Text style={S.sectionTitle}>5. Regulaciones ({data.regulations.length})</Text>
          <Row bold cells={['#', 'Título', 'Entidad', 'Categoría', 'Fecha']} />
          {data.regulations.slice(0, 10).map((r, i) => (
            <Row key={r.id} cells={[String(i + 1), r.title, r.issuing_body, r.category, r.publication_date]} />
          ))}
        </View>

        {/* 6. Indicadores */}
        <View style={S.section} wrap={false}>
          <Text style={S.sectionTitle}>6. Indicadores ({data.indicators.length})</Text>
          <Row bold cells={['#', 'Nombre', 'Valor', 'Unidad', 'Período']} />
          {data.indicators.slice(0, 10).map((ind, i) => (
            <Row key={ind.id} cells={[String(i + 1), ind.name, String(ind.value), ind.unit, ind.period]} />
          ))}
        </View>

        {/* 7. Alertas */}
        <View style={S.section} wrap={false}>
          <Text style={S.sectionTitle}>7. Alertas ({data.alerts.length})</Text>
          <Row bold cells={['#', 'Título', 'Severidad', 'Sector', 'Fecha']} />
          {data.alerts.slice(0, 10).map((a, i) => (
            <Row key={a.id} cells={[String(i + 1), a.titulo, a.severidad, a.sector_codigo || '-', new Date(a.fecha).toLocaleDateString('es-ES')]} />
          ))}
        </View>

        {/* 8. Boletines */}
        <View style={S.section} wrap={false}>
          <Text style={S.sectionTitle}>8. Boletines ({data.bulletins.length})</Text>
          <Row bold cells={['#', 'Título', 'Categoría', 'Fecha']} />
          {data.bulletins.slice(0, 10).map((b, i) => (
            <Row key={b.id} cells={[String(i + 1), b.titulo, b.categoria, new Date(b.fecha).toLocaleDateString('es-ES')]} />
          ))}
        </View>

        {/* 9. Sectores */}
        <View style={S.section} wrap={false}>
          <Text style={S.sectionTitle}>9. Sectores Industriales ({data.industrialSectors.length})</Text>
          <Row bold cells={['#', 'Código', 'Nombre']} />
          {data.industrialSectors.map((s, i) => (
            <Row key={s.codigo} cells={[String(i + 1), s.codigo, s.nombre]} />
          ))}
        </View>

        {/* 10. Timeline */}
        <View style={S.section} wrap={false}>
          <Text style={S.sectionTitle}>10. Actividad Reciente ({data.timeline.length})</Text>
          <Row bold cells={['#', 'Evento', 'Tipo', 'Fecha']} />
          {data.timeline.slice(0, 6).map((ev, i) => (
            <Row key={ev.id} cells={[String(i + 1), ev.titulo, ev.tipo, new Date(ev.fecha).toLocaleDateString('es-ES')]} />
          ))}
        </View>

        <View style={S.footer} fixed>
          <Text>Observatorio Tecnológico Industrial © 2026 MINDUS</Text>
          <Text>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
}
