"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/AuthContext"

const CourseDetail = () => {
  const { id } = useParams()
  const { api } = useAuth()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState(0)

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${id}`)
      setCourse(response.data)

      // Auto-enroll if not enrolled
      if (response.data && !response.data.progress) {
        try {
          await api.post(`/courses/${id}/enroll`)
        } catch (error) {
          // Ignore enrollment errors
        }
      }
    } catch (error) {
      toast.error("Error al cargar el curso")
    } finally {
      setLoading(false)
    }
  }

  const toggleProgress = async (levelId, currentStatus) => {
    try {
      await api.post(`/progress/${levelId}`, { completed: !currentStatus })
      toast.success(currentStatus ? "Progreso desmarcado" : "¡Nivel completado!")
      fetchCourse()
    } catch (error) {
      toast.error("Error al actualizar el progreso")
    }
  }

  const getLevelProgress = (levelId) => {
    const progress = course.progress?.find((p) => p.level_id === levelId)
    return progress?.completed || false
  }

  const getOverallProgress = () => {
    if (!course.levels || course.levels.length === 0) return 0
    const completedLevels = course.progress?.filter((p) => p.completed).length || 0
    return Math.round((completedLevels / course.levels.length) * 100)
  }

  if (loading) {
    return (
      <div className="container text-center" style={{ marginTop: "4rem" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem" }}>Cargando curso...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container text-center" style={{ marginTop: "4rem" }}>
        <h2 className="text-xl font-bold mb-4">Curso no encontrado</h2>
        <Link to="/dashboard" className="btn btn-primary">
          Volver al Dashboard
        </Link>
      </div>
    )
  }

  const currentLevel = course.levels[selectedLevel]
  const completedLevels = course.progress?.filter((p) => p.completed).length || 0

  return (
    <div className="container">
      {/* Back Button */}
      <div className="mb-4">
        <Link to="/dashboard" className="btn btn-secondary">
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Course Header */}
      <div className="card mb-6">
        <h1 className="text-2xl font-bold mb-4">{course.title}</h1>

        {/* Progress Section */}
        <div className="p-4 mb-4" style={{ backgroundColor: "#eff6ff", borderRadius: "8px" }}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-blue-900">📈 Progreso del Curso</h3>
            <span className="text-sm text-blue-700">
              {completedLevels}/{course.levels?.length || 0}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${getOverallProgress()}%` }}></div>
          </div>
          <div className="text-sm text-blue-600">{getOverallProgress()}% del curso completado</div>
        </div>

        {/* Level Selector */}
        <div className="mb-4">
          <label className="text-sm font-semibold mb-2" style={{ display: "block" }}>
            Seleccionar Nivel
          </label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(Number.parseInt(e.target.value))}
            className="input"
          >
            {course.levels?.map((level, index) => (
              <option key={level.id} value={index}>
                {getLevelProgress(level.id) ? "✅" : "⭕"} {level.level_title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Level Content */}
      {currentLevel && (
        <div className="card">
          {/* Level Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {selectedLevel + 1} - {currentLevel.level_title?.replace(/^\d+\s*-\s*/, "") || "Fundamentos"}
            </h2>
            <button
              onClick={() => toggleProgress(currentLevel.id, getLevelProgress(currentLevel.id))}
              className={`btn ${getLevelProgress(currentLevel.id) ? "btn-secondary" : "btn-primary"}`}
            >
              {getLevelProgress(currentLevel.id) ? "✅ Completado" : "Marcar como completado"}
            </button>
          </div>

          {/* Content Sections */}
          <div className="grid grid-2">
            {/* Topics */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">📚 Temas</h3>
              {currentLevel.topics && currentLevel.topics.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {currentLevel.topics.map((topic, index) => (
                    <li key={index} className="mb-2 p-2" style={{ backgroundColor: "#f8fafc", borderRadius: "4px" }}>
                      • {topic}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No hay temas definidos</p>
              )}
            </div>

            {/* Objectives */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">🎯 Objetivos</h3>
              {currentLevel.objectives && currentLevel.objectives.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {currentLevel.objectives.map((objective, index) => (
                    <li key={index} className="mb-2 p-2" style={{ backgroundColor: "#f0fdf4", borderRadius: "4px" }}>
                      • {objective}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No hay objetivos definidos</p>
              )}
            </div>

            {/* Tools */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">🛠️ Herramientas</h3>
              {currentLevel.tools && currentLevel.tools.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentLevel.tools.map((tool, index) => (
                    <span
                      key={index}
                      className="text-sm p-2"
                      style={{ backgroundColor: "#fef3c7", borderRadius: "4px" }}
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay herramientas definidas</p>
              )}
            </div>

            {/* Resources */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">📖 Recursos</h3>
              {currentLevel.resources && currentLevel.resources.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {currentLevel.resources.map((resource, index) => (
                    <li key={index} className="mb-2 p-2" style={{ backgroundColor: "#fef2f2", borderRadius: "4px" }}>
                      {resource.startsWith("http") ? (
                        <a href={resource} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                          🔗 {resource}
                        </a>
                      ) : (
                        <span>• {resource}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No hay recursos definidos</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseDetail
