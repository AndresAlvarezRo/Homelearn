"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/AuthContext"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
    setLoading(true)

    try {
      console.log("Attempting login with:", formData.email)
      const response = await api.post("/auth/login", formData)
      const { token, user } = response.data

      login(user, token)
      toast.success("¡Bienvenido de vuelta!")
    } catch (error) {
      console.error("Login error:", error)
      toast.error(error.response?.data?.error || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: "400px", marginTop: "4rem" }}>
      <div className="card">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">📚 Liceo</h1>
          <h2 className="text-xl font-semibold mb-2">Iniciar Sesión</h2>
          <p className="text-gray-600">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-blue-600">
              Regístrate aquí
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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

          <div className="mb-6">
            <label className="text-sm font-semibold mb-1" style={{ display: "block" }}>
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              placeholder="Tu contraseña"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
            {loading ? <div className="spinner"></div> : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-6 p-4" style={{ backgroundColor: "#f3f4f6", borderRadius: "6px" }}>
          <p className="text-sm text-center text-gray-600 mb-2">Cuenta de prueba:</p>
          <p className="text-sm text-center">
            <strong>Email:</strong> admin@homelearn.com
            <br />
            <strong>Contraseña:</strong> admin123
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
