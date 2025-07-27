"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTheme } from "../../contexts/ThemeContext"
import { api } from "../../utils/api"

const CourseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadCourse()
  }, [id])

  const loadCourse = async () => {
    try {
      setLoading(true)
      const courseData = await api.getCourse(id)
      setCourse(courseData)
    } catch (error) {
      console.error("Error loading course:", error)
      setError("Error al cargar el curso")
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteLevel = async (levelId) => {
    try {
      await api.completeLevel(id, levelId)
      loadCourse() // Reload course data
    } catch (error) {
      console.error("Error completing level:", error)
      setError("Error al completar el nivel")
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

  if (error || !course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
            Error al cargar el curso
          </h2>
          <p style={{ color: theme.colors.textSecondary }}>{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-4 py-2 rounded-md text-white"
            style={{ backgroundColor: theme.colors.primary }}
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-4 text-sm underline"
          style={{ color: theme.colors.primary }}
        >
          ← Volver al Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
          {course.title}
        </h1>
        <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
          {course.description}
        </p>
        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
          Creado por: {course.created_by_username}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
          Niveles del Curso
        </h2>

        {course.levels && course.levels.length > 0 ? (
          course.levels.map((level, index) => (
            <div
              key={level.id}
              className="rounded-lg shadow-md p-6"
              style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
                  {level.level_title}
                </h3>
                {level.completed && (
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: theme.colors.success }}
                  >
                    ✓ Completado
                  </span>
                )}
              </div>

              {level.topics && level.topics.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2" style={{ color: theme.colors.text }}>
                    Temas:
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {level.topics.map((topic, topicIndex) => (
                      <li key={topicIndex} className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {level.objectives && level.objectives.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2" style={{ color: theme.colors.text }}>
                    Objetivos:
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {level.objectives.map((objective, objIndex) => (
                      <li key={objIndex} className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!level.completed && course.isEnrolled && (
                <button
                  onClick={() => handleCompleteLevel(level.id)}
                  className="px-4 py-2 rounded-md text-white font-medium"
                  style={{ backgroundColor: theme.colors.success }}
                >
                  Marcar como Completado
                </button>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: theme.colors.textSecondary }}>Este curso aún no tiene niveles disponibles.</p>
        )}
      </div>
    </div>
  )
}

export default CourseDetail
