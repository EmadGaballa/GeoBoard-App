import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { LocationContext } from "../App";
import { LocationModal } from "../components/LocationModal";
import AvatarPicker from "../components/AvatarPicker";
import {
  MapPin,
  LogOut,
  Trash2,
  Navigation,
  User,
  Check,
  ShieldAlert,
  Lock,
} from "lucide-react";
import "./Settings.css";

export const Settings: React.FC = () => {
  const { user, logout, setUser } = useAuth();
  const location = useContext(LocationContext);

  // ─────────────────────────────
  // PROFILE STATE — initialized from user
  // ─────────────────────────────
  const [name, setName] = useState(user?.name || "");
  const [avatarId, setAvatarId] = useState(user?.avatar || "fox");
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // ─────────────────────────────
  // LOCATION STATE — lazy init from localStorage
  // ─────────────────────────────
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationMode, setLocationMode] = useState<"auto" | "manual">(() => {
    return localStorage.getItem("manualLocation") ? "manual" : "auto";
  });
  const [savedLocation, setSavedLocation] = useState<{
    lat: number;
    lng: number;
    city: string;
  } | null>(() => {
    const saved = localStorage.getItem("manualLocation");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Invalid stored location data, ignore
      }
    }
    return null;
  });

  // ── Name validation (mirrors backend displayNameSchema behavior) ──
  const validateName = (name: string): string | null => {
    const trimmed = name.trim()
    if (!trimmed) return "Name is required."
    if (trimmed.length < 2) return "Name must be at least 2 characters."
    if (trimmed.length > 100) return "Name cannot exceed 100 characters."
    return null
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (nameTouched) {
      setNameError(validateName(val) ?? "")
    }
  }

  const handleNameBlur = () => {
    setNameTouched(true)
    setNameError(validateName(name) ?? "")
  }

  const handleSaveProfile = async () => {
    // Validate name before sending
    const err = validateName(name)
    setNameTouched(true)
    setNameError(err ?? "")
    if (err) return

    try {
      setSaving(true);
      setSaved(false);

      const payload = {
        name,
        avatar: avatarId,
      };
      console.log("[Settings] Saving profile with payload:", payload);

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      setUser(data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("[Settings] Profile save failed:", err);
      setNameError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelect = async (lat: number, lng: number, city?: string) => {
    // Resolve full location with country via reverse geocoding
    let resolvedCity = city || "Unknown";
    let country = "Unknown";

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      resolvedCity =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        resolvedCity;
      country = data.address?.country || "Unknown";
    } catch {
      // Reverse geocode failed, use partial data
    }

    const locationData = { lat, lng, city: resolvedCity, country };
    localStorage.setItem("manualLocation", JSON.stringify(locationData));
    setSavedLocation(locationData);
    setLocationMode("manual");

    // Reload so the app-wide LocationProvider picks up the new manual location
    // with full city/country data for weather and other widgets
    window.location.reload();
  };

  const handleClearLocation = () => {
    localStorage.removeItem("manualLocation");
    setSavedLocation(null);
    setLocationMode("auto");
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    setChangingPassword(true);

    try {
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to change password");
      }

      setPasswordSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* HEADER */}
        <motion.div
          className="settings-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">
            Manage your account and preferences
          </p>
        </motion.div>

        {/* ── PROFILE HERO ── */}
        <motion.div
          className="settings-profile-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="settings-profile-avatar">
            <AvatarPicker value={avatarId} onChange={setAvatarId} />
          </div>
          <div className="settings-profile-info">
            <h2 className="settings-profile-name">
              {user?.name || "Unnamed User"}
            </h2>
            <p className="settings-profile-email">
              {user?.email || "Not set"}
            </p>
            <span
              className={`settings-badge ${
                locationMode === "auto"
                  ? "settings-badge--auto"
                  : "settings-badge--manual"
              }`}
            >
              <Navigation size={12} />
              {locationMode === "auto" ? "Auto Location" : "Manual Location"}
            </span>
          </div>
        </motion.div>

        <div className="settings-sections">
          {/* ── PROFILE SECTION ── */}
          <motion.section
            className="settings-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="settings-section-header">
              <User size={20} />
              <h2>Profile</h2>
            </div>

            <div className="settings-section-content">
              {/* NAME */}
              <div className="settings-info-row">
                <span className="settings-info-label">Display Name</span>
                <input
                  className={`settings-input ${nameError ? "settings-input--error" : ""}`}
                  value={name}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  placeholder="Your display name"
                />
                {nameError && (
                  <span className="settings-field-error">{nameError}</span>
                )}
                <span className="settings-hint">
                  Display name can be changed once every 10 days
                </span>
              </div>

              {/* EMAIL (read-only) */}
              <div className="settings-info-row">
                <span className="settings-info-label">Email</span>
                <div className="settings-value readonly">
                  {user?.email || "Not set"}
                </div>
              </div>

              {/* SAVE ROW */}
              <div className="settings-save-row">
                <motion.button
                  className="settings-btn settings-btn--primary"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <AnimatePresence mode="wait">
                    {saving ? (
                      <motion.span
                        key="saving"
                        className="settings-btn-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <span className="settings-btn-spinner" />
                        Saving…
                      </motion.span>
                    ) : saved ? (
                      <motion.span
                        key="saved"
                        className="settings-btn-content"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <Check size={16} />
                        Saved ✓
                      </motion.span>
                    ) : (
                      <motion.span
                        key="save"
                        className="settings-btn-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Save Changes
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </motion.section>

          {/* ── CHANGE PASSWORD SECTION ── */}
          <motion.section
            className="settings-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="settings-section-header">
              <Lock size={20} />
              <h2>Change Password</h2>
            </div>

            <div className="settings-section-content">
              {passwordError && (
                <motion.div
                  className="settings-error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {passwordError}
                </motion.div>
              )}

              {passwordSuccess && (
                <motion.div
                  className="settings-success-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {passwordSuccess}
                </motion.div>
              )}

              <form onSubmit={handleChangePassword} className="settings-password-form">
                <div className="settings-field">
                  <label htmlFor="current-password" className="settings-label">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="settings-input"
                    placeholder="Enter current password"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="new-password" className="settings-label">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="settings-input"
                    placeholder="Enter new password"
                    required
                    autoComplete="new-password"
                    minLength={10}
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="confirm-password" className="settings-label">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="settings-input"
                    placeholder="Confirm new password"
                    required
                    autoComplete="new-password"
                    minLength={10}
                  />
                </div>

                <div className="settings-password-requirements">
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
                  className="settings-btn settings-btn--primary"
                  disabled={changingPassword}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </motion.button>
              </form>
            </div>
          </motion.section>

          {/* ── LOCATION SECTION ── */}
          <motion.section
            className="settings-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="settings-section-header">
              <MapPin size={20} />
              <h2>Location</h2>
            </div>

            <div className="settings-section-content">
              <div className="settings-location-display">
                <div className="settings-location-icon">
                  <MapPin size={24} />
                </div>
                <div className="settings-location-info">
                  {location ? (
                    <>
                      <span className="location-city">{location.city}</span>
                      <span className="location-country">
                        {location.country}
                      </span>
                    </>
                  ) : (
                    <span className="location-city">Location not set</span>
                  )}
                </div>
              </div>

              <div className="settings-actions">
                <motion.button
                  className="settings-btn settings-btn--primary"
                  onClick={() => setShowLocationModal(true)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Navigation size={18} />
                  Change Location
                </motion.button>

                {savedLocation && (
                  <motion.button
                    className="settings-btn settings-btn--danger"
                    onClick={handleClearLocation}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Trash2 size={18} />
                    Clear Saved Location
                  </motion.button>
                )}
              </div>
            </div>
          </motion.section>

          {/* ── ACCOUNT / DANGER ZONE ── */}
          <motion.section
            className="settings-section settings-section--danger"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="settings-section-header">
              <ShieldAlert size={20} />
              <h2>Account</h2>
            </div>

            <div className="settings-section-content">
              <p className="settings-danger-text">
                Once you log out, you will need to sign in again to access your
                account. Your profile data and preferences will be preserved.
              </p>
              <motion.button
                className="settings-btn settings-btn--logout"
                onClick={handleLogout}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <LogOut size={18} />
                Logout
              </motion.button>
            </div>
          </motion.section>
        </div>
      </div>

      {/* LOCATION MODAL */}
      {showLocationModal && (
        <LocationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onLocationSelect={handleLocationSelect}
        />
      )}
    </div>
  );
};