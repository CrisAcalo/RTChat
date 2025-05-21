// import { useEffect } from "react";
// import { socket } from "../services/api";
// import type {
//     ServerToClientEvents,
//     Room,
//     Message,
//     User,
// } from "../types/chat";

// /**
//  * Custom Hook para manejar eventos de Socket.io de forma declarativa.
//  * @param handlers - Objeto con callbacks para eventos específicos
//  * @returns Estado de conexión y métodos útiles
//  */
// export const useSocket = (handlers: {
//     onRoomUpdate?: (room: Room) => void;
//     onNewMessage?: (message: Message) => void;
//     onUserJoined?: (user: User) => void;
//     onUserLeft?: (userId: string) => void;
//     onError?: (message: string) => void;
// }) => {
//     // Registrar listeners de eventos
//     useEffect(() => {
//         const {
//             onRoomUpdate,
//             onNewMessage,
//             onUserJoined,
//             onUserLeft,
//             onError
//         } = handlers;

//         if (onRoomUpdate) socket.on("room_update", onRoomUpdate);
//         if (onNewMessage) socket.on("new_message", onNewMessage);
//         if (onUserJoined) socket.on("user_joined", onUserJoined);
//         if (onUserLeft) socket.on("user_left", onUserLeft);
//         if (onError) socket.on("error", onError);

//         return () => {
//             socket.off("room_update");
//             socket.off("new_message");
//             socket.off("user_joined");
//             socket.off("user_left");
//             socket.off("error");
//         };
//     }, [handlers]);

//     /**
//      * Envía un mensaje al servidor.
//      * @param text - Contenido del mensaje
//      */
//     const sendMessage = (text: string) => {
//         if (!socket.connected) return;
//         socket.emit("send_message", text);
//     };

//     return { sendMessage, isConnected: socket.connected };
// };