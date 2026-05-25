import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'

import {
  Home,
  Cloud,
  Newspaper,
  DollarSign,
  X,
} from 'lucide-react'

import { SidebarProps, NavLink } from '../../services/types'

import '../../styles/Sidebar.css'

// ======================================================
// NAV LINKS — matches Navbar exactly
// ======================================================

const navLinks: NavLink[] = [
  { path: '/',         label: 'Dashboard', icon: <Home       size={20} /> },
  { path: '/weather',  label: 'Weather',   icon: <Cloud      size={20} /> },
  { path: '/news',     label: 'News',      icon: <Newspaper  size={20} /> },
  { path: '/currency', label: 'Currency',  icon: <DollarSign size={20} /> },
]

// ======================================================
// COMPONENT: Sidebar
// ======================================================

export const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleNavigation = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path)

  return (
    <>
      {/* ── BACKDROP ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setOpen(false)}
            className="sidebar-overlay"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR PANEL ── */}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="sidebar"
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!open}
      >
        <div className="sidebar-content">

          {/* CLOSE BUTTON — top-right inside the panel */}
          <button
            className="sidebar-close-btn"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} strokeWidth={2.2} />
          </button>

          {/* LOGO */}
          <div className="sidebar-logo">
            <div className="sidebar-logo-rings" aria-hidden="true">
              <span className="sidebar-logo-ring sidebar-logo-ring--outer" />
              <span className="sidebar-logo-ring sidebar-logo-ring--inner" />
              <span className="sidebar-logo-dot" />
            </div>
            <div>
              <h1 className="sidebar-logo-title">GEOBOARD</h1>
              <p className="sidebar-logo-subtitle">Smart Location Dashboard</p>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="sidebar-divider" />

          {/* NAVIGATION */}
          <nav className="sidebar-nav" aria-label="Sidebar navigation">
            {navLinks.map((link, index) => {
              const active = isActive(link.path)
              return (
                <motion.button
                  key={link.path}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 + 0.05 }}
                  onClick={() => handleNavigation(link.path)}
                  className={`sidebar-link${active ? ' sidebar-link-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={`sidebar-link-icon${active ? ' active' : ''}`} aria-hidden="true">
                    {link.icon}
                  </span>
                  <span className="sidebar-link-text">{link.label}</span>
                  {active && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="sidebar-active-indicator"
                      aria-hidden="true"
                    />
                  )}
                </motion.button>
              )
            })}
          </nav>

          {/* FOOTER */}
          <div className="sidebar-footer">
            <div className="sidebar-footer-line" />
            <p className="sidebar-footer-text">GEOBOARD · v1.0</p>
          </div>

        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar