import { useState, useRef, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { listProfessionals } from '@/api/professionals';

interface AuthorAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export default function AuthorAutocomplete({ value, onChange, placeholder, id }: AuthorAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ full_name: string; id: string }>>([]);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const selectedAuthors = value ? value.split(',').map((a) => a.trim()).filter(Boolean) : [];

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await listProfessionals(1, 10, undefined, q);
      setSuggestions(res.items.map((p) => ({ full_name: p.full_name, id: p.id })));
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addAuthor = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !selectedAuthors.includes(trimmed)) {
      const newAuthors = [...selectedAuthors, trimmed].join(', ');
      onChange(newAuthors);
    }
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeAuthor = (name: string) => {
    const newAuthors = selectedAuthors.filter((a) => a !== name).join(', ');
    onChange(newAuthors);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        addAuthor(suggestions[highlightedIndex].full_name);
      } else if (query.trim()) {
        addAuthor(query);
      }
      setHighlightedIndex(-1);
    } else if (e.key === 'Backspace' && !query && selectedAuthors.length > 0) {
      removeAuthor(selectedAuthors[selectedAuthors.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) => !selectedAuthors.includes(s.full_name)
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1 min-h-[36px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring">
        {selectedAuthors.map((author) => (
          <Badge key={author} variant="secondary" className="gap-1 pr-1">
            {author}
            <button type="button" onClick={() => removeAuthor(author)} className="ml-0.5 rounded-full hover:bg-muted p-0.5">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlightedIndex(-1); }}
          onFocus={() => { if (query.length >= 1 || filteredSuggestions.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={selectedAuthors.length === 0 ? (placeholder || 'Buscar o escribir autores...') : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover p-1 text-sm shadow-md">
          {filteredSuggestions.map((s, i) => (
            <div
              key={s.id}
              className={`cursor-pointer rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground ${i === highlightedIndex ? 'bg-accent text-accent-foreground' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); addAuthor(s.full_name); }}
            >
              {s.full_name}
            </div>
          ))}
          {query.trim() && !filteredSuggestions.some((s) => s.full_name.toLowerCase() === query.toLowerCase()) && (
            <div
              className="cursor-pointer rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              onMouseDown={(e) => { e.preventDefault(); addAuthor(query); }}
            >
              Agregar &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
