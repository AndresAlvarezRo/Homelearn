"use client"

import { useState, useEffect } from "react"
import { useTheme } from "../../contexts/ThemeContext"
import { api } from "../../utils/api"

const LogsViewer = () => {
  const { theme } = useTheme()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadLogs()
    // Auto-refresh logs every 30 seconds
    const interval = setInterval(loadLogs, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const data = await api.getLogs()
      setLogs(data)
    } catch (error) {
      console.error("Error loading logs:", error)
      setError("Failed to load logs")
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level) => {
    switch (level) {
      case "ERROR":
        return "bg-red-100 text-red-800"
      case "WARN":
        return "bg-yellow-100 text-yellow-800"
      case "INFO":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLevelIcon = (level) => {
    switch (level) {
      case "ERROR":
        return "❌"
      case "WARN":
        return "⚠️"
      case "INFO":
        return "ℹ️"
      default:
        return "📝"
    }
  }

  if (loading && logs.length === 0) {
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
        <button
          onClick={loadLogs}
          className="mt-4 px-4 py-2 rounded"
          style={{ backgroundColor: theme.colors.primary, color: "white" }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
            Logs del Sistema 📋
          </h3>
          <p style={{ color: theme.colors.textSecondary }}>
            Últimos eventos del sistema (actualización automática cada 30s)
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="px-4 py-2 rounded flex items-center gap-2"
          style={{ backgroundColor: theme.colors.primary, color: "white" }}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Actualizando...
            </>
          ) : (
            <>🔄 Actualizar</>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {logs.map((log, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-xl">{getLevelIcon(log.level)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ color: theme.colors.text }}>{log.message}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {logs.length === 0 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
            No hay logs disponibles
          </h3>
          <p style={{ color: theme.colors.textSecondary }}>
            Los logs del sistema aparecerán aquí cuando estén disponibles.
          </p>
        </div>
      )}
    </div>
  )
}

export default LogsViewer
