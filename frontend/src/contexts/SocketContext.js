"use client"

import { createContext, useContext, useEffect, useState } from "react"
import io from "socket.io-client"
import { useAuth } from "./AuthContext"

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_API_URL || "http://localhost:5000", {
        transports: ["websocket"],
      })

      newSocket.on("connect", () => {
        console.log("Socket connected")
        setConnected(true)
      })

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected")
        setConnected(false)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [user])

  const joinCourse = (courseId) => {
    if (socket) {
      socket.emit("join-course", courseId)
    }
  }

  const value = {
    socket,
    connected,
    joinCourse,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
