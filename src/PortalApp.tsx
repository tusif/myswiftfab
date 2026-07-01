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

type PortalUploadRow = {
  id: string;
  created_at: string;
  upload_type: 'dxf' | 'other';
  file_name: string | null;
  storage_path: string | null;
  category: string | null;
  description: string | null;
  qty: number;
  notes: string | null;
  plate_width: number | null;
  plate_height: number | null;
  cut_length: number | null;
  pierce_count: number | null;
  holes: any[];
  material: string | null;
  thickness: string | null;
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
        if (data.session.user.user_metadata?.invited) {
          setAuthState("set-password");
        } else {
          setAuthState("portal");
        }
      } else {
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

const CATEGORIES = ["BENDING", "WELDING", "PAINTING", "GALVANISING", "POWDER COATING", "FABRICATION", "DELIVERY", "OTHER"];

function PortalDashboard({ clientEmail }: { clientEmail: string }) {
  const [activeTab, setActiveTab] = useState<"cutting" | "others">("cutting");

  // portal_quotes (legacy)
  const [quotes, setQuotes] = useState<PortalQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  // portal_uploads — cutting
  const [dxfUploads, setDxfUploads] = useState<PortalUploadRow[]>([]);
  const [loadingDxf, setLoadingDxf] = useState(true);
  const [showDxfUpload, setShowDxfUpload] = useState(false);

  // portal_uploads — others
  const [otherUploads, setOtherUploads] = useState<PortalUploadRow[]>([]);
  const [loadingOthers, setLoadingOthers] = useState(true);
  const [showOthersForm, setShowOthersForm] = useState(false);

  const fetchQuotes = async () => {
    if (!supabase) return;
    setLoadingQuotes(true);
    const { data } = await supabase.from("portal_quotes").select("*").eq("client_email", clientEmail).order("created_at", { ascending: false });
    setQuotes((data ?? []) as PortalQuote[]);
    setLoadingQuotes(false);
  };

  const fetchDxfUploads = async () => {
    if (!supabase) return;
    setLoadingDxf(true);
    const { data } = await supabase.from("portal_uploads").select("*").eq("client_email", clientEmail).eq("upload_type", "dxf").order("created_at", { ascending: false });
    setDxfUploads((data ?? []) as PortalUploadRow[]);
    setLoadingDxf(false);
  };

  const fetchOtherUploads = async () => {
    if (!supabase) return;
    setLoadingOthers(true);
    const { data } = await supabase.from("portal_uploads").select("*").eq("client_email", clientEmail).eq("upload_type", "other").order("created_at", { ascending: false });
    setOtherUploads((data ?? []) as PortalUploadRow[]);
    setLoadingOthers(false);
  };

  useEffect(() => {
    fetchQuotes();
    fetchDxfUploads();
    fetchOtherUploads();
  }, [clientEmail]);

  const signOut = async () => { await supabase?.auth.signOut(); };

  return (
    <div className="portal-dashboard">
      {/* Header */}
      <div className="portal-dashboard-topbar">
        <div>
          <h2 className="portal-welcome">Welcome back</h2>
          <div className="portal-email-tag">{clientEmail}</div>
        </div>
        <div className="portal-dashboard-actions">
          <button className="portal-btn-ghost" onClick={signOut}>Sign Out</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="portal-tab-bar">
        <button className={`portal-tab${activeTab === "cutting" ? " portal-tab--active" : ""}`} onClick={() => setActiveTab("cutting")} type="button">
          📐 Cutting Files
        </button>
        <button className={`portal-tab${activeTab === "others" ? " portal-tab--active" : ""}`} onClick={() => setActiveTab("others")} type="button">
          ⚙ Others &amp; Extras
        </button>
      </div>

      {/* Cutting Files Tab */}
      {activeTab === "cutting" && (
        <div className="portal-tab-content">
          <div className="portal-tab-actions">
            <button className="portal-btn-primary" onClick={() => setShowDxfUpload(true)}>Upload DXF File</button>
          </div>

          {showDxfUpload && (
            <DxfUploadPanel
              clientEmail={clientEmail}
              onSubmitted={() => { setShowDxfUpload(false); fetchDxfUploads(); }}
              onCancel={() => setShowDxfUpload(false)}
            />
          )}

          <div className="portal-quotes-section">
            <h3 className="portal-section-title">Your Cutting Files</h3>
            {loadingDxf ? (
              <div className="portal-loading">Loading…</div>
            ) : dxfUploads.length === 0 ? (
              <div className="portal-empty">No DXF files uploaded yet. Click <strong>Upload DXF File</strong> to get started.</div>
            ) : (
              <table className="portal-table">
                <thead>
                  <tr><th>Date</th><th>File Name</th><th>Size (mm)</th><th>Material</th><th>Thickness</th><th>Qty</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {dxfUploads.map(u => (
                    <tr key={u.id}>
                      <td>{new Date(u.created_at).toLocaleDateString("en-AU")}</td>
                      <td className="portal-filename">{u.file_name ?? "—"}</td>
                      <td>{u.plate_width != null && u.plate_height != null ? `${u.plate_width} × ${u.plate_height}` : "—"}</td>
                      <td>{u.material || "—"}</td>
                      <td>{u.thickness ? `${u.thickness} mm` : "—"}</td>
                      <td>{u.qty}</td>
                      <td><span className={`portal-status portal-status--${u.status}`}>{u.status.toUpperCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Legacy quote requests */}
          <div className="portal-quotes-section" style={{ marginTop: 32 }}>
            <h3 className="portal-section-title">Quote Requests (Legacy)</h3>
            {loadingQuotes ? (
              <div className="portal-loading">Loading…</div>
            ) : quotes.length === 0 ? (
              <div className="portal-empty">No legacy quote requests.</div>
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
      )}

      {/* Others & Extras Tab */}
      {activeTab === "others" && (
        <div className="portal-tab-content">
          <div className="portal-tab-actions">
            <button className="portal-btn-primary" onClick={() => setShowOthersForm(true)}>Add Item</button>
          </div>

          {showOthersForm && (
            <OthersItemForm
              clientEmail={clientEmail}
              onSubmitted={() => { setShowOthersForm(false); fetchOtherUploads(); }}
              onCancel={() => setShowOthersForm(false)}
            />
          )}

          <div className="portal-quotes-section">
            <h3 className="portal-section-title">Your Other Items</h3>
            {loadingOthers ? (
              <div className="portal-loading">Loading…</div>
            ) : otherUploads.length === 0 ? (
              <div className="portal-empty">No items yet. Click <strong>Add Item</strong> to get started.</div>
            ) : (
              <table className="portal-table">
                <thead>
                  <tr><th>Date</th><th>Category</th><th>Description</th><th>Qty</th><th>File</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {otherUploads.map(u => (
                    <tr key={u.id}>
                      <td>{new Date(u.created_at).toLocaleDateString("en-AU")}</td>
                      <td>{u.category ?? "—"}</td>
                      <td>{u.description ?? "—"}</td>
                      <td>{u.qty}</td>
                      <td>{u.file_name ? <span className="portal-filename">{u.file_name}</span> : "—"}</td>
                      <td><span className={`portal-status portal-status--${u.status}`}>{u.status.toUpperCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── DXF Upload Panel ───────────────────────────────────────────────────────

const MATERIALS = ["M/S", "304 SS", "316 SS", "Aluminium", "Copper", "Brass"];
const THICKNESSES = ["1.0","1.5","2.0","3.0","4.0","5.0","6.0","8.0","10.0","12.0","16.0","20.0","25.0"];

function DxfUploadPanel({ clientEmail, onSubmitted, onCancel }: {
  clientEmail: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dxf, setDxf] = useState<DxfAnalysis | null>(null);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [thickness, setThickness] = useState("6.0");
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (f: File) => {
    setFileName(f.name);
    setFile(f);
    setParsing(true);
    const result = await analyseDxf(f);
    setParsing(false);
    if (result.rawError) { setError(`Could not read DXF: ${result.rawError}`); return; }
    setDxf(result);
    setError("");
  };

  const submit = async () => {
    if (!dxf || !supabase) return;
    setSubmitting(true);

    // Upload file to Supabase Storage
    let storagePath: string | null = null;
    if (file) {
      const uuid = crypto.randomUUID();
      storagePath = `${clientEmail}/${uuid}/${fileName}`;
      const { error: uploadErr } = await supabase.storage.from("portal-files").upload(storagePath, file);
      if (uploadErr) {
        // Storage may not be configured — proceed without it
        console.warn("Storage upload failed:", uploadErr.message);
        storagePath = null;
      }
    }

    // Save to portal_uploads
    const { error: err } = await supabase.from("portal_uploads").insert({
      client_email: clientEmail,
      upload_type: "dxf",
      category: "CUTTING",
      file_name: fileName,
      storage_path: storagePath,
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
        <h3>Upload DXF File</h3>
        <button className="portal-btn-ghost" onClick={onCancel} type="button">✕ Cancel</button>
      </div>

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
          {submitting ? "Uploading…" : "Submit File"}
        </button>
      </div>
    </div>
  );
}

// ── Others Item Form ───────────────────────────────────────────────────────

function OthersItemForm({ clientEmail, onSubmitted, onCancel }: {
  clientEmail: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!supabase) return;
    setSubmitting(true);

    let storagePath: string | null = null;
    let fileName: string | null = null;
    if (file) {
      fileName = file.name;
      const uuid = crypto.randomUUID();
      storagePath = `${clientEmail}/${uuid}/${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("portal-files").upload(storagePath, file);
      if (uploadErr) {
        console.warn("Storage upload failed:", uploadErr.message);
        storagePath = null;
      }
    }

    const { error: err } = await supabase.from("portal_uploads").insert({
      client_email: clientEmail,
      upload_type: "other",
      category,
      description,
      qty: Number(qty) || 1,
      notes,
      file_name: fileName,
      storage_path: storagePath,
      status: "pending",
    });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    onSubmitted();
  };

  return (
    <div className="portal-upload-panel portal-others-form">
      <div className="portal-upload-header">
        <h3>Add Item</h3>
        <button className="portal-btn-ghost" onClick={onCancel} type="button">✕ Cancel</button>
      </div>

      <div className="portal-order-form">
        <div className="portal-others-row">
          <label className="portal-field">
            <span>Category</span>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="portal-field" style={{ flex: 2 }}>
            <span>Description</span>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what you need…" />
          </label>
          <label className="portal-field" style={{ width: 100 }}>
            <span>Quantity</span>
            <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
          </label>
        </div>
        <label className="portal-field">
          <span>Notes (optional)</span>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional instructions, reference drawings, dimensions…" />
        </label>
        <div className="portal-field">
          <span>Drawing / File (optional)</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
            <button className="portal-btn-ghost" type="button" onClick={() => fileInputRef.current?.click()}>
              {file ? `✅ ${file.name}` : "Choose file…"}
            </button>
            {file && <button className="portal-btn-ghost" type="button" style={{ fontSize: 11 }} onClick={() => setFile(null)}>Remove</button>}
            <input ref={fileInputRef} type="file" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }} />
          </div>
        </div>
      </div>

      {error && <div className="portal-error">{error}</div>}

      <div className="portal-upload-footer">
        <button className="portal-btn-ghost" onClick={onCancel} type="button">Cancel</button>
        <button className="portal-btn-primary" disabled={!description.trim() || submitting} onClick={submit} type="button">
          {submitting ? "Submitting…" : "Submit Item"}
        </button>
      </div>
    </div>
  );
}
