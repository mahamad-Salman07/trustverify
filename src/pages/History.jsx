import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  ExternalLink,
  Loader2
} from "lucide-react";

import { supabase } from "../services/supabase";
import "../style/history.css";

function History() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error: historyError } = await supabase
        .from("verifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;

      setRecords(data || []);
    } catch (err) {
      console.error("History error:", err);
      setError(
        err?.message || "Unable to load verification history."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === "verified") {
      return <CheckCircle2 size={19} />;
    }

    if (status === "review") {
      return <AlertTriangle size={19} />;
    }

    return <XCircle size={19} />;
  };

  const getStatusText = (status) => {
    if (status === "verified") return "Verified";
    if (status === "review") return "Needs Review";
    return "Failed";
  };

  const formatDate = (date) => {
    if (!date) return "Unknown date";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "Unknown size";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openResult = (record) => {
    navigate(`/results/${record.id}`);
  };

  return (
    <div className="history-page">

      <div className="history-background">
        <div className="history-grid"></div>
        <div className="history-glow history-glow-one"></div>
        <div className="history-glow history-glow-two"></div>
      </div>

      <main className="history-container">

        <button
          className="history-back"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <header className="history-header">

          <div className="history-title">

            <div className="history-icon">
              <ShieldCheck size={28} />
            </div>

            <div>
              <p>TRUSTVERIFY / ACTIVITY</p>

              <h1>
                Verification <span>history</span>
              </h1>

              <p className="history-description">
                Review every document verification associated
                with your TrustVerify account.
              </p>
            </div>

          </div>

          <button
            className="history-refresh"
            onClick={loadHistory}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="spin" size={18} />
            ) : (
              "Refresh"
            )}
          </button>

        </header>

        {error && (
          <div className="history-error">
            <XCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (

          <section className="history-empty">

            <Loader2
              size={38}
              className="spin"
            />

            <h2>Loading history</h2>

            <p>
              Retrieving your verification records...
            </p>

          </section>

        ) : records.length === 0 ? (

          <section className="history-empty">

            <div className="empty-icon">
              <FileText size={34} />
            </div>

            <h2>No verifications yet</h2>

            <p>
              Upload your first document to start building
              your verification history.
            </p>

            <button
              onClick={() => navigate("/upload")}
              className="history-primary"
            >
              Verify a document
            </button>

          </section>

        ) : (

          <section className="history-list">

            <div className="history-list-header">
              <div>
                <span>YOUR ACTIVITY</span>
                <h2>
                  {records.length} verification
                  {records.length !== 1 ? "s" : ""}
                </h2>
              </div>
            </div>

            {records.map((record) => (

              <article
                className="history-item"
                key={record.id}
              >

                <div className="history-file-icon">
                  <FileText size={25} />
                </div>

                <div className="history-file">

                  <h3>
                    {record.file_name}
                  </h3>

                  <p>
                    {record.file_type || "Document"}
                    {" • "}
                    {formatBytes(record.file_size)}
                  </p>

                  <span>
                    {formatDate(record.created_at)}
                  </span>

                </div>

                <div
                  className={`history-status ${record.status}`}
                >
                  {getStatusIcon(record.status)}

                  <span>
                    {getStatusText(record.status)}
                  </span>
                </div>

                <div className="history-score">
                  <strong>
                    {record.score ?? 0}
                  </strong>

                  <span>/100</span>
                </div>

                <button
                  className="history-view"
                  onClick={() => openResult(record)}
                >
                  <ExternalLink size={17} />
                  View
                </button>

              </article>

            ))}

          </section>

        )}

      </main>

    </div>
  );
}

export default History;