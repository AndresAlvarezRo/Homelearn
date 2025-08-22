"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"
import { api } from "../../utils/api"

// ---------- Progreso por TEMAS en localStorage (por usuario/curso) ----------
const storageKey = (userId, courseId) => `hl_topic_progress:u${userId || "anon"}:c${courseId}`
const readTopicState = (userId, courseId) => {
  try { return JSON.parse(localStorage.getItem(storageKey(userId, courseId)) || "{}") } catch { return {} }
}
const writeTopicState = (userId, courseId, obj) => {
  try { localStorage.setItem(storageKey(userId, courseId), JSON.stringify(obj)) } catch {}
}

const CourseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { user } = useAuth()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [topicState, setTopicState] = useState({}) // { [levelId]: { [topicIndex]: boolean } }

  useEffect(() => {
    loadCourse()
  }, [id])

  const loadCourse = async () => {
    try {
      setLoading(true)
      const courseData = await api.getCourse(id)
      setCourse(courseData)
      setTopicState(readTopicState(user?.id, courseData?.id))
      if (courseData && !courseData.isEnrolled) {
        // auto-enroll si no está inscrito
        try {
          await api.enrollCourse(id)
          const fresh = await api.getCourse(id)
          setCourse(fresh)
          setTopicState(readTopicState(user?.id, fresh?.id))
        } catch {}
      }
    } catch (err) {
      console.error("Error loading course:", err)
      setError("Error al cargar el curso")
      setCourse(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteLevel = async (levelId) => {
    try {
      await api.completeCourseLevel(id, levelId)
      await loadCourse()
    } catch (err) {
      console.error("Error completing level:", err)
      setError("Error al completar el nivel")
    }
  }

  // ---------- Progreso por tema (local) ----------
  const isTopicDone = (levelId, topicIndex) => !!topicState?.[levelId]?.[topicIndex]
  const toggleTopic = (levelId, topicIndex) => {
    setTopicState((prev) => {
      const next = {
        ...prev,
        [levelId]: { ...(prev[levelId] || {}), [topicIndex]: !prev?.[levelId]?.[topicIndex] },
      }
      if (course?.id) writeTopicState(user?.id, course.id, next)
      return next
    })
  }

  // ---------- Métricas ----------
  const overallPercent = useMemo(() => {
    const total = course?.levels?.length || 0
    if (!total) return 0
    const done = course.levels.filter((lv) => !!lv.completed).length
    return Math.round((done / total) * 100)
  }, [course])

  const levelTopicsPercent = (level) => {
    const total = level?.topics?.length || 0
    if (!total) return 0
    const done = (level.topics || []).reduce((acc, _t, idx) => acc + (isTopicDone(level.id, idx) ? 1 : 0), 0)
    return Math.round((done / total) * 100)
  }

  // ---------- UI helpers (colores del tema) ----------
  const cardStyle = { backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }
  const chipStyle = {
    backgroundColor: theme.colors.primary + "20",
    color: theme.colors.primary,
    border: `1px solid ${theme.colors.primary}40`,
  }
  const bubbleStyle = { backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.border}` }

  const ProgressBar = ({ percent, height = 8 }) => (
    <div
      style={{
        height,
        borderRadius: 999,
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: "100%",
          backgroundColor: theme.colors.primary,
          transition: "width .25s ease",
        }}
      />
    </div>
  )

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: theme.colors.primary }} />
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
      {/* back + encabezado */}
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
        {course.description && (
          <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
            {course.description}
          </p>
        )}
        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
          Creado por: {course.created_by_username}
        </p>
      </div>

      {/* progreso del curso */}
      <div className="mb-8 p-4 rounded-lg" style={cardStyle}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold" style={{ color: theme.colors.text }}>
            📈 Progreso del Curso (por niveles)
          </h3>
          <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
            {course.levels?.filter((lv) => !!lv.completed).length}/{course.levels?.length || 0}
          </span>
        </div>
        <ProgressBar percent={overallPercent} />
        <div className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
          {overallPercent}% del curso completado
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
          Niveles del Curso
        </h2>

        {course.levels && course.levels.length > 0 ? (
          course.levels.map((level, index) => (
            <div key={level.id} className="rounded-lg shadow-md p-6" style={cardStyle}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold" style={{ color: theme.colors.text }}>
                    {level.title || level.level_title || `Nivel ${index + 1}`}
                  </h3>
                  {/* mini progreso por temas */}
                  <div className="mt-2">
                    <div className="text-sm mb-1" style={{ color: theme.colors.textSecondary }}>
                      Progreso de temas: {levelTopicsPercent(level)}%
                    </div>
                    <ProgressBar percent={levelTopicsPercent(level)} />
                  </div>
                </div>

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

              {/* GRID 2 columnas (con fallback inline por si no hay utilidades CSS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* TEMAS con checkbox */}
                {level.topics && level.topics.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                      📚 Temas
                    </h4>
                    <div className="space-y-2">
                      {level.topics.map((topic, topicIndex) => {
                        const done = isTopicDone(level.id, topicIndex)
                        return (
                          <div key={topicIndex} className="p-3 rounded-lg" style={bubbleStyle}>
                            <label className="flex items-center gap-3 w-full cursor-pointer">
                              <input
                                type="checkbox"
                                checked={done}
                                onChange={() => toggleTopic(level.id, topicIndex)}
                                aria-label={`Marcar tema ${topicIndex + 1} del nivel ${index + 1}`}
                                style={{ width: 18, height: 18 }}
                              />
                              <span
                                className="text-sm"
                                style={{
                                  color: theme.colors.text,
                                  textDecoration: done ? "line-through" : "none",
                                  opacity: done ? 0.75 : 1,
                                }}
                              >
                                • {topic}
                              </span>
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* OBJETIVOS */}
                {level.objectives && level.objectives.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                      🎯 Objetivos
                    </h4>
                    <div className="space-y-2">
                      {level.objectives.map((objective, objIndex) => (
                        <div key={objIndex} className="p-3 rounded-lg" style={bubbleStyle}>
                          <span className="text-sm" style={{ color: theme.colors.text }}>
                            • {objective}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* HERRAMIENTAS */}
                {level.tools && level.tools.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                      🛠️ Herramientas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {level.tools.map((tool, toolIndex) => (
                        <span key={toolIndex} className="px-3 py-2 rounded-full text-sm font-medium" style={chipStyle}>
                          🔧 {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* RECURSOS */}
                {level.resources && level.resources.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                      📖 Recursos
                    </h4>
                    <div className="space-y-2">
                      {level.resources.map((resource, resourceIndex) => (
                        <div key={resourceIndex} className="p-3 rounded-lg" style={bubbleStyle}>
                          {typeof resource === "string" && resource.startsWith("http") ? (
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
                              📄 {String(resource)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sin contenido */}
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
          <div className="text-center py-8 rounded-lg" style={cardStyle}>
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
