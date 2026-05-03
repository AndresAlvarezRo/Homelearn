"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useAuth } from "./AuthContext"

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

const APP_SLUG = "homelearn"
const CACHE_KEY = "homelearn_theme_cache_v2"
const LEGACY_KEY = "theme"

// URL of the Centro-Hogar portal (port 80) on the same host as Homelearn.
// Centro-Hogar exposes the cross-app theme API at /api/themes etc.
function portalApiBase() {
  if (typeof window === "undefined") return ""
  const proto = window.location.protocol
  const host = window.location.hostname
  return `${proto}//${host}/api`
}

// Minimal fallback used before the API responds, or when offline.
// Keeps the same shape Homelearn components already consume.
const FALLBACK_THEME = {
  slug: "light",
  name: "Claro",
  isDark: false,
  palette: {
    bg: "#ffffff",
    surface: "#f8fafc",
    surfaceAlt: "#f1f5f9",
    border: "#e2e8f0",
    borderHover: "#cbd5e1",
    text: "#1e293b",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    accent1: "#3b82f6",
    accent1Rgb: "59, 130, 246",
    accent2: "#60a5fa",
    accent2Rgb: "96, 165, 250",
    accent3: "#93c5fd",
    accent3Rgb: "147, 197, 253",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
  },
}

// Map a unified palette to the legacy --color-* CSS vars Homelearn components
// already use, plus the unified --bg/--accent1 set so new components can
// share the same vars.
function applyPalette(palette) {
  const root = document.documentElement
  const set = (name, value) => root.style.setProperty(name, value)

  // Unified vars (new naming).
  set("--bg", palette.bg)
  set("--surface", palette.surface)
  set("--surface-alt", palette.surfaceAlt)
  set("--border", palette.border)
  set("--border-hover", palette.borderHover)
  set("--text", palette.text)
  set("--text-secondary", palette.textSecondary)
  set("--text-muted", palette.textMuted)
  set("--accent1", palette.accent1)
  set("--accent1-rgb", palette.accent1Rgb)
  set("--accent2", palette.accent2)
  set("--accent2-rgb", palette.accent2Rgb)
  set("--accent3", palette.accent3)
  set("--accent3-rgb", palette.accent3Rgb)
  set("--success", palette.success)
  set("--warning", palette.warning)
  set("--error", palette.error)

  // Legacy --color-* vars Homelearn already uses across components.
  set("--color-primary", palette.accent1)
  set("--color-secondary", palette.accent2)
  set("--color-background", palette.bg)
  set("--color-surface", palette.surface)
  set("--color-text", palette.text)
  set("--color-textSecondary", palette.textSecondary)
  set("--color-border", palette.border)
  set("--color-success", palette.success)
  set("--color-warning", palette.warning)
  set("--color-error", palette.error)
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeCache(theme) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(theme))
  } catch {}
}

// Builds the legacy map shape `{[slug]: {name, colors, isDark, palette}}`
// so the existing ThemeSelector keeps working without changes.
function buildThemesMap(catalog) {
  const map = {}
  for (const t of catalog) {
    map[t.slug] = {
      name: t.name,
      isDark: t.isDark,
      palette: t.palette,
      colors: {
        primary: t.palette.accent1,
        secondary: t.palette.accent2,
        background: t.palette.bg,
        surface: t.palette.surface,
        text: t.palette.text,
        textSecondary: t.palette.textSecondary,
        border: t.palette.border,
        success: t.palette.success,
        warning: t.palette.warning,
        error: t.palette.error,
      },
    }
  }
  return map
}

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth()
  const [catalog, setCatalog] = useState([])
  const [current, setCurrent] = useState(() => readCache() || FALLBACK_THEME)
  const lastSyncedUserRef = useRef(null)

  // First paint uses the cached palette so we don't flash an unstyled view.
  useEffect(() => {
    applyPalette(current.palette)
  }, [current])

  // Authenticated request to Centro-Hogar's portal API.
  const portalRequest = useCallback(async (path, init = {}) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const headers = {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${portalApiBase()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(text || `HTTP ${res.status}`)
    }
    return res.json()
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [{ themes }, prefs] = await Promise.all([
        portalRequest("/themes"),
        portalRequest(`/user/themes?app=${APP_SLUG}`),
      ])
      setCatalog(themes)
      if (prefs.effective) {
        const t = {
          slug: prefs.effective.slug,
          name: prefs.effective.name,
          isDark: prefs.effective.isDark,
          palette: prefs.effective.palette,
        }
        setCurrent(t)
        writeCache(t)
      }
    } catch (err) {
      // Stay on cached/fallback theme; portal might be down.
      console.warn("[homelearn] theme sync failed:", err.message)
    }
  }, [portalRequest])

  // Sync once per logged-in user. Re-runs when the user changes (login/logout),
  // so single-tab logins propagate without needing a storage event.
  useEffect(() => {
    if (!user) {
      lastSyncedUserRef.current = null
      return
    }
    if (lastSyncedUserRef.current === user.id) return
    lastSyncedUserRef.current = user.id

    // One-time migration of the legacy single-theme localStorage value.
    try {
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        portalRequest(`/user/themes/${APP_SLUG}`, {
          method: "PUT",
          body: JSON.stringify({ themeSlug: legacy }),
        }).catch(() => {})
        localStorage.removeItem(LEGACY_KEY)
      }
    } catch {}

    refresh()
  }, [user, refresh, portalRequest])

  const changeTheme = useCallback(
    async (themeSlug) => {
      const found = catalog.find((t) => t.slug === themeSlug)
      if (!found) return
      const next = { slug: found.slug, name: found.name, isDark: found.isDark, palette: found.palette }
      setCurrent(next)
      writeCache(next)
      try {
        await portalRequest(`/user/themes/${APP_SLUG}`, {
          method: "PUT",
          body: JSON.stringify({ themeSlug }),
        })
      } catch (err) {
        console.warn("[homelearn] save theme failed:", err.message)
      }
    },
    [catalog, portalRequest],
  )

  // Backward-compatible shape for existing components.
  // `theme.colors` mirrors the legacy structure (primary/secondary/...) so old
  // components keep working without changes.
  const legacyTheme = {
    name: current.name,
    colors: {
      primary: current.palette.accent1,
      secondary: current.palette.accent2,
      background: current.palette.bg,
      surface: current.palette.surface,
      text: current.palette.text,
      textSecondary: current.palette.textSecondary,
      border: current.palette.border,
      success: current.palette.success,
      warning: current.palette.warning,
      error: current.palette.error,
    },
  }

  const value = {
    currentTheme: current.slug,
    theme: legacyTheme,
    themes: buildThemesMap(
      catalog.length > 0
        ? catalog
        : [{ slug: current.slug, name: current.name, isDark: current.isDark, palette: current.palette }],
    ),
    changeTheme,
    refresh,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
