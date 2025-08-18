// frontend/src/utils/api.js

// Fallback LAN robusto: usa el hostname actual y puerto 5000 si no hay env
const FALLBACK_HOST =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "http://localhost:5000"

// Base de la API (si hay REACT_APP_API_URL se usa, si no fallback)
// Normalizamos para quitar slashes finales
export const API_BASE_URL = (process.env.REACT_APP_API_URL || `${FALLBACK_HOST}/api`).replace(/\/+$/, "")

// Host de backend sin el sufijo /api (útil para imágenes y socket.io)
export const API_HOST = API_BASE_URL.replace(/\/api$/, "")

// Base para archivos subidos
export const UPLOADS_BASE_URL = `${API_HOST}/uploads`

// Utilidad para parsear JSON seguro (maneja 204/304 o cuerpos vacíos)
async function safeJson(response) {
  if (response.status === 204 || response.status === 304) return null
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

class ApiService {
  constructor() {
    try {
      this.token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    } catch {
      this.token = null
    }
  }

  setToken(token) {
    this.token = token || null
    try {
      if (token) localStorage.setItem("token", token)
      else localStorage.removeItem("token")
    } catch {
      // ignore storage errors (SSR/priv mode)
    }
  }

  getHeaders() {
    const headers = { "Content-Type": "application/json" }
    if (this.token) headers.Authorization = `Bearer ${this.token}`
    return headers
  }

  getMultipartHeaders() {
    const headers = {}
    if (this.token) headers.Authorization = `Bearer ${this.token}`
    // No seteamos Content-Type para FormData
    return headers
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: this.getHeaders(),
      // Evita respuestas 304 que rompan el flujo con JSON vacío
      cache: "no-store",
      ...options,
    }

    let response
    try {
      response = await fetch(url, config)
    } catch (err) {
      throw new Error(`No se pudo conectar con el servidor (${url}): ${err.message}`)
    }

    const data = await safeJson(response)
    if (!response.ok) {
      throw new Error((data && data.error) || `HTTP error! status: ${response.status}`)
    }
    return data
  }

  async requestMultipart(endpoint, formData) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      method: "POST",
      headers: this.getMultipartHeaders(),
      body: formData,
    }

    let response
    try {
      response = await fetch(url, config)
    } catch (err) {
      throw new Error(`No se pudo conectar con el servidor (${url}): ${err.message}`)
    }

    const data = await safeJson(response)
    if (!response.ok) {
      throw new Error((data && data.error) || `HTTP error! status: ${response.status}`)
    }
    return data
  }

  // ---------- Auth ----------
  async login(credentials) {
    try {
      const data = await this.request("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      })
      if (data?.token) this.setToken(data.token)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async register(userData) {
    try {
      const data = await this.request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  logout() {
    this.setToken(null)
  }

  // ---------- Profile ----------
  async getProfile() {
    return this.request("/profile")
  }

  /**
   * updateProfile: acepta tanto FormData ya armado como un objeto simple
   * - Si pasas FormData, se envía tal cual
   * - Si pasas objeto { username, biography, profilePic? }, lo convertimos a FormData
   */
  async updateProfile(profileDataOrForm) {
    let formData
    if (typeof FormData !== "undefined" && profileDataOrForm instanceof FormData) {
      formData = profileDataOrForm
    } else {
      formData = new FormData()
      const obj = profileDataOrForm || {}
      Object.keys(obj).forEach((k) => {
        const v = obj[k]
        if (v !== null && v !== undefined) formData.append(k, v)
      })
    }

    const url = `${API_BASE_URL}/profile`
    const config = {
      method: "PUT",
      headers: this.getMultipartHeaders(),
      body: formData,
    }

    let response
    try {
      response = await fetch(url, config)
    } catch (err) {
      throw new Error(`No se pudo conectar con el servidor (${url}): ${err.message}`)
    }

    const data = await safeJson(response)
    if (!response.ok) {
      throw new Error((data && data.error) || `HTTP error! status: ${response.status}`)
    }
    return data
  }

  // ---------- Courses ----------
  async getCourses(search = "") {
    const params = search ? `?search=${encodeURIComponent(search)}` : ""
    return this.request(`/courses${params}`)
  }

  async getMyCourses() {
    return this.request("/my-courses")
  }

  async getCourse(id) {
    return this.request(`/course/${id}`)
  }

  async enrollCourse(courseId) {
    return this.request(`/courses/${courseId}/enroll`, { method: "POST" })
  }

  async unsubscribeCourse(courseId) {
    return this.request(`/courses/${courseId}/unsubscribe`, { method: "DELETE" })
  }

  async deleteCourse(courseId) {
    return this.request(`/courses/${courseId}`, { method: "DELETE" })
  }

  async uploadCourse(file) {
    const formData = new FormData()
    formData.append("courseFile", file)
    return this.requestMultipart("/courses/upload", formData)
  }

  async createCourse(courseData) {
    return this.request("/courses", { method: "POST", body: JSON.stringify(courseData) })
  }

  async completeCourseLevel(courseId, levelId) {
    return this.request(`/course/${courseId}/level/${levelId}/complete`, { method: "POST" })
  }

  // ---------- Social ----------
  async getFriends() {
    return this.request("/friends")
  }

  async sendFriendRequest(userCode) {
    return this.request("/friends/request", { method: "POST", body: JSON.stringify({ userCode }) })
  }

  async respondToFriendRequest(friendshipId, action) {
    return this.request(`/friends/${friendshipId}`, { method: "PUT", body: JSON.stringify({ action }) })
  }

  async searchUsers(query) {
    return this.request(`/users/search?q=${encodeURIComponent(query)}`)
  }

  // ---------- Admin ----------
  async getUsers() {
    return this.request("/admin/users")
  }

  async getLogs() {
    return this.request("/admin/logs")
  }

  // ---------- Health ----------
  async healthCheck() {
    return this.request("/health")
  }
}

export const api = new ApiService()
export default api
