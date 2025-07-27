"use client"

import { useState } from "react"
import { useTheme } from "../../contexts/ThemeContext"

const ThemeSelector = () => {
  const { currentTheme, themes, changeTheme, theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md transition-colors"
        style={{
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
        }}
        title="Cambiar tema"
      >
        🎨
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-20"
            style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div className="py-1">
              {Object.entries(themes).map(([key, themeOption]) => (
                <button
                  key={key}
                  onClick={() => {
                    changeTheme(key)
                    setIsOpen(false)
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                    currentTheme === key ? "font-bold" : ""
                  }`}
                  style={{
                    color: currentTheme === key ? theme.colors.primary : theme.colors.text,
                    backgroundColor: currentTheme === key ? theme.colors.primary + "20" : "transparent",
                  }}
                >
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: themeOption.colors.primary }}
                    />
                    {themeOption.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ThemeSelector
