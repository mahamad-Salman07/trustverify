import {
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "../style/upload.css";

import {
  analyzeImageWithBrowserAI,
} from "../services/browserAiDetector";


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


const MAX_SIZE =
  100 * 1024 * 1024;


export default function Upload() {

  const fileInputRef =
    useRef(null);

  const navigate =
    useNavigate();


  const [file, setFile] =
    useState(null);

  const [dragging, setDragging] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [analysisStage, setAnalysisStage] =
    useState("");


  // ==========================================================
  // VALIDATE FILE
  // ==========================================================

  const validateFile = (
    selectedFile
  ) => {

    if (!selectedFile) {
      return false;
    }


    if (
      !ALLOWED_TYPES.includes(
        selectedFile.type
      )
    ) {

      setError(
        "Please select JPG, PNG, WEBP, BMP, or TIFF image."
      );

      return false;
    }


    if (
      selectedFile.size >
      MAX_SIZE
    ) {

      setError(
        "File size must be 100 MB or less."
      );

      return false;
    }


    setError("");

    setFile(
      selectedFile
    );

    return true;
  };


  // ==========================================================
  // FILE INPUT
  // ==========================================================

  const handleFileChange = (
    event
  ) => {

    validateFile(
      event.target.files?.[0]
    );
  };


  // ==========================================================
  // DRAG & DROP
  // ==========================================================

  const handleDrop = (
    event
  ) => {

    event.preventDefault();

    setDragging(false);


    const droppedFile =
      event.dataTransfer.files?.[0];


    validateFile(
      droppedFile
    );
  };


  // ==========================================================
  // ANALYZE
  // ==========================================================

  const handleAnalyze = async () => {

    if (!file) {

      setError(
        "Please select an image first."
      );

      return;
    }


    setLoading(true);

    setError("");

    setAnalysisStage(
      "Loading AI detector..."
    );


    try {

      // ======================================================
      // STEP 1
      // Browser-side AI analysis
      // ======================================================

      console.log(
        "TRUSTVERIFY: Starting browser AI analysis..."
      );


      const browserAiResult =
        await analyzeImageWithBrowserAI(
          file
        );


      console.log(
        "TRUSTVERIFY browser AI result:",
        browserAiResult
      );


      // ======================================================
      // STEP 2
      // Send image + browser AI result to backend
      // ======================================================

      setAnalysisStage(
        "Running forensic analysis..."
      );


      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      formData.append(
        "ai_result_json",
        JSON.stringify(
          browserAiResult
        )
      );


      console.log(
        "TRUSTVERIFY backend:",
        `${API_URL}/analyze`
      );


      const response =
        await fetch(
          `${API_URL}/analyze`,
          {
            method: "POST",
            body: formData,
          }
        );


      let data = null;


      try {

        data =
          await response.json();

      } catch {

        throw new Error(
          "Backend returned an invalid response."
        );
      }


      // ======================================================
      // BACKEND ERROR
      // ======================================================

      if (!response.ok) {

        const message =
          data?.detail ||
          data?.message ||
          `Analysis failed (${response.status})`;


        const formattedMessage =
          Array.isArray(message)

            ? message
                .map(
                  (item) =>
                    item?.msg ||
                    JSON.stringify(item)
                )
                .join(", ")

            : String(message);


        throw new Error(
          formattedMessage
        );
      }


      // ======================================================
      // SUCCESS
      // ======================================================

      console.log(
        "TRUSTVERIFY final analysis:",
        data
      );


      if (!data?.file_id) {

        throw new Error(
          "Backend did not return a verification ID."
        );
      }


      setAnalysisStage(
        "Preparing forensic report..."
      );


      // ======================================================
      // OPEN REPORT
      // ======================================================

      navigate(
        `/report/${data.file_id}`,
        {
          state: {
            report: data,
          },
        }
      );


    } catch (err) {

      console.error(
        "TRUSTVERIFY analysis error:",
        err
      );


      setError(
        err?.message ||
        "Unable to analyze the image."
      );


    } finally {

      setLoading(false);

      setAnalysisStage("");
    }
  };


  // ==========================================================
  // REMOVE FILE
  // ==========================================================

  const removeFile = () => {

    setFile(null);

    setError("");

    setAnalysisStage("");


    if (
      fileInputRef.current
    ) {

      fileInputRef.current.value =
        "";
    }
  };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <main
      className="upload-page"
    >

      <div
        className="upload-background"
      >

        <div
          className="glow glow-one"
        />

        <div
          className="glow glow-two"
        />

        <div
          className="grid-overlay"
        />

      </div>


      <section
        className="upload-container"
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className="upload-header"
        >

          <div
            className="brand"
          >

            <span
              className="brand-mark"
            >
              ✦
            </span>

            TRUSTVERIFY

          </div>


          <div
            className="header-badge"
          >

            <span
              className="status-dot"
            />

            AI FORENSICS

          </div>

        </div>


        {/* ==================================================
            HERO
        ================================================== */}

        <div
          className="hero-section"
        >

          <div
            className="eyebrow"
          >
            TRUSTVERIFY / AI FORENSICS
          </div>


          <h1>
            Verify your <span>image.</span>
          </h1>


          <p
            className="hero-description"
          >

            Upload an image and TrustVerify
            will analyze metadata, forensic
            characteristics, ELA patterns,
            manipulation indicators,
            screenshot context, fingerprints,
            and AI-generated image signals.

          </p>


          <div
            className="analysis-pills"
          >

            <span>
              Metadata
            </span>

            <span>
              Forensics
            </span>

            <span>
              ELA
            </span>

            <span>
              AI Detection
            </span>

          </div>

        </div>


        {/* ==================================================
            DROP ZONE
        ================================================== */}

        <div
          className={`
            drop-zone
            ${dragging ? "dragging" : ""}
            ${file ? "has-file" : ""}
          `}
          onDragOver={(event) => {

            event.preventDefault();

            if (!loading) {
              setDragging(true);
            }
          }}
          onDragLeave={() =>
            setDragging(false)
          }
          onDrop={handleDrop}
        >

          {!file ? (

            <>

              <div
                className="upload-icon"
              >
                ↑
              </div>


              <h2>
                Drop your image here
              </h2>


              <p
                className="drop-subtitle"
              >
                or choose a file from your computer
              </p>


              <button
                className="choose-button"
                type="button"
                disabled={loading}
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                Choose image
              </button>


              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.bmp,.tiff"
                onChange={
                  handleFileChange
                }
                hidden
              />


              <div
                className="file-info"
              >

                <span>JPG</span>
                <span>PNG</span>
                <span>WEBP</span>
                <span>BMP</span>
                <span>TIFF</span>

              </div>


              <div
                className="max-size"
              >
                Maximum 100 MB
              </div>

            </>

          ) : (

            <div
              className="selected-file"
            >

              <div
                className="selected-icon"
              >
                ✓
              </div>


              <div
                className="selected-details"
              >

                <span
                  className="selected-label"
                >
                  IMAGE READY FOR ANALYSIS
                </span>


                <h3>
                  {file.name}
                </h3>


                <p>

                  {file.type ||
                    "image"}

                  {" • "}

                  {(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)}

                  {" MB"}

                </p>

              </div>


              <button
                className="remove-button"
                type="button"
                disabled={loading}
                onClick={
                  removeFile
                }
              >
                Remove
              </button>

            </div>
          )}

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div
            className="error-message"
          >

            <span>
              !
            </span>

            {error}

          </div>

        )}


        {/* ==================================================
            ANALYZE BUTTON
        ================================================== */}

        <button
          className={`
            analyze-button
            ${loading ? "loading" : ""}
          `}
          type="button"
          disabled={
            !file ||
            loading
          }
          onClick={
            handleAnalyze
          }
        >

          {loading ? (

            <>

              <span
                className="spinner"
              />

              {analysisStage ||
                "Analyzing image..."}

            </>

          ) : (

            <>

              Analyze image

              <span
                className="arrow"
              >
                →
              </span>

            </>

          )}

        </button>


        {/* ==================================================
            SECURITY
        ================================================== */}

        <div
          className="security-note"
        >

          <span
            className="lock"
          >
            🔒
          </span>


          <div>

            <strong>
              Secure forensic processing
            </strong>


            <p>
              Your image is processed through
              the TrustVerify forensic analysis
              pipeline.
            </p>

          </div>

        </div>


        {/* ==================================================
            PIPELINE
        ================================================== */}

        <div
          className="pipeline"
        >

          <div
            className="pipeline-title"
          >
            ANALYSIS PIPELINE
          </div>


          <div
            className="pipeline-items"
          >

            <div
              className="pipeline-item"
            >

              <span>
                01
              </span>

              Metadata

            </div>


            <div
              className="pipeline-line"
            />


            <div
              className="pipeline-item"
            >

              <span>
                02
              </span>

              Forensics

            </div>


            <div
              className="pipeline-line"
            />


            <div
              className="pipeline-item"
            >

              <span>
                03
              </span>

              ELA

            </div>


            <div
              className="pipeline-line"
            />


            <div
              className="pipeline-item"
            >

              <span>
                04
              </span>

              AI Detection

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}