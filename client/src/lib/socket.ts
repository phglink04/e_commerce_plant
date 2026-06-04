import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Socket.IO must connect directly to the NestJS backend, NOT through
 * the Next.js proxy (rewrites only work for HTTP, not WebSocket upgrades).
 * If NEXT_PUBLIC_SOCKET_URL is not set, fall back to localhost:5000.
 */
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL?.trim().replace(/\/$/, "") ||
  "http://localhost:5000";

/**
 * Get or create Socket.IO connection for chat namespace
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${SOCKET_URL}/chat`, {
      transports: ["websocket", "polling"],
      autoConnect: false,
      withCredentials: true,
    });
  }
  return socket;
}

/**
 * Connect to Socket.IO server
 */
export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/**
 * Disconnect from Socket.IO server
 */
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
