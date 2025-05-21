/**
 * Tipos globales para la aplicación de chat con WebSockets.
 * Define las estructuras de datos para salas, usuarios y mensajes.
 */

// -----------------------------------------
// Interfaces principales
// -----------------------------------------

/** Usuario conectado a una sala */
export interface User {
  id: string;          // ID único (socket.id)
  name: string;        // Nombre mostrado en el chat
  avatar?: string;     // URL de imagen (opcional)
}

/** Mensaje enviado en una sala */
export interface Message {
  sender: User["id"];  // ID del usuario que envió el mensaje
  senderName?: string; // Nombre del usuario que envió el mensaje
  text: string;        // Contenido del mensaje
  timestamp: number;   // Fecha en milisegundos (Date.now())
  isSystem?: boolean;  // Si es un mensaje del sistema (ej: "Usuario X se unió")
}

/** Sala de chat */
export interface Room {
  pin: string;         // PIN único de 6 dígitos
  maxUsers: number;    // Límite de participantes
  users: User[];       // Lista de usuarios conectados
  messages: Message[]; // Historial de mensajes
}

// -----------------------------------------
// Tipos para eventos de Socket.io
// -----------------------------------------

/** Eventos emitidos por el cliente (frontend -> backend) */
export type ClientToServerEvents = {
  create_room: (maxUsers: number, callback: (res: RoomResponse) => void) => void;
  join_room: (data: { pin: string; username: string }, callback: (res: RoomResponse) => void) => void;
  send_message: (data: { message: string; pin: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  leave_room: (callback: (res: { success: boolean }) => void) => void;
};

/** Eventos emitidos por el servidor (backend -> frontend) */
export type ServerToClientEvents = {
  room_created: (pin: string) => void;
  room_update: (room: Room) => void;
  new_message: (message: Message) => void;
  user_joined: (user: User) => void;
  user_left: (data: { userId: string; room?: Room }) => void;
};

// -----------------------------------------
// Tipos para respuestas del backend
// -----------------------------------------

/** Respuesta estándar para operaciones con salas */
export interface RoomResponse {
  success: boolean;
  room?: Room;         // Solo si success=true
  error?: string;      // Solo si success=false
  pin?: string;        // Para creación de salas
}

// -----------------------------------------
// Tipos para el contexto de React
// -----------------------------------------

/** Propiedades del SocketContext */
export interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  currentRoom: Room | null;
  setCurrentRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  createRoom: (maxUsers: number) => Promise<RoomResponse>;
  joinRoom: (pin: string, username: string) => Promise<RoomResponse>;
  sendMessage: (text: string) => void;
  leaveRoom: () => void;
  isConnected: boolean;
}
