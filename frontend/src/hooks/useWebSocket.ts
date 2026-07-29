import { useCallback, useEffect, useRef } from 'react';

type MessageHandler = (data: Record<string, unknown>) => void;

interface UseWebSocketOptions {
  token: string | null;
  onMessage: MessageHandler;
  onReconnect?: () => void;
}

const RECONNECT_DELAY = 3000;
const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8000/ws`;

export function useWebSocket({ token, onMessage, onReconnect }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      if (onReconnect) onReconnect();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // ignore non-JSON messages
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [token, onMessage, onReconnect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);
}
