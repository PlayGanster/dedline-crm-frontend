import { io, Socket } from 'socket.io-client';

type RealtimeEvent = 'message' | 'notification' | 'update' | 'force-logout' | string;
type RealtimeCallback = (data: any) => void;

class RealtimeService {
  private socket: Socket | null = null;
  private connected = false;
  private listeners = new Map<RealtimeEvent, Set<RealtimeCallback>>();
  private currentUserId: number | null = null;

  connect(url: string = 'http://localhost:3000', userId?: number) {
    if (this.socket?.connected) {
      // Если уже подключены, но userId изменился - аутентифицируемся заново
      if (userId && userId !== this.currentUserId) {
        this.currentUserId = userId;
        this.authenticate(userId);
      }
      return;
    }

    this.currentUserId = userId || null;

    this.socket = io(url, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[Realtime] Connected:', this.socket?.id);
      this.connected = true;

      // Аутентифицируемся если userId доступен
      if (this.currentUserId) {
        this.authenticate(this.currentUserId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('[Realtime] Disconnected');
      this.connected = false;
    });

    this.socket.on('error', (error: any) => {
      console.error('[Realtime] Error:', error);
    });

    // Setup global event listeners
    this.socket.on('message', (data: any) => {
      console.log('[Realtime] Received message:', data);
      this.emitEvent('message', data);
    });
    this.socket.on('notification', (data: any) => {
      console.log('[Realtime] Received notification:', data);
      this.emitEvent('notification', data);
    });
    this.socket.on('update', (data: any) => {
      console.log('[Realtime] Received update:', data);
      this.emitEvent('update', data);
    });
    this.socket.on('force-logout', (data: any) => {
      console.log('[Realtime] Received force-logout:', data);
      this.emitEvent('force-logout', data);
    });
    this.socket.on('new-message', (data: any) => {
      console.log('[Realtime] Received new-message:', data);
      this.emitEvent('new-message', data);
    });
    this.socket.on('read', (data: any) => {
      console.log('[Realtime] Received read:', data);
      this.emitEvent('read', data);
    });
    this.socket.on('read-messages', (data: any) => {
      console.log('[Realtime] Received read-messages:', data);
      this.emitEvent('read-messages', data);
    });
    this.socket.on('new-incoming-call', (data: any) => {
      console.log('[Realtime] Received new-incoming-call:', data);
      this.emitEvent('new-incoming-call', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.currentUserId = null;
    }
  }

  // Аутентификация пользователя
  authenticate(userId: number) {
    if (this.socket?.connected) {
      this.socket.emit('authenticate', { userId });
      console.log('[Realtime] Authenticated user:', userId);
    }
  }

  on(event: RealtimeEvent, callback: RealtimeCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Subscribe to socket events for known events
    if (['message', 'notification', 'update', 'force-logout', 'new-message', 'read', 'read-messages', 'new-incoming-call'].includes(event) && this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: RealtimeEvent, callback: RealtimeCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }

    if (this.socket && ['message', 'notification', 'update', 'force-logout', 'new-message', 'read', 'read-messages', 'new-incoming-call'].includes(event)) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[Realtime] Not connected, cannot emit:', event);
    }
  }

  private emitEvent(event: RealtimeEvent, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();
