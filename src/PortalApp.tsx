import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { analyseDxf, DxfAnalysis } from "./dxfUtils";

// ── Types ──────────────────────────────────────────────────────────────────

type PortalQuote = {
  id: string;
  created_at: string;
  file_name: string;
  plate_width: number;
  plate_height: number;
  cut_length: number;
  pierce_count: number;
  holes: { dia: number; qty: number }[];
  material: string;
  thickness: string;
  qty: number;
  notes: string;
  status: string;
};

type AuthState = "checking" | "login" | "set-password" | "portal";

// ── Portal App ─────────────────────────────────────────────────────────────

export function PortalApp() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [clientEmail, setClientEmail] = useState("");

  useEffect(() => {
    if (!supabase) { setAuthState("login"); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setClientEmail(data.session.user.email ?? "");
        // If user signed up via invite and hasn't changed password yet
        if (data.session.user.user_metadata?.invited) {
          setAuthState("set-password");
        } else {
          setAuthState("portal");
        }
      } else {
        // Check URL for invite token (Supabase magic link)
        const hash = window.location.hash;
        if (hash.includes("type=invite") || hash.includes("type=recovery")) {
          setAuthState("set-password");
        } else {
          setAuthState("login");
        }
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setClientEmail(session.user.email ?? "");
        setAuthState("portal");
      }
      if (event === "SIGNED_OUT") setAuthState("login");
      if (event === "USER_UPDATED" && session?.user) {
        setClientEmail(session.user.email ?? "");
        setAuthState("portal");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (authState === "checking") return <PortalShell><div className="portal-loading">Loading…</div></PortalShell>;
  if (authState === "login") return <PortalShell><LoginForm onLogin={() => setAuthState("portal")} /></PortalShell>;
  if (authState === "set-password") return <PortalShell><SetPasswordForm onDone={() => setAuthState("portal")} /></PortalShell>;
  return <PortalShell><PortalDashboard clientEmail={clientEmail} /></PortalShell>;
}

// ── Shell ──────────────────────────────────────────────────────────────────

function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-shell">
      <header className="portal-topbar">
        <div className="portal-brand">MySwiftFab — Client Portal</div>
        <div className="portal-tagline">Upload your DXF files and receive quotes instantly</div>
      </header>
      <main className="portal-main">{children}</main>
      <footer className="portal-footer">© MySwiftFab — Powered by laser precision</footer>
    </div>
  );
}

// ── Login Form ─────────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError(""); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
    else onLogin();
  };

  return (
    <div className="portal-card">
      <h2 className="portal-card-title">Client Login</h2>
      <p className="portal-card-sub">Log in to submit DXF files and track your quotes.</p>
      <form onSubmit={login} className="portal-form">
        <label className="portal-field">
          <span>Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" autoComplete="email" />
        </label>
        <label className="portal-field">
          <span>Password</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
        </label>
        {error && <div className="portal-error">{error}</div>}
        <button type="submit" className="portal-btn-primary" disabled={loading}>
          {loading ? "Logging in…" : "Log In"}
        </button>
      </form>
    </div>
  );
}

// ── Set Password Form (after invite link) ──────────────────────────────────

function SetPasswordForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!supabase) return;
    setError(""); setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) setError(err.message);
    else onDone();
  };

  return (
    <div className="portal-card">
      <h2 className="portal-card-title">Set Your Password</h2>
      <p className="portal-card-sub">Welcome! Please create a password to access your portal.</p>
      <form onSubmit={save} className="portal-form">
        <label className="portal-field">
          <span>New Password</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters" autoComplete="new-password" />
        </label>
        <label className="portal-field">
          <span>Confirm Password</span>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat password" autoComplete="new-password" />
        </label>
        {error && <div className="portal-error">{error}</div>}
        <button type="submit" className="portal-btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Set Password & Enter Portal"}
        </button>
      </form>
    </div>
  );
}

// ── Portal Dashboard ───────────────────────────────────────────────────────

