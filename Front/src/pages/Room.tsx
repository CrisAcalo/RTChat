import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocketContext } from "../hooks/useSocketContext";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Toast } from "primereact/toast";
import { ScrollPanel } from "primereact/scrollpanel";
import { Badge } from "primereact/badge";
import { socket } from "../services/api";
import type { Message, Room as RoomType } from "../types/chat";

export const Room = () => {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();
  const { currentRoom, sendMessage, leaveRoom, setCurrentRoom } =
    useSocketContext();
  const [newMessage, setNewMessage] = useState("");
  const toast = useRef<Toast>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const handleUserLeft = (data: { userId: string; room?: RoomType }) => {
      // No procesar si es nuestro propio evento de salida
      if (data.userId === socket.id) return;

      setCurrentRoom((prev) => {
        if (!prev) return null;

        // Solo agregar mensaje del sistema, no modificar lista de usuarios aquí
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              sender: "system",
              text: `Usuario ha abandonado la sala`,
              timestamp: Date.now(),
              isSystem: true,
            },
          ],
        };
      });
    };

    // Configurar listeners
    socket.on("new_message", handleNewMessage);
    socket.on("user_left", handleUserLeft);

    return () => {
      // Limpiar listeners al desmontar
      socket.off("new_message", handleNewMessage);
      socket.off("user_left", handleUserLeft);
    };
  }, [setCurrentRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [currentRoom?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage);
      setNewMessage("");
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      navigate("/");
    } catch (error: any) {
      showError(error.message);
    }
  };

  const showError = (message: string) => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: message,
      life: 3000,
    });
  };

  if (!currentRoom || currentRoom.pin !== pin) {
    return (
      <div className="flex justify-content-center align-items-center min-h-screen">
        <Card title="Sala no encontrada" className="w-6">
          <p>La sala con PIN {pin} no existe o fue cerrada</p>
          <Button
            label="Volver al inicio"
            icon="pi pi-home"
            onClick={() => navigate("/")}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-column h-screen">
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex align-items-center justify-content-between p-3 border-bottom-1 surface-border">
        <div className="flex align-items-center gap-2">
          <h2>Sala: {currentRoom.pin}</h2>
          <Badge value={currentRoom.users.length} severity="info" />
        </div>
        <Button
          label="Salir"
          icon="pi pi-sign-out"
          severity="danger"
          onClick={handleLeaveRoom}
        />
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1">
        {/* Lista de usuarios */}
        <div className="w-3 border-right-1 surface-border p-3">
          <h3>Participantes</h3>
          <div className="flex flex-column gap-2 mt-3">
            {(Array.isArray(currentRoom?.users) ? currentRoom.users : []).map(
              (user) => (
                <div key={user.id} className="user-item">
                  <span>{user.name}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="flex flex-column flex-1">
          {/* Mensajes */}
          <ScrollPanel style={{ height: "calc(100vh - 150px)" }}>
            <div className="p-3">
              {currentRoom.messages.map((msg, index) => {
                // Usar el nombre guardado en el mensaje, o buscarlo en la lista de usuarios si no existe
                const senderName =
                  msg.senderName ||
                  (currentRoom.users.find((u) => u.id === msg.sender)?.name) ||
                  "System";

                return (
                  <div key={index} className="mb-3">
                    <div className="flex align-items-center gap-2 mb-1">
                      <Avatar
                        label={senderName.charAt(0)}
                        size="normal"
                        shape="circle"
                        className="bg-primary"
                      />
                      <span className="font-bold">{senderName}</span>
                      <small className="text-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </small>
                    </div>
                    <div className="ml-5">{msg.text}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollPanel>

          {/* Input de mensaje */}
          <div className="p-3 border-top-1 surface-border">
            <div className="flex gap-2">
              <InputText
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button
                label="Enviar"
                icon="pi pi-send"
                onClick={handleSendMessage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
