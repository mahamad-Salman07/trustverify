import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ArrowLeft,
  History,
  ExternalLink,
  Loader2,
  Upload,
  FileWarning,
  BarChart3
} from "lucide-react";

import { supabase } from "../services/supabase";
import "../style/results.css";

function Results() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [verification, setVerification] = useState(null);
  const [fileUrl, setFileUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    loadResult();

    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [id]);

  /* --------------------------------
     LOAD RESULT FROM SUPABASE
  -------------------------------- */

  const loadResult = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigate("/login");
        return;
      }

      if (!id) {
        throw new Error("Verification ID is missing.");
      }

      const {
        data,
        error: verificationError
      } = await supabase
        .from("verifications")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (verificationError) {
        throw verificationError;
      }

      if (!data) {
        throw new Error("Verification result was not found.");
      }

      setVerification(data);

      /* --------------------------------
         GET DOCUMENT URL
      -------------------------------- */

      if (data.file_path) {
        const { data: urlData } =
          supabase.storage
            .from("documents")
            .getPublicUrl(data.file_path);

        setFileUrl(
          urlData?.publicUrl || ""
        );
      }

    } catch (err) {
      console.error(
        "Results loading error:",
        err
      );

      setError(
        err?.message ||
        "Unable to load verification result."
      );
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------
     LOADING SCREEN
  -------------------------------- */

  if (loading) {
    return (
      <div className="results-empty">

        <div className="loading-icon">
          <Loader2
            size={44}
            className="spin"
          />
        </div>

        <p className="results-eyebrow">
          TRUSTVERIFY / RESULTS
        </p>

        <h2>
          Loading verification result
        </h2>

        <p>
          Retrieving your document analysis
          securely from TrustVerify.
        </p>

      </div>
    );
  }

  /* --------------------------------
     ERROR SCREEN
  -------------------------------- */

  if (error || !verification) {
    return (
      <div className="results-empty">

        <div className="empty-result-icon">
          <FileWarning size={44} />
        </div>

        <p className="results-eyebrow">
          TRUSTVERIFY / RESULTS
        </p>

        <h2>
          Verification unavailable
        </h2>

        <p>
          {error ||
            "No verification result was found."}
        </p>

        <div className="empty-actions">

          <button
            className="primary-result-button"
            onClick={() =>
              navigate("/upload")
            }
          >
            <Upload size={18} />
            Upload Document
          </button>

          <button
            className="secondary-result-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

        </div>

      </div>
    );
  }

  /* --------------------------------
     RESULT DATA
  -------------------------------- */

  const status =
    verification.status || "failed";

  const score =
    Number(verification.score) || 0;

  const isVerified =
    status === "verified";

  const isReview =
    status === "review";

  const isFailed =
    status === "failed";

  /* --------------------------------
     STATUS TEXT
  -------------------------------- */

  let statusTitle =
    "Verification Failed";

  let statusDescription =
    "The document requires further investigation.";

  if (isVerified) {
    statusTitle =
      "Document Verified";

    statusDescription =
      "The document passed the preliminary verification checks.";
  }

  if (isReview) {
    statusTitle =
      "Needs Review";

    statusDescription =
      "Additional verification is recommended before accepting this document.";
  }

  /* --------------------------------
     SCORE TEXT
  -------------------------------- */

  let scoreTitle =
    "Weak verification signals";

  if (score >= 80) {
    scoreTitle =
      "Strong verification signals";
  } else if (score >= 60) {
    scoreTitle =
      "Moderate verification signals";
  }

  /* --------------------------------
     RESULT PAGE
  -------------------------------- */

  return (
    <div className="results-page">

      {/* BACKGROUND */}

      <div className="results-bg">

        <div className="results-grid"></div>

        <div className="results-orb results-orb-one"></div>

        <div className="results-orb results-orb-two"></div>

      </div>

      {/* MAIN */}

      <main
        className={`results-container ${
          visible ? "show" : ""
        }`}
      >

        {/* BACK BUTTON */}

        <button
          className="back-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        {/* HEADER */}

        <div className="results-heading">

          <div>

            <p>
              TRUSTVERIFY / ANALYSIS COMPLETE
            </p>

            <h1>
              Verification{" "}
              <span>result</span>
            </h1>

            <small>
              Verification ID: {id}
            </small>

          </div>

          <div className="results-heading-icon">
            <ShieldCheck
              size={46}
              strokeWidth={1.5}
            />
          </div>

        </div>

        {/* STATUS CARD */}

        <section className="result-card">

          <div
            className={`result-status ${
              isVerified
                ? "verified"
                : isReview
                  ? "review"
                  : "failed"
            }`}
          >

            <div className="status-icon">

              {isVerified ? (
                <CheckCircle2 size={42} />
              ) : isReview ? (
                <AlertTriangle size={42} />
              ) : (
                <XCircle size={42} />
              )}

            </div>

            <div>

              <span>
                VERIFICATION STATUS
              </span>

              <h2>
                {statusTitle}
              </h2>

              <p>
                {statusDescription}
              </p>

            </div>

          </div>

          {/* SCORE */}

          <div className="score-section">

            <div
              className={`score-ring ${
                isVerified
                  ? "score-verified"
                  : isReview
                    ? "score-review"
                    : "score-failed"
              }`}
            >

              <strong>
                {score}
              </strong>

              <span>
                /100
              </span>

            </div>

            <div className="score-info">

              <p className="score-label">
                PRELIMINARY CONFIDENCE
              </p>

              <h3>
                {scoreTitle}
              </h3>

              <p>
                This score represents preliminary
                automated checks. It should not be
                treated as a final authenticity guarantee.
              </p>

            </div>

          </div>

        </section>

        {/* DOCUMENT CARD */}

        <section className="document-card">

          <div className="document-icon">
            <FileText size={28} />
          </div>

          <div className="document-info">

            <span>
              DOCUMENT
            </span>

            <h3>
              {verification.file_name ||
                "Unnamed document"}
            </h3>

            <p>
              {verification.file_type ||
                "Document"}

              {" • "}

              {formatBytes(
                verification.file_size
              )}
            </p>

          </div>

          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="view-document"
            >
              <ExternalLink size={17} />
              View Document
            </a>
          )}

        </section>

        {/* ANALYSIS */}

        <section className="analysis-card">

          <div className="analysis-title">

            <div>

              <span>
                ANALYSIS
              </span>

              <h2>
                Verification summary
              </h2>

            </div>

            <BarChart3 size={24} />

          </div>

          {/* CHECK 1 */}

          <div className="analysis-row">

            <div>

              <CheckCircle2 />

              <span>
                File format check
              </span>

            </div>

            <strong>
              Passed
            </strong>

          </div>

          {/* CHECK 2 */}

          <div className="analysis-row">

            <div>

              <CheckCircle2 />

              <span>
                File integrity check
              </span>

            </div>

            <strong>
              Passed
            </strong>

          </div>

          {/* CHECK 3 */}

          <div className="analysis-row">

            <div>

              {isVerified ? (
                <CheckCircle2 />
              ) : isReview ? (
                <AlertTriangle />
              ) : (
                <XCircle />
              )}

              <span>
                Preliminary document analysis
              </span>

            </div>

            <strong>
              {isVerified
                ? "Passed"
                : isReview
                  ? "Review"
                  : "Failed"}
            </strong>

          </div>

          {/* RESULT MESSAGE */}

          <div className="result-message">

            <ShieldCheck size={18} />

            <span>
              {verification.result ||
                "No additional analysis information is available."}
            </span>

          </div>

        </section>

        {/* DISCLAIMER */}

        <div className="results-disclaimer">

          <ShieldCheck size={17} />

          <p>
            TrustVerify currently performs
            preliminary automated verification.
            Advanced government, DigiLocker,
            certificate authority and signature
            verification can be connected to the
            verification engine in a future stage.
          </p>

        </div>

        {/* ACTIONS */}

        <div className="result-actions">

          <button
            onClick={() =>
              navigate("/upload")
            }
            className="primary-result-button"
          >
            <Upload size={18} />
            Verify another document
          </button>

          <button
            onClick={() =>
              navigate("/history")
            }
            className="secondary-result-button"
          >
            <History size={18} />
            View history
          </button>

          <button
            onClick={() =>
              navigate(
                `/report/${verification.id}`
              )
            }
            className="secondary-result-button"
          >
            <FileText size={18} />
            View report
          </button>

        </div>

      </main>

    </div>
  );
}

/* --------------------------------
   FILE SIZE FORMATTER
-------------------------------- */

function formatBytes(bytes) {

  if (!bytes) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

export default Results;