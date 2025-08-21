// frontend/src/contexts/SocketContext.js
"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import io from "socket.io-client"
import { useAuth } from "./AuthContext"
import { API_HOST } from "../utils/api" // contexts -> utils

const SocketContext = createContext(null)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) throw new Error("useSocket must be used within SocketProvider")
  return context
}

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Si no hay usuario, cerramos cualquier socket abierto
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
      setSocket(null)
      setConnected(false)
      return
    }

    // Abrimos conexión para el usuario actual
    const SOCKET_URL = (process.env.REACT_APP_SOCKET_URL || API_HOST).replace(/\/$/, "")
    const s = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    })

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    s.on("connect", onConnect)
    s.on("disconnect", onDisconnect)

    socketRef.current = s
    setSocket(s)

    // Limpieza al cambiar usuario o desmontar
    return () => {
      s.off("connect", onConnect)
      s.off("disconnect", onDisconnect)
      s.close()
      if (socketRef.current === s) socketRef.current = null
      setSocket((curr) => (curr === s ? null : curr))
      setConnected(false)
    }
  }, [user])

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>
}
