import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import './Auth.css'

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [validating, setValidating] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false)
        setValidating(false)
        return
      }

      try {
        const response = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (data.success && data.data.valid) {
          setIsValidToken(true)
        } else {
          setIsValidToken(false)
        }
      } catch {
        setIsValidToken(false)
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Password has been reset successfully. Redirecting to login...')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        const msgs = (data.details || [])
          .map((d: { message: string }) => d.message)
          .filter(Boolean)
        setError(
          msgs.length
            ? [...new Set(msgs)].join('. ')
            : data.error || 'Failed to reset password'
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
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
            <h1 className="auth-title">Validating Reset Link</h1>
            <p className="auth-subtitle">Please wait...</p>
          </div>
          <div className="auth-loading-container">
            <span className="auth-loading" />
          </div>
        </motion.div>
      </div>
    )
  }

  if (!isValidToken) {
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
            <h1 className="auth-title">Invalid Reset Link</h1>
            <p className="auth-subtitle">This reset link has expired or is invalid.</p>
          </div>

          <div className="auth-error-message">
            <p>Please request a new password reset link.</p>
          </div>

          <Link to="/login" className="auth-submit" style={{ textAlign: 'center', display: 'block' }}>
            Back to Login
          </Link>
        </motion.div>
      </div>
    )
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
          <h1 className="auth-title">Reset Your Password</h1>
          <p className="auth-subtitle">Enter your new password below</p>
        </div>

        {error && (
          <motion.div
            className="auth-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            className="auth-success-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="new-password" className="auth-label">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              minLength={10}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirm-password" className="auth-label">Confirm New Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              minLength={10}
            />
          </div>

          <div className="auth-password-requirements">
            <p><strong>Password must contain:</strong></p>
            <ul>
              <li>At least 10 characters</li>
              <li>One uppercase letter (A-Z)</li>
              <li>One lowercase letter (a-z)</li>
              <li>One number (0-9)</li>
              <li>One special character (!@#$%^&*)</li>
            </ul>
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
              'Reset Password'
            )}
          </motion.button>
        </form>

        <div className="auth-footer">
          <span>Remember your password?</span>
          <Link to="/login" className="auth-link">Sign In</Link>
        </div>
      </motion.div>
    </div>
  )
}