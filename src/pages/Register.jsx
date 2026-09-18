import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Fingerprint,
  FileCheck2,
  ScanLine,
  Database,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

import { supabase } from "../services/supabase";
import "../style/register.css";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordValid = password.length >= 8;
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const profileProgress = Math.min(
    100,
    Math.round(
      ([fullName.trim(), email.trim(), password, confirmPassword, agree].filter(
        Boolean
      ).length /
        5) *
        100
    )
  );

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (!passwordValid) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    if (!agree) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim()
            }
          }
        });

      if (signUpError) {
        throw signUpError;
      }

      if (!data?.user) {
        throw new Error("Unable to create your account.");
      }

      if (data.session) {
        navigate("/dashboard", {
          replace: true
        });
      } else {
        navigate("/login", {
          replace: true,
          state: {
            message:
              "Account created successfully. Please verify your email before signing in."
          }
        });
      }
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-background">
        <div className="register-orb register-orb-one"></div>
        <div className="register-orb register-orb-two"></div>
        <div className="register-orb register-orb-three"></div>
        <div className="register-grid"></div>
        <div className="register-noise"></div>
      </div>

      <div className="register-shell">

        <section className="register-showcase">

          <div className="showcase-top">

            <div className="showcase-logo">
              <ShieldCheck size={25} />
            </div>

            <div>
              <div className="showcase-brand">
                TRUST<span>VERIFY</span>
              </div>

              <div className="showcase-caption">
                DOCUMENT INTELLIGENCE
              </div>
            </div>

          </div>

          <div className="showcase-content">

            <div className="showcase-status">
              <span className="status-pulse"></span>
              SYSTEM OPERATIONAL
            </div>

            <p className="showcase-eyebrow">
              NEXT-GENERATION VERIFICATION
            </p>

            <h1>
              Build trust.
              <br />
              <span>Verify everything.</span>
            </h1>

            <p className="showcase-description">
              Create your secure TrustVerify workspace and
              experience intelligent document verification
              designed for confidence.
            </p>

            <div className="feature-stack">

              <div className="feature-item">

                <div className="feature-icon">
                  <Fingerprint size={20} />
                </div>

                <div>
                  <strong>Secure Identity</strong>
                  <span>
                    Protected authentication environment
                  </span>
                </div>

                <CheckCircle2 size={16} />

              </div>

              <div className="feature-item">

                <div className="feature-icon">
                  <ScanLine size={20} />
                </div>

                <div>
                  <strong>Intelligent Analysis</strong>
                  <span>
                    Multi-layer document inspection
                  </span>
                </div>

                <CheckCircle2 size={16} />

              </div>

              <div className="feature-item">

                <div className="feature-icon">
                  <Database size={20} />
                </div>

                <div>
                  <strong>Trusted Verification</strong>
                  <span>
                    Evidence-based verification signals
                  </span>
                </div>

                <CheckCircle2 size={16} />

              </div>

              <div className="feature-item">

                <div className="feature-icon">
                  <FileCheck2 size={20} />
                </div>

                <div>
                  <strong>Secure Workspace</strong>
                  <span>
                    Enterprise-grade document protection
                  </span>
                </div>

                <CheckCircle2 size={16} />

              </div>

            </div>

          </div>

          <div className="showcase-footer">

            <Fingerprint size={18} />

            <span>
              END-TO-END SECURE ENVIRONMENT
            </span>

            <span className="footer-dot"></span>

            <span>
              TRUSTVERIFY CORE
            </span>

          </div>

        </section>

        <section className="register-panel">

          <div className="register-card">

            <div className="register-card-header">

              <div>

                <p className="register-eyebrow">
                  CREATE YOUR ACCOUNT
                </p>

                <h2>
                  Join <span>TrustVerify</span>
                </h2>

                <p className="register-intro">
                  Create your secure verification workspace
                </p>

              </div>

              <div className="register-shield">
                <ShieldCheck size={25} />
              </div>

            </div>

            <div className="profile-progress">

              <div className="progress-heading">

                <span>
                  PROFILE COMPLETION
                </span>

                <strong>
                  {profileProgress}%
                </strong>

              </div>

              <div className="profile-track">
                <div
                  className="profile-fill"
                  style={{
                    width: `${profileProgress}%`
                  }}
                />
              </div>

            </div>

            <div className="auth-state">

              <span className="auth-state-icon">
                <ShieldCheck size={17} />
              </span>

              <div>
                <strong>
                  SECURE REGISTRATION
                </strong>

                <span>
                  Your account is protected by TrustVerify
                </span>
              </div>

              <span className="auth-live">
                LIVE
              </span>

            </div>

            <form
              className="register-form"
              onSubmit={handleRegister}
            >

              <div className="register-input-group">

                <label htmlFor="fullName">
                  Full name
                </label>

                <div className="register-input-wrapper">

                  <User size={19} />

                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setError("");
                    }}
                    autoComplete="name"
                    disabled={loading}
                  />

                  {fullName.trim() && (
                    <CheckCircle2 className="valid-icon" size={17} />
                  )}

                </div>

              </div>

              <div className="register-input-group">

                <label htmlFor="register-email">
                  Email address
                </label>

                <div className="register-input-wrapper">

                  <Mail size={19} />

                  <input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    autoComplete="email"
                    disabled={loading}
                  />

                  {email.includes("@") && (
                    <CheckCircle2 className="valid-icon" size={17} />
                  )}

                </div>

              </div>

              <div className="register-input-group">

                <label htmlFor="register-password">
                  Create password
                </label>

                <div className="register-input-wrapper">

                  <Lock size={19} />

                  <input
                    id="register-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

                <div className="password-meter">

                  <span
                    className={
                      password.length >= 1
                        ? "active"
                        : ""
                    }
                  />

                  <span
                    className={
                      password.length >= 5
                        ? "active"
                        : ""
                    }
                  />

                  <span
                    className={
                      password.length >= 8
                        ? "active"
                        : ""
                    }
                  />

                  <span
                    className={
                      /[A-Z]/.test(password) &&
                      /\d/.test(password)
                        ? "active"
                        : ""
                    }
                  />

                  <small>
                    {password.length === 0
                      ? "Use at least 8 characters"
                      : passwordValid
                      ? "Strong password"
                      : "Password is too short"}
                  </small>

                </div>

              </div>

              <div className="register-input-group">

                <label htmlFor="confirm-password">
                  Confirm password
                </label>

                <div className="register-input-wrapper">

                  <Lock size={19} />

                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    disabled={loading}
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                  {passwordsMatch && (
                    <CheckCircle2
                      className="valid-icon confirm-valid"
                      size={17}
                    />
                  )}

                </div>

              </div>

              {error && (
                <div className="register-error">

                  <AlertCircle size={18} />

                  <span>
                    {error}
                  </span>

                </div>
              )}

              <label className="terms-row">

                <span
                  className={`custom-checkbox ${
                    agree ? "checked" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => {
                      setAgree(e.target.checked);
                      setError("");
                    }}
                    disabled={loading}
                  />

                  {agree && (
                    <CheckCircle2 size={14} />
                  )}
                </span>

                <span className="terms-text">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Terms of Service will be available soon."
                      )
                    }
                  >
                    Terms
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Privacy Policy will be available soon."
                      )
                    }
                  >
                    Privacy Policy
                  </button>
                </span>

              </label>

              <button
                type="submit"
                className="register-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <Loader2
                      size={20}
                      className="register-spin"
                    />

                    <span>
                      Creating secure account...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      Create secure account
                    </span>

                    <ArrowRight size={20} />
                  </>
                )}

              </button>

            </form>

            <div className="register-divider">
              <span></span>
              <em>OR</em>
              <span></span>
            </div>

            <div className="already-account">

              <div>
                <span className="already-eyebrow">
                  ALREADY A MEMBER?
                </span>

                <strong>
                  Access your workspace
                </strong>
              </div>

              <Link to="/login">
                Sign in
                <ArrowRight size={17} />
              </Link>

            </div>

            <div className="register-security">

              <div className="security-symbol">
                <Fingerprint size={17} />
              </div>

              <div>
                <strong>
                  SECURE ENVIRONMENT
                </strong>

                <span>
                  Protected authentication • Encrypted sessions
                </span>
              </div>

              <ShieldCheck size={17} />

            </div>

          </div>

        </section>

      </div>

      <footer className="register-page-footer">
        <span>
          TRUSTVERIFY
        </span>

        <i></i>

        <span>
          INTELLIGENT DOCUMENT VERIFICATION
        </span>

        <i></i>

        <span>
          SECURE DIGITAL IDENTITY
        </span>
      </footer>

    </div>
  );
}

export default Register;