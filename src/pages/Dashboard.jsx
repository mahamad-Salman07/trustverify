import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Upload,
  FileCheck2,
  AlertTriangle,
  Clock3,
  History,
  LogOut,
  Settings,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  Bell,
  Search,
  Sparkles,
  Activity,
  LockKeyhole,
  TrendingUp,
  FileText,
  ArrowUpRight,
  RefreshCw,
  Palette,
  Sun,
  Moon,
  LayoutDashboard,
  SlidersHorizontal,
  UserRound,
  Zap,
  Database,
  Fingerprint,
  ShieldAlert,
  CircleCheck,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";

import { supabase } from "../services/supabase";
import "../style/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState(
    localStorage.getItem("trustverify-theme") || "dark"
  );
  const [accent, setAccent] = useState(
    localStorage.getItem("trustverify-accent") || "violet"
  );
  const [density, setDensity] = useState(
    localStorage.getItem("trustverify-density") || "comfortable"
  );
  const [sidebarMode, setSidebarMode] = useState(
    localStorage.getItem("trustverify-sidebar") || "expanded"
  );

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    localStorage.setItem("trustverify-theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("trustverify-accent", accent);
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  useEffect(() => {
    localStorage.setItem("trustverify-density", density);
    document.documentElement.dataset.density = density;
  }, [density]);

  useEffect(() => {
    localStorage.setItem("trustverify-sidebar", sidebarMode);
  }, [sidebarMode]);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const {
        data: { user: currentUser },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      const { data, error } = await supabase
        .from("verifications")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRecords(data || []);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const firstLetter = displayName.charAt(0).toUpperCase();

  const verifiedCount = useMemo(
    () => records.filter((item) => item.status === "verified").length,
    [records]
  );

  const reviewCount = useMemo(
    () => records.filter((item) => item.status === "review").length,
    [records]
  );

  const failedCount = useMemo(
    () =>
      records.filter(
        (item) =>
          item.status !== "verified" &&
          item.status !== "review"
      ).length,
    [records]
  );

  const recentCount = useMemo(() => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    return records.filter((item) => {
      if (!item.created_at) return false;
      return now - new Date(item.created_at).getTime() <= thirtyDays;
    }).length;
  }, [records]);

  const averageScore = useMemo(() => {
    if (!records.length) return 0;

    const scores = records
      .map((item) => Number(item.score))
      .filter((score) => !Number.isNaN(score));

    if (!scores.length) return 0;

    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) /
        scores.length
    );
  }, [records]);

  const successRate = useMemo(() => {
    if (!records.length) return 0;

    return Math.round(
      (verifiedCount / records.length) * 100
    );
  }, [records.length, verifiedCount]);

  const latestRecords = records.slice(0, 4);

  const formatDate = (date) => {
    if (!date) return "Unknown";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const getStatusClass = (status) => {
    if (status === "verified") return "status-success";
    if (status === "review") return "status-warning";
    return "status-danger";
  };

  const getStatusIcon = (status) => {
    if (status === "verified") {
      return <CheckCircle2 size={16} />;
    }

    if (status === "review") {
      return <AlertTriangle size={16} />;
    }

    return <XCircle size={16} />;
  };

  const getStatusText = (status) => {
    if (status === "verified") return "Verified";
    if (status === "review") return "Needs Review";
    return "Failed";
  };

  const openRecord = (record) => {
    navigate(`/results/${record.id}`);
  };

  const toggleTheme = () => {
    setTheme((value) =>
      value === "dark" ? "light" : "dark"
    );
  };

  return (
    <div
      className={`dashboard-page ${
        sidebarMode === "compact"
          ? "sidebar-compact"
          : ""
      }`}
    >
      <div className="dashboard-background">
        <div className="background-orb background-orb-one"></div>
        <div className="background-orb background-orb-two"></div>
        <div className="background-orb background-orb-three"></div>
        <div className="background-grid"></div>
      </div>

      <header className="mobile-header">
        <button
          className="mobile-brand"
          onClick={() => navigate("/dashboard")}
        >
          <span className="brand-mark">
            <ShieldCheck size={22} />
          </span>

          <span className="brand-name">
            TRUST<span>VERIFY</span>
          </span>
        </button>

        <div className="mobile-header-actions">
          <button
            onClick={toggleTheme}
            className="icon-button"
          >
            {theme === "dark" ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>

          <button
            className="mobile-menu-button"
            onClick={() =>
              setMobileMenu((value) => !value)
            }
          >
            {mobileMenu ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>
      </header>

      <aside
        className={`dashboard-sidebar ${
          mobileMenu ? "mobile-open" : ""
        }`}
      >
        <div className="sidebar-top">
          <button
            className="sidebar-brand"
            onClick={() => navigate("/dashboard")}
          >
            <span className="sidebar-brand-icon">
              <ShieldCheck size={25} />
            </span>

            <span className="sidebar-brand-text">
              <strong>
                TRUST<span>VERIFY</span>
              </strong>
              <small>DOCUMENT INTELLIGENCE</small>
            </span>
          </button>

          <div className="sidebar-divider"></div>

          <nav className="dashboard-nav">
            <button className="nav-item active">
              <span className="nav-icon">
                <LayoutDashboard size={18} />
              </span>
              <span className="nav-label">
                Dashboard
              </span>
              <span className="nav-active-line"></span>
            </button>

            <button
              className="nav-item"
              onClick={() => navigate("/upload")}
            >
              <span className="nav-icon">
                <FileCheck2 size={18} />
              </span>
              <span className="nav-label">
                Verify Documents
              </span>
              <ChevronRight
                size={15}
                className="nav-arrow"
              />
            </button>

            <button
              className="nav-item"
              onClick={() => navigate("/history")}
            >
              <span className="nav-icon">
                <History size={18} />
              </span>
              <span className="nav-label">
                Verification History
              </span>
              <ChevronRight
                size={15}
                className="nav-arrow"
              />
            </button>

            <button
              className="nav-item"
              onClick={() => setSettingsOpen(true)}
            >
              <span className="nav-icon">
                <Settings size={18} />
              </span>
              <span className="nav-label">
                Settings
              </span>
              <ChevronRight
                size={15}
                className="nav-arrow"
              />
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="security-widget">
            <div className="security-widget-icon">
              <LockKeyhole size={17} />
            </div>

            <div className="security-widget-content">
              <strong>Secure Workspace</strong>
              <span>Protection active</span>
            </div>

            <span className="security-live-dot"></span>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>

          <div className="sidebar-version">
            TRUSTVERIFY
            <span>PRO</span>
            <small>v2.0</small>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="topbar">
          <div className="topbar-left">
            <button
              className="desktop-collapse"
              onClick={() =>
                setSidebarMode((value) =>
                  value === "expanded"
                    ? "compact"
                    : "expanded"
                )
              }
            >
              <SlidersHorizontal size={17} />
            </button>

            <button
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={17} />
              <span>Search workspace</span>
              <kbd>⌘ K</kbd>
            </button>
          </div>

          <div className="topbar-right">
            <button
              className="topbar-icon"
              onClick={toggleTheme}
              title="Change appearance"
            >
              {theme === "dark" ? (
                <Sun size={19} />
              ) : (
                <Moon size={19} />
              )}
            </button>

            <button
              className="topbar-icon notification-button"
              onClick={() =>
                setNotificationsOpen(
                  (value) => !value
                )
              }
            >
              <Bell size={19} />
              <span className="notification-dot"></span>
            </button>

            <div className="topbar-divider"></div>

            <button
              className="profile-trigger"
              onClick={() =>
                setProfileOpen((value) => !value)
              }
            >
              <div className="profile-avatar">
                {firstLetter}
              </div>

              <div className="profile-details">
                <strong>{displayName}</strong>
                <span>{user?.email}</span>
              </div>

              <ChevronDown size={16} />
            </button>

            {profileOpen && (
              <div className="dropdown profile-dropdown">
                <div className="dropdown-user">
                  <div className="dropdown-avatar">
                    {firstLetter}
                  </div>

                  <div>
                    <strong>{displayName}</strong>
                    <span>{user?.email}</span>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <button
                  onClick={() =>
                    setSettingsOpen(true)
                  }
                >
                  <Settings size={16} />
                  Account settings
                </button>

                <button
                  onClick={() => navigate("/history")}
                >
                  <History size={16} />
                  Verification history
                </button>

                <div className="dropdown-divider"></div>

                <button
                  className="danger-option"
                  onClick={logout}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}

            {notificationsOpen && (
              <div className="dropdown notification-dropdown">
                <div className="dropdown-heading">
                  <div>
                    <span>WORKSPACE</span>
                    <strong>Notifications</strong>
                  </div>

                  <Bell size={17} />
                </div>

                <div className="notification-item">
                  <div className="notification-icon success">
                    <CheckCircle2 size={16} />
                  </div>

                  <div>
                    <strong>
                      Verification engine ready
                    </strong>
                    <span>
                      Your workspace is ready for a
                      new document.
                    </span>
                  </div>
                </div>

                <div className="notification-item">
                  <div className="notification-icon info">
                    <Sparkles size={16} />
                  </div>

                  <div>
                    <strong>AI analysis active</strong>
                    <span>
                      Preliminary analysis is available.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="dashboard-content">
          <div className="welcome-row">
            <div>
              <span className="eyebrow">
                TRUSTVERIFY WORKSPACE
              </span>

              <h1>
                Welcome back,{" "}
                <span>{displayName}</span>
              </h1>

              <p>
                Your secure document intelligence
                workspace is ready.
              </p>
            </div>

            <div className="welcome-actions">
              <button
                className="secondary-button"
                onClick={loadDashboard}
                disabled={loading}
              >
                <RefreshCw
                  size={17}
                  className={
                    loading ? "spin" : ""
                  }
                />
                Refresh
              </button>

              <button
                className="primary-button"
                onClick={() => navigate("/upload")}
              >
                <Upload size={17} />
                New Verification
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          <section className="hero-card">
            <div className="hero-glow"></div>

            <div className="hero-left">
              <div className="hero-badge">
                <span className="live-indicator"></span>
                AI VERIFICATION ENGINE
              </div>

              <h2>
                Verify documents
                <br />
                <span>with confidence.</span>
              </h2>

              <p>
                Upload certificates, identity documents,
                images or PDFs and let TrustVerify perform
                intelligent preliminary analysis.
              </p>

              <div className="hero-actions">
                <button
                  className="hero-primary"
                  onClick={() => navigate("/upload")}
                >
                  <span className="hero-button-icon">
                    <Upload size={18} />
                  </span>
                  Verify a Document
                  <ChevronRight size={18} />
                </button>

                <button
                  className="hero-secondary"
                  onClick={() => navigate("/history")}
                >
                  <History size={17} />
                  View History
                </button>
              </div>

              <div className="hero-trust">
                <span>
                  <LockKeyhole size={14} />
                  Secure processing
                </span>

                <span>
                  <Database size={14} />
                  Protected storage
                </span>

                <span>
                  <Fingerprint size={14} />
                  Integrity checks
                </span>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-ring hero-ring-one"></div>
              <div className="hero-ring hero-ring-two"></div>

              <div className="hero-shield">
                <ShieldCheck size={105} />
              </div>

              <div className="hero-floating-card card-one">
                <CheckCircle2 size={16} />
                <div>
                  <strong>Integrity</strong>
                  <span>Protected</span>
                </div>
              </div>

              <div className="hero-floating-card card-two">
                <Sparkles size={16} />
                <div>
                  <strong>AI Analysis</strong>
                  <span>Active</span>
                </div>
              </div>
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card stat-purple">
              <div className="stat-top">
                <div className="stat-icon">
                  <FileCheck2 size={20} />
                </div>

                <span className="stat-trend">
                  <TrendingUp size={13} />
                  All time
                </span>
              </div>

              <div className="stat-value">
                {records.length}
              </div>

              <div className="stat-label">
                DOCUMENTS VERIFIED
              </div>

              <div className="stat-description">
                Total verification requests
              </div>
            </div>

            <div className="stat-card stat-green">
              <div className="stat-top">
                <div className="stat-icon">
                  <CheckCircle2 size={20} />
                </div>

                <span className="stat-trend positive">
                  {successRate}%
                </span>
              </div>

              <div className="stat-value">
                {verifiedCount}
              </div>

              <div className="stat-label">
                TRUSTED DOCUMENTS
              </div>

              <div className="stat-description">
                Successfully verified
              </div>
            </div>

            <div className="stat-card stat-orange">
              <div className="stat-top">
                <div className="stat-icon">
                  <AlertTriangle size={20} />
                </div>

                <span className="stat-trend">
                  Attention
                </span>
              </div>

              <div className="stat-value">
                {reviewCount}
              </div>

              <div className="stat-label">
                NEEDS REVIEW
              </div>

              <div className="stat-description">
                Documents requiring review
              </div>
            </div>

            <div className="stat-card stat-blue">
              <div className="stat-top">
                <div className="stat-icon">
                  <Clock3 size={20} />
                </div>

                <span className="stat-trend">
                  30 days
                </span>
              </div>

              <div className="stat-value">
                {recentCount}
              </div>

              <div className="stat-label">
                RECENT CHECKS
              </div>

              <div className="stat-description">
                Verification activity
              </div>
            </div>
          </section>

          <section className="analytics-grid">
            <div className="analytics-card performance-card">
              <div className="section-heading">
                <div>
                  <span>WORKSPACE ANALYTICS</span>
                  <h3>Verification performance</h3>
                </div>

                <div className="heading-icon">
                  <Activity size={19} />
                </div>
              </div>

              <div className="performance-body">
                <div className="performance-score">
                  <div
                    className="score-circle"
                    style={{
                      "--score":
                        `${successRate}%`
                    }}
                  >
                    <div>
                      <strong>
                        {successRate}
                      </strong>
                      <span>%</span>
                    </div>
                  </div>

                  <div>
                    <strong>Success rate</strong>
                    <p>
                      Percentage of documents that
                      passed preliminary verification.
                    </p>
                  </div>
                </div>

                <div className="metric-list">
                  <div className="metric-row">
                    <span>
                      <span className="metric-dot purple"></span>
                      Total checks
                    </span>
                    <strong>
                      {records.length}
                    </strong>
                  </div>

                  <div className="metric-row">
                    <span>
                      <span className="metric-dot green"></span>
                      Verified
                    </span>
                    <strong>
                      {verifiedCount}
                    </strong>
                  </div>

                  <div className="metric-row">
                    <span>
                      <span className="metric-dot orange"></span>
                      Review
                    </span>
                    <strong>
                      {reviewCount}
                    </strong>
                  </div>

                  <div className="metric-row">
                    <span>
                      <span className="metric-dot red"></span>
                      Failed
                    </span>
                    <strong>
                      {failedCount}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="analytics-card score-card">
              <div className="section-heading">
                <div>
                  <span>TRUST SIGNAL</span>
                  <h3>Average confidence</h3>
                </div>

                <div className="heading-icon green-icon">
                  <ShieldCheck size={19} />
                </div>
              </div>

              <div className="confidence-number">
                <strong>{averageScore}</strong>
                <span>/100</span>
              </div>

              <div className="confidence-bar">
                <div
                  style={{
                    width: `${averageScore}%`
                  }}
                ></div>
              </div>

              <div className="confidence-footer">
                <span>Low</span>
                <span>Moderate</span>
                <span>Strong</span>
              </div>

              <div className="confidence-message">
                <CircleCheck size={17} />
                <span>
                  {averageScore >= 80
                    ? "Your average verification signal is strong."
                    : averageScore >= 50
                    ? "Your workspace has moderate verification signals."
                    : "Complete more verifications to establish a trust signal."}
                </span>
              </div>
            </div>
          </section>

          <section className="main-grid">
            <div className="workspace-card">
              <div className="section-heading">
                <div>
                  <span>VERIFICATION ENGINE</span>
                  <h3>How TrustVerify works</h3>
                </div>

                <div className="ai-badge">
                  <Sparkles size={14} />
                  AI-Powered
                </div>
              </div>

              <div className="process-list">
                <div className="process-item">
                  <div className="process-number">
                    01
                  </div>

                  <div className="process-icon">
                    <Upload size={18} />
                  </div>

                  <div className="process-content">
                    <strong>Upload</strong>
                    <p>
                      Add your certificate, image or
                      document securely.
                    </p>
                  </div>

                  <CheckCircle2
                    size={18}
                    className="process-check"
                  />
                </div>

                <div className="process-line"></div>

                <div className="process-item">
                  <div className="process-number">
                    02
                  </div>

                  <div className="process-icon">
                    <Search size={18} />
                  </div>

                  <div className="process-content">
                    <strong>Analyze</strong>
                    <p>
                      AI analyzes content, metadata and
                      document integrity.
                    </p>
                  </div>

                  <CheckCircle2
                    size={18}
                    className="process-check"
                  />
                </div>

                <div className="process-line"></div>

                <div className="process-item">
                  <div className="process-number">
                    03
                  </div>

                  <div className="process-icon">
                    <ShieldCheck size={18} />
                  </div>

                  <div className="process-content">
                    <strong>Verify</strong>
                    <p>
                      Verification signals are compared
                      and evaluated.
                    </p>
                  </div>

                  <CheckCircle2
                    size={18}
                    className="process-check"
                  />
                </div>

                <div className="process-line"></div>

                <div className="process-item">
                  <div className="process-number">
                    04
                  </div>

                  <div className="process-icon">
                    <FileText size={18} />
                  </div>

                  <div className="process-content">
                    <strong>Report</strong>
                    <p>
                      Review an explainable verification
                      result.
                    </p>
                  </div>

                  <CheckCircle2
                    size={18}
                    className="process-check"
                  />
                </div>
              </div>
            </div>

            <div className="workspace-card activity-card">
              <div className="section-heading">
                <div>
                  <span>ACTIVITY</span>
                  <h3>Recent verification</h3>
                </div>

                <button
                  className="view-all-button"
                  onClick={() =>
                    navigate("/history")
                  }
                >
                  View all
                  <ArrowUpRight size={15} />
                </button>
              </div>

              {latestRecords.length === 0 ? (
                <div className="empty-activity">
                  <div className="empty-activity-icon">
                    <History size={25} />
                  </div>

                  <h4>No verification activity</h4>

                  <p>
                    Your recent verification activity
                    will appear here.
                  </p>

                  <button
                    onClick={() =>
                      navigate("/upload")
                    }
                  >
                    Start your first verification
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="activity-list">
                  {latestRecords.map((record) => (
                    <button
                      key={record.id}
                      className="activity-item"
                      onClick={() =>
                        openRecord(record)
                      }
                    >
                      <div className="activity-file-icon">
                        <FileText size={18} />
                      </div>

                      <div className="activity-details">
                        <strong>
                          {record.file_name ||
                            "Untitled document"}
                        </strong>

                        <span>
                          {formatDate(
                            record.created_at
                          )}
                        </span>
                      </div>

                      <div
                        className={`activity-status ${getStatusClass(
                          record.status
                        )}`}
                      >
                        {getStatusIcon(record.status)}
                        <span>
                          {getStatusText(
                            record.status
                          )}
                        </span>
                      </div>

                      <div className="activity-score">
                        <strong>
                          {record.score ?? 0}
                        </strong>
                        <span>/100</span>
                      </div>

                      <ChevronRight
                        size={17}
                        className="activity-arrow"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="security-grid">
            <div className="security-card">
              <div className="security-card-icon">
                <ShieldCheck size={21} />
              </div>

              <div>
                <span>SECURITY STATUS</span>
                <strong>Workspace protected</strong>
                <p>
                  Authentication and protected document
                  access are active.
                </p>
              </div>

              <div className="security-status-pill">
                <span></span>
                Active
              </div>
            </div>

            <div className="security-card">
              <div className="security-card-icon blue">
                <Zap size={21} />
              </div>

              <div>
                <span>VERIFICATION ENGINE</span>
                <strong>Ready for analysis</strong>
                <p>
                  Your workspace can process a new
                  verification request.
                </p>
              </div>

              <div className="security-status-pill blue-pill">
                <span></span>
                Ready
              </div>
            </div>

            <div className="security-card">
              <div className="security-card-icon purple">
                <Database size={21} />
              </div>

              <div>
                <span>DATA STORAGE</span>
                <strong>Protected storage</strong>
                <p>
                  Verification records are associated
                  with your account.
                </p>
              </div>

              <div className="security-status-pill purple-pill">
                <span></span>
                Secure
              </div>
            </div>
          </section>
        </section>
      </main>

      {searchOpen && (
        <div
          className="modal-overlay"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="search-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="search-modal-header">
              <Search size={20} />
              <input
                autoFocus
                placeholder="Search TrustVerify..."
              />
              <button
                onClick={() =>
                  setSearchOpen(false)
                }
              >
                ESC
              </button>
            </div>

            <div className="search-results">
              <button
                onClick={() => {
                  setSearchOpen(false);
                  navigate("/upload");
                }}
              >
                <FileCheck2 size={18} />
                <span>
                  <strong>Verify Documents</strong>
                  <small>
                    Start a new document verification
                  </small>
                </span>
                <ArrowUpRight size={16} />
              </button>

              <button
                onClick={() => {
                  setSearchOpen(false);
                  navigate("/history");
                }}
              >
                <History size={18} />
                <span>
                  <strong>Verification History</strong>
                  <small>
                    Browse previous verification records
                  </small>
                </span>
                <ArrowUpRight size={16} />
              </button>

              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSettingsOpen(true);
                }}
              >
                <Settings size={18} />
                <span>
                  <strong>Settings</strong>
                  <small>
                    Customize your workspace
                  </small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div
          className="modal-overlay"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="settings-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="settings-header">
              <div>
                <span>WORKSPACE</span>
                <h2>Personalize dashboard</h2>
                <p>
                  Customize the appearance of your
                  TrustVerify workspace.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSettingsOpen(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">
                <Palette size={17} />
                <div>
                  <strong>Appearance</strong>
                  <span>Choose your interface mode</span>
                </div>
              </div>

              <div className="theme-options">
                <button
                  className={
                    theme === "dark"
                      ? "theme-option selected"
                      : "theme-option"
                  }
                  onClick={() => setTheme("dark")}
                >
                  <div className="theme-preview dark-preview">
                    <div></div>
                    <span></span>
                    <span></span>
                  </div>

                  <strong>Dark</strong>
                  <small>
                    Premium dark workspace
                  </small>
                </button>

                <button
                  className={
                    theme === "light"
                      ? "theme-option selected"
                      : "theme-option"
                  }
                  onClick={() => setTheme("light")}
                >
                  <div className="theme-preview light-preview">
                    <div></div>
                    <span></span>
                    <span></span>
                  </div>

                  <strong>Light</strong>
                  <small>
                    Clean bright workspace
                  </small>
                </button>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">
                <Sparkles size={17} />
                <div>
                  <strong>Accent color</strong>
                  <span>
                    Change your interface accent
                  </span>
                </div>
              </div>

              <div className="accent-options">
                <button
                  className={
                    accent === "violet"
                      ? "accent-option violet selected"
                      : "accent-option violet"
                  }
                  onClick={() => setAccent("violet")}
                >
                  <span></span>
                  Violet
                </button>

                <button
                  className={
                    accent === "blue"
                      ? "accent-option blue selected"
                      : "accent-option blue"
                  }
                  onClick={() => setAccent("blue")}
                >
                  <span></span>
                  Blue
                </button>

                <button
                  className={
                    accent === "cyan"
                      ? "accent-option cyan selected"
                      : "accent-option cyan"
                  }
                  onClick={() => setAccent("cyan")}
                >
                  <span></span>
                  Cyan
                </button>

                <button
                  className={
                    accent === "rose"
                      ? "accent-option rose selected"
                      : "accent-option rose"
                  }
                  onClick={() => setAccent("rose")}
                >
                  <span></span>
                  Rose
                </button>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">
                <SlidersHorizontal size={17} />
                <div>
                  <strong>Interface density</strong>
                  <span>
                    Control dashboard spacing
                  </span>
                </div>
              </div>

              <div className="segmented-control">
                <button
                  className={
                    density === "compact"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setDensity("compact")
                  }
                >
                  Compact
                </button>

                <button
                  className={
                    density === "comfortable"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setDensity("comfortable")
                  }
                >
                  Comfortable
                </button>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">
                <LayoutDashboard size={17} />
                <div>
                  <strong>Sidebar layout</strong>
                  <span>
                    Choose your navigation width
                  </span>
                </div>
              </div>

              <div className="segmented-control">
                <button
                  className={
                    sidebarMode === "compact"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSidebarMode("compact")
                  }
                >
                  Compact
                </button>

                <button
                  className={
                    sidebarMode === "expanded"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSidebarMode("expanded")
                  }
                >
                  Expanded
                </button>
              </div>
            </div>

            <div className="settings-footer">
              <button
                className="secondary-button"
                onClick={() => {
                  setTheme("dark");
                  setAccent("violet");
                  setDensity("comfortable");
                  setSidebarMode("expanded");
                }}
              >
                Reset
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  setSettingsOpen(false)
                }
              >
                <CheckCircle2 size={17} />
                Save appearance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;