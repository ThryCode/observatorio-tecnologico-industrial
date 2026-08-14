import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';
const RECONNECT_DELAY = 3000;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function connect() {
      if (disposed) return;

      try {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          if (token) ws.send(token);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'new_alert':
                queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
                queryClient.invalidateQueries({ queryKey: queryKeys.dashboardKPIs() });
                queryClient.invalidateQueries({ queryKey: queryKeys.timelineEvents() });
                toast.info('Nueva alerta', {
                  description: data.alert?.titulo || 'Se ha creado una nueva alerta de vigilancia.',
                });
                break;
              case 'alert_read':
                queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
                break;
            }
          } catch {
            // ignore malformed messages
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (!disposed) {
            reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
          }
        };

        ws.onerror = () => {
          ws.close();
        };

        wsRef.current = ws;
      } catch {
        if (!disposed) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
        }
      }
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [token, queryClient]);

  return wsRef;
}
