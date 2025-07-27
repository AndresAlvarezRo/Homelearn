"use client"

import { useContext } from "react"
import { Link, useLocation } from "react-router-dom"
import { Home, Settings } from "lucide-react"
import AuthContext from "../../contexts/AuthContext"

const MobileNavigation = () => {
  const { user } = useContext(AuthContext)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    ...(user?.isAdmin ? [{ path: "/admin", icon: Settings, label: "Admin" }] : []),
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              isActive(path) ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default MobileNavigation
