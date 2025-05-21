import React, { useRef, useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";

const SOCKET_SERVER_URL = import.meta.env.REACT_APP_SOCKET_SERVER_URL || "";

interface Message {
  id: string;
  author: string;
  content: string;
}

interface HostInfo {
  host: string;
  ip: string;
}

export const Chat: React.FC = () => {
  const [nickName, setNickName] = React.useState<string>("");
  const [tempNick, setTempNick] = React.useState<string>("");
  const [message, setMessage] = React.useState<string>("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [connected, setConnected] = React.useState<boolean>(false);
  const [hostInfo, setHostInfo] = React.useState<HostInfo | null>();

  const useSocketRef = useRef<any>(null);

  useEffect(() => {
    if (!nickName) return;

    useSocketRef.current = io(SOCKET_SERVER_URL);
    useSocketRef.current.on("host-info", (info: HostInfo) => {
      setHostInfo(info);
      setConnected(true);
    });
    useSocketRef.current.on("recieve_message", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      useSocketRef.current.disconnect();
    };
  }, [nickName]);

  const handleNickName = () => {
    const nick = tempNick.trim();
    if (!nick) return;
    setNickName(nick);
  };

  const sendMessage = () => {
    if (!message.trim() || connected) return;
    const msg: Message = {
      id: "jkadsjkdsa",
      author: nickName,
      content: message,
    };
    useSocketRef.current.emit("send_message", msg);

    setMessages((prevMessages) => [...prevMessages, msg]);

    setMessage("");
  };

  return (
    <>
      {!nickName && (
        <div className="app">
          <Card title="Bienvenido a la sala de chat" className="card">
            <div className="p-fluid">
              <div className="p-field">
                <label htmlFor="nickname">Nickname</label>
                <InputText
                  id="nickname"
                  value={tempNick}
                  onChange={(e) => setTempNick(e.target.value)}
                  placeholder="Escribe tu nickname"
                />
              </div>
              <Button
                label="Conectarse"
                icon="pi pi-check"
                onClick={handleNickName}
                className="p-button-success"
              />
            </div>
          </Card>
        </div>
      )}

      {nickName && (
        <>
          <div className="app">
            Bacán 👍
            <Card title={`Chat de ${nickName}`}>
              <div className="host-info">
                Conectado desde: <strong>{hostInfo?.host}</strong>
                {hostInfo?.ip}
              </div>
              <div className="messages">
                {messages.map((msg, index) => (
                  <div key={index} className="message">
                    <strong>{msg.author}: </strong>
                    {msg.content}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div
            className="input-chat"
            style={{ display: "flex", gap: "10px", flexDirection: "column" }}
          >
            <InputTextarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              cols={30}
              placeholder="Escribe tu mensaje"
            />
            <Button
              label="Enviar"
              icon="pi pi-send"
              onClick={sendMessage}
              className="p-button-success"
            />
          </div>
        </>
      )}
    </>
  );
};
