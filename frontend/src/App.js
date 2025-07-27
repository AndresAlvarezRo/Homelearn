"use client"

import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { SocketProvider } from "./contexts/SocketContext"

// Components
import Login from "./components/Auth/Login"
import Register from "./components/Auth/Register"
import Header from "./components/Layout/Header"
import LoadingScreen from "./components/Layout/LoadingScreen"
import Dashboard from "./components/Dashboard/Dashboard"
import CourseDetail from "./components/Course/CourseDetail"
import ProfilePage from "./components/Profile/ProfilePage"
import SocialPage from "./components/Social/SocialPage"
import AdminPanel from "./components/Admin/AdminPanel"
import NotFound from "./components/Layout/NotFound"

// Auth wrapper component
const AuthWrapper = () => {
  const { user, loading } = useAuth()
  const [authMode, setAuthMode] = useState("login")

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return authMode === "login" ? (
      <Login onSwitchToRegister={() => setAuthMode("register")} />
    ) : (
      <Register onSwitchToLogin={() => setAuthMode("login")} />
    )
  }

  return (
    <SocketProvider>
      <div className="min-h-screen" style={{ backgroundColor: "var(--color-background)" }}>
        <Header />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/social" element={<SocialPage />} />
            <Route path="/admin" element={user.isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </SocketProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <AuthWrapper />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
