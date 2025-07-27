"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/AuthContext"

const Dashboard = () => {
  const { user, api } = useAuth()
  const [courses, setCourses] = useState([])
  const [myCourses, setMyCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [coursesResponse, myCoursesResponse] = await Promise.all([api.get("/courses"), api.get("/my-courses")])

      setCourses(coursesResponse.data)
      setMyCourses(myCoursesResponse.data)
    } catch (error) {
      console.error("Fetch data error:", error)
      toast.error("Error al cargar los cursos")
    } finally {
      setLoading(false)
    }
  }

  const enrollInCourse = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/enroll`)
      toast.success("¡Inscrito exitosamente!")
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al inscribirse")
    }
  }

  const getProgressPercentage = (course) => {
    if (!course.total_levels || course.total_levels === 0) return 0
    return Math.round((course.completed_levels / course.total_levels) * 100)
  }

  if (loading) {
    return (
      <div className="container text-center" style={{ marginTop: "4rem" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem" }}>Cargando cursos...</p>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Welcome Section */}
      <div className="card" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
        <h1 className="text-2xl font-bold mb-2">¡Hola, {user?.username}! 👋</h1>
        <p>Bienvenido de vuelta a tu plataforma de aprendizaje</p>
        <p className="text-sm" style={{ opacity: 0.9, marginTop: "0.5rem" }}>
          Tu código: {user?.userCode}
        </p>
      </div>

      {/* My Courses */}
      {myCourses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">📈 Mis Cursos</h2>
          <div className="grid grid-2">
            {myCourses.map((course) => (
              <div key={course.id} className="card">
                <Link to={`/course/${course.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <h3 className="font-semibold mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {course.completed_levels || 0} de {course.total_levels || 0} niveles completados
                  </p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${getProgressPercentage(course)}%` }}></div>
                  </div>
                  <p className="text-sm text-gray-500">{getProgressPercentage(course)}% completado</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Courses */}
      <div>
        <h2 className="text-xl font-bold mb-4">📚 Cursos Disponibles</h2>
        {courses.filter((course) => !myCourses.some((mc) => mc.id === course.id)).length > 0 ? (
          <div className="grid grid-2">
            {courses
              .filter((course) => !myCourses.some((mc) => mc.id === course.id))
              .map((course) => (
                <div key={course.id} className="card">
                  <h3 className="font-semibold mb-2">{course.title}</h3>
                  {course.description && <p className="text-sm text-gray-600 mb-4">{course.description}</p>}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{course.level_count || 0} niveles</span>
                    <button
                      onClick={() => enrollInCourse(course.id)}
                      className="btn btn-primary"
                      style={{ padding: "0.5rem 1rem" }}
                    >
                      Inscribirse
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="card text-center">
            <h3 className="font-semibold mb-2">No hay cursos disponibles</h3>
            <p className="text-gray-600">
              {myCourses.length > 0 ? "Ya estás inscrito en todos los cursos disponibles" : "Aún no hay cursos creados"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
