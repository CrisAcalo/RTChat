import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../hooks/useSocketContext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useRef } from "react";

export const Home = () => {
  const { createRoom, joinRoom, isConnected } =
    useSocketContext();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  // Estados para el formulario
  const [maxUsers, setMaxUsers] = useState<number>(5);
  const [pin, setPin] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      showError("Debes ingresar un nombre de usuario válido");
      return;
    }

    setIsCreating(true);
    try {
      // 1. Crear sala
      const creationResponse = await createRoom(maxUsers);
      console.log("Respuesta creación:", creationResponse);

      if (!creationResponse.success || !creationResponse.pin) {
        throw new Error(creationResponse.error || "Error al crear sala");
      }

      // 2. Unirse a la sala recién creada
      const joinResponse = await joinRoom(creationResponse.pin, username);
      console.log("Respuesta unión:", joinResponse);

      if (joinResponse.success && joinResponse.room) {
        navigate(`/room/${creationResponse.pin}`);
      } else {
        throw new Error(
          joinResponse.error || "Error al unirse a la sala creada"
        );
      }
    } catch (error: any) {
      showError(error.message);
      // Limpiar estado si falla
      // if (socket.connected) {
      //   socket.disconnect();
      // }
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!pin || !username) {
      showError("PIN y nombre de usuario son requeridos");
      return;
    }

    setIsJoining(true);
    try {
      const response = await joinRoom(pin, username);
      if (response.success && response.room) { // Asegúrate de que response.room exista
        navigate(`/room/${pin}`);
      } else {
        // Esta parte ya debería manejar el error del backend
        showError(response.error || "Error desconocido al unirse a la sala");
      }
    } catch (error: any) {
      // Este catch es más para errores de red o excepciones no controladas
      showError(error.message || "Ocurrió un error inesperado");
    } finally {
      setIsJoining(false);
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

  return (
    <div className="flex justify-content-center align-items-center min-h-screen w-full">
      <Toast ref={toast} />
      <Card title="Chat en Tiempo Real" className="w-full md:w-6 lg:w-4">
        <div className="flex flex-column gap-3">
          <div className="p-field">
            <label htmlFor="username">Tu Nombre</label>
            <InputText
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: Juan"
            />
          </div>

          <div className="flex flex-column gap-3">
            {/* Sección Crear Sala */}
            <div className="border-round border-1 p-3">
              <h3>Crear Nueva Sala</h3>
              <div className="flex align-items-center gap-2 mt-2">
                <label>Límite:</label>
                <InputText
                  type="number"
                  value={maxUsers.toString()}
                  onChange={(e) => setMaxUsers(Number(e.target.value))}
                  min="2"
                  max="10"
                  style={{ width: "60px" }}
                />
              </div>
              <Button
                label="Crear Sala"
                icon="pi pi-plus"
                loading={isCreating}
                onClick={handleCreateRoom}
                className="mt-3"
              />
            </div>

            {/* Sección Unirse a Sala */}
            <div className="border-round border-1 p-3">
              <h3>Unirse a Sala Existente</h3>
              <div className="p-field mt-2">
                <label htmlFor="pin">PIN de 6 dígitos</label>
                <InputText
                  id="pin"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Ej: 452781"
                  maxLength={6}
                  keyfilter="num"
                />
              </div>
              <Button
                label="Unirse"
                icon="pi pi-sign-in"
                loading={isJoining}
                onClick={handleJoinRoom}
                className="mt-3"
              />
            </div>
          </div>

          {isConnected && (
            <small className="text-green-500">Conectado al servidor</small>
          )}
        </div>
      </Card>
    </div>
  );
};
