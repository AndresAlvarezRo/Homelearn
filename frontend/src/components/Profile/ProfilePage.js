"use client"

import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { api } from "../../utils/api"

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const { theme } = useTheme()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || "",
    biography: user?.biography || "",
  })
  const [profilePic, setProfilePic] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileChange = (e) => {
    setProfilePic(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("username", formData.username)
      formDataToSend.append("biography", formData.biography)
      if (profilePic) {
        formDataToSend.append("profilePic", profilePic)
      }

      const response = await api.updateProfile(formDataToSend)
      updateUser(response)
      setSuccess("Perfil actualizado correctamente")
      setEditing(false)
      setProfilePic(null)
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Error al actualizar el perfil")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: theme.colors.surface }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
            Mi Perfil
          </h1>
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 rounded-md text-white font-medium"
            style={{ backgroundColor: theme.colors.primary }}
          >
            {editing ? "Cancelar" : "Editar Perfil"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-md" style={{ backgroundColor: theme.colors.error + "20" }}>
            <p style={{ color: theme.colors.error }}>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-md" style={{ backgroundColor: theme.colors.success + "20" }}>
            <p style={{ color: theme.colors.success }}>{success}</p>
          </div>
        )}

        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            {user?.profilePic ? (
              <img
                src={`http://localhost:5000/${user.profilePic}`}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center text-4xl"
                style={{ backgroundColor: theme.colors.border }}
              >
                👤
              </div>
            )}
          </div>

          <div className="flex-1">
            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                    Nombre de usuario
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                    Biografía
                  </label>
                  <textarea
                    name="biography"
                    value={formData.biography}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    }}
                    placeholder="Cuéntanos sobre ti..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                    Foto de perfil
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-md text-white font-medium disabled:opacity-50"
                  style={{ backgroundColor: theme.colors.success }}
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
                    {user?.username}
                  </h3>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    Código de usuario: {user?.userCode}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2" style={{ color: theme.colors.text }}>
                    Email
                  </h4>
                  <p style={{ color: theme.colors.textSecondary }}>{user?.email}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2" style={{ color: theme.colors.text }}>
                    Biografía
                  </h4>
                  <p style={{ color: theme.colors.textSecondary }}>
                    {user?.biography || "No hay biografía disponible"}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2" style={{ color: theme.colors.text }}>
                    Miembro desde
                  </h4>
                  <p style={{ color: theme.colors.textSecondary }}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>

                {user?.isAdmin && (
                  <div className="mt-4 p-3 rounded-md" style={{ backgroundColor: theme.colors.primary + "20" }}>
                    <p className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                      👑 Administrador del sistema
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
