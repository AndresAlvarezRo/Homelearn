"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { api } from "../../utils/api"
import UsersManager from "./UsersManager"
import LogsViewer from "./LogsViewer"

const AdminPanel = () => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
  })
  const [loading, setLoading] = useState(true)

  const tabs = [
    { id: "overview", name: "Resumen", icon: "📊" },
    { id: "users", name: "Usuarios", icon: "👥" },
    { id: "logs", name: "Logs del Sistema", icon: "📋" },
  ]

  useEffect(() => {
    if (user?.is_admin) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [users, courses] = await Promise.all([api.getUsers().catch(() => []), api.getCourses().catch(() => [])])

      setStats({
        totalUsers: users.length || 0,
        totalCourses: courses.length || 0,
        totalEnrollments: users.reduce((sum, user) => sum + (user.enrolled_courses || 0), 0),
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  // Redirect if not admin
  if (!user?.is_admin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="text-center p-8 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
            Acceso Denegado
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            No tienes permisos de administrador para acceder a esta página.
          </p>
          <p className="mt-2 text-sm" style={{ color: theme.colors.textSecondary }}>
            Inicia sesión como admin@homelearn.com para acceder al panel de administración.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="animate-spin rounded-full h-32 w-32 border-b-2"
          style={{ borderColor: theme.colors.primary }}
        ></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
          Panel de Administración ⚙️
        </h1>
        <p style={{ color: theme.colors.textSecondary }}>
          Bienvenido, {user.username}. Gestiona usuarios, cursos y monitorea el sistema.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: theme.colors.surface }}>
          <div className="flex items-center">
            <div className="text-3xl mr-4">👥</div>
            <div>
              <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                {stats.totalUsers}
              </p>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                Total Usuarios
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: theme.colors.surface }}>
          <div className="flex items-center">
            <div className="text-3xl mr-4">📚</div>
            <div>
              <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                {stats.totalCourses}
              </p>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                Total Cursos
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: theme.colors.surface }}>
          <div className="flex items-center">
            <div className="text-3xl mr-4">📈</div>
            <div>
              <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                {stats.totalEnrollments}
              </p>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                Total Inscripciones
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg shadow-md" style={{ backgroundColor: theme.colors.surface }}>
        <div className="border-b" style={{ borderColor: theme.colors.border }}>
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id ? "border-current" : "border-transparent hover:border-gray-300"
                }`}
                style={{
                  color: activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary,
                }}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
                Panel de Administración Activo
              </h3>
              <p style={{ color: theme.colors.textSecondary }}>
                El sistema está funcionando correctamente. Usa las pestañas para gestionar usuarios y ver logs.
              </p>
            </div>
          )}
          {activeTab === "users" && <UsersManager />}
          {activeTab === "logs" && <LogsViewer />}
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
