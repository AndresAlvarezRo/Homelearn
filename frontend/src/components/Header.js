"use client"

import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Header = () => {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <Link to="/dashboard" className="logo">
            📚 Liceo
          </Link>

          <div className="nav-links">
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <span className="nav-link">Hola, {user?.username}</span>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
              Salir
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
