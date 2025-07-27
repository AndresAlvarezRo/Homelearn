"use client"

import { createContext, useContext, useState, useEffect } from "react"

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

const themes = {
  light: {
    name: "Light",
    colors: {
      primary: "#3b82f6",
      secondary: "#64748b",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#1e293b",
      textSecondary: "#64748b",
      border: "#e2e8f0",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    },
  },
  dark: {
    name: "Dark",
    colors: {
      primary: "#60a5fa",
      secondary: "#94a3b8",
      background: "#0f172a",
      surface: "#1e293b",
      text: "#f1f5f9",
      textSecondary: "#94a3b8",
      border: "#334155",
      success: "#34d399",
      warning: "#fbbf24",
      error: "#f87171",
    },
  },
  blue: {
    name: "Ocean Blue",
    colors: {
      primary: "#0ea5e9",
      secondary: "#0284c7",
      background: "#f0f9ff",
      surface: "#e0f2fe",
      text: "#0c4a6e",
      textSecondary: "#0369a1",
      border: "#bae6fd",
      success: "#059669",
      warning: "#d97706",
      error: "#dc2626",
    },
  },
  green: {
    name: "Forest Green",
    colors: {
      primary: "#059669",
      secondary: "#047857",
      background: "#f0fdf4",
      surface: "#dcfce7",
      text: "#14532d",
      textSecondary: "#166534",
      border: "#bbf7d0",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    },
  },
  purple: {
    name: "Royal Purple",
    colors: {
      primary: "#7c3aed",
      secondary: "#6d28d9",
      background: "#faf5ff",
      surface: "#f3e8ff",
      text: "#581c87",
      textSecondary: "#7c2d92",
      border: "#d8b4fe",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    },
  },
}

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState("light")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    const theme = themes[currentTheme]
    const root = document.documentElement

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })

    localStorage.setItem("theme", currentTheme)
  }, [currentTheme])

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName)
    }
  }

  const value = {
    currentTheme,
    theme: themes[currentTheme],
    themes,
    changeTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
