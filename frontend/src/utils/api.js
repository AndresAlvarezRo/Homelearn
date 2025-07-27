const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

class ApiService {
  constructor() {
    this.token = localStorage.getItem("token")
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem("token", token)
    } else {
      localStorage.removeItem("token")
    }
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    return headers
  }

  getMultipartHeaders() {
    const headers = {}
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    return headers
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: this.getHeaders(),
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  async requestMultipart(endpoint, formData) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      method: "POST",
      headers: this.getMultipartHeaders(),
      body: formData,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("API multipart request failed:", error)
      throw error
    }
  }

  // Auth methods
  async login(credentials) {
    try {
      const data = await this.request("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      })
      if (data.token) {
        this.setToken(data.token)
      }
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

  // Profile methods
  async getProfile() {
    return this.request("/profile")
  }

  async updateProfile(profileData) {
    const formData = new FormData()
    Object.keys(profileData).forEach((key) => {
      if (profileData[key] !== null && profileData[key] !== undefined) {
        formData.append(key, profileData[key])
      }
    })

    const url = `${API_BASE_URL}/profile`
    const config = {
      method: "PUT",
      headers: this.getMultipartHeaders(),
      body: formData,
    }

    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`)
    }

    return data
  }

  // Course methods
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
    return this.request(`/courses/${courseId}/enroll`, {
      method: "POST",
    })
  }

  async unsubscribeCourse(courseId) {
    return this.request(`/courses/${courseId}/unsubscribe`, {
      method: "DELETE",
    })
  }

  async deleteCourse(courseId) {
    return this.request(`/courses/${courseId}`, {
      method: "DELETE",
    })
  }

  async uploadCourse(file) {
    const formData = new FormData()
    formData.append("courseFile", file)
    return this.requestMultipart("/courses/upload", formData)
  }

  async createCourse(courseData) {
    return this.request("/courses", {
      method: "POST",
      body: JSON.stringify(courseData),
    })
  }

  async completeCourseLevel(courseId, levelId) {
    return this.request(`/course/${courseId}/level/${levelId}/complete`, {
      method: "POST",
    })
  }

  // Social methods
  async getFriends() {
    return this.request("/friends")
  }

  async sendFriendRequest(userCode) {
    return this.request("/friends/request", {
      method: "POST",
      body: JSON.stringify({ userCode }),
    })
  }

  async respondToFriendRequest(friendshipId, action) {
    return this.request(`/friends/${friendshipId}`, {
      method: "PUT",
      body: JSON.stringify({ action }),
    })
  }

  async searchUsers(query) {
    return this.request(`/users/search?q=${encodeURIComponent(query)}`)
  }

  // Admin methods
  async getUsers() {
    return this.request("/admin/users")
  }

  async getLogs() {
    return this.request("/admin/logs")
  }

  // Health check
  async healthCheck() {
    return this.request("/health")
  }
}

export const api = new ApiService()
export default api
