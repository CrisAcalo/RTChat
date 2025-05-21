import { useContext } from "react";
import { SocketContext } from "../context/SocketContext";
import type { SocketContextType } from "../types/chat";

export const useSocketContext = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
};