import {
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  ClipboardList,
  Factory,
  FileText,
  PackageCheck,
  ShoppingCart,
  Users,
} from "lucide-react";
import { hasSupabaseConfig } from "./lib/supabase";

const metrics = [
  { label: "Active Quotes", value: "1,324", note: "Quote history imported from TLC", icon: FileText },
  { label: "Contacts", value: "4,536", note: "Clients, suppliers, transport", icon: Users },
  { label: "Material Lines", value: "199", note: "Thickness and cutting rates", icon: Factory },
  { label: "Jobs", value: "14", note: "Production workflow foundation", icon: BriefcaseBusiness },
];

const modules = [
  {
    title: "CRM",
    icon: Users,
    items: ["Company profile", "Staff contacts", "Delivery addresses", "AI notes and map enrichment"],
  },
  {
    title: "Quote Estimator",
    icon: Calculator,
    items: ["Material and thickness", "Cutting and piercing rates", "Holes and slots", "GST totals"],
  },
  {
    title: "Jobs",
    icon: ClipboardList,
    items: ["Quote to job", "Production status", "Order acknowledgement", "Time consumed"],
  },
  {
    title: "Material to Order",
    icon: PackageCheck,
    items: ["Supplier candidates", "Order status", "Received tracking", "Email workflow"],
  },
  {
    title: "Purchases",
    icon: ShoppingCart,
    items: ["Purchase orders", "Supplier comments", "Attachments", "Authorization"],
  },
  {
    title: "Accounts",
    icon: BarChart3,
    items: ["Invoices", "MYOB references", "Sent status", "GST reporting"],
  },
];

const quoteLines = [
  {
    part: "PLATE 220 x 100 WITH HOLES TO EMAIL",
    material: "M/S",
    thickness: "16 mm",
    qty: 16,
    cutting: 5.21,
    piercing: 0.2,
    total: 187.52,
  },
  {
    part: "PLATE 500 x 500 TO EMAIL",
    material: "M/S",
    thickness: "10 mm",
    qty: 4,
    cutting: 9,
    piercing: 0,
    total: 184.08,
  },
  {
    part: "RECTANGLE 240 x 100",
    material: "M/S",
    thickness: "10 mm",
    qty: 32,
    cutting: 3.06,
    piercing: 0,
    total: 234.56,
  },
];

export function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">MSF</div>
        <nav aria-label="Main navigation">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button className="nav-button" key={module.title} type="button" title={module.title}>
                <Icon size={20} />
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">MySwiftFab</p>
            <h1>Laser Cutting Estimation</h1>
          </div>
          <div className={hasSupabaseConfig ? "status-dot online" : "status-dot"}>
            {hasSupabaseConfig ? "Supabase connected" : "Add Supabase env"}
          </div>
        </header>

        <section className="metrics-grid" aria-label="Project metrics">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article className="metric" key={metric.label}>
                <Icon size={22} />
                <div>
                  <span>{metric.value}</span>
                  <p>{metric.label}</p>
                  <small>{metric.note}</small>
                </div>
              </article>
            );
          })}
        </section>

        <section className="content-grid">
          <article className="quote-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Phase 1</p>
                <h2>Quote Estimator Core</h2>
              </div>
              <button className="primary-action" type="button">New Quote</button>
            </div>

            <div className="quote-summary">
              <div>
                <span>Client</span>
                <strong>Willis Engineering</strong>
              </div>
              <div>
                <span>Quote</span>
                <strong>400120</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Draft</strong>
              </div>
              <div>
                <span>Total inc. GST</span>
                <strong>$4,814.35</strong>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Part</th>
                    <th>Material</th>
                    <th>Qty</th>
                    <th>Cut</th>
                    <th>Pierce</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteLines.map((line) => (
                    <tr key={line.part}>
                      <td>
                        <strong>{line.part}</strong>
                        <span>{line.thickness}</span>
                      </td>
                      <td>{line.material}</td>
                      <td>{line.qty}</td>
                      <td>{line.cutting.toFixed(2)}</td>
                      <td>{line.piercing.toFixed(2)}</td>
                      <td>${line.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <section className="module-grid" aria-label="Application modules">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <article className="module-card" key={module.title}>
                  <div className="module-title">
                    <Icon size={20} />
                    <h3>{module.title}</h3>
                  </div>
                  <ul>
                    {module.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </section>
        </section>
      </section>
    </main>
  );
}
