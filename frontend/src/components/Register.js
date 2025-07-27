"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/AuthContext"

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const { login, api } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)

    try {
      const response = await api.post("/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      })

      const { token, user } = response.data
      login(user, token)
      toast.success("¡Cuenta creada exitosamente!")
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al crear la cuenta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: "400px", marginTop: "4rem" }}>
      <div className="card">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">📚 Liceo</h1>
          <h2 className="text-xl font-semibold mb-2">Crear Cuenta</h2>
          <p className="text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-blue-600">
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-sm font-semibold mb-1" style={{ display: "block" }}>
              Nombre de Usuario
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input"
              placeholder="Tu nombre de usuario"
              required
            />
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold mb-1" style={{ display: "block" }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold mb-1" style={{ display: "block" }}>
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-semibold mb-1" style={{ display: "block" }}>
              Confirmar Contraseña
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              placeholder="Repite tu contraseña"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
            {loading ? <div className="spinner"></div> : "Crear Cuenta"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register