function PortalDashboard({ clientEmail }: { clientEmail: string }) {
  const [quotes, setQuotes] = useState<PortalQuote[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  const fetchQuotes = async () => {
    if (!supabase) return;
    setLoadingQuotes(true);
    const { data } = await supabase
      .from("portal_quotes")
      .select("*")
      .eq("client_email", clientEmail)
      .order("created_at", { ascending: false });
    setQuotes((data ?? []) as PortalQuote[]);
    setLoadingQuotes(false);
  };

  useEffect(() => { fetchQuotes(); }, [clientEmail]);

  const signOut = async () => { await supabase?.auth.signOut(); };

  return (
    <div className="portal-dashboard">
      <div className="portal-dashboard-topbar">
        <div>
          <h2 className="portal-welcome">Welcome back</h2>
          <div className="portal-email-tag">{clientEmail}</div>
        </div>
        <div className="portal-dashboard-actions">
          <button className="portal-btn-primary" onClick={() => setShowUpload(true)}>+ New Quote Request</button>
          <button className="portal-btn-ghost" onClick={signOut}>Sign Out</button>
        </div>
      </div>

      {showUpload && (
        <UploadPanel
          clientEmail={clientEmail}
          onSubmitted={() => { setShowUpload(false); fetchQuotes(); }}
          onCancel={() => setShowUpload(false)}
        />
      )}

      <div className="portal-quotes-section">
        <h3 className="portal-section-title">Your Quote Requests</h3>
        {loadingQuotes ? (
          <div className="portal-loading">Loading…</div>
        ) : quotes.length === 0 ? (
          <div className="portal-empty">No quote requests yet. Click <strong>+ New Quote Request</strong> to get started.</div>
        ) : (
          <table className="portal-table">
            <thead>
              <tr><th>Date</th><th>File</th><th>Size (mm)</th><th>Material</th><th>Thickness</th><th>Qty</th><th>Status</th></tr>
            </thead>
            <tbody>
              {quotes.map(q => (
                <tr key={q.id}>
                  <td>{new Date(q.created_at).toLocaleDateString("en-AU")}</td>
                  <td className="portal-filename">{q.file_name}</td>
                  <td>{q.plate_width} × {q.plate_height}</td>
                  <td>{q.material || "—"}</td>
                  <td>{q.thickness ? `${q.thickness} mm` : "—"}</td>
                  <td>{q.qty}</td>
                  <td><span className={`portal-status portal-status--${q.status}`}>{q.status.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Upload Panel ───────────────────────────────────────────────────────────

const MATERIALS = ["M/S", "304 SS", "316 SS", "Aluminium", "Copper", "Brass"];
const THICKNESSES = ["1.0","1.5","2.0","3.0","4.0","5.0","6.0","8.0","10.0","12.0","16.0","20.0","25.0"];

function UploadPanel({ clientEmail, onSubmitted, onCancel }: {
  clientEmail: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dxf, setDxf] = useState<DxfAnalysis | null>(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [thickness, setThickness] = useState("6.0");
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setParsing(true);
    const result = await analyseDxf(file);
    setParsing(false);
    if (result.rawError) { setError(`Could not read DXF: ${result.rawError}`); return; }
    setDxf(result);
    setError("");
  };

  const submit = async () => {
    if (!dxf || !supabase) return;
    setSubmitting(true);
    const { error: err } = await supabase.from("portal_quotes").insert({
      client_email: clientEmail,
      file_name: fileName,
      plate_width: dxf.plateWidth,
      plate_height: dxf.plateHeight,
      cut_length: dxf.cutLength,
      pierce_count: dxf.pierceCount,
      holes: dxf.holes,
      material,
      thickness,
      qty: Number(qty) || 1,
      notes,
      status: "pending",
    });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    onSubmitted();
  };

  return (
    <div className="portal-upload-panel">
      <div className="portal-upload-header">
        <h3>New Quote Request</h3>
        <button className="portal-btn-ghost" onClick={onCancel} type="button">✕ Cancel</button>
      </div>

      {/* DXF Drop Zone */}
      <div
        className={`portal-dxf-zone${dxf ? " portal-dxf-zone--done" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <input ref={fileInputRef} type="file" accept=".dxf" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        {parsing ? (
          <div className="portal-dxf-status">⏳ Analysing your DXF file…</div>
        ) : dxf ? (
          <div className="portal-dxf-status portal-dxf-status--ok">
            ✅ <strong>{fileName}</strong> — analysed successfully
            <button className="portal-change-file" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }} type="button">Change file</button>
          </div>
        ) : (
          <div className="portal-dxf-hint">
            <div className="portal-dxf-icon">📐</div>
            <div><strong>Click or drag &amp; drop your DXF file here</strong></div>
            <div className="portal-dxf-sub">Supports standard 2D DXF files from AutoCAD, SolidWorks, Fusion 360, etc.</div>
          </div>
        )}
      </div>

      {/* Analysis results */}
      {dxf && (
        <div className="portal-dxf-results">
          <div className="portal-result-grid">
            <div><span>Plate Width</span><strong>{dxf.plateWidth} mm</strong></div>
            <div><span>Plate Height</span><strong>{dxf.plateHeight} mm</strong></div>
            <div><span>Cut Length</span><strong>{(dxf.cutLength / 1000).toFixed(2)} m</strong></div>
            <div><span>Pierces</span><strong>{dxf.pierceCount}</strong></div>
            {dxf.holes.length > 0 && (
              <div style={{ gridColumn: "1 / -1" }}>
                <span>Detected Holes</span>
                <strong>{dxf.holes.map(h => `${h.qty}× Ø${h.dia}`).join(", ")}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order details */}
      <div className="portal-order-form">
        <div className="portal-order-row">
          <label className="portal-field">
            <span>Material</span>
            <select value={material} onChange={e => setMaterial(e.target.value)}>
              {MATERIALS.map(m => <option key={m}>{m}</option>)}
            </select>
          </label>
          <label className="portal-field">
            <span>Thickness (mm)</span>
            <select value={thickness} onChange={e => setThickness(e.target.value)}>
              {THICKNESSES.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="portal-field">
            <span>Quantity</span>
            <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
          </label>
        </div>
        <label className="portal-field">
          <span>Notes (optional)</span>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any special requirements, delivery notes, reference numbers…" />
        </label>
      </div>

      {error && <div className="portal-error">{error}</div>}

      <div className="portal-upload-footer">
        <button className="portal-btn-ghost" onClick={onCancel} type="button">Cancel</button>
        <button className="portal-btn-primary" disabled={!dxf || submitting} onClick={submit} type="button">
          {submitting ? "Submitting…" : "Submit Quote Request"}
        </button>
      </div>
    </div>
  );
}
