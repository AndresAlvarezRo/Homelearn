"use client"

import { useState, useEffect } from "react"
import { useTheme } from "../../contexts/ThemeContext"
import { api } from "../../utils/api"

const UsersManager = () => {
  const { theme } = useTheme()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await api.getUsers()
      setUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
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

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
          Error
        </h3>
        <p style={{ color: theme.colors.textSecondary }}>{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
          Gestión de Usuarios 👥
        </h3>
        <p style={{ color: theme.colors.textSecondary }}>Total de usuarios registrados: {users.length}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              <th className="px-4 py-3 text-left" style={{ color: theme.colors.text }}>
                Usuario
              </th>
              <th className="px-4 py-3 text-left" style={{ color: theme.colors.text }}>
                Email
              </th>
              <th className="px-4 py-3 text-left" style={{ color: theme.colors.text }}>
                Código
              </th>
              <th className="px-4 py-3 text-left" style={{ color: theme.colors.text }}>
                Rol
              </th>
              <th className="px-4 py-3 text-left" style={{ color: theme.colors.text }}>
                Cursos
              </th>
              <th className="px-4 py-3 text-left" style={{ color: theme.colors.text }}>
                Progreso
              </th>
              <th className="px-4 py-3 text-left" style={{ color: theme.colors.text }}>
                Registro
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold mr-3">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ color: theme.colors.text }}>{user.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: theme.colors.textSecondary }}>
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-1 rounded text-xs font-mono"
                    style={{
                      backgroundColor: theme.colors.primary + "20",
                      color: theme.colors.primary,
                    }}
                  >
                    {user.user_code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      user.is_admin ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.is_admin ? "Admin" : "Usuario"}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: theme.colors.textSecondary }}>
                  {user.enrolled_courses || 0}
                </td>
                <td className="px-4 py-3" style={{ color: theme.colors.textSecondary }}>
                  {user.completed_levels || 0} niveles
                </td>
                <td className="px-4 py-3" style={{ color: theme.colors.textSecondary }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
            No hay usuarios
          </h3>
          <p style={{ color: theme.colors.textSecondary }}>Aún no se han registrado usuarios en el sistema.</p>
        </div>
      )}
    </div>
  )
}

export default UsersManager
