import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/upload.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/tiff",
];

const MAX_SIZE = 100 * 1024 * 1024;

export default function Upload() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Please select JPG, PNG, WEBP, BMP, or TIFF image.");
      return false;
    }

    if (selectedFile.size > MAX_SIZE) {
      setError("File size must be 100 MB or less.");
      return false;
    }

    setError("");
    setFile(selectedFile);
    return true;
  };

  const handleFileChange = (event) => {
    validateFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];
    validateFile(droppedFile);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Image analysis failed."
        );
      }

      console.log("TRUSTVERIFY analysis:", data);

      /*
       * Your backend returns:
       * file_id
       * report
       * summary
       * metadata
       * forensics
       * ela
       * ai_analysis
       * risk
       * evidence
       */

      if (!data.file_id) {
        throw new Error("Backend did not return a verification ID.");
      }

      navigate(`/report/${data.file_id}`, {
        state: {
          report: data,
        },
      });
    } catch (err) {
      console.error("Analysis error:", err);

      setError(
        err.message ||
          "Unable to connect to the TrustVerify analysis server."
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="upload-page">
      <div className="upload-background">
        <div className="glow glow-one"></div>
        <div className="glow glow-two"></div>
        <div className="grid-overlay"></div>
      </div>

      <section className="upload-container">

        <div className="upload-header">
          <div className="brand">
            <span className="brand-mark">✦</span>
            TRUSTVERIFY
          </div>

          <div className="header-badge">
            <span className="status-dot"></span>
            AI FORENSICS
          </div>
        </div>

        <div className="hero-section">

          <div className="eyebrow">
            TRUSTVERIFY / AI FORENSICS
          </div>

          <h1>
            Verify your <span>image.</span>
          </h1>

          <p className="hero-description">
            Upload an image and TrustVerify will analyze its metadata,
            forensic characteristics, ELA patterns, and AI-generated
            image indicators.
          </p>

          <div className="analysis-pills">
            <span>Metadata</span>
            <span>Forensics</span>
            <span>ELA</span>
            <span>AI Detection</span>
          </div>

        </div>

        <div
          className={`drop-zone ${
            dragging ? "dragging" : ""
          } ${file ? "has-file" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >

          {!file ? (
            <>
              <div className="upload-icon">
                ↑
              </div>

              <h2>Drop your image here</h2>

              <p className="drop-subtitle">
                or choose a file from your computer
              </p>

              <button
                className="choose-button"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose image
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.bmp,.tiff"
                onChange={handleFileChange}
                hidden
              />

              <div className="file-info">
                <span>JPG</span>
                <span>PNG</span>
                <span>WEBP</span>
                <span>BMP</span>
                <span>TIFF</span>
              </div>

              <div className="max-size">
                Maximum 100 MB
              </div>
            </>
          ) : (
            <div className="selected-file">

              <div className="selected-icon">
                ✓
              </div>

              <div className="selected-details">
                <span className="selected-label">
                  IMAGE READY FOR ANALYSIS
                </span>

                <h3>{file.name}</h3>

                <p>
                  {file.type || "image"} •{" "}
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                className="remove-button"
                type="button"
                onClick={removeFile}
              >
                Remove
              </button>

            </div>
          )}

        </div>

        {error && (
          <div className="error-message">
            <span>!</span>
            {error}
          </div>
        )}

        <button
          className={`analyze-button ${
            loading ? "loading" : ""
          }`}
          type="button"
          disabled={!file || loading}
          onClick={handleAnalyze}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Analyzing image...
            </>
          ) : (
            <>
              Analyze image
              <span className="arrow">→</span>
            </>
          )}
        </button>

        <div className="security-note">
          <span className="lock">🔒</span>

          <div>
            <strong>Secure forensic processing</strong>
            <p>
              Your image is processed through the TrustVerify
              forensic analysis pipeline.
            </p>
          </div>
        </div>

        <div className="pipeline">

          <div className="pipeline-title">
            ANALYSIS PIPELINE
          </div>

          <div className="pipeline-items">

            <div className="pipeline-item">
              <span>01</span>
              Metadata
            </div>

            <div className="pipeline-line"></div>

            <div className="pipeline-item">
              <span>02</span>
              Forensics
            </div>

            <div className="pipeline-line"></div>

            <div className="pipeline-item">
              <span>03</span>
              ELA
            </div>

            <div className="pipeline-line"></div>

            <div className="pipeline-item">
              <span>04</span>
              AI Detection
            </div>

          </div>

        </div>

      </section>
    </main>
  );
}