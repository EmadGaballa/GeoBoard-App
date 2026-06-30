import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Auth.css";
import AvatarPicker from "../components/AvatarPicker";
import { Link } from "react-router-dom";

// ── Password requirements ───────────────────────────
interface Requirement {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_REQUIREMENTS: Requirement[] = [
  { label: "At least 10 characters", test: (pw) => pw.length >= 10 },
  { label: "At least one uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "At least one lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "At least one number", test: (pw) => /[0-9]/.test(pw) },
  { label: "At least one special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function usePasswordValidation(password: string) {
  return useMemo(
    () =>
      PASSWORD_REQUIREMENTS.map((req) => ({
        ...req,
        met: req.test(password),
      })),
    [password]
  );
}

// ── Validation helpers ──────────────────────────────
function validateName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, " ")
  if (!trimmed) return "Please enter your display name."
  if (trimmed.length < 2) return "Display name must be at least 2 characters."
  if (trimmed.length > 40) return "Display name cannot exceed 40 characters."
  if (!/^[a-zA-Z0-9 _'-]+$/.test(trimmed)) return "Display name can only contain letters, numbers, spaces, hyphens, underscores, and apostrophes."
  return null
}

function validateUsername(username: string): string | null {
  if (!username.trim()) return "Please enter a username."
  if (username.length < 3) return "Username must be at least 3 characters."
  if (username.length > 20) return "Username cannot exceed 20 characters."
  if (!/^[a-zA-Z0-9_.]+$/.test(username)) return "Username can only contain letters, numbers, underscores, and periods."
  return null
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Please enter your email."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address."
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return "Please enter a password."
  if (password.length < 10) return "Password must be at least 10 characters."
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter."
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter."
  if (!/[0-9]/.test(password)) return "Password must contain at least one number."
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character."
  return null
}

function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return "Please confirm your password."
  if (password !== confirm) return "Passwords do not match."
  return null
}

export const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarId, setAvatarId] = useState("fox");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordChecks = usePasswordValidation(password);

  // ── Live field validation ───────────────────────
  const validateField = (field: string, value: string, extra?: string) => {
    switch (field) {
      case "name": return validateName(value);
      case "username": return validateUsername(value);
      case "email": return validateEmail(value);
      case "password": return validatePassword(value);
      case "confirmPassword": return validateConfirmPassword(extra || password, value);
      default: return null;
    }
  };

  const handleChange = (field: string, value: string) => {
    // Update state
    const setters: Record<string, React.Dispatch<React.SetStateAction<string>>> = {
      name: setName,
      username: setUsername,
      email: setEmail,
      password: setPassword,
      confirmPassword: setConfirmPassword,
    };
    setters[field]?.(value);

    // Live validation if touched
    if (touched[field]) {
      const err = validateField(field, value, confirmPassword);
      setFieldErrors(prev => ({ ...prev, [field]: err ?? "" }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let value: string;
    switch (field) {
      case "name": value = name; break;
      case "username": value = username; break;
      case "email": value = email; break;
      case "password": value = password; break;
      case "confirmPassword": value = confirmPassword; break;
      default: value = "";
    }
    const err = validateField(field, value, confirmPassword);
    setFieldErrors(prev => ({ ...prev, [field]: err ?? "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate all fields
    const fields = ["name", "username", "email", "password", "confirmPassword"];
    const values: Record<string, string> = { name, username, email, password, confirmPassword };
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      const err = validateField(field, values[field], confirmPassword);
      if (err) newErrors[field] = err;
    }

    setTouched(Object.fromEntries(fields.map(f => [f, true])));
    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      await register(email, password, username, name, avatarId);
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
        <div className="auth-orb auth-orb--3" />
      </div>

      <motion.div
        className="auth-card auth-card--register"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join GeoBoard and start your journey</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
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
            <label className="auth-label">Choose Your Avatar</label>
            <div className="avatar-wrapper">
              <AvatarPicker value={avatarId} onChange={setAvatarId} />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="name" className="auth-label">Display Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              className={`auth-input ${fieldErrors.name ? "auth-input--error" : ""}`}
              placeholder="Enter Your Display Name"
              required
              autoComplete="name"
            />
            {fieldErrors.name && <span className="auth-field-error">{fieldErrors.name}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="username" className="auth-label">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => handleChange("username", e.target.value)}
              onBlur={() => handleBlur("username")}
              className={`auth-input ${fieldErrors.username ? "auth-input--error" : ""}`}
              placeholder="Choose A Username"
              required
              autoComplete="username"
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              title="3-20 characters: letters, numbers, and underscores only"
            />
            {fieldErrors.username && <span className="auth-field-error">{fieldErrors.username}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              className={`auth-input ${fieldErrors.email ? "auth-input--error" : ""}`}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              className={`auth-input ${fieldErrors.password ? "auth-input--error" : ""}`}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              minLength={10}
            />
            {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}

            {/* Live password requirements checklist */}
            <div className="auth-requirements">
              {passwordChecks.map((req) => (
                <span
                  key={req.label}
                  className={`auth-requirement ${req.met ? "auth-requirement--met" : ""}`}
                >
                  <span className="auth-requirement-icon">{req.met ? "✓" : "○"}</span>
                  {req.label}
                </span>
              ))}
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
              className={`auth-input ${fieldErrors.confirmPassword ? "auth-input--error" : ""}`}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              minLength={10}
            />
            {fieldErrors.confirmPassword && (
              <span className="auth-field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <motion.button
            type="submit"
            className="auth-submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? <span className="auth-loading" /> : "Create Account"}
          </motion.button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
};