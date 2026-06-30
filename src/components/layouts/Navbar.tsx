import React, { useContext, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, LogOut, User } from 'lucide-react'

import { LocationContext } from '../../App'
import { useAuth } from '../../contexts/AuthContext'
import { NavbarProps } from '../../services/types'
import { AvatarDisplay } from '../../constants/avatars'

import '../../styles/Navbar.css'

const NAV_LINKS = [
  {
    path: '/',
    label: 'Home',
    icon: (
      <svg className="navbar-nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6.5L8 2l6 4.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1z" />
        <path d="M6 14V9h4v5" />
      </svg>
    ),
  },
  {
    path: '/weather',
    label: 'Weather',
    icon: (
      <svg className="navbar-nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 10.5A3.5 3.5 0 009.5 7H9a4 4 0 10-4 4h7.5a2.5 2.5 0 00.5 0z" />
      </svg>
    ),
  },
  {
    path: '/news',
    label: 'News',
    icon: (
      <svg className="navbar-nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="2" width="14" height="12" rx="1.5" />
        <path d="M4 6h8M4 9h5" />
      </svg>
    ),
  },
  {
    path: '/currency',
    label: 'Currency',
    badge: 'Live',
    icon: (
      <svg className="navbar-nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 4v8M10 5.5H7a1.5 1.5 0 000 3h2a1.5 1.5 0 010 3H6" />
      </svg>
    ),
  },
]

const LogoRings: React.FC = () => (
  <div className="navbar-logo-ring" aria-hidden="true">
    <svg viewBox="0 0 36 36" fill="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <circle cx="18" cy="18" r="15" stroke="rgba(0,245,255,0.12)" strokeWidth="1" />
    </svg>
    <motion.svg
      viewBox="0 0 36 36"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <defs>
        <linearGradient id="nb-arc-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f5ff" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="15" stroke="url(#nb-arc-grad)" strokeWidth="1.5" strokeDasharray="28 68" fill="none" />
    </motion.svg>
    <motion.svg
      viewBox="0 0 36 36"
      fill="none"
      animate={{ rotate: -360 }}
      transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <circle cx="18" cy="18" r="10" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="14 46" fill="none" opacity="0.7" />
    </motion.svg>
    <svg viewBox="0 0 36 36" fill="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <circle cx="18" cy="18" r="7" fill="rgba(0,245,255,0.14)" />
      <circle cx="18" cy="18" r="3.5" fill="#00f5ff" opacity="0.9" />
    </svg>
  </div>
)

const PulseDot: React.FC = () => (
  <div className="navbar-location-dot" aria-hidden="true" />
)

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const routerLocation = useLocation()
  const navigate = useNavigate()
  const locationData = useContext(LocationContext)
  const { user, isAuthenticated, logout } = useAuth()

  const [currentTime, setCurrentTime] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: locationData?.timezone ?? undefined,
        })
      )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [locationData?.timezone])

  const handleNavClick = (path: string) => {
    navigate(path)
  }

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
    navigate('/')
  }

  const isActive = (path: string) =>
    path === '/' ? routerLocation.pathname === '/' : routerLocation.pathname.startsWith(path)

  return (
    <nav className="navbar" role="banner">

      <div className="navbar-scanline" aria-hidden="true" />

      <div className="navbar-container">

        <div className="navbar-left">

          {onMenuClick && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onMenuClick}
              className="navbar-sidebar-toggle"
              aria-label="Open navigation menu"
            >
              <Menu size={20} strokeWidth={2.2} />
            </motion.button>
          )}

          <button
            className="navbar-logo"
            onClick={() => navigate('/')}
            aria-label="Go to dashboard home"
          >
            <LogoRings />
            <span className="navbar-title">GEOBOARD</span>
          </button>

          <div className="navbar-divider" aria-hidden="true" />

          {locationData && (
            <div className="navbar-location">
              <PulseDot />
              <div className="navbar-location-text">
                <div className="navbar-location-city">{locationData.city}</div>
                <div className="navbar-location-country">
                  {locationData.country}&nbsp;·&nbsp;
                  {locationData.timezone?.split('/')[1]?.replace('_', ' ') ?? locationData.timezone}
                </div>
              </div>
            </div>
          )}

        </div>

        <nav className="navbar-center" aria-label="Main navigation">
          {NAV_LINKS.map(({ path, label, icon, badge }) => (
            <button
              key={path}
              onClick={() => handleNavClick(path)}
              className={`navbar-nav-link${isActive(path) ? ' active' : ''}`}
              aria-current={isActive(path) ? 'page' : undefined}
            >
              {icon}
              {label}
              {badge && <span className="navbar-nav-badge">{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="navbar-right">

          {isAuthenticated && user ? (
            <div className="navbar-auth">
              <motion.button
                className="navbar-user-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="navbar-user-avatar">
                  <AvatarDisplay avatarId={user.avatar} size={32} />
                </div>
                <span className="navbar-user-name">{user.name}</span>
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    className="navbar-user-menu"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  >
                    <button
                      className="navbar-user-menu-item"
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate('/settings')
                      }}
                    >
                      <User size={16} />
                      Settings
                    </button>
                    <button
                      className="navbar-user-menu-item navbar-user-menu-item--logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="navbar-auth-buttons">
              <motion.button
                className="navbar-login-btn"
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Log In
              </motion.button>
              <motion.button
                className="navbar-register-btn"
                onClick={() => navigate('/register')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign Up
              </motion.button>
            </div>
          )}

          {currentTime && (
            <div className="navbar-time-wrapper" aria-live="off">
              <div className="navbar-time">{currentTime}</div>
              <div className="navbar-timezone">{locationData?.timezone ?? 'UTC'}</div>
            </div>
          )}

        </div>
      </div>

      <div className="navbar-bottom-line" aria-hidden="true" />
    </nav>
  )
}

export default Navbar