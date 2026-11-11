import React, { useState, useEffect, useMemo } from "react";
import {
  Inbox,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  ExternalLink,
  User,
  Clock,
  Paperclip,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  Check,
  Scale,
  X,
  Phone,
  Mail,
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Building2,
  BarChart3,
  Printer,
  Globe
} from "lucide-react";

const DEPARTMENTS = [
  { key: "General Administration", ta: "பொது நிர்வாகம்", en: "General Administration" },
  { key: "Revenue & Land Administration", ta: "வருவாய் & நில நிர்வாகம்", en: "Revenue & Land Administration" },
  { key: "Highways & Public Works (PWD)", ta: "நெடுஞ்சாலை & பொதுப்பணி (PWD)", en: "Highways & Public Works (PWD)" },
  { key: "TANGEDCO / Electricity Board", ta: "மின்வாரியம் (TANGEDCO)", en: "TANGEDCO / Electricity Board" },
  { key: "Municipal & Rural Sanitation", ta: "நகராட்சி & ஊரக சுகாதாரம்", en: "Municipal & Rural Sanitation" },
  { key: "Police & Law Enforcement", ta: "காவல்துறை & சட்டம் ஒழுங்கு", en: "Police & Law Enforcement" },
  { key: "Social Welfare & Women Rights", ta: "சமூக நலம் & மகளிர் உரிமை", en: "Social Welfare & Women Rights" },
  { key: "Education & Youth Welfare", ta: "கல்வி & இளைஞர் நலம்", en: "Education & Youth Welfare" },
  { key: "Others", ta: "மற்றவை (Others)", en: "Others" }
];

