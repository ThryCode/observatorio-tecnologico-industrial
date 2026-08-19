import { useState } from 'react';
import CrudPage from '@/components/CrudPage';
import type { CrudColumn } from '@/components/CrudPage';
import { usePatents, useCreatePatent, useUpdatePatent, useDeletePatent } from '@/hooks/usePatents';
import FileUpload from '@/components/FileUpload';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, getStatusColor, capitalize } from '@/utils/formatters';
import { Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Patent } from '@/types';

const statusOptions = [
  { value: 'filed', labelKey: 'page.patents.solicitada' },
  { value: 'examination', labelKey: 'page.patents.enExamen' },
  { value: 'granted', labelKey: 'page.patents.concedida' },
  { value: 'expired', labelKey: 'page.patents.expirada' },
  { value: 'rejected', labelKey: 'page.patents.rechazada' },
] as const;

const sectorOptions = [
  { value: 'SID', label: 'Siderurgia' },
  { value: 'MET', label: 'Metalurgia' },
  { value: 'ELE', label: 'Electrónica' },
  { value: 'QUI', label: 'Química' },
  { value: 'AUT', label: 'Automación' },
];

export default function Patents() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('');
  const [status, setStatus] = useState('');
  const { t } = useLanguage();

  const queryResult = usePatents(page, 20, sector || undefined, status || undefined, q || undefined);
  const createMutation = useCreatePatent();
  const updateMutation = useUpdatePatent();
  const deleteMutation = useDeletePatent();

  const statusLabels: Record<string, string> = {
    filed: t('page.patents.solicitada'),
    examination: t('page.patents.enExamen'),
    granted: t('page.patents.concedida'),
    expired: t('page.patents.expirada'),
    rejected: t('page.patents.rechazada'),
  };

  const columns: CrudColumn<Patent>[] = [
    {
      header: t('page.patents.titulo'),
      render: (patent) => <span className="font-medium truncate max-w-[200px] block">{patent.title}</span>,
    },
    {
      header: t('page.patents.numeroPatente'),
      render: (patent) => <Badge variant="outline" className="font-mono text-xs">{patent.patent_number}</Badge>,
    },
    {
      header: t('page.patents.solicitante'),
      render: (patent) => <span className="text-sm">{patent.applicant}</span>,
    },
    {
      header: t('page.patents.estado'),
      render: (patent) => (
        <Badge className={`${getStatusColor(patent.status)} text-[10px]`}>
          {statusLabels[patent.status] || capitalize(patent.status)}
        </Badge>
      ),
    },
    {
      header: t('page.patents.pais'),
      render: (patent) => <span className="text-sm">{patent.country}</span>,
    },
    {
      header: t('page.patents.fechaSolicitud'),
      render: (patent) => <span className="text-sm text-muted-foreground">{formatDate(patent.filing_date)}</span>,
    },
  ];

  return (
    <CrudPage
      title={t('page.patents.title')}
      description={t('page.patents.description')}
      permissionResource="patents"
      columns={columns}
      queryResult={queryResult}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      page={page}
      onPageChange={setPage}
      searchPlaceholder={t('page.patents.buscarPlaceholder')}
      onSearch={setQ}
      filterBar={
        <div className="flex items-center gap-3">
          <Select value={sector} onValueChange={(v) => { setSector(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder={t('common.sector')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.todosLosSectores')}</SelectItem>
              {sectorOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder={t('page.patents.estado')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('page.patents.todosEstados')}</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      defaultForm={{
        title: '', patent_number: '', applicant: '', inventor: '',
        filing_date: '', publication_date: '', status: '', abstract: '',
        technological_sector: '', country: '', file_url: '',
      }}
      formToPayload={(form) => ({
        title: form.title,
        patent_number: form.patent_number,
        applicant: form.applicant,
        inventor: form.inventor || undefined,
        filing_date: form.filing_date,
        publication_date: form.publication_date || undefined,
        status: form.status || undefined,
        abstract: form.abstract || undefined,
        technological_sector: form.technological_sector || undefined,
        country: form.country || undefined,
        file_url: form.file_url || undefined,
      })}
      transformEditItem={(item) => ({
        title: item.title,
        patent_number: item.patent_number,
        applicant: item.applicant,
        inventor: item.inventor || '',
        filing_date: item.filing_date,
        publication_date: item.publication_date || '',
        status: item.status || '',
        abstract: item.abstract || '',
        technological_sector: item.technological_sector || '',
        country: item.country,
        file_url: item.file_url || '',
      })}
      validateForm={(form) => {
        if (!form.title) return t('page.patents.titulo') + ' es obligatorio';
        if (!form.patent_number) return t('page.patents.numeroPatente') + ' es obligatorio';
        if (!form.applicant) return t('page.patents.solicitante') + ' es obligatorio';
        return null;
      }}
      renderForm={({ data, onChange }) => (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label htmlFor="patent-titulo" className="text-sm font-medium">{t('page.patents.titulo')} *</label>
            <Input id="patent-titulo" value={data.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Título de la patente" />
          </div>
          <div>
            <label htmlFor="patent-numero" className="text-sm font-medium">{t('page.patents.numeroPatente')} *</label>
            <Input id="patent-numero" value={data.patent_number} onChange={(e) => onChange({ patent_number: e.target.value })} placeholder="CU2024/0001" />
          </div>
          <div>
            <label className="text-sm font-medium">{t('page.patents.estado')}</label>
            <Select value={data.status} onValueChange={(v) => onChange({ status: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="patent-solicitante" className="text-sm font-medium">{t('page.patents.solicitante')} *</label>
            <Input id="patent-solicitante" value={data.applicant} onChange={(e) => onChange({ applicant: e.target.value })} placeholder="Solicitante" />
          </div>
          <div>
            <label htmlFor="patent-inventor" className="text-sm font-medium">{t('page.patents.inventor')}</label>
            <Input id="patent-inventor" value={data.inventor} onChange={(e) => onChange({ inventor: e.target.value })} placeholder="Inventor(es)" />
          </div>
          <div>
            <label htmlFor="patent-fecha_solicitud" className="text-sm font-medium">{t('page.patents.fechaSolicitud')}</label>
            <Input id="patent-fecha_solicitud" type="date" value={data.filing_date} onChange={(e) => onChange({ filing_date: e.target.value })} />
          </div>
          <div>
            <label htmlFor="patent-fecha_publicacion" className="text-sm font-medium">{t('page.patents.fechaPublicacion')}</label>
            <Input id="patent-fecha_publicacion" type="date" value={data.publication_date} onChange={(e) => onChange({ publication_date: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">{t('page.patents.sectorTecnologico')}</label>
            <Select value={data.technological_sector} onValueChange={(v) => onChange({ technological_sector: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar sector" /></SelectTrigger>
              <SelectContent>
                {sectorOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="patent-pais" className="text-sm font-medium">{t('page.patents.pais')}</label>
            <Input id="patent-pais" value={data.country} onChange={(e) => onChange({ country: e.target.value })} placeholder="Cuba" />
          </div>
          <div className="col-span-2">
            <label htmlFor="patent-resumen" className="text-sm font-medium">{t('page.patents.resumen')}</label>
            <Textarea id="patent-resumen" value={data.abstract} onChange={(e) => onChange({ abstract: e.target.value })} placeholder="Resumen de la patente" />
          </div>
          <div className="col-span-2">
            <label htmlFor="patent-file_url" className="text-sm font-medium">{t('page.patents.archivoAdjunto')}</label>
            <FileUpload
              id="patent-file_url"
              onUpload={(url) => onChange({ file_url: url })}
              currentUrl={data.file_url}
              accept=".pdf,.doc,.docx"
            />
          </div>
        </div>
      )}
      renderSidebar={(patent) => (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-semibold leading-tight">{patent.title}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">{patent.patent_number}</p>
            </div>
            <Badge className={getStatusColor(patent.status)}>
              {statusLabels[patent.status] || capitalize(patent.status)}
            </Badge>
          </div>
          {patent.abstract && (
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('page.patents.resumen')}</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{patent.abstract}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('page.patents.solicitante')}</p>
              <p className="text-sm">{patent.applicant}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('page.patents.inventor')}</p>
              <p className="text-sm">{patent.inventor || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('page.patents.fechaSolicitud')}</p>
              <p className="text-sm">{formatDate(patent.filing_date)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('page.patents.fechaPublicacion')}</p>
              <p className="text-sm">{patent.publication_date ? formatDate(patent.publication_date) : '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('page.patents.sectorTecnologico')}</p>
              <p className="text-sm">{patent.technological_sector || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('page.patents.pais')}</p>
              <p className="text-sm">{patent.country}</p>
            </div>
          </div>
          {patent.file_url && (
            <div className="border-t border-border pt-3">
              <a href={patent.file_url} download className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <Download className="h-3.5 w-3.5" /> {t('page.patents.descargarArchivo')}
              </a>
            </div>
          )}
        </div>
      )}
    />
  );
}
