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

  const loadCourse = async () => {
    if (!id) return;
    
    setLoading(true);
    setError("");
    
    try {
      console.log("Loading course:", id);
      const courseData = await api.request(`/courses/${id}`);
      console.log("Course data received:", courseData);
      
      setCourse(courseData);
      setTopicState(readTopicState(user?.id, courseData?.id));

      // Cargar mini-cursos para cada nivel
      if (courseData && courseData.levels) {
        const miniCoursesData = {};
        for (const level of courseData.levels) {
          try {
            const response = await api.request(`/levels/${level.id}/mini-courses`);
            miniCoursesData[level.id] = response;
          } catch (err) {
            console.error(`Error loading mini-courses for level ${level.id}:`, err);
          }
        }
        setMiniCoursesByLevel(miniCoursesData);
      }

      if (courseData && !courseData.isEnrolled) {
        // auto-enroll si no está inscrito
        try {
          await api.request(`/courses/${id}/enroll`, { method: "POST" });
          const fresh = await api.request(`/courses/${id}`);
          setCourse(fresh);
          setTopicState(readTopicState(user?.id, fresh?.id));
        } catch (enrollErr) {
          console.error("Error auto-enrolling:", enrollErr);
        }
      }
    } catch (err) {
      console.error("Error loading course:", err);
      setError(err.message || "Error al cargar el curso");
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [id]);

  // Mini-cursos por nivel
  const [miniCoursesByLevel, setMiniCoursesByLevel] = useState({});
  const [miniLoading, setMiniLoading] = useState(false);
  const [miniCourseDetail, setMiniCourseDetail] = useState(null);
  const [showMiniPopup, setShowMiniPopup] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editMiniCourseData, setEditMiniCourseData] = useState(null);

  const handleViewMiniCourse = async (miniCourseId) => {
    try {
      console.log("Fetching mini-course:", miniCourseId);
      const miniCourse = await api.request(`/mini-courses/${miniCourseId}`);
      console.log("Mini-course data:", miniCourse);
      setMiniCourseDetail(miniCourse);
      setShowMiniPopup(true);
    } catch (err) {
      console.error("Error fetching mini-course:", err);
      alert("Error al cargar el mini-curso: " + (err.message || "Error desconocido"));
    }
  };

  const closeMiniPopup = () => {
    setShowMiniPopup(false);
    setMiniCourseDetail(null);
  };

  const handleDeleteMiniCourse = async (miniCourseId) => {
    if (window.confirm("¿Estás seguro de que quieres borrar este mini-curso?")) {
      try {
        await api.request(`/mini-courses/${miniCourseId}`, { method: "DELETE" });
        alert("Mini-curso eliminado correctamente.");
        await loadCourse();
        setShowMiniPopup(false);
        setMiniCourseDetail(null);
      } catch (err) {
        console.error("Error deleting mini-course:", err);
        alert("Error al eliminar el mini-curso: " + err.message);
      }
    }
  };

  // Editar mini-curso
  const handleEditMiniCourse = (miniCourse) => {
    setEditMiniCourseData(miniCourse);
    setEditMode(true);
  };

  const handleSaveEditMiniCourse = async () => {
    try {
      await api.request(`/mini-courses/${editMiniCourseData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editMiniCourseData),
      });
      alert("Mini-curso editado correctamente.");
      await loadCourse();
      setEditMode(false);
      setEditMiniCourseData(null);
    } catch (err) {
      console.error("Error editing mini-course:", err);
      alert("Error al editar el mini-curso: " + err.message);
    }
  };


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
    <>
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
                    {/* MINI-COURSE UPLOAD BUTTON */}
                    <h4 className="font-semibold text-lg flex items-center gap-2" style={{ color: theme.colors.text }}>
                      🪄 Mini-Cursos
                    </h4>
                    <button
                      className="px-3 py-2 rounded-md text-white font-medium"
                      style={{ backgroundColor: theme.colors.primary }}
                      onClick={() => document.getElementById(`mini-upload-${level.id}`)?.click()}
                    >
                      Subir Mini-Curso (JSON)
                    </button>
                    <input
                      type="file"
                      id={`mini-upload-${level.id}`}
                      accept="application/json"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        
                        try {
                          setMiniLoading(true);
                          
                          // Leer el archivo como texto
                          const fileContent = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => resolve(e.target.result);
                            reader.onerror = (e) => reject(e);
                            reader.readAsText(file);
                          });
                          
                          // Parsear el JSON para validarlo
                          const miniCourseData = JSON.parse(fileContent);
                          
                          // Enviar el JSON directamente
                          const token = localStorage.getItem("token");
                          if (!token) {
                            throw new Error("Debes iniciar sesión para subir mini-cursos");
                          }

                          const response = await api.request(`/levels/${level.id}/mini-course`, {
                            method: "POST",
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(miniCourseData)
                          });
                          
                          console.log("Mini-course upload response:", response);
                          alert("Mini-curso subido correctamente");
                          await loadCourse();
                        } catch (err) {
                          console.error("Error uploading mini-course:", err);
                          
                          let errorMessage = "Error desconocido al subir el mini-curso";
                          
                          if (err instanceof SyntaxError) {
                            errorMessage = "Error: El archivo no contiene un JSON válido";
                          } else if (err.message === "Debes iniciar sesión para subir mini-cursos") {
                            errorMessage = err.message;
                          } else if (err.response?.status === 401) {
                            errorMessage = "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.";
                          } else if (err.response?.status === 403) {
                            errorMessage = "No tienes permisos para subir mini-cursos en este nivel.";
                          } else if (err.message) {
                            errorMessage = err.message;
                          }
                          
                          alert(errorMessage);
                        } finally {
                          setMiniLoading(false);
                          e.target.value = ""; // Limpiar input
                        }
                      }}
                    />
                    {/* Listado de mini-cursos */}
                    {miniLoading && <div className="text-sm" style={{ color: theme.colors.textSecondary }}>Cargando mini-cursos...</div>}
                    {miniCoursesByLevel[level.id] && miniCoursesByLevel[level.id].length > 0 && (
                      <div className="mt-2">
                        <h5 className="font-semibold text-md" style={{ color: theme.colors.text }}>
                          Mini-cursos disponibles:
                        </h5>
                        <ul className="space-y-1">
                          {miniCoursesByLevel[level.id].map((mc) => (
                            <li key={mc.id} className="flex items-center gap-2">
                              <button
                                className="underline text-sm"
                                style={{ color: theme.colors.primary }}
                                onClick={() => handleViewMiniCourse(mc.id)}
                              >
                                {mc.title}
                              </button>
                              <button
                                className="text-xs px-2 py-1 rounded bg-yellow-100"
                                style={{ color: theme.colors.primary, border: "1px solid #ffd700" }}
                                onClick={() => handleEditMiniCourse(mc)}
                              >Editar</button>
                              <button
                                className="text-xs px-2 py-1 rounded bg-red-100"
                                style={{ color: theme.colors.error, border: "1px solid #f00" }}
                                onClick={() => handleDeleteMiniCourse(mc.id)}
                              >Borrar</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Temas */}
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

    {/* Pop-up de mini-curso */}
    {showMiniPopup && miniCourseDetail && (
      <div style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        width: "100vw", 
        height: "100vh", 
        background: "rgba(0,0,0,0.4)", 
        zIndex: 1000,
        overflow: "auto",
        padding: "20px 0"
      }}>
        <div style={{ 
          maxWidth: 600, 
          margin: "0 auto", 
          background: theme.colors.surface, 
          borderRadius: 12, 
          boxShadow: "0 2px 16px #0002", 
          padding: 32, 
          position: "relative",
          border: `1px solid ${theme.colors.border}`
        }}>
          <button 
            onClick={closeMiniPopup} 
            style={{ 
              position: "absolute", 
              top: 16, 
              right: 16, 
              fontSize: 24, 
              color: theme.colors.primary, 
              background: "none", 
              border: "none", 
              cursor: "pointer",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              transition: "background-color 0.2s"
            }}
            onMouseOver={e => e.target.style.backgroundColor = `${theme.colors.primary}20`}
            onMouseOut={e => e.target.style.backgroundColor = "transparent"}
          >×</button>
          
          <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
            {miniCourseDetail.title}
          </h2>
          
          <p className="mb-6" style={{ color: theme.colors.textSecondary }}>
            {miniCourseDetail.description}
          </p>
          
          <div className="flex gap-3 mb-6">
            <button 
              className="px-4 py-2 rounded-md transition-colors duration-200" 
              style={{ 
                backgroundColor: `${theme.colors.primary}20`,
                color: theme.colors.primary,
                border: `1px solid ${theme.colors.primary}40`
              }}
              onMouseOver={e => e.target.style.backgroundColor = `${theme.colors.primary}30`}
              onMouseOut={e => e.target.style.backgroundColor = `${theme.colors.primary}20`}
              onClick={() => handleEditMiniCourse(miniCourseDetail)}
            >
              ✏️ Editar
            </button>
            <button 
              className="px-4 py-2 rounded-md transition-colors duration-200" 
              style={{ 
                backgroundColor: `${theme.colors.error}20`,
                color: theme.colors.error,
                border: `1px solid ${theme.colors.error}40`
              }}
              onMouseOver={e => e.target.style.backgroundColor = `${theme.colors.error}30`}
              onMouseOut={e => e.target.style.backgroundColor = `${theme.colors.error}20`}
              onClick={() => handleDeleteMiniCourse(miniCourseDetail.id)}
            >
              🗑️ Borrar
            </button>
          </div>

          {miniCourseDetail.levels && miniCourseDetail.levels.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                📚 Niveles del Mini-Curso
              </h3>
              <div className="space-y-6">
                {miniCourseDetail.levels.map((lvl, idx) => (
                  <div 
                    key={lvl.id} 
                    style={{ 
                      borderBottom: `1px solid ${theme.colors.border}`,
                      paddingBottom: 16,
                      marginBottom: 16
                    }}
                    className="rounded-lg p-4"
                  >
                    <h4 className="text-lg font-semibold mb-3" style={{ color: theme.colors.primary }}>
                      {lvl.title || `Nivel ${idx + 1}`}
                    </h4>
                    
                    <div className="space-y-3" style={{ color: theme.colors.text }}>
                      {lvl.topics?.length > 0 && (
                        <div className="pl-4 space-y-1">
                          <span className="font-medium block" style={{ color: theme.colors.textSecondary }}>📝 Temas:</span>
                          <ul className="list-disc pl-4">
                            {lvl.topics.map((topic, i) => (
                              <li key={i}>{topic}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {lvl.objectives?.length > 0 && (
                        <div className="pl-4 space-y-1">
                          <span className="font-medium block" style={{ color: theme.colors.textSecondary }}>🎯 Objetivos:</span>
                          <ul className="list-disc pl-4">
                            {lvl.objectives.map((obj, i) => (
                              <li key={i}>{obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {lvl.tools?.length > 0 && (
                        <div className="pl-4 space-y-2">
                          <span className="font-medium block" style={{ color: theme.colors.textSecondary }}>🛠️ Herramientas:</span>
                          <div className="flex flex-wrap gap-2">
                            {lvl.tools.map((tool, i) => (
                              <span 
                                key={i}
                                className="px-3 py-1 rounded-full text-sm"
                                style={{ 
                                  backgroundColor: `${theme.colors.primary}15`,
                                  color: theme.colors.primary,
                                  border: `1px solid ${theme.colors.primary}30`
                                }}
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {lvl.resources?.length > 0 && (
                        <div className="pl-4 space-y-1">
                          <span className="font-medium block" style={{ color: theme.colors.textSecondary }}>📚 Recursos:</span>
                          <ul className="space-y-2">
                            {lvl.resources.map((resource, i) => (
                              <li key={i}>
                                {typeof resource === "string" && resource.startsWith("http") ? (
                                  <a
                                    href={resource}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 hover:underline transition-colors duration-200"
                                    style={{ 
                                      color: theme.colors.primary,
                                      textDecoration: "none",
                                      wordBreak: "break-all",
                                      overflowWrap: "break-word"
                                    }}
                                    onMouseOver={e => e.target.style.textDecoration = "underline"}
                                    onMouseOut={e => e.target.style.textDecoration = "none"}
                                  >
                                    🔗 {resource}
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    📄 {resource}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Pop-up de edición de mini-curso */}
    {editMode && editMiniCourseData && (
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.4)", zIndex: 1000 }}>
        <div style={{ maxWidth: 600, margin: "5vh auto", background: theme.colors.surface, borderRadius: 12, boxShadow: "0 2px 16px #0002", padding: 32, position: "relative" }}>
          <button onClick={() => { setEditMode(false); setEditMiniCourseData(null); }} style={{ position: "absolute", top: 16, right: 16, fontSize: 24, color: theme.colors.primary, background: "none", border: "none", cursor: "pointer" }}>×</button>
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>Editar Mini-Curso</h2>
          <input className="mb-2 w-full p-2 border rounded" style={{ color: theme.colors.text }} value={editMiniCourseData.title} onChange={e => setEditMiniCourseData({ ...editMiniCourseData, title: e.target.value })} />
          <textarea className="mb-2 w-full p-2 border rounded" style={{ color: theme.colors.text }} value={editMiniCourseData.description} onChange={e => setEditMiniCourseData({ ...editMiniCourseData, description: e.target.value })} />
          {/* Aquí podrías agregar edición de niveles si lo necesitas */}
          <button className="px-4 py-2 rounded bg-green-500 text-white" onClick={handleSaveEditMiniCourse}>Guardar</button>
        </div>
      </div>
    )}
    </>
  )
}

export default CourseDetail;
