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
      await api.completeCourseLevel(id, levelId)
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

      <div className="space-y-6">
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
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold" style={{ color: theme.colors.text }}>
                  {level.title}
                </h3>
                <div className="flex items-center gap-4">
                  {level.completed && (
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: theme.colors.success }}
                    >
                      ✅ Completado
                    </span>
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
              </div>

              {/* Content Grid - Now showing all 4 sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* TEMAS (Topics) */}
                {level.topics && level.topics.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                      📚 Temas
                    </h4>
                    <div className="space-y-2">
                      {level.topics.map((topic, topicIndex) => (
                        <div
                          key={topicIndex}
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: theme.colors.background,
                            border: `1px solid ${theme.colors.border}`,
                          }}
                        >
                          <span className="text-sm" style={{ color: theme.colors.text }}>
                            • {topic}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OBJETIVOS (Objectives) */}
                {level.objectives && level.objectives.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                      🎯 Objetivos
                    </h4>
                    <div className="space-y-2">
                      {level.objectives.map((objective, objIndex) => (
                        <div
                          key={objIndex}
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: theme.colors.background,
                            border: `1px solid ${theme.colors.border}`,
                          }}
                        >
                          <span className="text-sm" style={{ color: theme.colors.text }}>
                            • {objective}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* HERRAMIENTAS (Tools) - NOW ADDED */}
                {level.tools && level.tools.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                      🛠️ Herramientas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {level.tools.map((tool, toolIndex) => (
                        <span
                          key={toolIndex}
                          className="px-3 py-2 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: theme.colors.primary + "20",
                            color: theme.colors.primary,
                            border: `1px solid ${theme.colors.primary}40`,
                          }}
                        >
                          🔧 {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* RECURSOS (Resources) - NOW ADDED */}
                {level.resources && level.resources.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                      📖 Recursos
                    </h4>
                    <div className="space-y-2">
                      {level.resources.map((resource, resourceIndex) => (
                        <div
                          key={resourceIndex}
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: theme.colors.background,
                            border: `1px solid ${theme.colors.border}`,
                          }}
                        >
                          {resource.startsWith("http") ? (
                            <a
                              href={resource}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm flex items-center gap-2 hover:underline"
                              style={{ color: theme.colors.primary }}
                            >
                              🔗 {resource}
                            </a>
                          ) : (
                            <span className="text-sm flex items-center gap-2" style={{ color: theme.colors.text }}>
                              📄 {resource}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Show message if no content */}
              {(!level.topics || level.topics.length === 0) &&
                (!level.objectives || level.objectives.length === 0) &&
                (!level.tools || level.tools.length === 0) &&
                (!level.resources || level.resources.length === 0) && (
                  <div className="text-center py-8">
                    <p style={{ color: theme.colors.textSecondary }}>Este nivel aún no tiene contenido disponible.</p>
                  </div>
                )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
              Sin Niveles
            </h3>
            <p style={{ color: theme.colors.textSecondary }}>Este curso aún no tiene niveles disponibles.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseDetail
