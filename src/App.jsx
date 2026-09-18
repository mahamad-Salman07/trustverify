import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

// Pages
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/upload";
import Verification from "./pages/Verification";
import Results from "./pages/Results";
import Report from "./pages/Report";
import VerifyEmail from "./pages/VerifyEmail";
import History from "./pages/History";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            WELCOME
        ========================== */}
        <Route
          path="/"
          element={<Welcome />}
        />

        {/* =========================
            AUTHENTICATION
        ========================== */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />

        {/* =========================
            MAIN APPLICATION
        ========================== */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/upload"
          element={<Upload />}
        />

        <Route
          path="/history"
          element={<History />}
        />

        {/* =========================
            VERIFICATION
        ========================== */}

        <Route
          path="/verification/:id"
          element={<Verification />}
        />

        {/* Results with ID */}
        <Route
          path="/results/:id"
          element={<Results />}
        />

        {/* Results without ID
            Used by current Upload.jsx */}
        <Route
          path="/results"
          element={<Results />}
        />

        {/* =========================
            REPORT
        ========================== */}

        <Route
          path="/report/:id"
          element={<Report />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;