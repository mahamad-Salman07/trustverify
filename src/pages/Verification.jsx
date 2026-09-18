import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Verification() {
  const location = useLocation();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      /*
       * First preference:
       * React Router state from Upload.jsx
       */
      if (location.state?.analysis) {
        setAnalysis(location.state.analysis);
        setLoading(false);
        return;
      }

      /*
       * Second preference:
       * sessionStorage
       */
      const saved = sessionStorage.getItem(
        "trustverify_analysis"
      );

      if (saved) {
        const parsed = JSON.parse(saved);
        setAnalysis(parsed);
        setLoading(false);
        return;
      }

      console.error("No TrustVerify analysis result found.");
      setLoading(false);
    } catch (error) {
      console.error(
        "Failed to load verification result:",
        error
      );

      setLoading(false);
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="verification-loading">
        <div className="loading-spinner" />

        <h2>
          Loading verification...
        </h2>

        <p>
          Preparing your forensic report.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="verification-empty">

        <div className="empty-icon">
          !
        </div>

        <h1>
          No verification found
        </h1>

        <p>
          Please upload an image and run the verification
          again.
        </p>

        <button
          onClick={() => navigate("/upload")}
          className="primary-button"
        >
          Go to upload
        </button>

      </div>
    );
  }

  const summary = analysis.summary || {};
  const metadata = analysis.metadata || {};
  const forensics = analysis.forensics || {};
  const ela = analysis.ela || {};
  const ai = analysis.ai_analysis || {};
  const risk = analysis.risk || {};
  const evidence = analysis.evidence || {};

  const verdict =
    summary.verdict ||
    risk.verdict ||
    "Unknown";

  const status =
    summary.status ||
    risk.status ||
    "unknown";

  const confidence =
    Number(summary.confidence ?? risk.confidence ?? 0);

  const riskScore =
    Number(
      summary.risk_score ??
        risk.risk_score ??
        risk.score ??
        0
    );

  const riskLevel =
    summary.risk_level ||
    risk.risk_level ||
    "unknown";

  const filename =
    analysis.original_filename ||
    analysis.report?.filename ||
    sessionStorage.getItem(
      "trustverify_filename"
    ) ||
    "Unknown file";

  const fileSize =
    analysis.file_size ||
    forensics.file_size ||
    0;

  const formatBytes = (bytes) => {
    if (!bytes) return "0 KB";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (value) => {
    if (!value) return "Unknown";

    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const getStatusClass = () => {
    const value = String(status).toLowerCase();

    if (
      value.includes("verified") ||
      value.includes("authentic")
    ) {
      return "verified";
    }

    if (
      value.includes("high") ||
      value.includes("suspicious") ||
      value.includes("risk")
    ) {
      return "danger";
    }

    return "neutral";
  };

  const aiAvailable = ai.available === true;

  return (
    <div className="verification-page">

      {/* HEADER */}

      <header className="verification-header">

        <button
          className="back-button"
          onClick={() => navigate("/history")}
        >
          ← History
        </button>

        <div className="header-title">
          <div className="eyebrow">
            TRUSTVERIFY / VERIFICATION REPORT
          </div>

          <h1>
            Verification <span>report.</span>
          </h1>

          <p>
            Detailed verification information for your
            submitted image.
          </p>
        </div>

        <div className="secure-label">
          🔒 SECURE REPORT
        </div>

      </header>


      {/* MAIN STATUS */}

      <section
        className={`verification-status ${getStatusClass()}`}
      >

        <div className="status-icon">
          ✓
        </div>

        <div className="status-content">

          <div className="section-label">
            VERIFICATION STATUS
          </div>

          <h2>
            {verdict}
          </h2>

          <p>
            {status === "verified"
              ? "The image passed the available preliminary verification checks."
              : "The image analysis has been completed. Review the forensic evidence below."
            }
          </p>

        </div>

        <div className="confidence">

          <strong>
            {confidence}
          </strong>

          <span>
            /100
          </span>

          <small>
            CONFIDENCE
          </small>

        </div>

      </section>


      {/* FILE INFORMATION */}

      <section className="report-card">

        <div className="section-label">
          DOCUMENT INFORMATION
        </div>

        <h2>
          Submitted image
        </h2>

        <div className="file-panel">

          <div className="file-large-icon">
            IMG
          </div>

          <div>

            <div className="field-label">
              FILE NAME
            </div>

            <h3>
              {filename}
            </h3>

            <p>
              {analysis.file_type ||
                metadata.format ||
                "image"}
            </p>

          </div>

        </div>

        <div className="info-grid">

          <Info
            label="FILE TYPE"
            value={
              analysis.file_type ||
              `image/${String(
                metadata.format || ""
              ).toLowerCase()}`
            }
          />

          <Info
            label="FILE SIZE"
            value={formatBytes(fileSize)}
          />

          <Info
            label="SUBMITTED"
            value={formatDate(
              analysis.analysis_timestamp ||
                analysis.report?.generated_at
            )}
          />

          <Info
            label="VERIFICATION ID"
            value={
              analysis.file_id || "Unavailable"
            }
          />

        </div>

      </section>


      {/* RISK */}

      <section className="report-card">

        <div className="section-label">
          RISK ASSESSMENT
        </div>

        <div className="risk-header">

          <div>

            <h2>
              Risk score
            </h2>

            <p>
              Combined assessment from the available
              verification components.
            </p>

          </div>

          <div className="risk-number">
            {riskScore}
            <span>/100</span>
          </div>

        </div>

        <div className="risk-bar">

          <div
            className="risk-fill"
            style={{
              width: `${Math.min(
                Math.max(riskScore, 0),
                100
              )}%`,
            }}
          />

        </div>

        <div className="risk-meta">

          <span>
            Risk level
          </span>

          <strong>
            {riskLevel}
          </strong>

        </div>

      </section>


      {/* FORENSICS */}

      <section className="report-card">

        <div className="section-label">
          FORENSIC ANALYSIS
        </div>

        <h2>
          Image forensics
        </h2>

        <div className="analysis-grid">

          <AnalysisItem
            title="Dimensions"
            value={
              forensics.width &&
              forensics.height
                ? `${forensics.width} × ${forensics.height}`
                : "Unavailable"
            }
          />

          <AnalysisItem
            title="Format"
            value={
              forensics.format ||
              metadata.format ||
              "Unknown"
            }
          />

          <AnalysisItem
            title="Color mode"
            value={
              forensics.mode ||
              metadata.mode ||
              "Unknown"
            }
          />

          <AnalysisItem
            title="Total pixels"
            value={
              forensics.total_pixels
                ? Number(
                    forensics.total_pixels
                  ).toLocaleString()
                : "Unavailable"
            }
          />

          <AnalysisItem
            title="Aspect ratio"
            value={
              forensics.aspect_ratio
                ? forensics.aspect_ratio
                : "Unavailable"
            }
          />

          <AnalysisItem
            title="EXIF metadata"
            value={
              metadata.has_exif
                ? "Available"
                : "Not found"
            }
          />

        </div>

        <EvidenceList
          title="Forensic flags"
          items={
            forensics.forensic_flags || []
          }
        />

        <EvidenceList
          title="Suspicion indicators"
          items={
            forensics.suspicion_indicators ||
            []
          }
        />

      </section>


      {/* ELA */}

      <section className="report-card">

        <div className="section-label">
          ERROR LEVEL ANALYSIS
        </div>

        <div className="analysis-grid">

          <AnalysisItem
            title="ELA score"
            value={
              ela.ela_score !== undefined
                ? ela.ela_score
                : "Unavailable"
            }
          />

          <AnalysisItem
            title="Mean error"
            value={
              ela.mean_error !== undefined
                ? ela.mean_error
                : "Unavailable"
            }
          />

          <AnalysisItem
            title="Maximum error"
            value={
              ela.max_error !== undefined
                ? ela.max_error
                : "Unavailable"
            }
          />

          <AnalysisItem
            title="Quality"
            value={
              ela.quality !== undefined
                ? `${ela.quality}`
                : "Unavailable"
            }

          />

          <AnalysisItem
            title="Suspicion"
            value={
              ela.suspicion_level ||
              "Unknown"
            }
          />

        </div>

        <EvidenceList
          title="ELA flags"
          items={ela.flags || []}
        />

      </section>


      {/* AI */}

      <section className="report-card">

        <div className="section-label">
          AI DETECTION
        </div>

        <div className="ai-status">

          <div
            className={
              aiAvailable
                ? "ai-indicator available"
                : "ai-indicator unavailable"
            }
          >
            {aiAvailable ? "✓" : "!"}
          </div>

          <div>

            <h2>
              {aiAvailable
                ? "AI detector analyzed the image"
                : "AI detector unavailable"}
            </h2>

            <p>
              {ai.message ||
                (aiAvailable
                  ? "AI detection completed."
                  : "AI detection was skipped because no detector model is configured."
                )}
            </p>

          </div>

        </div>

        <div className="analysis-grid">

          <AnalysisItem
            title="Model"
            value={
              ai.model || "Not configured"
            }
          />

          <AnalysisItem
            title="Prediction"
            value={
              ai.prediction || "Unknown"
            }
          />

          <AnalysisItem
            title="AI probability"
            value={
              ai.ai_probability !== null &&
              ai.ai_probability !== undefined
                ? `${ai.ai_probability}%`
                : "Unavailable"
            }
          />

          <AnalysisItem
            title="Real probability"
            value={
              ai.real_probability !== null &&
              ai.real_probability !== undefined
                ? `${ai.real_probability}%`
                : "Unavailable"
            }
          />

          <AnalysisItem
            title="Confidence"
            value={
              ai.confidence !== null &&
              ai.confidence !== undefined
                ? `${ai.confidence}%`
                : "Unavailable"
            }
          />

        </div>

        <EvidenceList
          title="AI flags"
          items={ai.flags || []}
        />

      </section>


      {/* METADATA */}

      <section className="report-card">

        <div className="section-label">
          METADATA
        </div>

        <div className="analysis-grid">

          <AnalysisItem
            title="Metadata available"
            value={
              metadata.available
                ? "Yes"
                : "No"
            }
          />

          <AnalysisItem
            title="EXIF"
            value={
              metadata.has_exif
                ? "Present"
                : "Not found"
            }
          />

          <AnalysisItem
            title="Format"
            value={
              metadata.format ||
              "Unknown"
            }
          />

          <AnalysisItem
            title="Mode"
            value={
              metadata.mode ||
              "Unknown"
            }
          />

        </div>

        <EvidenceList
          title="Metadata flags"
          items={
            metadata.metadata_flags || []
          }
        />

      </section>


      {/* EVIDENCE */}

      <section className="report-card">

        <div className="section-label">
          EVIDENCE SUMMARY
        </div>

        <h2>
          Verification evidence
        </h2>

        <EvidenceList
          title="Metadata"
          items={
            evidence.metadata_flags || []
          }
        />

        <EvidenceList
          title="Forensics"
          items={
            evidence.forensic_flags || []
          }
        />

        <EvidenceList
          title="Forensic suspicion"
          items={
            evidence.forensic_suspicion_indicators ||
            []
          }
        />

        <EvidenceList
          title="ELA"
          items={
            evidence.ela_flags || []
          }
        />

        <EvidenceList
          title="AI detection"
          items={
            evidence.ai_flags || []
          }
        />

        <EvidenceList
          title="Risk reasons"
          items={
            evidence.risk_reasons || []
          }
        />

      </section>


      {/* RAW RESULT FOR DEBUGGING */}

      <details className="raw-result">

        <summary>
          Developer: View complete backend response
        </summary>

        <pre>
          {JSON.stringify(
            analysis,
            null,
            2
          )}
        </pre>

      </details>

    </div>
  );
}


/* ================================
   SMALL COMPONENTS
================================ */

function Info({ label, value }) {
  return (
    <div className="info-item">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


function AnalysisItem({
  title,
  value,
}) {
  return (
    <div className="analysis-item">

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


function EvidenceList({
  title,
  items,
}) {
  if (!items || items.length === 0) {
    return (
      <div className="evidence-block">

        <h4>
          {title}
        </h4>

        <p className="no-evidence">
          No issues detected.
        </p>

      </div>
    );
  }

  return (
    <div className="evidence-block">

      <h4>
        {title}
      </h4>

      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {String(item)}
          </li>
        ))}
      </ul>

    </div>
  );
}