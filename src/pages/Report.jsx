import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import {
  ShieldCheck,
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Hash,
  Database,
  Lock,
  Calendar,
  Fingerprint,
  Image as ImageIcon,
  ScanSearch,
  Activity,
  Brain,
  Layers,
  Gauge,
  Eye,
  ShieldAlert,
  Info,
  RefreshCw,
  Monitor,
  Search,
  FileWarning,
  CircleDot,
  ChevronRight,
} from "lucide-react";

import { supabase } from "../services/supabase";
import "../style/report.css";

/* ============================================================
   HELPERS
============================================================ */

const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value) =>
  Math.min(100, Math.max(0, num(value)));

const text = (value, fallback = "Not available") => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  return String(value);
};

const bytes = (value) => {
  const n = num(value);

  if (!n) return "Unknown";

  if (n < 1024) {
    return `${n} B`;
  }

  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }

  if (n < 1024 * 1024 * 1024) {
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const dateFormat = (value) => {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const score = (value) =>
  Math.round(clamp(value));

const titleCase = (value) =>
  String(value || "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const evidenceText = (item) => {
  if (typeof item === "string") {
    return item;
  }

  if (!item || typeof item !== "object") {
    return String(item);
  }

  return (
    item.finding ||
    item.message ||
    item.description ||
    item.name ||
    JSON.stringify(item)
  );
};

/* ============================================================
   REPORT COMPONENT
============================================================ */

function Report() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  /* ==========================================================
     LOAD REPORT
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Upload.jsx already passes the complete backend
         * response through navigation state.
         */
        const passedReport =
          location?.state?.report;

        if (
          passedReport &&
          typeof passedReport === "object"
        ) {
          if (mounted) {
            setVerification(passedReport);
            setLoading(false);

            setTimeout(() => {
              if (mounted) {
                setVisible(true);
              }
            }, 80);
          }

          return;
        }

        /* ------------------------------------------------------
           FALLBACK: LOAD FROM SUPABASE
        ------------------------------------------------------ */

        const {
          data: {
            user,
          },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          navigate("/login");
          return;
        }

        if (!id) {
          throw new Error(
            "Verification ID is missing."
          );
        }

        const {
          data,
          error: queryError,
        } = await supabase
          .from("verifications")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (queryError) {
          throw queryError;
        }

        if (!data) {
          throw new Error(
            "Verification report was not found."
          );
        }

        if (mounted) {
          setVerification(data);

          setTimeout(() => {
            if (mounted) {
              setVisible(true);
            }
          }, 80);
        }
      } catch (err) {
        console.error(
          "TrustVerify report error:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Unable to load the verification report."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      mounted = false;
    };
  }, [
    id,
    navigate,
    location?.state?.report,
  ]);

  /* ============================================================
     NORMALIZE BACKEND
  ============================================================ */

  const data = useMemo(() => {
    if (!verification) {
      return null;
    }

    const root = verification;

    const report =
      root.report &&
      typeof root.report === "object"
        ? root.report
        : root;

    return {
      root,

      report,

      summary:
        root.summary ??
        report.summary ??
        {},

      metadata:
        root.metadata ??
        report.metadata ??
        {},

      forensics:
        root.forensics ??
        report.forensics ??
        {},

      ela:
        root.ela ??
        report.ela ??
        {},

      ai:
        root.ai_analysis ??
        report.ai_analysis ??
        root.ai ??
        report.ai ??
        {},

      fingerprint:
        root.fingerprint ??
        report.fingerprint ??
        {},

      manipulation:
        root.manipulation_analysis ??
        report.manipulation_analysis ??
        {},

      recapture:
        root.recapture_analysis ??
        report.recapture_analysis ??
        {},

      webTrace:
        root.web_trace ??
        report.web_trace ??
        {},

      risk:
        root.risk ??
        report.risk ??
        {},

      evidence:
        root.evidence ??
        report.evidence ??
        [],
    };
  }, [verification]);

  /* ============================================================
     AI DATA

     IMPORTANT:
     Everything is calculated here BEFORE JSX.
     This prevents:
       Cannot access 'aiConfidence'
       before initialization
  ============================================================ */

  const aiData = useMemo(() => {
    if (!data) {
      return {
        available: false,
        prediction: "Unknown",
        aiProbability: 0,
        realProbability: 0,
        confidence: 0,
        model: "Unavailable",
        labels: [],
        flags: [],
      };
    }

    const ai = data.ai || {};

    const aiProbability = clamp(
      ai.ai_probability ??
        ai.aiProbability ??
        ai.ai_score ??
        ai.aiScore ??
        0
    );

    const realProbability = clamp(
      ai.real_probability ??
        ai.realProbability ??
        ai.real_score ??
        ai.realScore ??
        0
    );

    const confidence = clamp(
      ai.confidence ??
        ai.confidence_score ??
        ai.confidenceScore ??
        0
    );

    const prediction = text(
      ai.prediction ??
        ai.label ??
        ai.result ??
        "unknown",
      "unknown"
    );

    return {
      available:
        ai.available !== false,

      prediction,

      aiProbability,

      realProbability,

      confidence,

      model: text(
        ai.model,
        "Configured AI detector"
      ),

      labels:
        Array.isArray(ai.labels)
          ? ai.labels
          : [],

      flags:
        Array.isArray(ai.flags)
          ? ai.flags
          : [],

      screenshot:
        ai.screenshot_analysis || null,
    };
  }, [data]);

  /* ============================================================
     SCREENSHOT DETECTION
  ============================================================ */

  const screenshotData = useMemo(() => {
    if (!data) {
      return {
        possible: false,
        confidence: 0,
        reasons: [],
      };
    }

    const aiScreenshot =
      data.ai?.screenshot_analysis || {};

    const manipulation =
      data.manipulation || {};

    const recapture =
      data.recapture || {};

    const possible =
      Boolean(
        aiScreenshot.possible ||
        manipulation.is_screenshot ||
        recapture.likely_screenshot
      );

    const confidence = Math.max(
      num(
        aiScreenshot.score,
        0
      ) * 100,

      num(
        manipulation.screenshot_confidence,
        0
      ),

      recapture.likely_screenshot
        ? num(
            recapture.confidence,
            0
          )
        : 0
    );

    const reasons = [
      ...(Array.isArray(
        aiScreenshot.signals
      )
        ? aiScreenshot.signals
        : []),

      ...(Array.isArray(
        manipulation.screenshot_reasons
      )
        ? manipulation.screenshot_reasons
        : []),
    ];

    return {
      possible,
      confidence: Math.round(
        Math.min(100, confidence)
      ),
      reasons: [
        ...new Set(reasons),
      ],
    };
  }, [data]);

  /* ============================================================
     RISK
  ============================================================ */

  const riskData = useMemo(() => {
    if (!data) {
      return {
        score: 0,
        level: "unknown",
        verdict: "Unknown",
        status: "review",
        confidence: 0,
      };
    }

    const risk = data.risk || {};
    const summary = data.summary || {};

    const riskScore = clamp(
      risk.risk_score ??
        risk.score ??
        summary.risk_score ??
        0
    );

    let level = String(
      risk.risk_level ??
        risk.level ??
        summary.risk_level ??
        ""
    ).toLowerCase();

    if (!level) {
      if (riskScore >= 70) {
        level = "high";
      } else if (riskScore >= 40) {
        level = "medium";
      } else {
        level = "low";
      }
    }

    return {
      score: riskScore,

      level,

      verdict: text(
        risk.verdict ??
          summary.verdict,
        "Unknown"
      ),

      status: text(
        risk.status ??
          summary.status,
        "review"
      ),

      confidence: clamp(
        risk.confidence ??
          summary.confidence ??
          0
      ),
    };
  }, [data]);

  /* ============================================================
     OVERALL CONFIDENCE
  ============================================================ */

  const overallConfidence = useMemo(() => {
    if (!data) {
      return 0;
    }

    return clamp(
      data.summary?.confidence ??
        data.risk?.confidence ??
        aiData.confidence ??
        0
    );
  }, [
    data,
    aiData.confidence,
  ]);

  /* ============================================================
     FINAL UI STATUS
  ============================================================ */

  const finalStatus = useMemo(() => {
    const prediction =
      aiData.prediction.toLowerCase();

    if (
      aiData.aiProbability >= 80 &&
      (
        prediction.includes("ai") ||
        prediction.includes("generated") ||
        prediction.includes("synthetic")
      )
    ) {
      return "ai";
    }

    if (
      riskData.level === "high" ||
      riskData.score >= 70
    ) {
      return "review";
    }

    if (
      riskData.level === "medium" ||
      riskData.score >= 40
    ) {
      return "review";
    }

    return "verified";
  }, [
    aiData,
    riskData,
  ]);

  const statusConfig = useMemo(() => {
    if (finalStatus === "ai") {
      return {
        label: "AI / SYNTHETIC SIGNAL",
        title:
          "Strong AI-generation indicator",
        description:
          "The AI detector produced a strong synthetic-image signal. Review the complete forensic evidence before reaching a final conclusion.",
        icon: <Brain size={25} />,
      };
    }

    if (finalStatus === "review") {
      return {
        label: "REVIEW RECOMMENDED",
        title: "Additional review recommended",
        description:
          "One or more evidence signals require closer inspection before the image can be considered trusted.",
        icon: <AlertTriangle size={25} />,
      };
    }

    return {
      label: "LOW FORENSIC RISK",
      title: "No major risk detected",
      description:
        "The available TrustVerify checks did not identify a major authenticity concern.",
      icon: <CheckCircle2 size={25} />,
    };
  }, [finalStatus]);

  /* ============================================================
     FILE INFORMATION
  ============================================================ */

  const fileName =
    data?.root?.original_filename ??
    data?.root?.file_name ??
    data?.report?.filename ??
    data?.report?.file_name ??
    "Submitted image";

  const fileType =
    data?.root?.file_type ??
    data?.root?.mime_type ??
    "image";

  const fileSize =
    data?.root?.file_size ??
    data?.metadata?.file_size ??
    0;

  const format =
    data?.metadata?.format ??
    fileType?.split("/")?.[1] ??
    "Unknown";

  const width =
    data?.forensics?.width ??
    data?.metadata?.width;

  const height =
    data?.forensics?.height ??
    data?.metadata?.height;

  const dimensions =
    width && height
      ? `${width} × ${height}`
      : "Unknown";

  const colorMode =
    data?.forensics?.mode ??
    data?.metadata?.mode ??
    "Unknown";

  const aspectRatio =
    data?.forensics?.aspect_ratio ??
    data?.metadata?.aspect_ratio;

  const verificationId =
    data?.root?.file_id ??
    data?.root?.id ??
    id ??
    "Unknown";

  const generatedAt =
    data?.root?.analysis_timestamp ??
    data?.root?.report?.generated_at ??
    data?.report?.generated_at ??
    new Date();

  /* ============================================================
     CATEGORY SCORES
  ============================================================ */

  const categoryScores =
    data?.risk?.category_scores || {};

  const aiScore = clamp(
    categoryScores.ai ??
      aiData.aiProbability
  );

  const manipulationScore = clamp(
    categoryScores.manipulation ??
      data?.manipulation?.score ??
      0
  );

  const elaScore = clamp(
    categoryScores.ela ??
      data?.ela?.ela_score ??
      0
  );

  const forensicScore = clamp(
    categoryScores.forensics ??
      (
        Array.isArray(
          data?.forensics?.suspicion_indicators
        )
          ? data.forensics
              .suspicion_indicators.length * 20
          : 0
      )
  );

  const recaptureScore = clamp(
    categoryScores.recapture ??
      data?.recapture?.confidence ??
      0
  );

  /* ============================================================
     EVIDENCE
  ============================================================ */

  const evidenceItems =
    Array.isArray(data?.evidence)
      ? data.evidence
      : [];

  const evidenceCount =
    num(
      data?.risk?.evidence_count,
      evidenceItems.length
    );

  /* ============================================================
     IMAGE URL
  ============================================================ */

  const [imageUrl, setImageUrl] =
    useState("");

  useEffect(() => {
    const loadImage = async () => {
      const path =
        data?.root?.file_path ??
        data?.report?.file_path;

      if (!path) {
        return;
      }

      try {
        const {
          data: publicData,
        } =
          supabase.storage
            .from("documents")
            .getPublicUrl(path);

        if (
          publicData?.publicUrl
        ) {
          setImageUrl(
            publicData.publicUrl
          );
        }
      } catch (err) {
        console.warn(
          "Image URL error:",
          err
        );
      }
    };

    loadImage();
  }, [data]);

  /* ============================================================
     DOWNLOAD
  ============================================================ */

  const downloadReport = () => {
    if (!verification) return;

    const output = {
      product: "TRUSTVERIFY",

      generated_at:
        new Date().toISOString(),

      file: {
        name: fileName,
        type: fileType,
        size: fileSize,
        format,
        dimensions,
      },

      verdict: {
        status: statusConfig.title,
        risk_score: riskData.score,
        risk_level: riskData.level,
        confidence: overallConfidence,
      },

      ai_analysis: {
        prediction: aiData.prediction,
        ai_probability:
          aiData.aiProbability,
        real_probability:
          aiData.realProbability,
        confidence:
          aiData.confidence,
        model: aiData.model,
      },

      screenshot_analysis:
        screenshotData,

      category_scores: {
        ai: aiScore,
        manipulation:
          manipulationScore,
        ela: elaScore,
        forensics:
          forensicScore,
        recapture:
          recaptureScore,
      },

      evidence: evidenceItems,

      original_report:
        verification,
    };

    const blob = new Blob(
      [
        JSON.stringify(
          output,
          null,
          2
        ),
      ],
      {
        type:
          "application/json;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `TRUSTVERIFY_${verificationId}_report.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="tv-report">
        <div className="tv-bg-grid" />

        <div className="tv-loader">
          <div className="tv-loader-ring">
            <ShieldCheck size={34} />
          </div>

          <div className="tv-loader-brand">
            TRUSTVERIFY
          </div>

          <h1>
            Building forensic report
          </h1>

          <p>
            Processing evidence and verification signals...
          </p>

          <div className="tv-loading-bar">
            <span />
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (
    error ||
    !verification ||
    !data
  ) {
    return (
      <div className="tv-report">
        <div className="tv-bg-grid" />

        <div className="tv-error">
          <div className="tv-error-icon">
            <XCircle size={38} />
          </div>

          <span>
            TRUSTVERIFY / REPORT
          </span>

          <h1>
            Report unavailable
          </h1>

          <p>
            {error ||
              "The verification report could not be loaded."}
          </p>

          <button
            className="tv-button tv-button-primary"
            onClick={() =>
              navigate("/history")
            }
          >
            <ArrowLeft size={17} />
            Back to history
          </button>
        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN REPORT
  ============================================================ */

  return (
    <div className="tv-report">
      <div className="tv-bg-grid" />

      <div className="tv-glow tv-glow-a" />
      <div className="tv-glow tv-glow-b" />

      <main
        className={`tv-container ${
          visible
            ? "tv-visible"
            : ""
        }`}
      >
        {/* ======================================================
            TOP NAV
        ====================================================== */}

        <div className="tv-topbar">
          <button
            className="tv-back"
            onClick={() =>
              navigate("/history")
            }
          >
            <ArrowLeft size={17} />
            History
          </button>

          <div className="tv-secure">
            <span className="tv-live-dot" />
            <Lock size={14} />
            Secure forensic report
          </div>
        </div>

        {/* ======================================================
            HERO
        ====================================================== */}

        <section className="tv-hero">
          <div className="tv-hero-copy">
            <div className="tv-brand-line">
              <div className="tv-brand-mark">
                <ShieldCheck size={22} />
              </div>

              <span>
                TRUSTVERIFY
              </span>

              <i />

              <span>
                IMAGE FORENSICS
              </span>
            </div>

            <div className="tv-eyebrow">
              VERIFICATION REPORT
            </div>

            <h1>
              Image authenticity
              <br />
              <span>intelligence.</span>
            </h1>

            <p>
              A multi-signal forensic assessment
              combining metadata, pixel analysis,
              ELA, AI detection, fingerprinting
              and screenshot-aware evidence.
            </p>
          </div>

          <div className="tv-hero-actions">
            <button
              className="tv-button tv-button-secondary"
              onClick={() =>
                window.print()
              }
            >
              <FileText size={17} />
              Print
            </button>

            <button
              className="tv-button tv-button-primary"
              onClick={downloadReport}
            >
              <Download size={17} />
              Download JSON
            </button>
          </div>
        </section>

        {/* ======================================================
            FILE STRIP
        ====================================================== */}

        <section className="tv-file-strip">
          <div className="tv-file-icon">
            <ImageIcon size={23} />
          </div>

          <div className="tv-file-main">
            <span>ANALYZED FILE</span>

            <strong>
              {fileName}
            </strong>
          </div>

          <div className="tv-file-stat">
            <span>FORMAT</span>
            <strong>
              {String(format).toUpperCase()}
            </strong>
          </div>

          <div className="tv-file-stat">
            <span>SIZE</span>
            <strong>
              {bytes(fileSize)}
            </strong>
          </div>

          <div className="tv-file-stat">
            <span>DIMENSIONS</span>
            <strong>
              {dimensions}
            </strong>
          </div>
        </section>

        {/* ======================================================
            VERDICT
        ====================================================== */}

        <section
          className={`tv-verdict tv-status-${finalStatus}`}
        >
          <div className="tv-verdict-icon">
            {statusConfig.icon}
          </div>

          <div className="tv-verdict-copy">
            <span>
              {statusConfig.label}
            </span>

            <h2>
              {statusConfig.title}
            </h2>

            <p>
              {statusConfig.description}
            </p>

            {screenshotData.possible && (
              <div className="tv-screenshot-chip">
                <Monitor size={15} />
                Screenshot-like image detected
                <span>
                  {screenshotData.confidence}%
                </span>
              </div>
            )}
          </div>

          <div className="tv-verdict-score">
            <div>
              <strong>
                {overallConfidence}
              </strong>

              <span>
                /100
              </span>
            </div>

            <small>
              ANALYSIS CONFIDENCE
            </small>
          </div>
        </section>

        {/* ======================================================
            DASHBOARD GRID
        ====================================================== */}

        <section className="tv-dashboard">
          <div className="tv-score-card tv-main-score">
            <div className="tv-card-top">
              <div>
                <span className="tv-card-label">
                  TRUST / RISK
                </span>

                <h3>
                  Risk assessment
                </h3>
              </div>

              <div className="tv-card-icon">
                <Gauge size={19} />
              </div>
            </div>

            <div className="tv-big-score">
              <strong>
                {score(
                  100 -
                    riskData.score
                )}
              </strong>

              <span>
                /100
              </span>
            </div>

            <div className="tv-score-track">
              <span
                style={{
                  width: `${Math.max(
                    0,
                    100 -
                      riskData.score
                  )}%`,
                }}
              />
            </div>

            <div className="tv-score-bottom">
              <span>
                Trust score
              </span>

              <b
                className={`tv-level tv-level-${riskData.level}`}
              >
                {riskData.level.toUpperCase()}
              </b>
            </div>
          </div>

          <div className="tv-score-card">
            <div className="tv-card-top">
              <div>
                <span className="tv-card-label">
                  AI FORENSICS
                </span>

                <h3>
                  AI signal
                </h3>
              </div>

              <div className="tv-card-icon tv-ai-icon">
                <Brain size={19} />
              </div>
            </div>

            <div className="tv-mini-score">
              <strong>
                {score(aiScore)}%
              </strong>

              <span>
                AI probability
              </span>
            </div>

            <div className="tv-dual-bar">
              <span
                style={{
                  width: `${aiScore}%`,
                }}
              />
            </div>

            <div className="tv-score-bottom">
              <span>
                Model confidence
              </span>

              <b>
                {score(
                  aiData.confidence
                )}%
              </b>
            </div>
          </div>

          <div className="tv-score-card">
            <div className="tv-card-top">
              <div>
                <span className="tv-card-label">
                  EVIDENCE
                </span>

                <h3>
                  Signals found
                </h3>
              </div>

              <div className="tv-card-icon">
                <Search size={19} />
              </div>
            </div>

            <div className="tv-mini-score">
              <strong>
                {evidenceCount}
              </strong>

              <span>
                recorded indicators
              </span>
            </div>

            <div className="tv-evidence-dots">
              {Array.from({
                length: Math.min(
                  evidenceCount,
                  8
                ),
              }).map(
                (_, index) => (
                  <i
                    key={index}
                  />
                )
              )}
            </div>

            <div className="tv-score-bottom">
              <span>
                Components analyzed
              </span>

              <b>
                8
              </b>
            </div>
          </div>
        </section>

        {/* ======================================================
            FORENSIC PIPELINE
        ====================================================== */}

        <section className="tv-section">
          <div className="tv-section-head">
            <div>
              <span>
                FORENSIC PIPELINE
              </span>

              <h2>
                Evidence components
              </h2>
            </div>

            <div className="tv-section-count">
              08 MODULES
            </div>
          </div>

          <div className="tv-pipeline">
            <PipelineItem
              icon={<Database size={18} />}
              title="Metadata"
              description={
                data.metadata?.has_exif
                  ? "EXIF metadata available"
                  : "No EXIF metadata found"
              }
              value={
                data.metadata?.metadata_quality ||
                "inspected"
              }
              status="complete"
            />

            <PipelineItem
              icon={<ScanSearch size={18} />}
              title="Pixel Forensics"
              description={
                data.forensics?.suspicion_indicators?.length
                  ? `${data.forensics.suspicion_indicators.length} statistical indicator(s)`
                  : "No major pixel anomaly"
              }
              value={`${score(
                forensicScore
              )} risk`}
              status="complete"
            />

            <PipelineItem
              icon={<Activity size={18} />}
              title="ELA"
              description={
                data.ela?.suspicion_level
                  ? `Suspicion: ${data.ela.suspicion_level}`
                  : "Error Level Analysis complete"
              }
              value={`${num(
                data.ela?.ela_score,
                elaScore
              ).toFixed(2)}`}
              status="complete"
            />

            <PipelineItem
              icon={<Brain size={18} />}
              title="AI Detection"
              description={
                aiData.model
              }
              value={`${score(
                aiData.aiProbability
              )}% AI`}
              status={
                aiData.available
                  ? "complete"
                  : "warning"
              }
            />

            <PipelineItem
              icon={<Fingerprint size={18} />}
              title="Fingerprint"
              description={
                data.fingerprint?.sha256
                  ? "SHA-256 identity generated"
                  : "Fingerprint unavailable"
              }
              value={
                data.fingerprint?.sha256
                  ? "READY"
                  : "N/A"
              }
              status="complete"
            />

            <PipelineItem
              icon={<FileWarning size={18} />}
              title="Manipulation"
              description={
                data.manipulation?.indicators?.length
                  ? `${data.manipulation.indicators.length} indicator(s)`
                  : "No strong manipulation evidence"
              }
              value={`${score(
                manipulationScore
              )}`}
              status="complete"
            />

            <PipelineItem
              icon={<Monitor size={18} />}
              title="Screenshot / Recapture"
              description={
                screenshotData.possible
                  ? "Screenshot-like characteristics detected"
                  : "No strong screenshot signal"
              }
              value={
                screenshotData.possible
                  ? "DETECTED"
                  : "CLEAR"
              }
              status="complete"
            />

            <PipelineItem
              icon={<Search size={18} />}
              title="Web Trace"
              description={
                data.webTrace?.matches?.length
                  ? `${data.webTrace.matches.length} source match(es)`
                  : "No discoverable matches"
              }
              value={
                data.webTrace?.matches?.length
                  ? "MATCH"
                  : "NONE"
              }
              status="complete"
            />
          </div>
        </section>

        {/* ======================================================
            SCREENSHOT ANALYSIS
        ====================================================== */}

        {screenshotData.possible && (
          <section className="tv-special-card">
            <div className="tv-special-icon">
              <Monitor size={23} />
            </div>

            <div className="tv-special-content">
              <span>
                SCREENSHOT-AWARE ANALYSIS
              </span>

              <h2>
                This image has screen-capture characteristics
              </h2>

              <p>
                Screenshot-like images can produce misleading
                AI-detector scores because screen captures are
                fundamentally different from camera photographs.
                TrustVerify therefore treats screenshot evidence
                separately instead of automatically declaring the
                image AI-generated.
              </p>

              {screenshotData.reasons.length > 0 && (
                <div className="tv-reason-list">
                  {screenshotData.reasons
                    .slice(0, 6)
                    .map(
                      (reason, index) => (
                        <div
                          key={index}
                        >
                          <CheckCircle2
                            size={15}
                          />
                          {reason}
                        </div>
                      )
                    )}
                </div>
              )}
            </div>

            <div className="tv-special-score">
              <strong>
                {screenshotData.confidence}%
              </strong>

              <span>
                SCREENSHOT
                <br />
                CONFIDENCE
              </span>
            </div>
          </section>
        )}

        {/* ======================================================
            AI ANALYSIS
        ====================================================== */}

        <section className="tv-section">
          <div className="tv-section-head">
            <div>
              <span>
                AI FORENSICS
              </span>

              <h2>
                Model analysis
              </h2>
            </div>

            <div className="tv-model-badge">
              <CircleDot size={13} />
              {aiData.available
                ? "MODEL COMPLETE"
                : "UNAVAILABLE"}
            </div>
          </div>

          <div className="tv-ai-panel">
            <div className="tv-ai-main">
              <div className="tv-ai-orb">
                <Brain size={31} />
              </div>

              <div>
                <span>
                  PREDICTION
                </span>

                <h3>
                  {titleCase(
                    aiData.prediction
                  )}
                </h3>

                <p>
                  {aiData.model}
                </p>
              </div>
            </div>

            <div className="tv-probabilities">
              <Probability
                label="AI generated"
                value={
                  aiData.aiProbability
                }
                primary
              />

              <Probability
                label="Real / photographic"
                value={
                  aiData.realProbability
                }
              />

              <Probability
                label="Model confidence"
                value={
                  aiData.confidence
                }
              />
            </div>
          </div>

          {aiData.flags.length > 0 && (
            <div className="tv-ai-flags">
              {aiData.flags
                .slice(0, 6)
                .map(
                  (flag, index) => (
                    <div
                      key={index}
                    >
                      <Info size={16} />

                      <span>
                        {evidenceText(
                          flag
                        )}
                      </span>
                    </div>
                  )
                )}
            </div>
          )}

          <div className="tv-disclaimer">
            <Info size={16} />

            <p>
              AI detection is a probabilistic forensic
              signal. A high AI probability does not by
              itself prove that an image was generated by AI.
            </p>
          </div>
        </section>

        {/* ======================================================
            TECHNICAL DETAILS
        ====================================================== */}

        <section className="tv-section">
          <div className="tv-section-head">
            <div>
              <span>
                TECHNICAL EVIDENCE
              </span>

              <h2>
                Image properties
              </h2>
            </div>
          </div>

          <div className="tv-tech-grid">
            <TechItem
              icon={<ImageIcon size={17} />}
              label="FORMAT"
              value={String(
                format
              ).toUpperCase()}
            />

            <TechItem
              icon={<ScanSearch size={17} />}
              label="DIMENSIONS"
              value={dimensions}
            />

            <TechItem
              icon={<Layers size={17} />}
              label="COLOR MODE"
              value={colorMode}
            />

            <TechItem
              icon={<Activity size={17} />}
              label="ASPECT RATIO"
              value={
                aspectRatio !==
                  undefined &&
                aspectRatio !==
                  null
                  ? num(
                      aspectRatio
                    ).toFixed(4)
                  : "Unknown"
              }
            />

            <TechItem
              icon={<Database size={17} />}
              label="FILE SIZE"
              value={bytes(
                fileSize
              )}
            />

            <TechItem
              icon={<Calendar size={17} />}
              label="ANALYZED"
              value={dateFormat(
                generatedAt
              )}
            />

            <TechItem
              icon={<Fingerprint size={17} />}
              label="VERIFICATION ID"
              value={verificationId}
              mono
            />

            <TechItem
              icon={<Hash size={17} />}
              label="SHA-256"
              value={
                data.fingerprint?.sha256
                  ? data.fingerprint.sha256
                  : "Not available"
              }
              mono
            />
          </div>
        </section>

        {/* ======================================================
            EVIDENCE
        ====================================================== */}

        <section className="tv-section">
          <div className="tv-section-head">
            <div>
              <span>
                FORENSIC EVIDENCE
              </span>

              <h2>
                Detected indicators
              </h2>
            </div>

            <div className="tv-section-count">
              {evidenceItems.length}
              {" "}
              RECORDS
            </div>
          </div>

          {evidenceItems.length === 0 ? (
            <div className="tv-empty">
              <CheckCircle2 size={22} />

              <div>
                <strong>
                  No additional evidence recorded
                </strong>

                <span>
                  The analysis did not produce
                  additional report-level indicators.
                </span>
              </div>
            </div>
          ) : (
            <div className="tv-evidence">
              {evidenceItems.map(
                (item, index) => {
                  const severity =
                    String(
                      item?.severity ||
                        "info"
                    ).toLowerCase();

                  return (
                    <div
                      className={`tv-evidence-row tv-severity-${severity}`}
                      key={index}
                    >
                      <div className="tv-evidence-number">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div className="tv-evidence-icon">
                        {severity ===
                        "high" ? (
                          <XCircle
                            size={17}
                          />
                        ) : severity ===
                          "medium" ? (
                          <AlertTriangle
                            size={17}
                          />
                        ) : (
                          <Info
                            size={17}
                          />
                        )}
                      </div>

                      <div className="tv-evidence-copy">
                        <strong>
                          {text(
                            item?.category,
                            "Forensic evidence"
                          )}
                        </strong>

                        <span>
                          {evidenceText(
                            item
                          )}
                        </span>
                      </div>

                      <div className="tv-evidence-score">
                        {item?.score !==
                        undefined
                          ? `${num(
                              item.score
                            ).toFixed(
                              1
                            )}`
                          : "—"}
                      </div>

                      <ChevronRight
                        size={16}
                      />
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* ======================================================
            FINAL ASSESSMENT
        ====================================================== */}

        <section
          className={`tv-final tv-status-${finalStatus}`}
        >
          <div className="tv-final-icon">
            {statusConfig.icon}
          </div>

          <div className="tv-final-copy">
            <span>
              TRUSTVERIFY INTERPRETATION
            </span>

            <h2>
              {riskData.verdict ||
                statusConfig.title}
            </h2>

            <p>
              {screenshotData.possible
                ? "The image contains screenshot-like characteristics. AI detector output should therefore be interpreted together with screenshot, metadata, forensic and manipulation evidence."
                : statusConfig.description}
            </p>
          </div>

          <div className="tv-final-metric">
            <span>
              RISK SCORE
            </span>

            <strong>
              {riskData.score}
            </strong>

            <small>
              / 100
            </small>
          </div>
        </section>

        {/* ======================================================
            DISCLAIMER
        ====================================================== */}

        <section className="tv-important">
          <ShieldAlert size={18} />

          <div>
            <strong>
              Important forensic notice
            </strong>

            <p>
              TrustVerify findings are forensic indicators,
              not absolute proof of authenticity or AI generation.
              Screenshots, compression, editing, unknown generators
              and other transformations can affect automated results.
              Human or investigative review may be required.
            </p>
          </div>
        </section>

        {/* ======================================================
            ACTIONS
        ====================================================== */}

        <div className="tv-actions">
          <button
            className="tv-button tv-button-primary tv-button-large"
            onClick={() =>
              navigate("/upload")
            }
          >
            <RefreshCw size={18} />
            Verify another image
          </button>

          <button
            className="tv-button tv-button-secondary tv-button-large"
            onClick={() =>
              navigate("/history")
            }
          >
            View verification history
          </button>
        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="tv-footer">
          <div className="tv-footer-brand">
            <ShieldCheck size={18} />
            <strong>
              TRUSTVERIFY
            </strong>
          </div>

          <span>
            AI-powered image authenticity &
            forensic analysis
          </span>

          <span>
            v2.0
          </span>

          <span>
            {dateFormat(
              generatedAt
            )}
          </span>
        </footer>
      </main>
    </div>
  );
}

/* ============================================================
   PIPELINE ITEM
============================================================ */

function PipelineItem({
  icon,
  title,
  description,
  value,
  status,
}) {
  return (
    <div className="tv-pipeline-item">
      <div className="tv-pipeline-icon">
        {icon}
      </div>

      <div className="tv-pipeline-copy">
        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>
      </div>

      <div className="tv-pipeline-value">
        <b>
          {value}
        </b>

        <small
          className={`tv-pipeline-status ${status}`}
        >
          {status === "warning"
            ? "REVIEW"
            : "COMPLETE"}
        </small>
      </div>
    </div>
  );
}

/* ============================================================
   PROBABILITY
============================================================ */

function Probability({
  label,
  value,
  primary = false,
}) {
  return (
    <div
      className={`tv-probability ${
        primary
          ? "tv-probability-primary"
          : ""
      }`}
    >
      <div>
        <span>
          {label}
        </span>

        <strong>
          {score(value)}%
        </strong>
      </div>

      <div className="tv-probability-track">
        <span
          style={{
            width: `${clamp(
              value
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   TECH ITEM
============================================================ */

function TechItem({
  icon,
  label,
  value,
  mono = false,
}) {
  return (
    <div className="tv-tech-item">
      <div className="tv-tech-icon">
        {icon}
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong
          className={
            mono
              ? "tv-mono"
              : ""
          }
        >
          {value}
        </strong>
      </div>
    </div>
  );
}

export default Report;