import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { realtimeService } from './realtime.service';
import { useAuthStore } from '@/features/auth';

interface RealtimeContextType {
  connected: boolean;
  connect: (url?: string) => void;
  disconnect: () => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  emit: (event: string, data?: any) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const connectedRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const { user } = useAuthStore();

  const connect = (url?: string) => {
    realtimeService.connect(url, user?.id);
  };

  const disconnect = () => {
    realtimeService.disconnect();
  };

  const on = (event: string, callback: (data: any) => void) => {
    realtimeService.on(event, callback);
  };

  const off = (event: string, callback: (data: any) => void) => {
    realtimeService.off(event, callback);
  };

  const emit = (event: string, data?: any) => {
    realtimeService.emit(event, data);
  };

  useEffect(() => {
    // Update connected state
    const updateConnectionState = () => {
      const isConnected = realtimeService.isConnected();
      connectedRef.current = isConnected;
      setConnected(isConnected);
    };

    // Connect with userId if user is authenticated
    if (user) {
      connect('http://localhost:3000');
    }
    updateConnectionState();

    // Poll for connection state
    const interval = setInterval(updateConnectionState, 1000);

    return () => {
      clearInterval(interval);
      disconnect();
    };
  }, [user?.id]);

  return (
    <RealtimeContext.Provider value={{ connected, connect, disconnect, on, off, emit }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
