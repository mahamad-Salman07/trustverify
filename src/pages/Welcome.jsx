import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  FileCheck2,
  ScanLine,
  Fingerprint
} from "lucide-react";

import "../style/welcome.css";

function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="welcome">

      {/* Animated background */}
      <div className="background">
        <div className="glow glow1"></div>
        <div className="glow glow2"></div>
        <div className="glow glow3"></div>
        <div className="grid"></div>
      </div>

      {/* Main content */}
      <div className="welcome-content">

        <div className="logo-container">
          <div className="logo">
            <ShieldCheck size={55} strokeWidth={1.5} />
          </div>
        </div>

        <div className="brand">
          <h1>TRUSTVERIFY</h1>

          <div className="line"></div>

          <p>INTELLIGENT DOCUMENT VERIFICATION</p>
        </div>

        <div className="message">
          <h2>
            VERIFY <span>EVERYTHING.</span>
          </h2>

          <p className="description">
            AI-powered verification for documents, certificates,
            signatures and digital identity.
          </p>
        </div>

        <div className="verification-icons">

          <div className="verify-item">
            <FileCheck2 size={15} />
            DOCUMENTS
          </div>

          <div className="verify-item">
            <ScanLine size={15} />
            AI ANALYSIS
          </div>

          <div className="verify-item">
            <Fingerprint size={15} />
            AUTHENTICITY
          </div>

        </div>

        <div className="loading">

          <div className="loading-text">
            INITIALIZING TRUST ENGINE
          </div>

          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>

          <div className="loading-percent">
            SECURE VERIFICATION SYSTEM
          </div>

        </div>

      </div>

      <div className="version">
        TRUSTVERIFY • SECURE AI
      </div>

    </div>
  );
}

export default Welcome;