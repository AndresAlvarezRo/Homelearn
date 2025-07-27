"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Save, User, Mail, MapPin, Calendar } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../../contexts/AuthContext"
import { api } from "../../utils/api"

const EditProfile = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    location: user?.location || "",
    birthDate: user?.birthDate || "",
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.updateProfile(formData)
      const data = await response.json()

      if (data.success) {
        updateUser(data.user)
        toast.success("Perfil actualizado exitosamente")
        navigate("/profile")
      } else {
        toast.error(data.message || "Error al actualizar perfil")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "var(--color-background)" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-4 mb-8"
        >
          <button
            onClick={() => navigate("/profile")}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            Editar Perfil
          </h1>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-text)",
                    border: `1px solid var(--color-border)`,
                  }}
                >
                  Cambiar Foto
                </button>
                <p className="text-sm mt-1" style={{ color: "var(--color-textSecondary)" }}>
                  JPG, PNG o GIF. Máximo 2MB.
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
                <User className="w-4 h-4 inline mr-2" />
                Nombre Completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  "--tw-ring-color": "var(--color-primary)",
                }}
                placeholder="Tu nombre completo"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
                <Mail className="w-4 h-4 inline mr-2" />
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  "--tw-ring-color": "var(--color-primary)",
                }}
                placeholder="tu@email.com"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
                Biografía
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 resize-none"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  "--tw-ring-color": "var(--color-primary)",
                }}
                placeholder="Cuéntanos sobre ti..."
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
                <MapPin className="w-4 h-4 inline mr-2" />
                Ubicación
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  "--tw-ring-color": "var(--color-primary)",
                }}
                placeholder="Ciudad, País"
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
                <Calendar className="w-4 h-4 inline mr-2" />
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  "--tw-ring-color": "var(--color-primary)",
                }}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="px-6 py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text)",
                  border: `1px solid var(--color-border)`,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "white",
                }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{loading ? "Guardando..." : "Guardar Cambios"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default EditProfile
