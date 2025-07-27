"use client"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../../contexts/ThemeContext"

const NotFound = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-4xl font-bold mb-4" style={{ color: theme.colors.text }}>
          404
        </h1>
        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
          Página no encontrada
        </h2>
        <p className="mb-8" style={{ color: theme.colors.textSecondary }}>
          La página que buscas no existe o ha sido movida.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 rounded-md font-medium text-white transition-colors"
          style={{ backgroundColor: theme.colors.primary }}
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  )
}

export default NotFound
