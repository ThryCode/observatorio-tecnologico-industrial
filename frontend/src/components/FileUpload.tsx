import { useState, useRef, type ChangeEvent } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/api/uploads';

const MAX_SIZE = 10_485_760;
const ALLOWED = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];

interface FileUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  accept?: string;
}

export default function FileUpload({ onUpload, currentUrl, accept }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    if (!file?.name) {
      setError('El archivo no tiene nombre');
      return;
    }
    const parts = file.name.split('.');
    const rawExt = parts.length > 1 ? parts.pop() : '';
    const ext = '.' + (rawExt || '').toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setError(`Formato "${ext}" no permitido. Permitidos: ${ALLOWED.join(', ')}`);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(`El archivo excede el tamaño máximo de ${MAX_SIZE / 1_048_576}MB`);
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(file);
      onUpload(result.url);
    } catch {
      setError('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      {currentUrl ? (
        <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-surface">
          <FileText className="h-4 w-4 text-accent-orange" />
          <span className="text-sm text-foreground flex-1 truncate">{currentUrl.split('/').pop()}</span>
          <button onClick={() => onUpload('')} className="text-text-muted hover:text-danger transition-colors" title="Quitar archivo">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            dragOver ? 'border-accent-orange bg-accent-subtle' : 'border-border hover:border-accent-orange',
          )}
        >
          <input ref={inputRef} type="file" hidden onChange={handleChange} accept={accept} />
          {uploading ? (
            <div className="flex flex-col items-center gap-1">
              <div className="animate-spin h-5 w-5 border-2 border-accent-orange border-t-transparent rounded-full" />
              <span className="text-sm text-text-muted">Subiendo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="h-5 w-5 text-text-muted" />
              <span className="text-sm text-text-muted">Arrastra un archivo o haz clic para seleccionar</span>
              <span className="text-xs text-text-muted">PDF, DOC, DOCX, XLS, XLSX, PNG, JPG — máx. 10MB</span>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
