"use client"

import { useState } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import api from "../../utils/api"

const CreateCourseModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    levels: [
      {
        nivel: "1 - Nivel Inicial",
        temas: [""],
        objetivos: [""],
        herramientas: [""],
        recursos: [""],
      },
    ],
  })
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleLevelChange = (levelIndex, field, value) => {
    const updatedLevels = [...formData.levels]
    updatedLevels[levelIndex] = {
      ...updatedLevels[levelIndex],
      [field]: value,
    }
    setFormData({
      ...formData,
      levels: updatedLevels,
    })
  }

  const handleArrayChange = (levelIndex, field, itemIndex, value) => {
    const updatedLevels = [...formData.levels]
    updatedLevels[levelIndex][field][itemIndex] = value
    setFormData({
      ...formData,
      levels: updatedLevels,
    })
  }

  const addArrayItem = (levelIndex, field) => {
    const updatedLevels = [...formData.levels]
    updatedLevels[levelIndex][field].push("")
    setFormData({
      ...formData,
      levels: updatedLevels,
    })
  }

  const removeArrayItem = (levelIndex, field, itemIndex) => {
    const updatedLevels = [...formData.levels]
    if (updatedLevels[levelIndex][field].length > 1) {
      updatedLevels[levelIndex][field].splice(itemIndex, 1)
      setFormData({
        ...formData,
        levels: updatedLevels,
      })
    }
  }

  const addLevel = () => {
    setFormData({
      ...formData,
      levels: [
        ...formData.levels,
        {
          nivel: `${formData.levels.length + 1} - Nuevo Nivel`,
          temas: [""],
          objetivos: [""],
          herramientas: [""],
          recursos: [""],
        },
      ],
    })
  }

  const removeLevel = (levelIndex) => {
    if (formData.levels.length === 1) {
      toast.error("Course must have at least one level")
      return
    }

    const updatedLevels = formData.levels.filter((_, index) => index !== levelIndex)
    setFormData({
      ...formData,
      levels: updatedLevels,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Clean up empty array items
      const cleanedLevels = formData.levels.map((level) => ({
        ...level,
        temas: level.temas.filter((item) => item.trim() !== ""),
        objetivos: level.objetivos.filter((item) => item.trim() !== ""),
        herramientas: level.herramientas.filter((item) => item.trim() !== ""),
        recursos: level.recursos.filter((item) => item.trim() !== ""),
      }))

      await api.post("/courses", {
        ...formData,
        levels: cleanedLevels,
      })

      toast.success("Course created successfully")
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create course")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom theme-bg-primary rounded-lg text-left overflow-hidden theme-shadow transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="theme-bg-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium theme-text-primary">Create New Course</h3>
                <button type="button" onClick={onClose} className="theme-text-tertiary hover:theme-text-primary">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* Course Info */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-2">Course Title *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Enter course title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="input"
                      placeholder="Enter course description"
                    />
                  </div>
                </div>

                {/* Levels */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium theme-text-primary">Course Levels</h4>
                    <button
                      type="button"
                      onClick={addLevel}
                      className="flex items-center space-x-1 text-sm theme-accent-primary hover:theme-text-primary"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Level</span>
                    </button>
                  </div>

                  {formData.levels.map((level, levelIndex) => (
                    <div key={levelIndex} className="border theme-border-primary rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <input
                          type="text"
                          value={level.nivel}
                          onChange={(e) => handleLevelChange(levelIndex, "nivel", e.target.value)}
                          className="text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 theme-text-primary"
                          placeholder="Level title"
                        />
                        {formData.levels.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLevel(levelIndex)}
                            className="text-red-600 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Temas */}
                        <div>
                          <label className="block text-sm font-medium theme-text-primary mb-2">Temas</label>
                          {level.temas.map((tema, temaIndex) => (
                            <div key={temaIndex} className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={tema}
                                onChange={(e) => handleArrayChange(levelIndex, "temas", temaIndex, e.target.value)}
                                className="flex-1 px-3 py-1 text-sm border theme-border-primary rounded focus:outline-none focus:ring-1 focus:ring-blue-500 theme-bg-primary theme-text-primary"
                                placeholder="Enter tema"
                              />
                              {level.temas.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem(levelIndex, "temas", temaIndex)}
                                  className="text-red-600 hover:text-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addArrayItem(levelIndex, "temas")}
                            className="text-sm theme-accent-primary hover:theme-text-primary"
                          >
                            + Add Tema
                          </button>
                        </div>

                        {/* Objetivos */}
                        <div>
                          <label className="block text-sm font-medium theme-text-primary mb-2">Objetivos</label>
                          {level.objetivos.map((objetivo, objetivoIndex) => (
                            <div key={objetivoIndex} className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={objetivo}
                                onChange={(e) =>
                                  handleArrayChange(levelIndex, "objetivos", objetivoIndex, e.target.value)
                                }
                                className="flex-1 px-3 py-1 text-sm border theme-border-primary rounded focus:outline-none focus:ring-1 focus:ring-blue-500 theme-bg-primary theme-text-primary"
                                placeholder="Enter objetivo"
                              />
                              {level.objetivos.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem(levelIndex, "objetivos", objetivoIndex)}
                                  className="text-red-600 hover:text-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addArrayItem(levelIndex, "objetivos")}
                            className="text-sm theme-accent-primary hover:theme-text-primary"
                          >
                            + Add Objetivo
                          </button>
                        </div>

                        {/* Herramientas */}
                        <div>
                          <label className="block text-sm font-medium theme-text-primary mb-2">Herramientas</label>
                          {level.herramientas.map((herramienta, herramientaIndex) => (
                            <div key={herramientaIndex} className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={herramienta}
                                onChange={(e) =>
                                  handleArrayChange(levelIndex, "herramientas", herramientaIndex, e.target.value)
                                }
                                className="flex-1 px-3 py-1 text-sm border theme-border-primary rounded focus:outline-none focus:ring-1 focus:ring-blue-500 theme-bg-primary theme-text-primary"
                                placeholder="Enter herramienta"
                              />
                              {level.herramientas.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem(levelIndex, "herramientas", herramientaIndex)}
                                  className="text-red-600 hover:text-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addArrayItem(levelIndex, "herramientas")}
                            className="text-sm theme-accent-primary hover:theme-text-primary"
                          >
                            + Add Herramienta
                          </button>
                        </div>

                        {/* Recursos */}
                        <div>
                          <label className="block text-sm font-medium theme-text-primary mb-2">Recursos</label>
                          {level.recursos.map((recurso, recursoIndex) => (
                            <div key={recursoIndex} className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={recurso}
                                onChange={(e) =>
                                  handleArrayChange(levelIndex, "recursos", recursoIndex, e.target.value)
                                }
                                className="flex-1 px-3 py-1 text-sm border theme-border-primary rounded focus:outline-none focus:ring-1 focus:ring-blue-500 theme-bg-primary theme-text-primary"
                                placeholder="Enter recurso URL or description"
                              />
                              {level.recursos.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem(levelIndex, "recursos", recursoIndex)}
                                  className="text-red-600 hover:text-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addArrayItem(levelIndex, "recursos")}
                            className="text-sm theme-accent-primary hover:theme-text-primary"
                          >
                            + Add Recurso
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="theme-bg-secondary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 theme-accent-bg text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Course"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border theme-border-primary shadow-sm px-4 py-2 theme-bg-primary text-base font-medium theme-text-primary hover:theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateCourseModal
