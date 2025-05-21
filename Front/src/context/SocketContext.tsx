import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { socket, connectSocket, disconnectSocket } from "../services/api";
import type {
  SocketContextType,
  Room,
  RoomResponse,
  ServerToClientEvents,
  Message,
  User,
} from "../types/chat";

export const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    const handleRoomUpdate: ServerToClientEvents["room_update"] = (room) => {
      setCurrentRoom(room);
    };

    const handleUserJoined = (user: User) => {
      // Opcional: solo agregar mensaje del sistema, no modificar lista de usuarios aquí
      if (user.id === socket.id) return;

      setCurrentRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              sender: "system",
              text: `${user.name} se ha unido`,
              timestamp: Date.now(),
              isSystem: true,
            },
          ],
        };
      });
    };

    socket.on("room_update", handleRoomUpdate);
    socket.on("user_joined", handleUserJoined);

    return () => {
      socket.off("room_update", handleRoomUpdate);
      socket.off("user_joined", handleUserJoined);
    };
  }, []);

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      setCurrentRoom((prev) => {
        if (!prev) return null;

        // Evitar duplicados
        if (prev.messages.some((m) => m.timestamp === message.timestamp)) {
          return prev;
        }

        return {
          ...prev,
          messages: [...prev.messages, message],
        };
      });
    };

    // Re-conectar listeners al unirse a una sala
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [currentRoom?.pin]); // Resetear al cambiar de sala

  const createRoom = async (maxUsers: number): Promise<RoomResponse> => {
    connectSocket();
    return new Promise((resolve) => {
      socket.emit("create_room", maxUsers, (response) => {
        if (response.success && response.pin) {
          resolve({
            success: true,
            pin: response.pin,
            room: {
              pin: response.pin,
              maxUsers,
              users: [],
              messages: [],
            },
          });
        } else {
          resolve({
            success: false,
            error: response.error || "Error al crear sala",
          });
        }
      });
    });
  };

  const joinRoom = async (
    pin: string,
    username: string
  ): Promise<RoomResponse> => {
    return new Promise((resolve) => {
      // Asegurar conexión primero
      if (!socket.connected) {
        connectSocket();
      }

      // Temporalmente deshabilitar el listener de room_update
      socket.off("room_update");

      socket.emit("join_room", { pin, username }, (response) => {
        if (response.success && response.room) {
          setCurrentRoom(response.room);
          // Restaurar el listener después de la actualización
          socket.on("room_update", handleRoomUpdate);
          resolve({
            success: true,
            room: response.room,
          });
        } else {
          socket.on("room_update", handleRoomUpdate); // Restaurar listener incluso en error
          resolve({
            success: false,
            error: response.error || "Error al unirse a la sala",
          });
        }
      });
    });
  };

  // Mover handleRoomUpdate fuera del useEffect para reusarla
  const handleRoomUpdate = (room: Room) => {
    setCurrentRoom((prev) => {
      // Fusionar datos existentes con los nuevos para evitar pérdida de estado
      if (prev && room.pin === prev.pin) {
        return {
          ...prev,
          users: room.users,
          messages: room.messages,
        };
      }
      return room;
    });
  };

  const sendMessage = (text: string) => {
    if (!currentRoom?.pin) return;

    return new Promise<void>((resolve, reject) => {
      socket.emit(
        "send_message",
        {
          message: text,
          pin: currentRoom.pin, // Añadir el PIN como referencia
        },
        (response: { success: boolean; error?: string }) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || "Error al enviar mensaje"));
          }
        }
      );
    });
  };

  const leaveRoom = async () => {
    try {
      if (!socket.connected) {
        throw new Error("No hay conexión con el servidor");
      }

      const response = await new Promise<{ success: boolean }>((resolve) => {
        socket.emit("leave_room", (res) => resolve(res));
      });

      if (response.success) {
        // Limpieza local
        setCurrentRoom(null);
        disconnectSocket();
      }

      return response;
    } catch (error) {
      console.error("Error al salir:", error);
      return {
        success: false,
        error:
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message
            : "Error desconocido",
      };
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        currentRoom,
        setCurrentRoom,
        isConnected,
        createRoom,
        joinRoom,
        sendMessage,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
