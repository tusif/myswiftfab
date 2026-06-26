import { useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  ClipboardList,
  Factory,
  FileText,
  Gauge,
  PackageCheck,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { hasSupabaseConfig } from "./lib/supabase";

type PageId = "dashboard" | "contacts" | "quotes" | "jobs" | "materials" | "purchases" | "invoices";

type Module = {
  id: PageId;
  title: string;
  description: string;
  icon: typeof Gauge;
};

const modules: Module[] = [
  { id: "dashboard", title: "Dashboard", description: "Daily estimating and production view", icon: Gauge },
  { id: "contacts", title: "Contacts", description: "Clients, suppliers, transport, and people", icon: Users },
  { id: "quotes", title: "Quotes", description: "Laser cutting estimates and quote lines", icon: Calculator },
  { id: "jobs", title: "Jobs", description: "Approved work and production status", icon: ClipboardList },
  { id: "materials", title: "Materials", description: "Material library and cutting rates", icon: Factory },
  { id: "purchases", title: "Purchases", description: "Material orders and purchase orders", icon: ShoppingCart },
  { id: "invoices", title: "Invoices", description: "Accounts, GST totals, and MYOB references", icon: BarChart3 },
];

const metrics = [
  { label: "Open Quotes", value: "12", note: "$48.6k quoted this month", icon: FileText, trend: "+18%" },
  { label: "Active Jobs", value: "7", note: "3 due this week", icon: BriefcaseBusiness, trend: "On track" },
  { label: "Material Orders", value: "5", note: "2 awaiting supplier confirmation", icon: PackageCheck, trend: "Review" },
  { label: "Invoices", value: "9", note: "$21.4k pending", icon: BarChart3, trend: "4 sent" },
];

const contacts = [
  { company: "Willis Engineering", kind: "Customer", person: "Anne Willis", phone: "08 9244 1180", status: "Active" },
  { company: "Laser Metals WA", kind: "Supplier", person: "Darren Ng", phone: "08 9300 7782", status: "Preferred" },
  { company: "Northline Transport", kind: "Transport", person: "Dispatch", phone: "13 13 31", status: "Active" },
  { company: "Bayside Fabrication", kind: "Customer", person: "Matt Cooper", phone: "08 9455 3344", status: "Follow up" },
];

const quotes = [
  { quote: "400120", client: "Willis Engineering", status: "Draft", lines: 8, total: 4814.35, margin: "34%" },
  { quote: "400121", client: "Bayside Fabrication", status: "Sent", lines: 5, total: 2240.1, margin: "29%" },
  { quote: "400122", client: "Henderson Marine", status: "Approved", lines: 14, total: 9133.8, margin: "37%" },
  { quote: "400123", client: "Perth Access", status: "Review", lines: 3, total: 1184.5, margin: "25%" },
];

const quoteLines = [
  { part: "PLATE 220 x 100 WITH HOLES TO EMAIL", material: "M/S", thickness: "16 mm", qty: 16, cut: 5.21, pierce: 0.2, total: 187.52 },
  { part: "PLATE 500 x 500 TO EMAIL", material: "M/S", thickness: "10 mm", qty: 4, cut: 9, pierce: 0, total: 184.08 },
  { part: "RECTANGLE 240 x 100", material: "M/S", thickness: "10 mm", qty: 32, cut: 3.06, pierce: 0, total: 234.56 },
  { part: "BRACKET SLOTTED 180 x 90", material: "AL", thickness: "6 mm", qty: 20, cut: 2.48, pierce: 0.12, total: 168.4 },
];

const jobs = [
  { job: "J-2418", quote: "400122", client: "Henderson Marine", status: "Cutting", due: "Today", value: 9133.8 },
  { job: "J-2419", quote: "400117", client: "WA Lift", status: "Programming", due: "Tomorrow", value: 3170.25 },
  { job: "J-2420", quote: "400115", client: "Perth Access", status: "Ready to invoice", due: "Jun 28", value: 1640 },
];

const materials = [
  { name: "Mild Steel", thickness: "10 mm", size: "2400 x 1200", rate: "$2.60 / min", stock: "8 sheets" },
  { name: "Mild Steel", thickness: "16 mm", size: "3000 x 1500", rate: "$3.85 / min", stock: "3 sheets" },
  { name: "Aluminium", thickness: "6 mm", size: "2400 x 1200", rate: "$2.10 / min", stock: "5 sheets" },
  { name: "Stainless", thickness: "3 mm", size: "2400 x 1200", rate: "$2.95 / min", stock: "Low" },
];

const purchaseOrders = [
  { po: "PO-1186", supplier: "Laser Metals WA", status: "Sent", items: "MS 16 mm x 3", value: 1560 },
  { po: "PO-1187", supplier: "Metalwest", status: "Draft", items: "SS 3 mm x 6", value: 2315 },
  { po: "PO-1188", supplier: "Northline Transport", status: "Booked", items: "Delivery", value: 185 },
];

const invoices = [
  { invoice: "INV-5034", client: "Willis Engineering", status: "Draft", total: 4814.35, myob: "Not synced" },
  { invoice: "INV-5035", client: "Perth Access", status: "Sent", total: 1640, myob: "MYOB-9812" },
  { invoice: "INV-5036", client: "WA Lift", status: "Paid", total: 3170.25, myob: "MYOB-9813" },
];

const currency = new Intl.NumberFormat("en-AU", {
  currency: "AUD",
  style: "currency",
});

export function App() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const currentModule = useMemo(
    () => modules.find((module) => module.id === activePage) ?? modules[0],
    [activePage],
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">MSF</div>
        <nav aria-label="Main navigation">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                aria-current={activePage === module.id ? "page" : undefined}
                className="nav-button"
                key={module.id}
                onClick={() => setActivePage(module.id)}
                title={module.title}
                type="button"
              >
                <Icon size={20} />
                <span>{module.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">MySwiftFab</p>
            <h1>{currentModule.title}</h1>
            <p className="page-description">{currentModule.description}</p>
          </div>
          <div className="topbar-actions">
            <div className={hasSupabaseConfig ? "status-dot online" : "status-dot"}>
              {hasSupabaseConfig ? "Supabase connected" : "Add Supabase env"}
            </div>
            <button className="icon-action" title="Settings" type="button">
              <Settings size={18} />
            </button>
          </div>
        </header>

        {activePage === "dashboard" && <DashboardPage />}
        {activePage === "contacts" && <ContactsPage />}
        {activePage === "quotes" && <QuotesPage />}
        {activePage === "jobs" && <JobsPage />}
        {activePage === "materials" && <MaterialsPage />}
        {activePage === "purchases" && <PurchasesPage />}
        {activePage === "invoices" && <InvoicesPage />}
      </section>
    </main>
  );
}

function DashboardPage() {
  return (
    <>
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
              <strong>{metric.trend}</strong>
            </article>
          );
        })}
      </section>

      <section className="content-grid">
        <QuoteWorkbench />
        <section className="activity-panel">
          <PanelHeading eyebrow="Today" title="Production Queue" actionLabel="New Job" />
          <div className="timeline">
            {jobs.map((job) => (
              <article className="timeline-item" key={job.job}>
                <span>{job.status}</span>
                <h3>{job.job} - {job.client}</h3>
                <p>{job.quote} due {job.due}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}

function ContactsPage() {
  return (
    <PagePanel eyebrow="CRM" title="Contact Directory" actionLabel="Add Contact">
      <Toolbar placeholder="Search company, person, or phone" />
      <DataTable
        columns={["Company", "Kind", "Primary person", "Phone", "Status"]}
        rows={contacts.map((contact) => [
          contact.company,
          contact.kind,
          contact.person,
          contact.phone,
          <Badge key={contact.company} label={contact.status} />,
        ])}
      />
    </PagePanel>
  );
}

function QuotesPage() {
  return (
    <section className="page-grid">
      <PagePanel eyebrow="Estimator" title="Quote Register" actionLabel="New Quote">
        <Toolbar placeholder="Search quote number or client" />
        <DataTable
          columns={["Quote", "Client", "Status", "Lines", "Total", "Margin"]}
          rows={quotes.map((quote) => [
            quote.quote,
            quote.client,
            <Badge key={quote.quote} label={quote.status} />,
            quote.lines,
            currency.format(quote.total),
            quote.margin,
          ])}
        />
      </PagePanel>
      <QuoteWorkbench compact />
    </section>
  );
}

function JobsPage() {
  return (
    <PagePanel eyebrow="Production" title="Job Board" actionLabel="Create Job">
      <div className="kanban">
        {["Programming", "Cutting", "Ready to invoice"].map((status) => (
          <article className="kanban-column" key={status}>
            <h2>{status}</h2>
            {jobs
              .filter((job) => job.status === status)
              .map((job) => (
                <div className="job-card" key={job.job}>
                  <strong>{job.job}</strong>
                  <span>{job.client}</span>
                  <p>{currency.format(job.value)} - due {job.due}</p>
                </div>
              ))}
          </article>
        ))}
      </div>
    </PagePanel>
  );
}

function MaterialsPage() {
  return (
    <PagePanel eyebrow="Library" title="Materials and Cutting Rates" actionLabel="Add Material">
      <Toolbar placeholder="Search material or thickness" />
      <DataTable
        columns={["Material", "Thickness", "Sheet size", "Cut rate", "Stock"]}
        rows={materials.map((material) => [
          material.name,
          material.thickness,
          material.size,
          material.rate,
          <Badge key={`${material.name}-${material.thickness}`} label={material.stock} />,
        ])}
      />
    </PagePanel>
  );
}

function PurchasesPage() {
  return (
    <PagePanel eyebrow="Procurement" title="Purchase Orders" actionLabel="New PO">
      <Toolbar placeholder="Search supplier or PO" />
      <DataTable
        columns={["PO", "Supplier", "Status", "Items", "Value"]}
        rows={purchaseOrders.map((order) => [
          order.po,
          order.supplier,
          <Badge key={order.po} label={order.status} />,
          order.items,
          currency.format(order.value),
        ])}
      />
    </PagePanel>
  );
}

function InvoicesPage() {
  return (
    <PagePanel eyebrow="Accounts" title="Invoices" actionLabel="Create Invoice">
      <Toolbar placeholder="Search invoice or client" />
      <DataTable
        columns={["Invoice", "Client", "Status", "Total", "MYOB"]}
        rows={invoices.map((invoice) => [
          invoice.invoice,
          invoice.client,
          <Badge key={invoice.invoice} label={invoice.status} />,
          currency.format(invoice.total),
          invoice.myob,
        ])}
      />
    </PagePanel>
  );
}

function QuoteWorkbench({ compact = false }: { compact?: boolean }) {
  return (
    <article className={compact ? "quote-panel compact" : "quote-panel"}>
      <PanelHeading eyebrow="Live estimate" title="Quote 400120" actionLabel="Add Line" />
      <div className="quote-summary">
        <div>
          <span>Client</span>
          <strong>Willis Engineering</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>Draft</strong>
        </div>
        <div>
          <span>Subtotal</span>
          <strong>{currency.format(4376.68)}</strong>
        </div>
        <div>
          <span>Total inc. GST</span>
          <strong>{currency.format(4814.35)}</strong>
        </div>
      </div>
      <DataTable
        columns={["Part", "Material", "Qty", "Cut", "Pierce", "Total"]}
        rows={quoteLines.map((line) => [
          <span className="stacked-cell" key={line.part}>
            <strong>{line.part}</strong>
            <small>{line.thickness}</small>
          </span>,
          line.material,
          line.qty,
          line.cut.toFixed(2),
          line.pierce.toFixed(2),
          currency.format(line.total),
        ])}
      />
    </article>
  );
}

function PagePanel({
  actionLabel,
  children,
  eyebrow,
  title,
}: {
  actionLabel: string;
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <article className="page-panel">
      <PanelHeading actionLabel={actionLabel} eyebrow={eyebrow} title={title} />
      {children}
    </article>
  );
}

function PanelHeading({
  actionLabel,
  eyebrow,
  title,
}: {
  actionLabel: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="panel-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <button className="primary-action" type="button">
        <Plus size={16} />
        <span>{actionLabel}</span>
      </button>
    </div>
  );
}

function Toolbar({ placeholder }: { placeholder: string }) {
  return (
    <div className="toolbar">
      <Search size={18} />
      <input aria-label={placeholder} placeholder={placeholder} type="search" />
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
