"use client"
import { useTheme } from "../../contexts/ThemeContext"

const LoadingScreen = () => {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-32 w-32 border-b-2 mx-auto mb-4"
          style={{ borderColor: theme.colors.primary }}
        ></div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text }}>
          Cargando Homelearn
        </h2>
        <p style={{ color: theme.colors.textSecondary }}>Preparando tu experiencia de aprendizaje...</p>
      </div>
    </div>
  )
}

export default LoadingScreen
