import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'


export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordMessage('')
    setForgotPasswordLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      console.log('[ForgotPassword] Response status:', response.status)
      console.log('[ForgotPassword] Response ok:', response.ok)
      console.log('[ForgotPassword] Response headers:', response.headers)
      
      const text = await response.text()
      console.log('[ForgotPassword] Response text:', text)
      console.log('[ForgotPassword] Response text length:', text.length)

      if (!text || text.trim() === '') {
        console.error('[ForgotPassword] Empty response body')
        setForgotPasswordMessage('Server returned an empty response. Please try again.')
        return
      }

      try {
        const data = JSON.parse(text)
        
        if (data.success) {
          setForgotPasswordMessage(data.message || 'If an account with that email exists, a password reset link has been sent.')
          setForgotPasswordEmail('')
        } else {
          const errorMsg = data.message || data.error || 'Something went wrong. Please try again.'
          setForgotPasswordMessage(errorMsg)
        }
      } catch (parseError) {
        console.error('[ForgotPassword] JSON parse error:', parseError)
        console.error('[ForgotPassword] Raw response:', text)
        setForgotPasswordMessage('Invalid response from server. Please try again.')
      }
    } catch (err) {
      console.error('[ForgotPassword] Fetch error:', err)
      setForgotPasswordMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
        <div className="auth-orb auth-orb--3" />
      </div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your GeoBoard account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <motion.div
              className="auth-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              minLength={8}
            />
          </div>

          <motion.button
            type="submit"
            className="auth-submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="auth-loading" />
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account?</span>
          <Link to="/register" className="auth-link">Create one</Link>
        </div>

        <div className="auth-forgot-password">
          <button
            type="button"
            className="auth-link-button"
            onClick={() => setShowForgotPassword(!showForgotPassword)}
          >
            Forgot Password?
          </button>
        </div>

        {showForgotPassword && (
          <motion.div
            className="auth-forgot-password-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleForgotPassword}>
              <div className="auth-field">
                <label htmlFor="forgot-email" className="auth-label">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={e => setForgotPasswordEmail(e.target.value)}
                  className="auth-input"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              {forgotPasswordMessage && (
                <motion.div
                  className={`auth-message ${forgotPasswordMessage.includes('sent') ? 'auth-success' : 'auth-error'}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {forgotPasswordMessage}
                </motion.div>
              )}

              <motion.button
                type="submit"
                className="auth-submit"
                disabled={forgotPasswordLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {forgotPasswordLoading ? (
                  <span className="auth-loading" />
                ) : (
                  'Send Reset Link'
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}