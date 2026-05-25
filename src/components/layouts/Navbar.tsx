import React, { useContext, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

import { LocationContext } from '../../App'
import { NavbarProps } from '../../services/types'

import '../../styles/Navbar.css'

// ======================================================
// COMPONENT: Navbar
// ======================================================

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

// ======================================================
// SUB-COMPONENT: LogoRings
// ======================================================

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

// ======================================================
// SUB-COMPONENT: PulseDot
// ======================================================

const PulseDot: React.FC = () => (
  <div className="navbar-location-dot" aria-hidden="true" />
)

// ======================================================
// MAIN EXPORT
// ======================================================

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const routerLocation = useLocation()
  const navigate = useNavigate()
  const locationData = useContext(LocationContext)

  const [currentTime, setCurrentTime] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Live clock
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [routerLocation.pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleNavClick = (path: string) => {
    navigate(path)
    setMobileOpen(false)
  }

  const isActive = (path: string) =>
    path === '/' ? routerLocation.pathname === '/' : routerLocation.pathname.startsWith(path)

  return (
    <>
      <nav className="navbar" role="banner">

        {/* Animated scanline sweep */}
        <div className="navbar-scanline" aria-hidden="true" />

        <div className="navbar-container">

          {/* ── LEFT: Sidebar toggle (mobile only) + Brand + Location ── */}
          <div className="navbar-left">

            {/*
              Sidebar toggle — shown ONLY on mobile via CSS.
              Calls the parent-provided onMenuClick to open the sidebar drawer.
            */}
            {onMenuClick && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onMenuClick}
                className="navbar-sidebar-toggle"
                aria-label="Toggle sidebar"
              >
                <Menu size={18} strokeWidth={2} />
              </motion.button>
            )}

            {/* Logo + wordmark */}
            <button
              className="navbar-logo"
              onClick={() => navigate('/')}
              aria-label="Go to dashboard home"
            >
              <LogoRings />
              <span className="navbar-title">GEOBOARD</span>
            </button>

            <div className="navbar-divider" aria-hidden="true" />

            {/* Live location — hidden on small screens via CSS */}
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

          {/* ── CENTER: Nav links — hidden below 960 px via CSS ── */}
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

          {/* ── RIGHT: Clock + Mobile hamburger ── */}
          <div className="navbar-right">

            {/* Live clock — hidden on small screens via CSS */}
            {currentTime && (
              <div className="navbar-time-wrapper" aria-live="off">
                <div className="navbar-time">{currentTime}</div>
                <div className="navbar-timezone">{locationData?.timezone ?? 'UTC'}</div>
              </div>
            )}

            {/*
              Mobile hamburger — shown ONLY on mobile (≤960px) via CSS.
              Toggles the slide-down nav link list.
            */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              className="navbar-hamburger"
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="navbar-mobile-menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="x"
                    initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex' }}
                  >
                    <X size={20} strokeWidth={2.2} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="m"
                    initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex' }}
                  >
                    <Menu size={20} strokeWidth={2.2} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

          </div>
        </div>

        {/* Chromatic bottom edge line */}
        <div className="navbar-bottom-line" aria-hidden="true" />
      </nav>

      {/* ── MOBILE SLIDE-DOWN MENU — rendered outside navbar to avoid overflow:hidden clipping ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="navbar-mobile-backdrop"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Menu panel */}
            <motion.div
              id="navbar-mobile-menu"
              key="mobile-menu"
              initial={{ opacity: 0, y: -12, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -12, scaleY: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="navbar-mobile-menu"
              role="navigation"
              aria-label="Mobile navigation"
              style={{ transformOrigin: 'top' }}
            >
              <div className="navbar-mobile-inner">
                {NAV_LINKS.map(({ path, label, icon, badge }, i) => (
                  <motion.button
                    key={path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.05 }}
                    onClick={() => handleNavClick(path)}
                    className={`navbar-mobile-link${isActive(path) ? ' active' : ''}`}
                    aria-current={isActive(path) ? 'page' : undefined}
                  >
                    <span className="navbar-mob-icon" aria-hidden="true">{icon}</span>
                    <span>{label}</span>
                    {badge && <span className="navbar-nav-badge navbar-mob-badge">{badge}</span>}
                  </motion.button>
                ))}

                <div className="navbar-mobile-sep" aria-hidden="true" />

                <div className="navbar-mobile-meta">
                  {currentTime && (
                    <span className="navbar-mobile-meta-time">{currentTime}</span>
                  )}
                  {locationData && (
                    <span className="navbar-mobile-meta-loc">
                      📍 {locationData.city}, {locationData.country}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar