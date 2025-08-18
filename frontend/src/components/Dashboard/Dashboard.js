"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useNavigate } from "react-router-dom"
import { api } from "../../utils/api"

const Dashboard = () => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [courses, setCourses] = useState([])
  const [myCourses, setMyCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [uploadLoading, setUploadLoading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [coursesData, myCoursesData] = await Promise.all([api.getCourses(), api.getMyCourses()])
      setCourses(coursesData)
      setMyCourses(myCoursesData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setError("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollCourse = async (courseId) => {
    try {
      await api.enrollCourse(courseId)
      loadData() // Reload data
    } catch (error) {
      console.error("Error enrolling in course:", error)
      setError("Error al inscribirse en el curso")
    }
  }

  const handleUnsubscribeCourse = async (courseId) => {
    if (window.confirm("¿Estás seguro de que quieres desuscribirte de este curso?")) {
      try {
        await api.unsubscribeCourse(courseId)
        loadData() // Reload data
      } catch (error) {
        console.error("Error unsubscribing from course:", error)
        setError("Error al desuscribirse del curso")
      }
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.")) {
      try {
        await api.deleteCourse(courseId)
        loadData() // Reload data
      } catch (error) {
        console.error("Error deleting course:", error)
        setError("Error al eliminar el curso")
      }
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== "application/json") {
      setError("Por favor selecciona un archivo JSON válido")
      return
    }

    setUploadLoading(true)
    setError("")

    try {
      await api.uploadCourse(file)
      setShowUploadModal(false)
      loadData() // Reload data
      alert("¡Curso subido exitosamente!")
    } catch (error) {
      console.error("Error uploading course:", error)
      setError("Error al subir el curso: " + error.message)
    } finally {
      setUploadLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
          ¡Bienvenido, {user?.username}! 👋
        </h1>
        <p style={{ color: theme.colors.textSecondary }}>Hecho con Amor para esta casa llena de sueños.❤️</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md" style={{ backgroundColor: theme.colors.error + "20" }}>
          <p style={{ color: theme.colors.error }}>{error}</p>
          <button onClick={() => setError("")} className="mt-2 text-sm underline" style={{ color: theme.colors.error }}>
            Cerrar
          </button>
        </div>
      )}

      {/* Upload Course Button */}
      <div className="mb-8 flex justify-end">
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-6 py-3 rounded-lg font-medium text-white flex items-center space-x-2"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <span>📁</span>
          <span>Subir Curso JSON</span>
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 max-w-md w-full mx-4" style={{ backgroundColor: theme.colors.surface }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: theme.colors.text }}>
              Subir Curso desde JSON
            </h3>
            <p className="mb-4 text-sm" style={{ color: theme.colors.textSecondary }}>
              Selecciona un archivo JSON con la estructura del curso para subirlo al sistema.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={uploadLoading}
              className="w-full p-3 border rounded-lg mb-4"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />

            <div className="flex space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploadLoading}
                className="flex-1 px-4 py-2 rounded-lg border font-medium"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white"
                style={{ backgroundColor: theme.colors.primary }}
              >
                {uploadLoading ? "Subiendo..." : "Seleccionar Archivo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Courses Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
          Mis Cursos
        </h2>
        {myCourses.length === 0 ? (
          <div className="text-center py-8 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
            <div className="text-4xl mb-4">📚</div>
            <p style={{ color: theme.colors.textSecondary }}>
              Aún no estás inscrito en ningún curso. ¡Explora los cursos disponibles abajo!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map((course) => (
              <div
                key={course.id}
                className="rounded-lg shadow-md p-6"
                style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
              >
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>
                  {course.title}
                </h3>
                <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
                  {course.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    {course.completed_levels || 0} / {course.total_levels || 0} completados
                  </span>
                  <div className="w-16 h-2 rounded-full" style={{ backgroundColor: theme.colors.border }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: theme.colors.success,
                        width: `${((course.completed_levels || 0) / (course.total_levels || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="flex-1 px-4 py-2 rounded-md text-white font-medium"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    Continuar
                  </button>
                  <button
                    onClick={() => handleUnsubscribeCourse(course.id)}
                    className="px-4 py-2 rounded-md font-medium"
                    style={{
                      backgroundColor: theme.colors.error,
                      color: "white",
                    }}
                  >
                    Desuscribirse
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Courses Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
            Cursos Disponibles
          </h2>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 rounded-md border"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = myCourses.some((mc) => mc.id === course.id)
            const canDelete = user?.is_admin || course.created_by === user?.id

            return (
              <div
                key={course.id}
                className="rounded-lg shadow-md p-6"
                style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
              >
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>
                  {course.title}
                </h3>
                <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
                  {course.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    Por: {course.created_by_username}
                  </span>
                  <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    {course.level_count} niveles
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="flex-1 px-4 py-2 rounded-md text-white font-medium"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    Ver Detalles
                  </button>
                  {!isEnrolled && (
                    <button
                      onClick={() => handleEnrollCourse(course.id)}
                      className="px-4 py-2 rounded-md font-medium"
                      style={{
                        backgroundColor: theme.colors.success,
                        color: "white",
                      }}
                    >
                      Inscribirse
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="px-4 py-2 rounded-md font-medium"
                      style={{
                        backgroundColor: theme.colors.error,
                        color: "white",
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
