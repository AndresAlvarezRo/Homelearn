"use client"

import { useState, useMemo } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useNavigate, useLocation } from "react-router-dom"
import ThemeSelector from "./ThemeSelector"
import { API_HOST as API_HOST_FROM_UTILS } from "../../utils/api"

// Fallback robusto por si todavía no exportaste API_HOST desde utils/api
const API_HOST =
  API_HOST_FROM_UTILS ||
  (process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, "")
    : typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : "http://localhost:5000")

const Header = () => {
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigationItems = useMemo(
    () => [
      { name: "Dashboard", path: "/dashboard", icon: "🏠" },
      { name: "Perfil", path: "/profile", icon: "👤" },
      { name: "Social", path: "/social", icon: "👥" },
      ...(user?.isAdmin ? [{ name: "Admin", path: "/admin", icon: "⚙️" }] : []),
    ],
    [user?.isAdmin],
  )

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 shadow-lg"
      style={{ backgroundColor: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-xl font-bold"
              style={{ color: theme.colors.primary }}
              aria-label="Ir al dashboard"
            >
              📚 Homelearn
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path) ? "font-bold" : ""
                }`}
                style={{
                  color: isActive(item.path) ? theme.colors.primary : theme.colors.text,
                  backgroundColor: isActive(item.path) ? theme.colors.primary + "20" : "transparent",
                }}
                aria-current={isActive(item.path) ? "page" : undefined}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <ThemeSelector />

            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium" style={{ color: theme.colors.text }}>
                  {user?.username || "Usuario"}
                </div>
                <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  {user?.userCode || ""}
                </div>
              </div>

              {user?.profilePic ? (
                <img
                  src={`${API_HOST}/${user.profilePic}`}
                  alt="Foto de perfil"
                  className="w-8 h-8 rounded-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ backgroundColor: theme.colors.border, color: theme.colors.text }}
                  aria-label="Sin foto de perfil"
                  title="Sin foto de perfil"
                >
                  {(user?.username || "U").slice(0, 1).toUpperCase()}
                </div>
              )}

              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  color: theme.colors.error,
                  backgroundColor: theme.colors.error + "20",
                }}
                aria-label="Cerrar sesión"
              >
                Salir
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen((s) => !s)}
              className="md:hidden p-2 rounded-md"
              style={{ color: theme.colors.text }}
              aria-label="Mostrar menú"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t" style={{ borderColor: theme.colors.border }}>
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setMobileMenuOpen(false)
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path) ? "font-bold" : ""
                  }`}
                  style={{
                    color: isActive(item.path) ? theme.colors.primary : theme.colors.text,
                    backgroundColor: isActive(item.path) ? theme.colors.primary + "20" : "transparent",
                  }}
                  aria-current={isActive(item.path) ? "page" : undefined}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
