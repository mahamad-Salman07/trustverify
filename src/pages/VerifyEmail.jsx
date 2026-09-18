import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  MailCheck,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

import { supabase } from "../services/supabase";

import "../style/verify-email.css";

function VerifyEmail() {

  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(
    location.state?.email || ""
  );

  const [resending, setResending] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  /*
   * If the email is not passed
   * through navigation, check
   * local storage.
   */
  useEffect(() => {

    if (!email) {

      const savedEmail =
        localStorage.getItem(
          "trustverify_pending_email"
        );

      if (savedEmail) {
        setEmail(savedEmail);
      }

    }

  }, [email]);


  /*
   * Save pending email.
   */
  useEffect(() => {

    if (email) {

      localStorage.setItem(
        "trustverify_pending_email",
        email
      );

    }

  }, [email]);


  /*
   * Resend verification email.
   */
  const resendEmail = async () => {

    if (!email) {

      setError(
        "Please return to registration and enter your email."
      );

      return;

    }


    setResending(true);

    setError("");
    setMessage("");


    try {

      const { error } =
        await supabase.auth.resend({

          type: "signup",

          email: email.trim(),

          options: {
            emailRedirectTo:
              window.location.origin
          }

        });


      if (error) {
        throw error;
      }


      setMessage(
        "Verification email sent again. Please check your inbox."
      );


    } catch (err) {

      console.error(
        "Resend error:",
        err
      );

      setError(
        err.message ||
        "Unable to resend verification email."
      );

    } finally {

      setResending(false);

    }

  };


  return (
    <div className="verify-page">

      {/* BACKGROUND */}
      <div className="verify-bg">

        <div className="verify-glow verify-glow-1"></div>

        <div className="verify-glow verify-glow-2"></div>

        <div className="verify-grid"></div>

      </div>


      {/* CARD */}
      <main className="verify-card">


        {/* LOGO */}
        <div className="verify-logo">

          <ShieldCheck size={22} />

          <span>
            TRUST<span>VERIFY</span>
          </span>

        </div>


        {/* ICON */}
        <div className="verify-icon">

          <MailCheck
            size={48}
            strokeWidth={1.5}
          />

        </div>


        <p className="verify-eyebrow">
          ACCOUNT VERIFICATION
        </p>


        <h1>
          Check your email
        </h1>


        <p className="verify-description">

          We've sent a verification link to:

        </p>


        {email && (
          <div className="verify-email-address">
            {email}
          </div>
        )}


        <p className="verify-description">

          Open the email and click the
          verification button to activate
          your TrustVerify account.

        </p>


        {/* STATUS */}
        <div className="verify-status">

          <span className="status-dot"></span>

          <span>
            Waiting for email verification
          </span>

        </div>


        {/* SUCCESS */}
        {message && (
          <div className="verify-message verify-success">

            <CheckCircle2 size={18} />

            <span>
              {message}
            </span>

          </div>
        )}


        {/* ERROR */}
        {error && (
          <div className="verify-message verify-error">

            <span>
              {error}
            </span>

          </div>
        )}


        {/* RESEND */}
        <button
          type="button"
          className="resend-button"
          onClick={resendEmail}
          disabled={resending}
        >

          {resending ? (
            <>
              <RefreshCw
                size={18}
                className="spin"
              />

              Sending...
            </>
          ) : (
            <>
              <RefreshCw size={18} />

              Resend verification email
            </>
          )}

        </button>


        {/* LOGIN */}
        <Link
          to="/login"
          className="verify-login"
        >

          <span>
            Go to Sign in
          </span>

          <ArrowRight size={18} />

        </Link>


        <p className="verify-footer">

          Didn't receive the email?
          Check your spam or junk folder.

        </p>


      </main>

    </div>
  );
}

export default VerifyEmail;