export default function AdminApp() {
  // Language state (Tamil / English)
  const [language, setLanguage] = useState(() => localStorage.getItem("ctr_admin_lang") || "தமிழ்");
  const tamil = language === "தமிழ்";

  const toggleLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("ctr_admin_lang", lang);
  };

  const [token, setToken] = useState(() => sessionStorage.getItem("ctr_admin_token") || "");
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const u = sessionStorage.getItem("ctr_admin_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  // Login form state
  const [usernameInput, setUsernameInput] = useState("admin");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Dashboard state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [petitions, setPetitions] = useState([]);
  const [stats, setStats] = useState({ total: 0, received: 0, underReview: 0, inProgress: 0, resolved: 0, rejected: 0 });

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [selectedPetition, setSelectedPetition] = useState(null);

  // Inspector action state
  const [newStatus, setNewStatus] = useState("Received");
  const [newDepartment, setNewDepartment] = useState("General Administration");
  const [notesInput, setNotesInput] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentData, setAttachmentData] = useState(null);
  const [petitionHistory, setPetitionHistory] = useState([]);
  const [activePhoto, setActivePhoto] = useState(null);

  // Reports modal state
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reportSummary, setReportSummary] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // 1. Initial verify if token exists
  useEffect(() => {
    if (!token) return;
    const verify = async () => {
      try {
        const res = await fetch("/api/admin/verify", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          handleLogout();
          return;
        }
        if (data.user) setAdminUser(data.user);
        fetchPetitions(token);
      } catch (err) {
        console.error("Session verification error:", err);
        handleLogout();
      }
    };
    verify();
  }, [token]);

  // 2. Admin Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError(
        tamil
          ? "பயனர்பெயர் மற்றும் கடவுச்சொல்லை உள்ளிடவும்."
          : "Please enter your username and password."
      );
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            (tamil
              ? "தவறான பயனர்பெயர் அல்லது கடவுச்சொல்."
              : "Invalid administrator username or password.")
        );
      }

      sessionStorage.setItem("ctr_admin_token", data.token);
      if (data.user) {
        sessionStorage.setItem("ctr_admin_user", JSON.stringify(data.user));
        setAdminUser(data.user);
      }
      setToken(data.token);
      setPasswordInput("");
      fetchPetitions(data.token);
    } catch (err) {
      setLoginError(err.message || (tamil ? "உள்நுழைவு தோல்வியடைந்தது." : "Login failed."));
    } finally {
      setLoginLoading(false);
    }
  };

  // 3. Admin Logout
  const handleLogout = async () => {
    const activeToken = token || sessionStorage.getItem("ctr_admin_token");
    try {
      if (activeToken) {
        await fetch("/api/admin/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${activeToken}` }
        });
      }
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      sessionStorage.removeItem("ctr_admin_token");
      sessionStorage.removeItem("ctr_admin_user");
      setToken("");
      setAdminUser(null);
      setPetitions([]);
      setSelectedPetition(null);
    }
  };

  // 4. Fetch all petitions
  const fetchPetitions = async (activeToken = token) => {
    if (!activeToken) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/petitions", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          handleLogout();
          return;
        }
        throw new Error(data.message || (tamil ? "மனுக்களை ஏற்றுவதில் பிழை." : "Failed to load petitions."));
      }

      setPetitions(data.petitions || []);
      if (data.stats) setStats(data.stats);

      if (selectedPetition) {
        const found = (data.petitions || []).find((p) => p.id === selectedPetition.id);
        if (found) setSelectedPetition(found);
      }
    } catch (err) {
      setError(err.message || (tamil ? "மனுக்கள் பட்டியலை ஏற்றுவதில் பிழை ஏற்பட்டது." : "Error loading petitions list."));
    } finally {
      setLoading(false);
    }
  };

  // 5. Select petition
  const handleSelectPetition = async (p) => {
    setSelectedPetition(p);
    setNewStatus(p.status || "Received");
    setNewDepartment(p.department || "General Administration");
    setNotesInput(p.adminNotes || "");
    setError("");
    setSuccess("");
    setAttachmentData(null);
    setPetitionHistory([]);

    const activeToken = token || sessionStorage.getItem("ctr_admin_token");
    if (!activeToken) return;

    // Fetch history
    try {
      const res = await fetch(`/api/admin/petitions/${p.id}`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPetitionHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load petition history:", err);
    }

    // Fetch attachment
    if (p.hasAttachment) {
      setAttachmentLoading(true);
      try {
        const res = await fetch(`/api/admin/petitions/${p.id}/attachment`, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        const data = await res.json();
        if (res.ok && data.success && data.attachment) {
          setAttachmentData(data.attachment);
        }
      } catch (err) {
        console.error("Failed to load attachment:", err);
      } finally {
        setAttachmentLoading(false);
      }
    }
  };

  // 6. Update Status & Department
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedPetition) return;
    setUpdatingStatus(true);
    setError("");
    setSuccess("");

    const activeToken = token || sessionStorage.getItem("ctr_admin_token");
    try {
      const res = await fetch(`/api/admin/petitions/${selectedPetition.id}/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          status: newStatus,
          department: newDepartment,
          adminNotes: notesInput.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (tamil ? "மனுவைப் புதுப்பிப்பதில் தோல்வி." : "Failed to update petition."));
      }

      setSuccess(
        tamil
          ? `மனு #${selectedPetition.referenceNo} வெற்றிகரமாக புதுப்பிக்கப்பட்டது!`
          : `Petition #${selectedPetition.referenceNo} updated successfully!`
      );

      setSelectedPetition((prev) => ({
        ...prev,
        status: newStatus,
        department: newDepartment,
        adminNotes: notesInput.trim()
      }));

      if (data.historyItem) {
        setPetitionHistory((prev) => [data.historyItem, ...prev]);
      }

      fetchPetitions(activeToken);
    } catch (err) {
      setError(err.message || (tamil ? "நிலை மாற்றுவதில் பிழை ஏற்பட்டது." : "Error updating status."));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // 7. Load Reports Summary
  const handleOpenReports = async () => {
    setShowReportsModal(true);
    setReportLoading(true);
    const activeToken = token || sessionStorage.getItem("ctr_admin_token");
    try {
      const res = await fetch("/api/admin/reports/summary", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReportSummary(data);
      }
    } catch (err) {
      console.error("Failed to load reports summary:", err);
    } finally {
      setReportLoading(false);
    }
  };

  // 8. Download CSV Report
  const handleDownloadCsv = async () => {
    const activeToken = token || sessionStorage.getItem("ctr_admin_token");
    try {
      const res = await fetch("/api/admin/reports/csv", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (!res.ok) throw new Error("CSV download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CTR_NirmalKumar_Petitions_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert((tamil ? "CSV பதிவிறக்கம் தோல்வியடைந்தது: " : "CSV download failed: ") + err.message);
    }
  };

  // 9. Filtered Petitions
  const filteredPetitions = useMemo(() => {
    return petitions.filter((p) => {
      const matchesStatus = statusFilter === "ALL" || (p.status || "").toLowerCase() === statusFilter.toLowerCase();
      if (!matchesStatus) return false;

      const matchesDept = departmentFilter === "ALL" || (p.department || "General Administration") === departmentFilter;
      if (!matchesDept) return false;

      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        (p.referenceNo || "").toLowerCase().includes(q) ||
        (p.petitionerName || "").toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.subject || "").toLowerCase().includes(q) ||
        (p.department || "").toLowerCase().includes(q)
      );
    });
  }, [petitions, statusFilter, departmentFilter, search]);

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(tamil ? "ta-IN" : "en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return iso;
    }
  };

  const getDeptDisplay = (deptKey) => {
    if (!deptKey) return tamil ? "பொது நிர்வாகம்" : "General Administration";
    const match = DEPARTMENTS.find((d) => d.key === deptKey);
    if (match) return tamil ? match.ta : match.en;
    if (deptKey.startsWith("Others")) {
      return deptKey.replace("Others", tamil ? "மற்றவை" : "Others");
    }
    return deptKey;
  };

  // ==========================================
  // VIEW A: INDEPENDENT ADMIN LOGIN PAGE
  // ==========================================
  if (!token) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-card">
          {/* Language Switcher Capsule on Login */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <div className="language-switch" aria-label="Language Selector">
              <button
                type="button"
                className={!tamil ? "selected" : ""}
                onClick={() => toggleLanguage("EN")}
              >
                EN
              </button>
              <button
                type="button"
                className={tamil ? "selected" : ""}
                onClick={() => toggleLanguage("தமிழ்")}
              >
                தமிழ்
              </button>
            </div>
          </div>

          <div className="admin-page-header">
            <div className="admin-page-emblem-wrap">
              <img src="/hero-thalaivar.png" alt="CTR Nirmal Kumar" className="admin-page-emblem" />
            </div>
            <span className="admin-page-kicker">
              {tamil ? "தமிழ்நாடு சட்டமன்ற உறுப்பினர் அலுவலகம்" : "TAMIL NADU LEGISLATIVE ASSEMBLY"}
            </span>
            <h1 className="admin-page-title">
              {tamil ? "சி.டி.ஆர். நிர்மல் குமார் தொகுதி அலுவலகம்" : "Office of CTR Nirmal Kumar, MLA"}
            </h1>
            <p className="admin-page-subtitle">
              {tamil
                ? "மனுக்கள் மேலாண்மை & நிர்வாக கட்டுப்பாட்டு தளம்"
                : "Official Petitions Governance & Admin Portal"}
            </p>
          </div>

          <div className="admin-security-badge">
            <ShieldCheck size={16} />
            <span>
              {tamil
                ? "அங்கீகரிக்கப்பட்ட நிர்வாகிகளுக்கான பிரத்யேக தளம் (Admin Access Only)"
                : "Authorized Personnel Only · Admin Authentication"}
            </span>
          </div>

          {loginError && (
            <div className="admin-page-alert error" role="alert">
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="admin-page-form">
            <div className="admin-form-group">
              <label htmlFor="portal-admin-user">
                {tamil ? "பயனர் பெயர் (Username)" : "Username"}
              </label>
              <div className="admin-input-group">
                <User size={16} className="admin-input-lead-icon" />
                <input
                  id="portal-admin-user"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="portal-admin-pass">
                {tamil ? "கடவுச்சொல் (Password)" : "Password"}
              </label>
              <div className="admin-input-group">
                <Lock size={16} className="admin-input-lead-icon" />
                <input
                  id="portal-admin-pass"
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="admin-pw-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="admin-submit-btn"
              disabled={loginLoading || !usernameInput.trim() || !passwordInput.trim()}
            >
              {loginLoading ? (
                <>
                  <span className="portal-spinner" />
                  <span>{tamil ? "சரிபார்க்கிறது..." : "Verifying..."}</span>
                </>
              ) : (
                <>
                  <KeyRound size={17} />
                  <span>{tamil ? "நிர்வாக உள்நுழைவு (Login)" : "Sign In to Admin Portal"}</span>
                </>
              )}
            </button>
          </form>

          <div className="admin-page-footer">
            <span style={{ fontSize: 11, color: "#8c7b74" }}>
              {tamil
                ? "குடிமக்கள் மனு தளம் தனி போர்ட்டலில் கிடைக்கிறது: "
                : "Citizen Portal is running separately on: "}
              <strong>http://localhost:5173</strong>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW B: INDEPENDENT ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="admin-standalone-dashboard">
      {/* Top Bar */}
      <header className="admin-portal-topbar">
        <div className="admin-topbar-left">
          <img src="/hero-thalaivar.png" alt="Emblem" className="admin-topbar-emblem" />
          <div>
            <h1 className="admin-topbar-title">
              {tamil ? "சி.டி.ஆர். நிர்மல் குமார் தொகுதி அலுவலகம்" : "Office of CTR Nirmal Kumar, MLA"}
            </h1>
            <span className="admin-topbar-subtitle">
              {tamil
                ? "மனுக்கள் மேலாண்மை மற்றும் நிர்வாகப் பலகை (Admin Portal)"
                : "Petitions Governance & Administrative Dashboard"}
            </span>
          </div>
        </div>

        <div className="admin-topbar-right">
          {/* Language Switcher Capsule */}
          <div className="language-switch" aria-label="Language Selector" style={{ marginRight: 6 }}>
            <button
              type="button"
              className={!tamil ? "selected" : ""}
              onClick={() => toggleLanguage("EN")}
            >
              EN
            </button>
            <button
              type="button"
              className={tamil ? "selected" : ""}
              onClick={() => toggleLanguage("தமிழ்")}
            >
              தமிழ்
            </button>
          </div>

          <button
            type="button"
            className="admin-btn-action"
            style={{ background: "#78221e", color: "#ffffff", borderColor: "#992823" }}
            onClick={handleOpenReports}
            title={tamil ? "அறிக்கைகள் மற்றும் புள்ளிவிவரங்கள்" : "View Reports & Statistics"}
          >
            <BarChart3 size={14} />
            <span>{tamil ? "அறிக்கைகள்" : "Reports"}</span>
          </button>

          <button
            type="button"
            className="admin-btn-action admin-btn-refresh"
            onClick={() => fetchPetitions()}
            disabled={loading}
            title={tamil ? "மனுக்கள் பட்டியலை புதுப்பிக்கவும்" : "Refresh Petitions"}
          >
            <RefreshCw size={14} className={loading ? "spin-icon" : ""} />
            <span>{tamil ? "புதுப்பி" : "Refresh"}</span>
          </button>

          <button
            type="button"
            className="admin-btn-action admin-btn-logout"
            onClick={handleLogout}
            title={tamil ? "வெளியேறு" : "Logout"}
          >
            <LogOut size={14} />
            <span>{tamil ? "வெளியேறு" : "Logout"}</span>
          </button>
        </div>
      </header>

      {/* Global Alerts */}
      {error && (
        <div className="portal-alert-error" style={{ margin: "14px 24px 0" }} role="alert">
          <AlertCircle size={15} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />
          {error}
        </div>
      )}
      {success && (
        <div className="portal-alert-success" style={{ margin: "14px 24px 0" }} role="status">
          <Check size={15} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />
          {success}
        </div>
      )}

      {/* Stats Ribbon */}
      <div className="admin-stats-ribbon">
        <div
          className={`admin-stat-card ${statusFilter === "ALL" ? "is-active" : ""}`}
          onClick={() => setStatusFilter("ALL")}
        >
          <div className="admin-stat-num">{stats.total}</div>
          <div className="admin-stat-label">{tamil ? "மொத்த மனுக்கள்" : "Total Petitions"}</div>
        </div>

        <div
          className={`admin-stat-card stat-received ${statusFilter === "Received" ? "is-active" : ""}`}
          onClick={() => setStatusFilter("Received")}
        >
          <div className="admin-stat-num">{stats.received}</div>
          <div className="admin-stat-label">{tamil ? "புதியவை (Received)" : "Received"}</div>
        </div>

        <div
          className={`admin-stat-card stat-under-review ${statusFilter === "Under Review" ? "is-active" : ""}`}
          onClick={() => setStatusFilter("Under Review")}
        >
          <div className="admin-stat-num">{stats.underReview}</div>
          <div className="admin-stat-label">{tamil ? "பரிசீலனை (Under Review)" : "Under Review"}</div>
        </div>

        <div
          className={`admin-stat-card stat-in-progress ${statusFilter === "In Progress" ? "is-active" : ""}`}
          onClick={() => setStatusFilter("In Progress")}
        >
          <div className="admin-stat-num">{stats.inProgress}</div>
          <div className="admin-stat-label">{tamil ? "நடவடிக்கை (In Progress)" : "In Progress"}</div>
        </div>

        <div
          className={`admin-stat-card stat-resolved ${statusFilter === "Resolved" ? "is-active" : ""}`}
          onClick={() => setStatusFilter("Resolved")}
        >
          <div className="admin-stat-num">{stats.resolved}</div>
          <div className="admin-stat-label">{tamil ? "தீர்வு (Resolved)" : "Resolved"}</div>
        </div>

        <div
          className={`admin-stat-card stat-rejected ${statusFilter === "Rejected" ? "is-active" : ""}`}
          onClick={() => setStatusFilter("Rejected")}
        >
          <div className="admin-stat-num">{stats.rejected}</div>
          <div className="admin-stat-label">{tamil ? "நிராகரிப்பு (Rejected)" : "Rejected"}</div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder={
              tamil
                ? "மனு எண், மனுதாரர் பெயர், கைபேசி எண், மின்னஞ்சல் மூலம் தேடுக..."
                : "Search by Ref No, Petitioner Name, Mobile, Email, Subject..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
          {search && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Department Filter Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Building2 size={15} color="#78221e" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1.5px solid #dcd3c4",
              background: "#ffffff",
              fontSize: 12,
              fontWeight: 600,
              color: "#2c090b",
              outline: "none"
            }}
          >
            <option value="ALL">
              {tamil ? "அனைத்து துறைகளும் (All Departments)" : "All Departments"}
            </option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept.key} value={dept.key}>
                {tamil ? dept.ta : dept.en}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filters */}
        <div className="admin-filter-pills">
          <span className="admin-filter-pill-label">
            <Filter size={13} style={{ marginRight: 4, verticalAlign: "-2px" }} />
            {tamil ? "நிலை:" : "Status:"}
          </span>
          {[
            { key: "ALL", ta: "அனைத்தும்", en: "All" },
            { key: "Received", ta: "புதியவை", en: "Received" },
            { key: "Under Review", ta: "பரிசீலனை", en: "Under Review" },
            { key: "In Progress", ta: "நடவடிக்கை", en: "In Progress" },
            { key: "Resolved", ta: "தீர்வு", en: "Resolved" },
            { key: "Rejected", ta: "நிராகரிப்பு", en: "Rejected" }
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-filter-pill ${statusFilter === item.key ? "is-active" : ""}`}
              onClick={() => setStatusFilter(item.key)}
            >
              {tamil ? item.ta : item.en}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Workspace */}
      <main className="admin-workspace-grid">
        {/* Column 1: Petitions Feed */}
        <section className="admin-petitions-feed" aria-label="Petitions List">
          <div className="admin-feed-header">
            <h4>
              <Inbox size={15} style={{ marginRight: 6, verticalAlign: "-2px" }} />
              {tamil ? "மனுக்கள் பட்டியல்" : "Citizen Petitions Feed"}
            </h4>
            <span className="admin-feed-count">
              {filteredPetitions.length} / {petitions.length}
            </span>
          </div>

          {loading && petitions.length === 0 ? (
            <div className="admin-feed-loading">
              <span className="portal-spinner" />
              <p>{tamil ? "மனுக்கள் தரவுத்தளத்தில் இருந்து ஏற்றப்படுகின்றன..." : "Loading petitions from database..."}</p>
            </div>
          ) : filteredPetitions.length === 0 ? (
            <div className="admin-feed-empty">
              <FileText size={40} opacity={0.3} />
              <p>{tamil ? "மனுக்கள் எதுவும் பொருந்தவில்லை." : "No petitions match the filter criteria."}</p>
            </div>
          ) : (
            <div className="admin-feed-list">
              {filteredPetitions.map((p) => {
                const isSelected = selectedPetition?.id === p.id;
                const statusClass = (p.status || "Received").toLowerCase().replace(/\s+/g, "");
                return (
                  <div
                    key={p.id}
                    className={`admin-petition-card ${isSelected ? "is-selected" : ""}`}
                    onClick={() => handleSelectPetition(p)}
                  >
                    <div className="admin-card-top-row">
                      <span className="admin-card-ref">{p.referenceNo}</span>
                      <span className={`portal-status-badge status-${statusClass}`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="admin-card-petitioner-row">
                      <span className="admin-card-name">
                        <User size={13} style={{ marginRight: 4, verticalAlign: "-2px" }} />
                        {p.petitionerName}
                      </span>
                      <span className="admin-card-date">
                        <Clock size={12} style={{ marginRight: 4, verticalAlign: "-1px" }} />
                        {formatDateTime(p.createdAt)}
                      </span>
                    </div>

                    <div className="admin-card-subject-row">
                      <strong>{p.subject}</strong>
                    </div>

                    <div style={{ margin: "4px 0", fontSize: 11, color: "#8c2024", fontWeight: 600 }}>
                      🏛️ {getDeptDisplay(p.department || "General Administration")}
                    </div>

                    <div className="admin-card-meta-row">
                      <span className="admin-card-contact">
                        {p.phone && <span>📞 {p.phone}</span>}
                        {p.email && <span>✉️ {p.email}</span>}
                      </span>
                      {p.hasAttachment && (
                        <span className="admin-card-attachment-tag" title={p.attachmentName || "Attachment"}>
                          <Paperclip size={12} style={{ marginRight: 2 }} />
                          {tamil ? "ஆவணம்" : "Doc"}
                        </span>
                      )}
                    </div>

                    {p.adminNotes && (
                      <div className="admin-card-note-preview">
                        💬 <em>{p.adminNotes}</em>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Column 2: Detailed Petition Inspector */}
        <section className="admin-petition-inspector" aria-label="Petition Details">
          {!selectedPetition ? (
            <div className="admin-inspector-placeholder">
              <div className="placeholder-icon">📋</div>
              <h3>{tamil ? "மனுவைத் தேர்ந்தெடுக்கவும்" : "Select a Petition to Inspect"}</h3>
              <p>
                {tamil
                  ? "இடது பக்கப் பட்டியலில் இருந்து ஏதேனும் ஒரு மனுவைத் தேர்ந்தெடுத்து அதன் முழு விவரங்கள், பதிவேற்றிய ஆவணங்கள், துறை ஒதுக்கீடு மற்றும் அலுவலக நடவடிக்கையை உடனுக்குடன் நிர்வகிக்கலாம்."
                  : "Choose any petition from the left list to review complete details, attached documents, assign government department, and update official status."}
              </p>
            </div>
          ) : (
            <div className="admin-inspector-content">
              {/* Header */}
              <div className="admin-inspector-header">
                <div>
                  <span className="inspector-ref-badge">{selectedPetition.referenceNo}</span>
                  <span className="inspector-date">{formatDateTime(selectedPetition.createdAt)}</span>
                </div>
                <span className={`portal-status-badge status-${(selectedPetition.status || 'received').toLowerCase().replace(/\s+/g, '')}`}>
                  {selectedPetition.status}
                </span>
              </div>

              {/* Petitioner Info */}
              <div className="inspector-section-card">
                <h5>{tamil ? "மனுதாரர் விவரங்கள்" : "Petitioner Information"}</h5>
                <div className="inspector-petitioner-grid">
                  <div className="petitioner-field">
                    <span className="field-lbl">{tamil ? "பெயர்:" : "Name:"}</span>
                    <span className="field-val"><strong>{selectedPetition.petitionerName}</strong></span>
                  </div>
                  <div className="petitioner-field">
                    <span className="field-lbl">{tamil ? "தொகுதி:" : "Constituency:"}</span>
                    <span className="field-val">{selectedPetition.constituency}</span>
                  </div>
                  <div className="petitioner-field">
                    <span className="field-lbl">{tamil ? "கைபேசி எண்:" : "Mobile:"}</span>
                    <span className="field-val">
                      {selectedPetition.phone ? (
                        <a href={`tel:${selectedPetition.phone}`} className="admin-tel-link">
                          📞 {selectedPetition.phone}
                        </a>
                      ) : "—"}
                    </span>
                  </div>
                  <div className="petitioner-field">
                    <span className="field-lbl">{tamil ? "மின்னஞ்சல்:" : "Email:"}</span>
                    <span className="field-val">
                      {selectedPetition.email ? (
                        <a href={`mailto:${selectedPetition.email}`} className="admin-mail-link">
                          ✉️ {selectedPetition.email}
                        </a>
                      ) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grievance Subject & Description */}
              <div className="inspector-section-card">
                <h5>{tamil ? "மனுவின் பொருள் & முழு விவரம்" : "Grievance Subject & Description"}</h5>
                <div className="inspector-subject">
                  <strong>{selectedPetition.subject}</strong>
                  {selectedPetition.category && (
                    <span className="inspector-category-badge">{selectedPetition.category}</span>
                  )}
                </div>
                <div className="inspector-description-box">
                  {selectedPetition.description}
                </div>
              </div>

              {/* Attachment Preview */}
              <div className="inspector-section-card">
                <h5>
                  <Paperclip size={14} style={{ marginRight: 5, verticalAlign: "-2px" }} />
                  {tamil ? "இணைக்கப்பட்ட ஆவணங்கள் / புகைப்படங்கள்" : "Supporting Documents & Attachments"}
                </h5>

                {attachmentLoading ? (
                  <div className="attachment-loading">
                    <span className="portal-spinner" />
                    <span>{tamil ? "இணைப்பு ஆவணம் பதிவிறக்கப்படுகிறது..." : "Loading attachment..."}</span>
                  </div>
                ) : attachmentData ? (
                  <div className="admin-attachment-preview">
                    {attachmentData.type?.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(attachmentData.name || "") ? (
                      <div className="admin-att-image-box">
                        <img
                          src={attachmentData.data}
                          alt={attachmentData.name}
                          className="admin-att-img"
                          onClick={() => setActivePhoto(attachmentData.data)}
                          title={tamil ? "பெரிதாக்க கிளிக் செய்க" : "Click to view full size"}
                        />
                        <div className="admin-att-actions">
                          <span>{attachmentData.name}</span>
                          <a
                            href={attachmentData.data}
                            download={attachmentData.name || `Petition_${selectedPetition.referenceNo}_Attachment.jpg`}
                            className="portal-download-btn"
                          >
                            <Download size={13} style={{ marginRight: 4, verticalAlign: "-2px" }} />
                            {tamil ? "பதிவிறக்கம்" : "Download"}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-att-file-box">
                        <FileText size={32} className="admin-file-icon" />
                        <div className="admin-file-info">
                          <strong>{attachmentData.name}</strong>
                          <small>{attachmentData.type || "Document"}</small>
                        </div>
                        <a
                          href={attachmentData.data}
                          download={attachmentData.name || `Petition_${selectedPetition.referenceNo}_Doc.pdf`}
                          className="portal-download-btn"
                        >
                          <Download size={13} style={{ marginRight: 4, verticalAlign: "-2px" }} />
                          {tamil ? "பதிவிறக்கம்" : "Download"}
                        </a>
                      </div>
                    )}
                  </div>
                ) : selectedPetition.hasAttachment ? (
                  <div className="admin-attachment-hint">
                    <span>{selectedPetition.attachmentName || (tamil ? "ஆவணம் இணைக்கப்பட்டுள்ளது" : "Attachment available")}</span>
                  </div>
                ) : (
                  <div className="inspector-no-attachment">
                    {tamil ? "இணைப்பு ஆவணங்கள் எதுவும் சமர்ப்பிக்கப்படவில்லை." : "No documents or photos were attached."}
                  </div>
                )}
              </div>

              {/* Status Update & Department Assignment */}
              <div className="inspector-section-card inspector-action-box">
                <h5>
                  <Scale size={14} style={{ marginRight: 5, verticalAlign: "-2px" }} />
                  {tamil ? "துறை ஒதுக்கீடு & நிலை புதுப்பிப்பு" : "Department Assignment & Status Update"}
                </h5>

                <form onSubmit={handleUpdateStatus} className="inspector-status-form">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label htmlFor="inspector-dept-select" style={{ fontSize: 12, fontWeight: 700, color: "#2c090b", display: "block", marginBottom: 4 }}>
                        {tamil ? "ஒதுக்கப்படும் அரசு துறை:" : "Assigned Government Department:"}
                      </label>
                      <select
                        id="inspector-dept-select"
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="inspector-status-dropdown"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept.key} value={dept.key}>
                            {tamil ? dept.ta : dept.en}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="admin-inspector-status-select" style={{ fontSize: 12, fontWeight: 700, color: "#2c090b", display: "block", marginBottom: 4 }}>
                        {tamil ? "மனுவின் புதிய நிலை:" : "Update Status to:"}
                      </label>
                      <select
                        id="admin-inspector-status-select"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="inspector-status-dropdown"
                      >
                        <option value="Received">{tamil ? "Received — பெறப்பட்டது" : "Received"}</option>
                        <option value="Under Review">{tamil ? "Under Review — பரிசீலனையில் உள்ளது" : "Under Review"}</option>
                        <option value="In Progress">{tamil ? "In Progress — நடவடிக்கை எடுக்கப்படுகிறது" : "In Progress"}</option>
                        <option value="Resolved">{tamil ? "Resolved — தீர்வு காணப்பட்டது" : "Resolved"}</option>
                        <option value="Rejected">{tamil ? "Rejected — நிராகரிக்கப்பட்டது" : "Rejected"}</option>
                      </select>
                    </div>
                  </div>

                  <label htmlFor="admin-inspector-notes-area">
                    {tamil ? "அலுவலகக் குறிப்பு / நடவடிக்கை விளக்கம் (மனுதாரர் பார்வைக்கு):" : "Official Remarks / Public Notes (Visible to Citizen):"}
                  </label>
                  <textarea
                    id="admin-inspector-notes-area"
                    rows="3"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder={
                      tamil
                        ? "எ.கா: மனு பரிசீலிக்கப்பட்டு உரிய துறை அதிகாரிகளுக்கு நடவடிக்கைக்காக பரிந்துரைக்கப்பட்டுள்ளது."
                        : "e.g. Petition reviewed and forwarded to Thiruparankundram department engineers for prompt resolution."
                    }
                    className="inspector-notes-textarea"
                  />

                  <button
                    type="submit"
                    className="inspector-update-btn"
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <>
                        <span className="portal-spinner" />
                        <span>{tamil ? "புதுப்பிக்கிறது..." : "Updating..."}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>{tamil ? "துறை & நிலையைப் புதுப்பித்து சேமிக்கவும்" : "Save & Publish Status Update"}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* History Timeline */}
              {petitionHistory && petitionHistory.length > 0 && (
                <div className="inspector-section-card">
                  <h5>
                    <Clock size={14} style={{ marginRight: 5, verticalAlign: "-2px" }} />
                    {tamil ? "நடவடிக்கை வரலாறு" : "Action History Timeline"}
                  </h5>
                  <div className="inspector-timeline">
                    {petitionHistory.map((item, idx) => (
                      <div key={idx} className="inspector-timeline-item">
                        <div className="timeline-marker" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className={`portal-status-badge status-${(item.status || 'received').toLowerCase().replace(/\s+/g, '')}`}>
                              {item.status}
                            </span>
                            <span className="timeline-date">{formatDateTime(item.date)}</span>
                          </div>
                          <p className="timeline-comment">{item.comments}</p>
                          <span className="timeline-by">{item.updatedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Reports Generation Modal */}
      {showReportsModal && (
        <div className="photo-lightbox-backdrop" onClick={() => setShowReportsModal(false)} role="dialog">
          <div
            className="photo-lightbox-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 840, background: "#ffffff", padding: 28, borderRadius: 16, color: "#1e1310", textAlign: "left" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #ede8de", paddingBottom: 14, marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, color: "#2c090b", fontSize: 20 }}>
                  📊 {tamil ? "மனுக்கள் மேலாண்மை அறிக்கை" : "Petitions Performance & Governance Report"}
                </h3>
                <small style={{ color: "#6b5a51" }}>
                  {tamil
                    ? "சி.டி.ஆர். நிர்மல் குமார் தொகுதி அலுவலகம் · திருப்பரங்குன்றம்"
                    : "Office of CTR Nirmal Kumar, MLA · Thiruparankundram Constituency"}
                </small>
              </div>
              <button onClick={() => setShowReportsModal(false)} className="admin-search-clear" style={{ position: "static" }}>
                <X size={20} />
              </button>
            </div>

            {reportLoading ? (
              <div style={{ textAlign: "center", padding: 30 }}>
                <span className="portal-spinner" />
                <p>{tamil ? "அறிக்கை விவரங்கள் கணக்கிடப்படுகின்றன..." : "Calculating report statistics..."}</p>
              </div>
            ) : reportSummary ? (
              <div>
                {/* Overall Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                  <div style={{ background: "#fbf7ee", border: "1px solid #e2af27", padding: 14, borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#78221e" }}>{reportSummary.overall?.total || stats.total}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6b5a51" }}>{tamil ? "மொத்த மனுக்கள்" : "Total Petitions"}</div>
                  </div>
                  <div style={{ background: "#edf7ed", border: "1px solid #a3d9a5", padding: 14, borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#1e7e34" }}>{reportSummary.overall?.totalResolved || stats.resolved}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#1e7e34" }}>{tamil ? "தீர்வு காணப்பட்டவை" : "Resolved Petitions"}</div>
                  </div>
                  <div style={{ background: "#f0f4f8", border: "1px solid #bbd1e8", padding: 14, borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#026aa7" }}>
                      {reportSummary.overall?.total > 0 ? Math.round(((reportSummary.overall?.totalResolved || stats.resolved) / reportSummary.overall?.total) * 100) : 0}%
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#026aa7" }}>{tamil ? "தீர்வு சதவீதம்" : "Resolution Rate"}</div>
                  </div>
                </div>

                {/* Department-wise Breakdown Table */}
                <h4 style={{ margin: "16px 0 8px 0", color: "#2c090b", fontSize: 14 }}>
                  {tamil ? "துறை வாரியான மனுக்கள் விவரம்" : "Department-wise Breakdown"}
                </h4>
                <div style={{ maxHeight: 250, overflowY: "auto", border: "1px solid #ede8de", borderRadius: 8, marginBottom: 20 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f5f0e6", textAlign: "left", color: "#2c090b" }}>
                        <th style={{ padding: "8px 12px" }}>{tamil ? "துறை (Department)" : "Department"}</th>
                        <th style={{ padding: "8px 12px", textAlign: "center" }}>{tamil ? "மொத்தம்" : "Total"}</th>
                        <th style={{ padding: "8px 12px", textAlign: "center" }}>Received</th>
                        <th style={{ padding: "8px 12px", textAlign: "center" }}>In Progress</th>
                        <th style={{ padding: "8px 12px", textAlign: "center" }}>Resolved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportSummary.departmentStats || []).map((d, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f0ebe1" }}>
                          <td style={{ padding: "8px 12px", fontWeight: 600 }}>{getDeptDisplay(d.department)}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>{d.total}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", color: "#b06000" }}>{d.received}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", color: "#5e35b1" }}>{d.inProgress}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", color: "#1e7e34", fontWeight: 700 }}>{d.resolved}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Export Action Buttons */}
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 16px",
                      background: "#ede8de",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    <Printer size={15} />
                    <span>{tamil ? "அச்சிடு (Print)" : "Print Summary"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 18px",
                      background: "linear-gradient(135deg, #78221e 0%, #4a0f12 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    <Download size={15} />
                    <span>{tamil ? "முழு அறிக்கையை CSV-யாக பதிவிறக்குக" : "Download Complete CSV Report"}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Lightbox for photos */}
      {activePhoto && (
        <div className="photo-lightbox-backdrop" onClick={() => setActivePhoto(null)} role="dialog">
          <div className="photo-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="photo-lightbox-close" onClick={() => setActivePhoto(null)} aria-label="Close">
              <X size={20} />
            </button>
            <img src={activePhoto} alt="Attachment" className="photo-lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
}
