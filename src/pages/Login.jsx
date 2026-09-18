import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Fingerprint,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ScanLine,
  Database,
  FileCheck2
} from "lucide-react";

import { supabase } from "../services/supabase";
import "../style/login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

      if (error) {
        throw error;
      }

      if (!data?.user) {
        throw new Error("Login failed. Please try again.");
      }

      navigate("/dashboard", {
        replace: true
      });
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err?.message ||
        "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-background">
        <div className="login-orb login-orb-one"></div>
        <div className="login-orb login-orb-two"></div>
        <div className="login-orb login-orb-three"></div>

        <div className="login-grid"></div>

        <div className="login-particles">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <main className="login-shell">

        <section className="login-showcase">

          <div className="showcase-top">

            <div className="showcase-brand">

              <div className="showcase-logo">
                <ShieldCheck size={28} strokeWidth={1.8} />
              </div>

              <div>
                <strong>
                  TRUST<span>VERIFY</span>
                </strong>

                <small>
                  DOCUMENT INTELLIGENCE
                </small>
              </div>

            </div>

            <div className="system-status">
              <span className="status-light"></span>
              SYSTEM OPERATIONAL
            </div>

          </div>

          <div className="showcase-content">

            <div className="showcase-badge">
              <Sparkles size={15} />
              NEXT-GENERATION VERIFICATION
            </div>

            <h1>
              Trust every
              <br />
              <span>document.</span>
            </h1>

            <p className="showcase-description">
              Intelligent document authentication designed
              to analyze, verify and protect your most
              important digital records.
            </p>

            <div className="showcase-line"></div>

            <div className="security-features">

              <div className="security-feature">

                <div className="feature-icon">
                  <Fingerprint size={20} />
                </div>

                <div>
                  <strong>Secure Identity</strong>
                  <span>
                    Protected authentication environment
                  </span>
                </div>

                <CheckCircle2
                  className="feature-check"
                  size={17}
                />

              </div>

              <div className="security-feature">

                <div className="feature-icon">
                  <ScanLine size={20} />
                </div>

                <div>
                  <strong>Intelligent Analysis</strong>
                  <span>
                    Multi-layer document inspection
                  </span>
                </div>

                <CheckCircle2
                  className="feature-check"
                  size={17}
                />

              </div>

              <div className="security-feature">

                <div className="feature-icon">
                  <Database size={20} />
                </div>

                <div>
                  <strong>Trusted Verification</strong>
                  <span>
                    Evidence-based verification signals
                  </span>
                </div>

                <CheckCircle2
                  className="feature-check"
                  size={17}
                />

              </div>

            </div>

          </div>

          <div className="showcase-bottom">

            <div className="security-indicator">
              <div className="indicator-icon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <strong>SECURE ENVIRONMENT</strong>
                <span>Enterprise-grade protection</span>
              </div>
            </div>

            <div className="version-label">
              TV / CORE 2.0
            </div>

          </div>

        </section>

        <section className="login-panel">

          <div className="login-panel-inner">

            <div className="mobile-brand">

              <div className="mobile-brand-icon">
                <ShieldCheck size={24} />
              </div>

              <strong>
                TRUST<span>VERIFY</span>
              </strong>

            </div>

            <div className="login-card">

              <div className="login-card-header">

                <div>

                  <div className="login-eyebrow">
                    <span></span>
                    WELCOME BACK
                  </div>

                  <h2>
                    Sign in
                  </h2>

                  <p>
                    Access your secure verification workspace.
                  </p>

                </div>

                <div className="login-card-icon">
                  <ShieldCheck size={25} />
                </div>

              </div>

              <div className="authentication-status">

                <div className="authentication-icon">
                  <FileCheck2 size={18} />
                </div>

                <div>
                  <strong>
                    AUTHENTICATION READY
                  </strong>

                  <span>
                    Your connection is protected
                  </span>
                </div>

                <div className="authentication-dot"></div>

              </div>

              <form
                className="login-form"
                onSubmit={handleLogin}
              >

                <div className="field">

                  <label htmlFor="email">
                    Email address
                  </label>

                  <div
                    className={`field-control ${
                      email ? "has-value" : ""
                    }`}
                  >

                    <Mail size={19} />

                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      autoComplete="email"
                      disabled={loading}
                      required
                    />

                  </div>

                </div>

                <div className="field">

                  <div className="field-label-row">

                    <label htmlFor="password">
                      Password
                    </label>

                    <button
                      type="button"
                      className="forgot-button"
                      onClick={() =>
                        alert(
                          "Password reset will be added later."
                        )
                      }
                    >
                      Forgot password?
                    </button>

                  </div>

                  <div
                    className={`field-control ${
                      password ? "has-value" : ""
                    }`}
                  >

                    <Lock size={19} />

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      autoComplete="current-password"
                      disabled={loading}
                      required
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

                </div>

                {error && (

                  <div className="login-error">

                    <AlertCircle size={18} />

                    <span>
                      {error}
                    </span>

                  </div>

                )}

                <div className="login-options">

                  <label className="remember-option">

                    <input
                      type="checkbox"
                    />

                    <span className="custom-checkbox"></span>

                    <span>
                      Remember me
                    </span>

                  </label>

                  <div className="protected-label">
                    <ShieldCheck size={14} />
                    Protected
                  </div>

                </div>

                <button
                  type="submit"
                  className="login-submit"
                  disabled={loading}
                >

                  <span className="submit-content">

                    {loading ? (
                      <>
                        <Loader2
                          size={19}
                          className="spin"
                        />

                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in securely
                        <ArrowRight size={19} />
                      </>
                    )}

                  </span>

                  <span className="submit-shine"></span>

                </button>

              </form>

              <div className="login-divider">
                <span></span>
                <small>OR</small>
                <span></span>
              </div>

              <div className="create-account">

                <div className="create-icon">
                  <Sparkles size={17} />
                </div>

                <div className="create-content">

                  <span>
                    NEW TO TRUSTVERIFY?
                  </span>

                  <strong>
                    Create your verification identity
                  </strong>

                  <Link to="/register">
                    Create account
                    <ArrowRight size={16} />
                  </Link>

                </div>

              </div>

              <div className="login-security-footer">

                <div>
                  <ShieldCheck size={15} />
                  Secure authentication
                </div>

                <div>
                  <span className="tiny-dot"></span>
                  Encrypted connection
                </div>

              </div>

            </div>

          </div>

        </section>

      </main>

      <footer className="login-footer">
        <span>TRUSTVERIFY</span>
        <i></i>
        AI DOCUMENT AUTHENTICATION
        <i></i>
        SECURE DIGITAL IDENTITY
      </footer>

    </div>
  );
}

export default Login;