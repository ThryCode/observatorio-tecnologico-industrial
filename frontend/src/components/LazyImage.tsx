import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
}

export function LazyImage({ src, alt, fallback, className, ...props }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  if (error && fallback) {
    return <div className={cn('flex items-center justify-center bg-muted', className)}>{fallback}</div>;
  }

  return (
    <img
      ref={imgRef}
      alt={alt}
      className={cn('transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0', className)}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      {...props}
    />
  );
}
