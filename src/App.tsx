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
  {
    id: "willis",
    company: "Willis Engineering",
    kind: "Customer",
    status: "Active",
    accountCode: "WILLIS",
    abn: "42 188 924 771",
    phone: "08 9244 1180",
    email: "quotes@willisengineering.com.au",
    website: "willisengineering.com.au",
    person: "Anne Willis",
    role: "Estimator",
    mobile: "0412 118 042",
    billingAddress: "18 Forge Street, Malaga WA 6090",
    deliveryAddress: "Gate 2, 18 Forge Street, Malaga WA 6090",
    terms: "30 days",
    creditLimit: "$25,000",
    priceLevel: "Trade",
    lastQuote: "400120",
    openQuotes: 3,
    totalQuoted: "$18,450",
    notes: "Prefers itemised quote lines with material thickness visible. Send drawings back with revision number.",
  },
  {
    id: "bayside",
    company: "Bayside Fabrication",
    kind: "Customer",
    status: "Follow up",
    accountCode: "BAYSIDE",
    abn: "71 624 118 093",
    phone: "08 9455 3344",
    email: "matt@baysidefab.com.au",
    website: "baysidefab.com.au",
    person: "Matt Cooper",
    role: "Owner",
    mobile: "0408 455 334",
    billingAddress: "Unit 4, 91 Kelvin Road, Maddington WA 6109",
    deliveryAddress: "Unit 4, 91 Kelvin Road, Maddington WA 6109",
    terms: "COD",
    creditLimit: "$5,000",
    priceLevel: "Standard",
    lastQuote: "400121",
    openQuotes: 1,
    totalQuoted: "$2,240",
    notes: "Usually supplies DXF files. Confirm pickup timing before converting quote to job.",
  },
  {
    id: "henderson",
    company: "Henderson Marine",
    kind: "Customer",
    status: "Active",
    accountCode: "HENDER",
    abn: "38 552 740 196",
    phone: "08 9437 8100",
    email: "projects@hendersonmarine.com.au",
    website: "hendersonmarine.com.au",
    person: "Priya Nair",
    role: "Project Coordinator",
    mobile: "0430 720 118",
    billingAddress: "22 Sparks Road, Henderson WA 6166",
    deliveryAddress: "Workshop 3, 22 Sparks Road, Henderson WA 6166",
    terms: "14 days",
    creditLimit: "$40,000",
    priceLevel: "Project",
    lastQuote: "400122",
    openQuotes: 2,
    totalQuoted: "$9,134",
    notes: "Marine jobs require stainless material certificates and delivery docket copies.",
  },
  {
    id: "laser-metals",
    company: "Laser Metals WA",
    kind: "Supplier",
    status: "Preferred",
    accountCode: "LMWA",
    abn: "66 514 300 902",
    phone: "08 9300 7782",
    email: "sales@lasermetalswa.com.au",
    website: "lasermetalswa.com.au",
    person: "Darren Ng",
    role: "Sales",
    mobile: "0417 300 778",
    billingAddress: "7 Capital Road, Wangara WA 6065",
    deliveryAddress: "7 Capital Road, Wangara WA 6065",
    terms: "30 days",
    creditLimit: "$60,000",
    priceLevel: "Supplier",
    lastQuote: "PO-1186",
    openQuotes: 0,
    totalQuoted: "$1,560",
    notes: "Primary source for mild steel sheet. Request eta confirmation before committing rush jobs.",
  },
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
  const customers = contacts.filter((contact) => contact.kind === "Customer");
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id ?? contacts[0].id);
  const selectedCustomer = contacts.find((contact) => contact.id === selectedCustomerId) ?? contacts[0];

  return (
    <section className="customer-workspace">
      <article className="customer-list-panel">
        <PanelHeading eyebrow="Customers" title="Customer List" actionLabel="Add Customer" />
        <Toolbar placeholder="Search customer, contact, or phone" />
        <div className="customer-list" aria-label="Customer list">
          {contacts.map((contact) => (
            <button
              aria-current={selectedCustomer.id === contact.id ? "true" : undefined}
              className="customer-list-item"
              key={contact.id}
              onClick={() => setSelectedCustomerId(contact.id)}
              type="button"
            >
              <span className="customer-name">{contact.company}</span>
              <span>{contact.person} - {contact.phone}</span>
              <span className="customer-row-meta">
                <Badge label={contact.kind} />
                <Badge label={contact.status} />
              </span>
            </button>
          ))}
        </div>
      </article>

      <article className="customer-detail-panel">
        <div className="customer-detail-header">
          <div>
            <p className="eyebrow">Customer Detail</p>
            <h2>{selectedCustomer.company}</h2>
            <p>{selectedCustomer.person} - {selectedCustomer.role}</p>
          </div>
          <div className="customer-actions">
            <button className="secondary-action" type="button">New Quote</button>
            <button className="primary-action" type="button">
              <Plus size={16} />
              <span>Save</span>
            </button>
          </div>
        </div>

        <div className="customer-stat-grid">
          <div>
            <span>Status</span>
            <strong>{selectedCustomer.status}</strong>
          </div>
          <div>
            <span>Open Quotes</span>
            <strong>{selectedCustomer.openQuotes}</strong>
          </div>
          <div>
            <span>Last Ref</span>
            <strong>{selectedCustomer.lastQuote}</strong>
          </div>
          <div>
            <span>Total Quoted</span>
            <strong>{selectedCustomer.totalQuoted}</strong>
          </div>
        </div>

        <form className="customer-form">
          <section>
            <h3>Company</h3>
            <div className="form-grid two">
              <Field label="Company name" value={selectedCustomer.company} />
              <Field label="Account code" value={selectedCustomer.accountCode} />
              <Field label="ABN" value={selectedCustomer.abn} />
              <Field label="Customer type" value={selectedCustomer.kind} />
              <Field label="Phone" value={selectedCustomer.phone} />
              <Field label="Email" value={selectedCustomer.email} />
              <Field label="Website" value={selectedCustomer.website} />
              <Field label="Status" value={selectedCustomer.status} />
            </div>
          </section>

          <section>
            <h3>Primary Contact</h3>
            <div className="form-grid three">
              <Field label="Name" value={selectedCustomer.person} />
              <Field label="Role" value={selectedCustomer.role} />
              <Field label="Mobile" value={selectedCustomer.mobile} />
            </div>
          </section>

          <section>
            <h3>Address</h3>
            <div className="form-grid two">
              <Field label="Billing address" rows={3} value={selectedCustomer.billingAddress} />
              <Field label="Delivery address" rows={3} value={selectedCustomer.deliveryAddress} />
            </div>
          </section>

          <section>
            <h3>Accounts and Pricing</h3>
            <div className="form-grid three">
              <Field label="Payment terms" value={selectedCustomer.terms} />
              <Field label="Credit limit" value={selectedCustomer.creditLimit} />
              <Field label="Price level" value={selectedCustomer.priceLevel} />
            </div>
          </section>

          <section>
            <h3>Notes</h3>
            <Field label="Internal notes" rows={4} value={selectedCustomer.notes} />
          </section>
        </form>
      </article>
    </section>
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

function Field({ label, rows, value }: { label: string; rows?: number; value: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {rows ? (
        <textarea defaultValue={value} key={`${label}-${value}`} rows={rows} />
      ) : (
        <input defaultValue={value} key={`${label}-${value}`} />
      )}
    </label>
  );
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
