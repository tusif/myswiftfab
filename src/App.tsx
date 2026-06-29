import { useEffect, useMemo, useState } from "react";
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
  Trash2,
  Users,
} from "lucide-react";
import { hasSupabaseConfig } from "./lib/supabase";
import { materialRates, type MaterialRate } from "./materialRates";

type PageId = "dashboard" | "contacts" | "quotes" | "jobs" | "materials" | "purchases" | "invoices" | "settings";

type Module = {
  id: PageId;
  title: string;
  description: string;
  icon: typeof Gauge;
};

type Contact = {
  id: string;
  company: string;
  kind: string;
  status: string;
  accountCode: string;
  abn: string;
  phone: string;
  email: string;
  website: string;
  person: string;
  role: string;
  mobile: string;
  billingAddress: string;
  deliveryAddress: string;
  terms: string;
  creditLimit: string;
  priceLevel: string;
  lastQuote: string;
  openQuotes: number;
  totalQuoted: string;
  notes: string;
  notesHistory: ContactNote[];
  staff: StaffMember[];
  deliveryAddresses: DeliveryAddress[];
};

type ContactNote = {
  id: string;
  createdAt: string;
  author: string;
  text: string;
};

type ContactTypeOption = {
  id: string;
  label: string;
};

type StaffMember = {
  id: string;
  title: string;
  name: string;
  jobTitle: string;
  direct: string;
  mobile: string;
  email: string;
};

type DeliveryAddress = {
  id: string;
  label: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  instructions: string;
};

type QuoteRecord = {
  quote: string;
  client: string;
  contact: string;
  status: string;
  lines: number;
  total: number;
  margin: string;
  date?: string;
  material?: number;
  delivery?: number;
};

type OtherLineItem = {
  id: string;
  category: string;
  description: string;
  qty: number;
  cost: number;
  markupPct: number;
  supplier: string;
  staff: string;
  ref: string;
};

type QuoteLine = {
  part: string;
  materialType?: string;
  material: string;
  thickness: string;
  feed?: number | null;
  cutRate?: number | null;
  costPerM2?: number | null;
  piercingRate?: number | null;
  qty: number;
  cut: number;
  pierce: number;
  total: number;
  predecessor?: string;
  side1?: number | null;
  side2?: number | null;
  od?: number | null;
  id?: number | null;
};

type QuoteLineDraft = {
  part: string;
  materialRateId: string;
  materialType: string;
  material: string;
  thickness: string;
  feed: string;
  costPerM2: string;
  qty: string;
  cut: string;
  pierce: string;
  predecessor: string;
  side1: string;
  side2: string;
  od: string;
  id: string;
};

type MaterialRateDraft = {
  type: string;
  material: string;
  thickness: string;
  feed: string;
  density: string;
  cutRate: string;
  costPerM2: string;
  piercingRate: string;
  piercingTime: string;
};

const modules: Module[] = [
  { id: "dashboard", title: "Dashboard", description: "Daily estimating and production view", icon: Gauge },
  { id: "contacts", title: "Contacts", description: "Clients, suppliers, transport, and people", icon: Users },
  { id: "quotes", title: "Quotes", description: "Laser cutting estimates and quote lines", icon: Calculator },
  { id: "jobs", title: "Jobs", description: "Approved work and production status", icon: ClipboardList },
  { id: "materials", title: "Materials", description: "Material library and cutting rates", icon: Factory },
  { id: "purchases", title: "Purchases", description: "Material orders and purchase orders", icon: ShoppingCart },
  { id: "invoices", title: "Invoices", description: "Accounts, GST totals, and MYOB references", icon: BarChart3 },
  { id: "settings", title: "Settings", description: "Integrations, API access, and account configuration", icon: Settings },
];

const metrics = [
  { label: "Open Quotes", value: "12", note: "$48.6k quoted this month", icon: FileText, trend: "+18%" },
  { label: "Active Jobs", value: "7", note: "3 due this week", icon: BriefcaseBusiness, trend: "On track" },
  { label: "Material Orders", value: "5", note: "2 awaiting supplier confirmation", icon: PackageCheck, trend: "Review" },
  { label: "Invoices", value: "9", note: "$21.4k pending", icon: BarChart3, trend: "4 sent" },
];

const defaultContactTypes: ContactTypeOption[] = [
  { id: "client", label: "Client" },
  { id: "contact", label: "Contact" },
  { id: "supplier", label: "Supplier" },
  { id: "subcontractor", label: "SubContractor" },
  { id: "transport", label: "Transport" },
];

const currentUserName = "Current User";

const contacts: Contact[] = [
  {
    id: "willis",
    company: "Willis Engineering",
    kind: "Client",
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
    notesHistory: [
      { id: "willis-note-1", createdAt: "2026-06-21T02:15:00.000Z", author: "Tusif Ahmad", text: "Anne asked for itemised material thickness on all quote lines." },
      { id: "willis-note-2", createdAt: "2026-06-24T05:40:00.000Z", author: "Tusif Ahmad", text: "Confirmed Gate 2 delivery is best for large profiles." },
    ],
    staff: [
      { id: "willis-staff-1", title: "Ms", name: "Anne Willis", jobTitle: "Estimator", direct: "08 9244 1180", mobile: "0412 118 042", email: "anne@willisengineering.com.au" },
      { id: "willis-staff-2", title: "Mr", name: "Mark Willis", jobTitle: "Workshop Manager", direct: "08 9244 1182", mobile: "0412 118 118", email: "mark@willisengineering.com.au" },
      { id: "willis-staff-3", title: "", name: "Accounts", jobTitle: "Accounts", direct: "08 9244 1185", mobile: "", email: "accounts@willisengineering.com.au" },
    ],
    deliveryAddresses: [
      { id: "willis-delivery-1", label: "Workshop", address: "Gate 2, 18 Forge Street", suburb: "Malaga", state: "WA", postcode: "6090", instructions: "Forklift available. Call before truck arrival." },
      { id: "willis-delivery-2", label: "Office", address: "18 Forge Street", suburb: "Malaga", state: "WA", postcode: "6090", instructions: "Small parcels and paperwork only." },
    ],
  },
  {
    id: "bayside",
    company: "Bayside Fabrication",
    kind: "Client",
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
    notesHistory: [
      { id: "bayside-note-1", createdAt: "2026-06-19T04:05:00.000Z", author: "Tusif Ahmad", text: "Matt prefers pickup once cutting is complete rather than delivery." },
    ],
    staff: [
      { id: "bayside-staff-1", title: "Mr", name: "Matt Cooper", jobTitle: "Owner", direct: "08 9455 3344", mobile: "0408 455 334", email: "matt@baysidefab.com.au" },
      { id: "bayside-staff-2", title: "", name: "Jenny Allen", jobTitle: "Accounts", direct: "08 9455 3345", mobile: "", email: "accounts@baysidefab.com.au" },
    ],
    deliveryAddresses: [
      { id: "bayside-delivery-1", label: "Factory", address: "Unit 4, 91 Kelvin Road", suburb: "Maddington", state: "WA", postcode: "6109", instructions: "Deliver during business hours." },
    ],
  },
  {
    id: "henderson",
    company: "Henderson Marine",
    kind: "Client",
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
    notesHistory: [
      { id: "henderson-note-1", createdAt: "2026-06-18T06:50:00.000Z", author: "Tusif Ahmad", text: "Project work needs stainless certificates attached to delivery documents." },
    ],
    staff: [
      { id: "henderson-staff-1", title: "Ms", name: "Priya Nair", jobTitle: "Project Coordinator", direct: "08 9437 8100", mobile: "0430 720 118", email: "priya@hendersonmarine.com.au" },
      { id: "henderson-staff-2", title: "Mr", name: "Graham Lee", jobTitle: "Procurement", direct: "08 9437 8120", mobile: "", email: "procurement@hendersonmarine.com.au" },
    ],
    deliveryAddresses: [
      { id: "henderson-delivery-1", label: "Workshop 3", address: "22 Sparks Road", suburb: "Henderson", state: "WA", postcode: "6166", instructions: "Use project gate and quote job reference." },
      { id: "henderson-delivery-2", label: "Stores", address: "Lot 6 Cockburn Road", suburb: "Henderson", state: "WA", postcode: "6166", instructions: "Material certificates required at delivery." },
    ],
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
    notesHistory: [
      { id: "laser-metals-note-1", createdAt: "2026-06-20T01:20:00.000Z", author: "Tusif Ahmad", text: "Ask Darren for ETA before accepting urgent mild steel jobs." },
    ],
    staff: [
      { id: "laser-metals-staff-1", title: "Mr", name: "Darren Ng", jobTitle: "Sales", direct: "08 9300 7782", mobile: "0417 300 778", email: "sales@lasermetalswa.com.au" },
    ],
    deliveryAddresses: [
      { id: "laser-metals-delivery-1", label: "Warehouse", address: "7 Capital Road", suburb: "Wangara", state: "WA", postcode: "6065", instructions: "Supplier pickup location." },
    ],
  },
];

function createBlankCustomer(): Contact {
  return {
    id: `new-${Date.now()}`,
    company: "New Customer",
    kind: "Client",
    status: "New",
    accountCode: "",
    abn: "",
    phone: "",
    email: "",
    website: "",
    person: "",
    role: "",
    mobile: "",
    billingAddress: "",
    deliveryAddress: "",
    terms: "30 days",
    creditLimit: "$0",
    priceLevel: "Standard",
    lastQuote: "None",
    openQuotes: 0,
    totalQuoted: "$0",
    notes: "",
    notesHistory: [],
    staff: [],
    deliveryAddresses: [],
  };
}

function createContactNote(text: string): ContactNote {
  return {
    id: `note-${Date.now()}`,
    createdAt: new Date().toISOString(),
    author: currentUserName,
    text: text.trim(),
  };
}

function formatContactNoteDate(createdAt: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt));
}

function createBlankStaffMember(): StaffMember {
  return {
    id: `staff-${Date.now()}`,
    title: "",
    name: "",
    jobTitle: "",
    direct: "",
    mobile: "",
    email: "",
  };
}

function createBlankDeliveryAddress(): DeliveryAddress {
  return {
    id: `delivery-${Date.now()}`,
    label: "",
    address: "",
    suburb: "",
    state: "WA",
    postcode: "",
    instructions: "",
  };
}

function splitContactTypes(kind: string) {
  return kind
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatMaterialValue(value: number | null, suffix = "") {
  if (value === null) return "";
  return `${value}${suffix}`;
}

function parseMaterialNumber(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const numberValue = Number(trimmedValue);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getMaterialRateLabel(rate: MaterialRate) {
  return `${rate.material} - ${formatMaterialValue(rate.thickness, " mm")} - ${rate.type}`;
}

function createMaterialRateDraft(rate?: MaterialRate): MaterialRateDraft {
  return {
    type: rate?.type ?? "",
    material: rate?.material ?? "",
    thickness: formatMaterialValue(rate?.thickness ?? null),
    feed: formatMaterialValue(rate?.feed ?? null),
    density: formatMaterialValue(rate?.density ?? null),
    cutRate: formatMaterialValue(rate?.cutRate ?? null),
    costPerM2: formatMaterialValue(rate?.costPerM2 ?? null),
    piercingRate: formatMaterialValue(rate?.piercingRate ?? null),
    piercingTime: formatMaterialValue(rate?.piercingTime ?? null),
  };
}

function createMaterialRateFromDraft(draft: MaterialRateDraft, existingRate?: MaterialRate): MaterialRate {
  return {
    id: existingRate?.id ?? `mat-custom-${Date.now()}`,
    type: draft.type.trim(),
    material: draft.material.trim(),
    thickness: parseMaterialNumber(draft.thickness),
    feed: parseMaterialNumber(draft.feed),
    density: parseMaterialNumber(draft.density),
    cutRate: parseMaterialNumber(draft.cutRate),
    costPerM2: parseMaterialNumber(draft.costPerM2),
    piercingRate: parseMaterialNumber(draft.piercingRate),
    piercingTime: parseMaterialNumber(draft.piercingTime),
  };
}

function createNewQuoteRecord(existingQuotes: QuoteRecord[], client: string, contact: string): QuoteRecord {
  const nextQuoteNumber =
    Math.max(400119, ...existingQuotes.map((quote) => Number(quote.quote)).filter(Number.isFinite)) + 1;

  return {
    quote: String(nextQuoteNumber),
    client,
    contact,
    status: "Draft",
    lines: 0,
    total: 0,
    margin: "0%",
  };
}

const PREDECESSOR_TYPES = ["Plate", "Rectangle", "Square", "Ring", "Flange", "Disc", "Rect Flange"];

function createBlankQuoteLineDraft(): QuoteLineDraft {
  const defaultMaterial = materialRates.find((rate) => rate.material === "M/S" && rate.thickness === 10) ?? materialRates[0];

  return {
    part: "",
    materialRateId: defaultMaterial.id,
    materialType: defaultMaterial.type,
    material: defaultMaterial.material,
    thickness: formatMaterialValue(defaultMaterial.thickness, " mm"),
    feed: formatMaterialValue(defaultMaterial.feed),
    costPerM2: formatMaterialValue(defaultMaterial.costPerM2),
    qty: "1",
    cut: formatMaterialValue(defaultMaterial.cutRate),
    pierce: formatMaterialValue(defaultMaterial.piercingRate),
    predecessor: "Plate",
    side1: "",
    side2: "",
    od: "",
    id: "",
  };
}

function createQuoteLineFromDraft(draft: QuoteLineDraft): QuoteLine {
  const qty = Number(draft.qty) || 0;
  const cut = Number(draft.cut) || 0;
  const pierce = Number(draft.pierce) || 0;

  return {
    part: draft.part.trim(),
    materialType: draft.materialType.trim(),
    material: draft.material.trim(),
    thickness: draft.thickness.trim(),
    feed: Number(draft.feed) || null,
    cutRate: cut,
    costPerM2: Number(draft.costPerM2) || null,
    piercingRate: pierce,
    qty,
    cut,
    pierce,
    total: qty * (cut + pierce),
    predecessor: draft.predecessor,
    side1: draft.side1 ? Number(draft.side1) : null,
    side2: draft.side2 ? Number(draft.side2) : null,
    od: draft.od ? Number(draft.od) : null,
    id: draft.id ? Number(draft.id) : null,
  };
}

type HoleRowForDesc = { holeType: string; qty: string; dia: string; side1: string; side2: string; holeDesc: string; };

function calcPartDescription(line: QuoteLineDraft, holeRows: HoleRowForDesc[]): string {
  const pred = line.predecessor;
  const s1 = line.side1 ? Number(line.side1) : 0;
  const s2 = line.side2 ? Number(line.side2) : 0;
  const od = line.od ? Number(line.od) : 0;
  const id = line.id ? Number(line.id) : 0;

  const holeDesc = holeRows.map((h) => {
    const qty = h.qty ? `${h.qty} x ` : "";
    if (h.holeDesc) return h.holeDesc.toUpperCase();
    if (h.holeType === "Laser Cut Holes") return `${qty}Ø${h.dia} LASER CUT HOLES`;
    if (h.holeType === "Drilled Holes") return `${qty}Ø${h.dia} DRILLED HOLES`;
    if (h.holeType === "Slots") return `${qty}SLOTS`;
    return "";
  }).filter(Boolean).join(", ");

  const withHoles = holeRows.length > 0 ? ` WITH ${holeDesc || "HOLES"}` : "";

  if (pred === "Plate") return `PLATE ${s1} x ${s2}${withHoles} TO EMAIL`;
  if (pred === "Rectangle") return `RECTANGLE ${s1} x ${s2}`;
  if (pred === "Square") return `SQUARE ${s1} x ${s1}`;
  if (pred === "Ring") return `RING OD ${od} ID ${id}`;
  if (pred === "Flange") return `FLANGE OD ${od} ID ${id}`;
  if (pred === "Disc") return `DISC OD ${od}`;
  if (pred === "Rect Flange") return `RECT FLANGE ${s1} x ${s2} OD ${od} ID ${id}`;
  return "";
}

function calculateQuoteTotal(lines: QuoteLine[]) {
  return lines.reduce((total, line) => total + line.total, 0);
}

const quotes: QuoteRecord[] = [
  { quote: "400120", client: "Willis Engineering", contact: "Anne Willis", status: "Draft", lines: 8, total: 4814.35, margin: "34%", date: "1/3/2026", material: 1240.00, delivery: 0 },
  { quote: "400121", client: "Bayside Fabrication", contact: "Matt Cooper", status: "Sent", lines: 5, total: 2240.10, margin: "29%", date: "1/3/2026", material: 680.50, delivery: 55.00 },
  { quote: "400122", client: "Henderson Marine", contact: "Priya Nair", status: "Approved", lines: 14, total: 9133.80, margin: "37%", date: "4/1/2026", material: 3210.00, delivery: 0 },
  { quote: "400123", client: "Perth Access", contact: "Site contact", status: "Review", lines: 3, total: 1184.50, margin: "25%", date: "2/2/2026", material: 457.29, delivery: 0 },
];

const quoteLines: QuoteLine[] = [
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
  const [contactTypes, setContactTypes] = useState<ContactTypeOption[]>(defaultContactTypes);
  const currentModule = useMemo(
    () => modules.find((module) => module.id === activePage) ?? modules[0],
    [activePage],
  );

  return (
    <main className="app-shell">
      <header className="topnav">
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
                <Icon size={22} />
                <span>{module.title}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <section className="workspace">
        {activePage === "dashboard" && <DashboardPage />}
        {activePage === "contacts" && <ContactsPage contactTypes={contactTypes} />}
        {activePage === "quotes" && <QuotesPage />}
        {activePage === "jobs" && <JobsPage />}
        {activePage === "materials" && <MaterialsPage />}
        {activePage === "purchases" && <PurchasesPage />}
        {activePage === "invoices" && <InvoicesPage />}
        {activePage === "settings" && <SettingsPage contactTypes={contactTypes} onContactTypesChange={setContactTypes} />}
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

function ContactsPage({ contactTypes }: { contactTypes: ContactTypeOption[] }) {
  const [contactRecords, setContactRecords] = useState<Contact[]>(contacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Contact>(contacts[0]);
  const [customerDetailTab, setCustomerDetailTab] = useState<"details" | "staff" | "delivery" | "notes">("details");
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredContacts = contactRecords.filter((contact) =>
    [
      contact.company,
      contact.person,
      contact.phone,
      contact.email,
      contact.kind,
      contact.status,
      contact.accountCode,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch),
  );

  const updateSelectedCustomer = (field: keyof Contact, value: string) => {
    setSelectedCustomer((current) => ({
      ...current,
      [field]: field === "openQuotes" ? Number(value) || 0 : value,
    }));
  };

  const updateSelectedContactType = (typeLabel: string, checked: boolean) => {
    setSelectedCustomer((current) => {
      const selectedTypes = splitContactTypes(current.kind);
      const nextTypes = checked
        ? [...selectedTypes, typeLabel]
        : selectedTypes.filter((selectedType) => selectedType !== typeLabel);

      return {
        ...current,
        kind: Array.from(new Set(nextTypes)).join(", "),
      };
    });
  };

  const updateStaffMember = (staffId: string, field: keyof StaffMember, value: string) => {
    setSelectedCustomer((current) => ({
      ...current,
      staff: current.staff.map((staffMember) =>
        staffMember.id === staffId ? { ...staffMember, [field]: value } : staffMember,
      ),
    }));
  };

  const addStaffMember = () => {
    setSelectedCustomer((current) => ({
      ...current,
      staff: [...current.staff, createBlankStaffMember()],
    }));
    setCustomerDetailTab("staff");
  };

  const removeStaffMember = (staffId: string) => {
    setSelectedCustomer((current) => ({
      ...current,
      staff: current.staff.filter((staffMember) => staffMember.id !== staffId),
    }));
  };

  const updateDeliveryAddress = (addressId: string, field: keyof DeliveryAddress, value: string) => {
    setSelectedCustomer((current) => ({
      ...current,
      deliveryAddresses: current.deliveryAddresses.map((address) =>
        address.id === addressId ? { ...address, [field]: value } : address,
      ),
    }));
  };

  const addDeliveryAddress = () => {
    setSelectedCustomer((current) => ({
      ...current,
      deliveryAddresses: [...current.deliveryAddresses, createBlankDeliveryAddress()],
    }));
    setCustomerDetailTab("delivery");
  };

  const removeDeliveryAddress = (addressId: string) => {
    setSelectedCustomer((current) => ({
      ...current,
      deliveryAddresses: current.deliveryAddresses.filter((address) => address.id !== addressId),
    }));
  };

  const addContactNote = () => {
    const note = createContactNote(newNoteText);

    if (!note.text) {
      return;
    }

    const nextCustomer = {
      ...selectedCustomer,
      notesHistory: [note, ...selectedCustomer.notesHistory],
    };

    setSelectedCustomer(nextCustomer);
    setContactRecords((current) =>
      current.map((contact) => (contact.id === nextCustomer.id ? nextCustomer : contact)),
    );
    setNewNoteText("");
    setCustomerDetailTab("notes");
  };

  const removeContactNote = (noteId: string) => {
    const nextCustomer = {
      ...selectedCustomer,
      notesHistory: selectedCustomer.notesHistory.filter((note) => note.id !== noteId),
    };

    setSelectedCustomer(nextCustomer);
    setContactRecords((current) =>
      current.map((contact) => (contact.id === nextCustomer.id ? nextCustomer : contact)),
    );
  };

  const selectCustomer = (contact: Contact) => {
    setSelectedCustomer(contact);
    setNewNoteText("");
    setCustomerDetailTab("details");
  };

  const addCustomer = () => {
    const blankCustomer = createBlankCustomer();
    setSelectedCustomer(blankCustomer);
    setNewNoteText("");
    setSearchQuery("");
    setCustomerDetailTab("details");
  };

  const saveCustomer = () => {
    setContactRecords((current) => {
      const existingIndex = current.findIndex((contact) => contact.id === selectedCustomer.id);
      if (existingIndex === -1) {
        return [selectedCustomer, ...current];
      }

      return current.map((contact) => (contact.id === selectedCustomer.id ? selectedCustomer : contact));
    });
  };

  return (
    <section className="customer-workspace">
      <article className="customer-list-panel">
        <PanelHeading
          actionLabel="Add Customer"
          eyebrow="Customers"
          onAction={addCustomer}
          title="Customer List"
        />
        <Toolbar
          onChange={setSearchQuery}
          placeholder="Search customer, contact, or phone"
          value={searchQuery}
        />
        <div className="customer-list" aria-label="Customer list">
          {filteredContacts.map((contact) => (
            <button
              aria-current={selectedCustomer.id === contact.id ? "true" : undefined}
              className="customer-list-item"
              key={contact.id}
              onClick={() => selectCustomer(contact)}
              type="button"
            >
              <span className="customer-name">{contact.company}</span>
              <span>{contact.person} - {contact.phone}</span>
              <span className="customer-row-meta">
                {splitContactTypes(contact.kind).map((contactType) => (
                  <Badge key={contactType} label={contactType} />
                ))}
                <Badge label={contact.status} />
              </span>
            </button>
          ))}
          {filteredContacts.length === 0 && (
            <div className="empty-state">
              <strong>No customers found</strong>
              <span>Try a different company, contact, phone, or account code.</span>
            </div>
          )}
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
            <button className="primary-action" onClick={saveCustomer} type="button">
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

        <div className="detail-tabs" role="tablist" aria-label="Customer detail sections">
          <button
            aria-selected={customerDetailTab === "details"}
            onClick={() => setCustomerDetailTab("details")}
            type="button"
          >
            Details
          </button>
          <button
            aria-selected={customerDetailTab === "staff"}
            onClick={() => setCustomerDetailTab("staff")}
            type="button"
          >
            Staff ({selectedCustomer.staff.length})
          </button>
          <button
            aria-selected={customerDetailTab === "delivery"}
            onClick={() => setCustomerDetailTab("delivery")}
            type="button"
          >
            Delivery ({selectedCustomer.deliveryAddresses.length})
          </button>
          <button
            aria-selected={customerDetailTab === "notes"}
            onClick={() => setCustomerDetailTab("notes")}
            type="button"
          >
            Notes ({selectedCustomer.notesHistory.length})
          </button>
        </div>

        {customerDetailTab === "details" && (
          <form className="customer-form">
            <section>
              <h3>Company</h3>
              <div className="form-grid two">
                <Field fieldId="company" label="Company name" onChange={(value) => updateSelectedCustomer("company", value)} value={selectedCustomer.company} />
              <Field fieldId="accountCode" label="Account code" onChange={(value) => updateSelectedCustomer("accountCode", value)} value={selectedCustomer.accountCode} />
              <Field fieldId="abn" label="ABN" onChange={(value) => updateSelectedCustomer("abn", value)} value={selectedCustomer.abn} />
              <Field fieldId="phone" label="Phone" onChange={(value) => updateSelectedCustomer("phone", value)} value={selectedCustomer.phone} />
              <Field fieldId="email" label="Email" onChange={(value) => updateSelectedCustomer("email", value)} value={selectedCustomer.email} />
              <Field fieldId="website" label="Website" onChange={(value) => updateSelectedCustomer("website", value)} value={selectedCustomer.website} />
              <Field fieldId="status" label="Status" onChange={(value) => updateSelectedCustomer("status", value)} value={selectedCustomer.status} />
            </div>
              <ContactTypeCheckboxes
                contactTypes={contactTypes}
                selectedTypes={splitContactTypes(selectedCustomer.kind)}
                onChange={updateSelectedContactType}
              />
          </section>

            <section>
              <h3>Primary Contact</h3>
              <div className="form-grid three">
                <Field fieldId="person" label="Name" onChange={(value) => updateSelectedCustomer("person", value)} value={selectedCustomer.person} />
                <Field fieldId="role" label="Role" onChange={(value) => updateSelectedCustomer("role", value)} value={selectedCustomer.role} />
                <Field fieldId="mobile" label="Mobile" onChange={(value) => updateSelectedCustomer("mobile", value)} value={selectedCustomer.mobile} />
              </div>
            </section>

            <section>
              <h3>Address</h3>
              <div className="form-grid two">
                <Field fieldId="billingAddress" label="Billing address" onChange={(value) => updateSelectedCustomer("billingAddress", value)} rows={3} value={selectedCustomer.billingAddress} />
                <Field fieldId="deliveryAddress" label="Default delivery address" onChange={(value) => updateSelectedCustomer("deliveryAddress", value)} rows={3} value={selectedCustomer.deliveryAddress} />
              </div>
            </section>

            <section>
              <h3>Accounts and Pricing</h3>
              <div className="form-grid three">
                <Field fieldId="terms" label="Payment terms" onChange={(value) => updateSelectedCustomer("terms", value)} value={selectedCustomer.terms} />
                <Field fieldId="creditLimit" label="Credit limit" onChange={(value) => updateSelectedCustomer("creditLimit", value)} value={selectedCustomer.creditLimit} />
                <Field fieldId="priceLevel" label="Price level" onChange={(value) => updateSelectedCustomer("priceLevel", value)} value={selectedCustomer.priceLevel} />
              </div>
            </section>

            <section>
              <h3>Notes</h3>
              <Field fieldId="notes" label="Internal notes" onChange={(value) => updateSelectedCustomer("notes", value)} rows={4} value={selectedCustomer.notes} />
            </section>
          </form>
        )}

        {customerDetailTab === "staff" && (
          <EditableStaffTable
            onAdd={addStaffMember}
            onRemove={removeStaffMember}
            onUpdate={updateStaffMember}
            staff={selectedCustomer.staff}
          />
        )}

        {customerDetailTab === "delivery" && (
          <EditableDeliveryTable
            addresses={selectedCustomer.deliveryAddresses}
            onAdd={addDeliveryAddress}
            onRemove={removeDeliveryAddress}
            onUpdate={updateDeliveryAddress}
          />
        )}

        {customerDetailTab === "notes" && (
          <ContactNotesPanel
            newNoteText={newNoteText}
            notes={selectedCustomer.notesHistory}
            onAdd={addContactNote}
            onChange={setNewNoteText}
            onRemove={removeContactNote}
          />
        )}
      </article>
    </section>
  );
}

const LS_QUOTES = "msf_quotes";
const LS_LINES = "msf_quote_lines";
const LS_OTHERS = "msf_quote_others";

function loadFromLS<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function QuotesPage() {
  const [view, setView] = useState<"list" | "form">("list");
  const [quoteRecords, setQuoteRecords] = useState<QuoteRecord[]>(() => loadFromLS(LS_QUOTES, quotes));
  const [currentQuote, setCurrentQuote] = useState<QuoteRecord>(() => { const saved = loadFromLS<QuoteRecord[]>(LS_QUOTES, quotes); return saved[0] ?? quotes[0]; });
  const [quoteLineRecords, setQuoteLineRecords] = useState<Record<string, QuoteLine[]>>(() =>
    loadFromLS(LS_LINES, { [quotes[0].quote]: quoteLines })
  );
  const [quoteSearchQuery, setQuoteSearchQuery] = useState("");
  const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [selectedQuoteClient, setSelectedQuoteClient] = useState<Contact | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const normalizedQuoteSearch = quoteSearchQuery.trim().toLowerCase();
  const normalizedClientSearch = clientSearchQuery.trim().toLowerCase();
  const normalizedStaffSearch = staffSearchQuery.trim().toLowerCase();
  const clientContacts = contacts.filter((contact) => splitContactTypes(contact.kind).includes("Client"));
  const filteredClientContacts = clientContacts.filter((contact) =>
    [
      contact.company,
      contact.person,
      contact.phone,
      contact.email,
      contact.accountCode,
      contact.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedClientSearch),
  );
  const filteredStaffMembers = (selectedQuoteClient?.staff ?? []).filter((staffMember) =>
    [
      staffMember.name,
      staffMember.jobTitle,
      staffMember.direct,
      staffMember.mobile,
      staffMember.email,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedStaffSearch),
  );
  const filteredQuoteRecords = quoteRecords.filter((quote) =>
    [
      quote.quote,
      quote.client,
      quote.contact,
      quote.status,
      quote.lines,
      currency.format(quote.total),
      quote.margin,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuoteSearch),
  );

  const openNewQuoteClientPicker = () => {
    setIsClientPickerOpen(true);
    setClientSearchQuery("");
    setSelectedQuoteClient(null);
    setStaffSearchQuery("");
  };

  const chooseQuoteClient = (client: Contact) => {
    setSelectedQuoteClient(client);
    setStaffSearchQuery("");
  };

  const closeNewQuotePicker = () => {
    setIsClientPickerOpen(false);
    setSelectedQuoteClient(null);
    setClientSearchQuery("");
    setStaffSearchQuery("");
  };

  const startNewQuote = (client: Contact, staffMember: StaffMember) => {
    const newQuote = createNewQuoteRecord(quoteRecords, client.company, staffMember.name);
    setQuoteRecords([newQuote, ...quoteRecords]);
    setQuoteLineRecords((currentLines) => ({
      ...currentLines,
      [newQuote.quote]: [],
    }));
    setCurrentQuote(newQuote);
    setQuoteSearchQuery("");
    closeNewQuotePicker();
    setView("form");
  };

  const openQuote = (quote: QuoteRecord) => {
    setCurrentQuote(quote);
    setView("form");
  };

  const addQuoteLine = (line: QuoteLine) => {
    const existingLines = quoteLineRecords[currentQuote.quote] ?? [];
    const nextLines = [...existingLines, line];
    const nextTotal = calculateQuoteTotal(nextLines);
    const nextQuote = {
      ...currentQuote,
      lines: nextLines.length,
      total: nextTotal,
      margin: nextTotal > 0 ? "30%" : "0%",
    };

    setQuoteLineRecords({
      ...quoteLineRecords,
      [currentQuote.quote]: nextLines,
    });
    setCurrentQuote(nextQuote);
    setQuoteRecords((currentQuotes) =>
      currentQuotes.map((quote) => (quote.quote === nextQuote.quote ? nextQuote : quote)),
    );
  };

  const updateQuoteLine = (index: number, line: QuoteLine) => {
    const existingLines = quoteLineRecords[currentQuote.quote] ?? [];
    const nextLines = existingLines.map((l, i) => i === index ? line : l);
    const nextTotal = calculateQuoteTotal(nextLines);
    const nextQuote = { ...currentQuote, total: nextTotal, margin: nextTotal > 0 ? "30%" : "0%" };
    setQuoteLineRecords({ ...quoteLineRecords, [currentQuote.quote]: nextLines });
    setCurrentQuote(nextQuote);
    setQuoteRecords((qs) => qs.map((q) => (q.quote === nextQuote.quote ? nextQuote : q)));
  };

  const saveQuote = (lineOthers: Record<number, OtherLineItem[]>) => {
    localStorage.setItem(LS_QUOTES, JSON.stringify(quoteRecords));
    localStorage.setItem(LS_LINES, JSON.stringify(quoteLineRecords));
    localStorage.setItem(LS_OTHERS + "_" + currentQuote.quote, JSON.stringify(lineOthers));
  };

  if (view === "form") {
    return (
      <QuoteWorkbench
        lines={quoteLineRecords[currentQuote.quote] ?? []}
        onAddLine={addQuoteLine}
        onUpdateLine={updateQuoteLine}
        quote={currentQuote}
        onBack={() => setView("list")}
        onNewQuote={openNewQuoteClientPicker}
        onSave={saveQuote}
        savedOthers={loadFromLS(LS_OTHERS + "_" + currentQuote.quote, {})}
      />
    );
  }

  return (
    <PagePanel eyebrow="Estimator" title="Quote Register" actionLabel="">
      <Toolbar
        onChange={setQuoteSearchQuery}
        placeholder="Search quote number or client"
        value={quoteSearchQuery}
      />
      {isClientPickerOpen && !selectedQuoteClient && (
        <section className="quote-client-picker" aria-label="Choose client for new quote">
          <div className="quote-client-picker-heading">
            <div>
              <p className="eyebrow">New Quote</p>
              <h3>Choose Client</h3>
            </div>
            <button className="secondary-action" onClick={closeNewQuotePicker} type="button">
              Cancel
            </button>
          </div>
          <Toolbar
            onChange={setClientSearchQuery}
            placeholder="Search clients"
            value={clientSearchQuery}
          />
          <div className="client-picker-list">
            {filteredClientContacts.map((contact) => (
              <button
                className="client-picker-item"
                key={contact.id}
                onClick={() => chooseQuoteClient(contact)}
                type="button"
              >
                <span>
                  <strong>{contact.company}</strong>
                  <small>{contact.person} - {contact.phone}</small>
                </span>
                <Badge label={contact.status} />
              </button>
            ))}
            {filteredClientContacts.length === 0 && (
              <div className="empty-state">
                <strong>No clients found</strong>
                <span>Try a different client name, contact, phone, or account code.</span>
              </div>
            )}
          </div>
        </section>
      )}
      {isClientPickerOpen && selectedQuoteClient && (
        <section className="quote-client-picker" aria-label="Choose staff for new quote">
          <div className="quote-client-picker-heading">
            <div>
              <p className="eyebrow">New Quote</p>
              <h3>Choose Staff</h3>
            </div>
            <div className="quote-picker-actions">
              <button className="secondary-action" onClick={() => setSelectedQuoteClient(null)} type="button">
                Back
              </button>
              <button className="secondary-action" onClick={closeNewQuotePicker} type="button">
                Cancel
              </button>
            </div>
          </div>
          <div className="selected-client-strip">
            <span>Client</span>
            <strong>{selectedQuoteClient.company}</strong>
          </div>
          <Toolbar
            onChange={setStaffSearchQuery}
            placeholder="Search staff"
            value={staffSearchQuery}
          />
          <div className="client-picker-list">
            {filteredStaffMembers.map((staffMember) => (
              <button
                className="client-picker-item"
                key={staffMember.id}
                onClick={() => startNewQuote(selectedQuoteClient, staffMember)}
                type="button"
              >
                <span>
                  <strong>{staffMember.name || "Unnamed staff member"}</strong>
                  <small>{staffMember.jobTitle || "Staff"} - {staffMember.email || staffMember.mobile || staffMember.direct || "No contact detail"}</small>
                </span>
                <Badge label={staffMember.title || "Staff"} />
              </button>
            ))}
            {filteredStaffMembers.length === 0 && (
              <div className="empty-state">
                <strong>No staff found</strong>
                <span>Try a different staff name, job title, phone, or email.</span>
              </div>
            )}
          </div>
        </section>
      )}
      <DataTable
        columns={["Quote", "Date", "Company", "Staff", "Lines", "Material", "Subtotal", "Delivery", "Total Del. Inc.", "GST", "Total GST Inc.", "Status"]}
        compact
        onRowClick={(index) => openQuote(filteredQuoteRecords[index])}
        rows={filteredQuoteRecords.map((quote) => {
          const subtotal = quote.total / 1.1;
          const gst = quote.total - subtotal;
          const delivery = quote.delivery ?? 0;
          const totalDelInc = subtotal + delivery;
          const totalGstInc = totalDelInc * 1.1;
          return [
            quote.quote,
            quote.date ?? "—",
            quote.client,
            quote.contact,
            quote.lines,
            currency.format(quote.material ?? 0),
            currency.format(subtotal),
            delivery ? currency.format(delivery) : "",
            currency.format(totalDelInc),
            currency.format(totalDelInc * 0.1),
            currency.format(totalGstInc),
            <Badge key={quote.quote} label={quote.status} />,
          ];
        })}
      />
    </PagePanel>
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
  const [materialRecords, setMaterialRecords] = useState<MaterialRate[]>(materialRates);
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const [selectedMaterialGroupKey, setSelectedMaterialGroupKey] = useState("ALUMINIUM::ALI 5005");
  const [selectedMaterialRateId, setSelectedMaterialRateId] = useState<string | null>(null);
  const [materialEditorMode, setMaterialEditorMode] = useState<"add" | "edit" | null>(null);
  const [materialDraft, setMaterialDraft] = useState<MaterialRateDraft>(createMaterialRateDraft);
  const [materialTypeEditorMode, setMaterialTypeEditorMode] = useState<"add" | "edit" | null>(null);
  const [materialTypeDraft, setMaterialTypeDraft] = useState("");
  const normalizedMaterialSearch = materialSearchQuery.trim().toLowerCase();
  const materialGroups = Array.from(
    materialRecords
      .reduce((groupMap, rate) => {
        const key = `${rate.type}::${rate.material}`;
        const existingGroup = groupMap.get(key);
        if (existingGroup) {
          existingGroup.lines.push(rate);
        } else {
          groupMap.set(key, { key, material: rate.material, lines: [rate], type: rate.type });
        }

        return groupMap;
      }, new Map<string, { key: string; material: string; lines: MaterialRate[]; type: string }>())
      .values(),
  )
    .map((group) => ({
      ...group,
      lines: [...group.lines].sort((first, second) => (first.thickness ?? 9999) - (second.thickness ?? 9999)),
    }))
    .sort((first, second) => first.type.localeCompare(second.type) || first.material.localeCompare(second.material));
  const filteredMaterialGroups = materialGroups.filter((group) =>
    [
      group.type,
      group.material,
      group.lines.length,
      ...group.lines.flatMap((line) => [line.thickness, line.feed, line.cutRate, line.costPerM2, line.piercingRate]),
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedMaterialSearch),
  );
  const selectedMaterialGroup =
    filteredMaterialGroups.find((group) => group.key === selectedMaterialGroupKey) ??
    filteredMaterialGroups[0] ??
    materialGroups[0];
  const selectedMaterialRate = materialRecords.find((rate) => rate.id === selectedMaterialRateId) ?? null;
  const canSaveMaterial = Boolean(materialDraft.type.trim() && materialDraft.material.trim());
  const canSaveMaterialType = Boolean(materialTypeDraft.trim());

  const selectMaterialGroup = (groupKey: string) => {
    setSelectedMaterialGroupKey(groupKey);
    setSelectedMaterialRateId(null);
  };

  const openAddMaterial = () => {
    setMaterialDraft(createMaterialRateDraft(selectedMaterialGroup?.lines[0]));
    setMaterialEditorMode("add");
  };

  const openEditMaterial = () => {
    if (!selectedMaterialRate) return;

    setMaterialDraft(createMaterialRateDraft(selectedMaterialRate));
    setMaterialEditorMode("edit");
  };

  const closeMaterialEditor = () => {
    setMaterialEditorMode(null);
    setMaterialDraft(createMaterialRateDraft());
  };

  const updateMaterialDraft = (field: keyof MaterialRateDraft, value: string) => {
    setMaterialDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveMaterial = () => {
    if (!canSaveMaterial) return;

    if (materialEditorMode === "edit" && selectedMaterialRate) {
      const updatedRate = createMaterialRateFromDraft(materialDraft, selectedMaterialRate);
      setMaterialRecords((current) => current.map((rate) => (rate.id === updatedRate.id ? updatedRate : rate)));
      setSelectedMaterialGroupKey(`${updatedRate.type}::${updatedRate.material}`);
      setSelectedMaterialRateId(updatedRate.id);
      closeMaterialEditor();
      return;
    }

    const newRate = createMaterialRateFromDraft(materialDraft);
    setMaterialRecords((current) => [...current, newRate]);
    setSelectedMaterialGroupKey(`${newRate.type}::${newRate.material}`);
    setSelectedMaterialRateId(newRate.id);
    closeMaterialEditor();
  };

  const openAddMaterialType = () => {
    setMaterialTypeDraft("");
    setMaterialTypeEditorMode("add");
  };

  const openEditMaterialType = () => {
    if (!selectedMaterialGroup) return;

    setMaterialTypeDraft(selectedMaterialGroup.type);
    setMaterialTypeEditorMode("edit");
  };

  const closeMaterialTypeEditor = () => {
    setMaterialTypeDraft("");
    setMaterialTypeEditorMode(null);
  };

  const saveMaterialType = () => {
    const nextType = materialTypeDraft.trim();
    if (!nextType) return;

    if (materialTypeEditorMode === "edit" && selectedMaterialGroup) {
      setMaterialRecords((current) =>
        current.map((rate) => (rate.type === selectedMaterialGroup.type ? { ...rate, type: nextType } : rate)),
      );
      setSelectedMaterialGroupKey(`${nextType}::${selectedMaterialGroup.material}`);
      closeMaterialTypeEditor();
      return;
    }

    setMaterialDraft({
      ...createMaterialRateDraft(),
      type: nextType,
    });
    setMaterialEditorMode("add");
    closeMaterialTypeEditor();
  };

  return (
    <PagePanel eyebrow="Library" title="Materials and Cutting Rates" actionLabel="" hideHeading>
      <Toolbar onChange={setMaterialSearchQuery} placeholder="Search material, type, thickness, or rate" value={materialSearchQuery} />
      <div className="material-action-bar">
        <div>
          <span>Material Type</span>
          <button className="secondary-action" onClick={openAddMaterialType} type="button">Add</button>
          <button className="secondary-action" disabled={!selectedMaterialGroup} onClick={openEditMaterialType} type="button">Edit</button>
        </div>
        <div>
          <span>Material</span>
          <button className="secondary-action" onClick={openAddMaterial} type="button">Add</button>
          <button className="secondary-action" disabled={!selectedMaterialRate} onClick={openEditMaterial} type="button">Edit</button>
        </div>
      </div>
      <section className="material-workbench" aria-label="Material rate editor">
        <div className="material-master-table table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Materials</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterialGroups.map((group) => (
                <tr
                  aria-current={selectedMaterialGroup?.key === group.key ? "true" : undefined}
                  key={group.key}
                  onClick={() => selectMaterialGroup(group.key)}
                >
                  <td>{group.type}</td>
                  <td>{group.material}</td>
                  <td>{group.lines.length}</td>
                </tr>
              ))}
              {filteredMaterialGroups.length === 0 && (
                <tr>
                  <td className="empty-table-cell" colSpan={3}>No materials found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="material-detail-panel">
          <div className="material-detail-table table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thickness</th>
                  <th>Feed</th>
                  <th>Density</th>
                  <th>Cut Rate</th>
                  <th>Cost per M2</th>
                  <th>Piercing Rate</th>
                  <th>Piercing Time</th>
                </tr>
              </thead>
              <tbody>
                {(selectedMaterialGroup?.lines ?? []).map((rate) => (
                  <tr
                    aria-current={selectedMaterialRateId === rate.id ? "true" : undefined}
                    key={rate.id}
                    onClick={() => setSelectedMaterialRateId(rate.id)}
                  >
                    <td>{formatMaterialValue(rate.thickness)}</td>
                    <td>{formatMaterialValue(rate.feed)}</td>
                    <td>{formatMaterialValue(rate.density)}</td>
                    <td>{rate.cutRate === null ? "" : currency.format(rate.cutRate)}</td>
                    <td>{rate.costPerM2 === null ? "" : currency.format(rate.costPerM2)}</td>
                    <td>{rate.piercingRate === null ? "" : currency.format(rate.piercingRate)}</td>
                    <td>{formatMaterialValue(rate.piercingTime)}</td>
                  </tr>
                ))}
                {!selectedMaterialGroup && (
                  <tr>
                    <td className="empty-table-cell" colSpan={7}>Select a material to view rates.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {materialEditorMode && (
        <section className="material-editor" aria-label={materialEditorMode === "add" ? "Add material" : "Edit material"}>
          <div className="quote-line-form-heading">
            <div>
              <p className="eyebrow">{materialEditorMode === "add" ? "Add Material" : "Edit Material"}</p>
              <h3>{materialDraft.material || "Material Rate"}</h3>
            </div>
            <div className="quote-picker-actions">
              <button className="secondary-action" onClick={closeMaterialEditor} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={!canSaveMaterial} onClick={saveMaterial} type="button">
                <Plus size={16} />
                <span>Save</span>
              </button>
            </div>
          </div>
          <div className="material-editor-grid">
            <label className="field">
              <span>Type</span>
              <input onChange={(event) => updateMaterialDraft("type", event.target.value)} value={materialDraft.type} />
            </label>
            <label className="field">
              <span>Materials</span>
              <input onChange={(event) => updateMaterialDraft("material", event.target.value)} value={materialDraft.material} />
            </label>
            <label className="field">
              <span>Thickness</span>
              <input onChange={(event) => updateMaterialDraft("thickness", event.target.value)} value={materialDraft.thickness} />
            </label>
            <label className="field">
              <span>Feed</span>
              <input onChange={(event) => updateMaterialDraft("feed", event.target.value)} value={materialDraft.feed} />
            </label>
            <label className="field">
              <span>Density</span>
              <input onChange={(event) => updateMaterialDraft("density", event.target.value)} value={materialDraft.density} />
            </label>
            <label className="field">
              <span>Cut Rate</span>
              <input onChange={(event) => updateMaterialDraft("cutRate", event.target.value)} value={materialDraft.cutRate} />
            </label>
            <label className="field">
              <span>Cost per M2</span>
              <input onChange={(event) => updateMaterialDraft("costPerM2", event.target.value)} value={materialDraft.costPerM2} />
            </label>
            <label className="field">
              <span>Piercing Rate</span>
              <input onChange={(event) => updateMaterialDraft("piercingRate", event.target.value)} value={materialDraft.piercingRate} />
            </label>
            <label className="field">
              <span>Piercing Time</span>
              <input onChange={(event) => updateMaterialDraft("piercingTime", event.target.value)} value={materialDraft.piercingTime} />
            </label>
          </div>
        </section>
      )}
      {materialTypeEditorMode && (
        <section className="material-editor" aria-label={materialTypeEditorMode === "add" ? "Add material type" : "Edit material type"}>
          <div className="quote-line-form-heading">
            <div>
              <p className="eyebrow">{materialTypeEditorMode === "add" ? "Add Material Type" : "Edit Material Type"}</p>
              <h3>{materialTypeDraft || selectedMaterialGroup?.type || "Material Type"}</h3>
            </div>
            <div className="quote-picker-actions">
              <button className="secondary-action" onClick={closeMaterialTypeEditor} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={!canSaveMaterialType} onClick={saveMaterialType} type="button">
                <Plus size={16} />
                <span>Save</span>
              </button>
            </div>
          </div>
          <div className="material-type-editor-grid">
            <label className="field">
              <span>Material Type</span>
              <input onChange={(event) => setMaterialTypeDraft(event.target.value)} value={materialTypeDraft} />
            </label>
          </div>
        </section>
      )}
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

function ContactTypeCheckboxes({
  contactTypes,
  onChange,
  selectedTypes,
}: {
  contactTypes: ContactTypeOption[];
  onChange: (typeLabel: string, checked: boolean) => void;
  selectedTypes: string[];
}) {
  return (
    <fieldset className="checkbox-fieldset">
      <legend>Contact type</legend>
      <div className="checkbox-grid">
        {contactTypes.map((contactType) => (
          <label className="checkbox-option" key={contactType.id}>
            <input
              checked={selectedTypes.includes(contactType.label)}
              onChange={(event) => onChange(contactType.label, event.target.checked)}
              type="checkbox"
            />
            <span>{contactType.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SettingsPage({
  contactTypes,
  onContactTypesChange,
}: {
  contactTypes: ContactTypeOption[];
  onContactTypesChange: (contactTypes: ContactTypeOption[]) => void;
}) {
  const integrationSettings = [
    { name: "Google APIs", status: "Not configured", detail: "Maps, address lookup, Drive, Gmail, or calendar services can be connected here later." },
    { name: "Supabase", status: hasSupabaseConfig ? "Connected" : "Needs env", detail: "Database URL and anon key are read from deployment environment variables." },
    { name: "Cloudflare", status: "Connected", detail: "GitHub deployment and domain routing are managed from Cloudflare Workers and Pages." },
    { name: "MYOB", status: "Future", detail: "Invoice export or accounting sync can be configured when we build accounts integration." },
  ];

  const addContactType = () => {
    onContactTypesChange([
      ...contactTypes,
      { id: `contact-type-${Date.now()}`, label: "New Type" },
    ]);
  };

  const updateContactType = (contactTypeId: string, label: string) => {
    onContactTypesChange(
      contactTypes.map((contactType) =>
        contactType.id === contactTypeId ? { ...contactType, label } : contactType,
      ),
    );
  };

  const removeContactType = (contactTypeId: string) => {
    onContactTypesChange(contactTypes.filter((contactType) => contactType.id !== contactTypeId));
  };

  return (
    <section className="settings-grid">
      <PagePanel eyebrow="System" title="Application Settings" actionLabel="Save Settings">
        <div className="settings-form">
          <section>
            <div className="settings-section-heading">
              <div>
                <h3>Contact Type Lookup</h3>
                <p>These options appear as checkboxes when creating or editing contacts.</p>
              </div>
              <button className="secondary-action" onClick={addContactType} type="button">
                <Plus size={16} />
                <span>Add Type</span>
              </button>
            </div>
            <div className="lookup-list">
              {contactTypes.map((contactType) => (
                <div className="lookup-row" key={contactType.id}>
                  <input
                    aria-label={`Contact type ${contactType.label}`}
                    onChange={(event) => updateContactType(contactType.id, event.target.value)}
                    value={contactType.label}
                  />
                  <button
                    className="row-icon-button"
                    onClick={() => removeContactType(contactType.id)}
                    title="Remove contact type"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3>Business Profile</h3>
            <div className="form-grid two">
              <Field fieldId="businessName" label="Business name" value="MySwiftFab" />
              <Field fieldId="timezone" label="Timezone" value="Australia/Perth" />
              <Field fieldId="defaultTax" label="Default GST" value="10%" />
              <Field fieldId="quotePrefix" label="Quote prefix" value="400" />
            </div>
          </section>

          <section>
            <h3>API Placeholders</h3>
            <div className="form-grid two">
              <Field fieldId="googleApiKey" label="Google API key" value="" />
              <Field fieldId="mapsApiKey" label="Maps API key" value="" />
              <Field fieldId="emailProvider" label="Email provider" value="Not configured" />
              <Field fieldId="accountingProvider" label="Accounting provider" value="Not configured" />
            </div>
          </section>
        </div>
      </PagePanel>

      <article className="settings-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Integrations</p>
            <h2>Connection Status</h2>
          </div>
        </div>
        <div className="integration-list">
          {integrationSettings.map((integration) => (
            <article className="integration-item" key={integration.name}>
              <div>
                <h3>{integration.name}</h3>
                <p>{integration.detail}</p>
              </div>
              <Badge label={integration.status} />
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function EditableStaffTable({
  onAdd,
  onRemove,
  onUpdate,
  staff,
}: {
  onAdd: () => void;
  onRemove: (staffId: string) => void;
  onUpdate: (staffId: string, field: keyof StaffMember, value: string) => void;
  staff: StaffMember[];
}) {
  return (
    <section className="editable-section">
      <div className="editable-section-heading">
        <div>
          <h3>Staff Members</h3>
          <p>Store all estimators, accounts contacts, workshop people, and other staff for this company.</p>
        </div>
        <button className="secondary-action" onClick={onAdd} type="button">
          <Plus size={16} />
          <span>Add Staff</span>
        </button>
      </div>

      <div className="editable-table-wrap">
        <table className="editable-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Name</th>
              <th>Job Title</th>
              <th>Direct</th>
              <th>Mobile</th>
              <th>Email</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {staff.map((staffMember) => (
              <tr key={staffMember.id}>
                <td>
                  <input value={staffMember.title} onChange={(event) => onUpdate(staffMember.id, "title", event.target.value)} />
                </td>
                <td>
                  <input value={staffMember.name} onChange={(event) => onUpdate(staffMember.id, "name", event.target.value)} />
                </td>
                <td>
                  <input value={staffMember.jobTitle} onChange={(event) => onUpdate(staffMember.id, "jobTitle", event.target.value)} />
                </td>
                <td>
                  <input value={staffMember.direct} onChange={(event) => onUpdate(staffMember.id, "direct", event.target.value)} />
                </td>
                <td>
                  <input value={staffMember.mobile} onChange={(event) => onUpdate(staffMember.id, "mobile", event.target.value)} />
                </td>
                <td>
                  <input value={staffMember.email} onChange={(event) => onUpdate(staffMember.id, "email", event.target.value)} />
                </td>
                <td>
                  <button className="row-icon-button" onClick={() => onRemove(staffMember.id)} title="Remove staff member" type="button">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="table-empty">No staff members yet.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EditableDeliveryTable({
  addresses,
  onAdd,
  onRemove,
  onUpdate,
}: {
  addresses: DeliveryAddress[];
  onAdd: () => void;
  onRemove: (addressId: string) => void;
  onUpdate: (addressId: string, field: keyof DeliveryAddress, value: string) => void;
}) {
  return (
    <section className="editable-section">
      <div className="editable-section-heading">
        <div>
          <h3>Delivery Addresses</h3>
          <p>Keep separate workshop, site, office, and pickup addresses for the same customer.</p>
        </div>
        <button className="secondary-action" onClick={onAdd} type="button">
          <Plus size={16} />
          <span>Add Address</span>
        </button>
      </div>

      <div className="editable-table-wrap">
        <table className="editable-table delivery-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Address</th>
              <th>Suburb</th>
              <th>State</th>
              <th>Postcode</th>
              <th>Instructions</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {addresses.map((address) => (
              <tr key={address.id}>
                <td>
                  <input value={address.label} onChange={(event) => onUpdate(address.id, "label", event.target.value)} />
                </td>
                <td>
                  <input value={address.address} onChange={(event) => onUpdate(address.id, "address", event.target.value)} />
                </td>
                <td>
                  <input value={address.suburb} onChange={(event) => onUpdate(address.id, "suburb", event.target.value)} />
                </td>
                <td>
                  <input value={address.state} onChange={(event) => onUpdate(address.id, "state", event.target.value)} />
                </td>
                <td>
                  <input value={address.postcode} onChange={(event) => onUpdate(address.id, "postcode", event.target.value)} />
                </td>
                <td>
                  <input value={address.instructions} onChange={(event) => onUpdate(address.id, "instructions", event.target.value)} />
                </td>
                <td>
                  <button className="row-icon-button" onClick={() => onRemove(address.id)} title="Remove delivery address" type="button">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {addresses.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="table-empty">No delivery addresses yet.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ContactNotesPanel({
  newNoteText,
  notes,
  onAdd,
  onChange,
  onRemove,
}: {
  newNoteText: string;
  notes: ContactNote[];
  onAdd: () => void;
  onChange: (value: string) => void;
  onRemove: (noteId: string) => void;
}) {
  return (
    <section className="notes-section">
      <div className="editable-section-heading">
        <div>
          <h3>Contact Notes</h3>
          <p>Record phone calls, quote follow-ups, payment notes, and other dated contact history.</p>
        </div>
      </div>

      <div className="note-compose">
        <Field
          fieldId="newContactNote"
          label="New note"
          onChange={onChange}
          rows={4}
          value={newNoteText}
        />
        <div className="note-compose-footer">
          <span>Saved as {currentUserName} with the current date and time.</span>
          <button className="primary-action" disabled={!newNoteText.trim()} onClick={onAdd} type="button">
            <Plus size={16} />
            <span>Add Note</span>
          </button>
        </div>
      </div>

      <div className="note-list" aria-label="Contact notes timeline">
        {[...notes]
          .sort((firstNote, secondNote) => new Date(secondNote.createdAt).getTime() - new Date(firstNote.createdAt).getTime())
          .map((note) => (
            <article className="note-item" key={note.id}>
              <div className="note-item-header">
                <div>
                  <strong>{note.author}</strong>
                  <span>{formatContactNoteDate(note.createdAt)}</span>
                </div>
                <button className="row-icon-button" onClick={() => onRemove(note.id)} title="Remove note" type="button">
                  <Trash2 size={16} />
                </button>
              </div>
              <p>{note.text}</p>
            </article>
          ))}
        {notes.length === 0 && (
          <div className="note-empty">
            <strong>No notes yet</strong>
            <span>Add the first note for this contact.</span>
          </div>
        )}
      </div>
    </section>
  );
}

function QuoteWorkbench({
  compact = false,
  lines = quoteLines,
  onAddLine,
  onUpdateLine,
  onBack,
  onNewQuote,
  onSave,
  savedOthers,
  quote = quotes[0],
}: {
  compact?: boolean;
  lines?: QuoteLine[];
  onAddLine?: (line: QuoteLine) => void;
  onUpdateLine?: (index: number, line: QuoteLine) => void;
  onBack?: () => void;
  onNewQuote?: () => void;
  onSave?: (lineOthers: Record<number, OtherLineItem[]>) => void;
  savedOthers?: Record<number, OtherLineItem[]>;
  quote?: QuoteRecord;
}) {
  const [isLineFormOpen, setIsLineFormOpen] = useState(false);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [lineDraft, setLineDraft] = useState<QuoteLineDraft>(createBlankQuoteLineDraft);
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [detailTab, setDetailTab] = useState<"detail" | "others" | "holes" | "advanced">("detail");
  const [selectedClientName, setSelectedClientName] = useState(quote.client);
  const selectedClient = contacts.find((contact) => contact.company === selectedClientName) ?? contacts[0];
  const [selectedStaffName, setSelectedStaffName] = useState(quote.contact);
  const [quoteComments, setQuoteComments] = useState("");
  const [lineOthers, setLineOthers] = useState<Record<number, OtherLineItem[]>>(savedOthers ?? {});
  const LINE_STATUSES = [
    { value: "Q", label: "Q — Quote" },
    { value: "J", label: "J — Job" },
    { value: "H", label: "H — On Hold" },
    { value: "N/A", label: "N/A — Not Applicable" },
    { value: "C", label: "C — Complete" },
    { value: "INV", label: "INV — Invoiced" },
  ];
  const lineStatusColor: Record<string, string> = { Q: "#1a6aaa", J: "#2a7a2a", H: "#b87a00", "N/A": "#888", C: "#4a4a9a", INV: "#153f4d" };
  const [lineStatuses, setLineStatuses] = useState<Record<number, string>>({});
  const HOLE_TYPES = ["Laser Cut Holes", "Drilled Holes", "Slots", "Len"];
  type HoleRow = { id: string; holeType: string; qty: string; dia: string; side1: string; side2: string; len: string; holeDesc: string; weight: string; };
  const [holeRows, setHoleRows] = useState<HoleRow[]>([]);
  function addHoleRow() {
    setHoleRows(r => [...r, { id: crypto.randomUUID(), holeType: "Laser Cut Holes", qty: "", dia: "", side1: "", side2: "", len: "", holeDesc: "", weight: "" }]);
  }
  function updateHoleRow(id: string, field: keyof HoleRow, value: string) {
    setHoleRows(r => r.map(h => h.id === id ? { ...h, [field]: value } : h));
  }
  function removeHoleRow(id: string) {
    setHoleRows(r => r.filter(h => h.id !== id));
  }
  function calcPerimeter(h: HoleRow): string {
    const qty = Number(h.qty) || 0;
    const dia = Number(h.dia) || 0;
    const s1 = Number(h.side1) || 0;
    const s2 = Number(h.side2) || 0;
    const len = Number(h.len) || 0;
    if (h.holeType === "Laser Cut Holes" || h.holeType === "Drilled Holes") return (Math.PI * dia * qty).toFixed(2);
    if (h.holeType === "Slots") return ((s1 * 2 + s2 * 2) * qty).toFixed(2);
    if (h.holeType === "Len") return String(len);
    return "—";
  }
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const selectedStaff = selectedClient.staff.find((staffMember) => staffMember.name === selectedStaffName) ?? selectedClient.staff[0];
  const selectedLine = lines[selectedLineIndex] ?? null;
  const gst = quote.total * 0.1;
  const totalIncGst = quote.total + gst;
  const currentOthers = lineOthers[selectedLineIndex] ?? [];
  const othersCostTotal = currentOthers.reduce((s, o) => s + o.cost * o.qty, 0);
  const othersAmountTotal = currentOthers.reduce((s, o) => s + o.cost * o.qty * (1 + o.markupPct / 100), 0);

  function addOtherRow() {
    const row: OtherLineItem = { id: crypto.randomUUID(), category: "BENDING", description: "", qty: 1, cost: 0, markupPct: 20, supplier: "", staff: "", ref: "" };
    setLineOthers((prev) => ({ ...prev, [selectedLineIndex]: [...(prev[selectedLineIndex] ?? []), row] }));
  }
  function updateOtherRow(id: string, field: keyof OtherLineItem, value: string | number) {
    setLineOthers((prev) => ({
      ...prev,
      [selectedLineIndex]: (prev[selectedLineIndex] ?? []).map((o) => o.id === id ? { ...o, [field]: value } : o),
    }));
  }
  function removeOtherRow(id: string) {
    setLineOthers((prev) => ({ ...prev, [selectedLineIndex]: (prev[selectedLineIndex] ?? []).filter((o) => o.id !== id) }));
  }

  const draftLine = createQuoteLineFromDraft(lineDraft);
  const canAddLine = Boolean(lineDraft.part.trim() && lineDraft.material.trim() && lineDraft.thickness.trim() && draftLine.qty > 0);

  useEffect(() => {
    setSelectedClientName(quote.client);
    setSelectedStaffName(quote.contact);
    setSelectedLineIndex(0);
  }, [quote.client, quote.contact, quote.quote]);

  const selectClientForQuote = (clientName: string) => {
    const nextClient = contacts.find((contact) => contact.company === clientName) ?? contacts[0];
    setSelectedClientName(nextClient.company);
    setSelectedStaffName(nextClient.staff[0]?.name ?? "");
  };

  const updateLineDraft = (field: keyof QuoteLineDraft, value: string) => {
    setLineDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openLineForm = () => {
    setLineDraft(createBlankQuoteLineDraft());
    setEditingLineIndex(null);
    setIsLineFormOpen(true);
  };

  const openEditLineForm = (index: number) => {
    const line = lines[index];
    if (!line) return;
    setLineDraft({
      part: line.part,
      materialRateId: "",
      materialType: line.materialType ?? "",
      material: line.material,
      thickness: line.thickness,
      feed: String(line.feed ?? ""),
      costPerM2: String(line.costPerM2 ?? ""),
      qty: String(line.qty),
      cut: String(line.cut),
      pierce: String(line.pierce),
      predecessor: line.predecessor ?? "Plate",
      side1: String(line.side1 ?? ""),
      side2: String(line.side2 ?? ""),
      od: String(line.od ?? ""),
      id: String(line.id ?? ""),
    });
    setEditingLineIndex(index);
    setIsLineFormOpen(true);
  };

  const selectMaterialRate = (materialRateId: string) => {
    const selectedRate = materialRates.find((rate) => rate.id === materialRateId);
    if (!selectedRate) return;

    setLineDraft((current) => ({
      ...current,
      materialRateId: selectedRate.id,
      materialType: selectedRate.type,
      material: selectedRate.material,
      thickness: formatMaterialValue(selectedRate.thickness, " mm"),
      feed: formatMaterialValue(selectedRate.feed),
      costPerM2: formatMaterialValue(selectedRate.costPerM2),
      cut: formatMaterialValue(selectedRate.cutRate),
      pierce: formatMaterialValue(selectedRate.piercingRate),
    }));
  };

  const closeLineForm = () => {
    setIsLineFormOpen(false);
    setEditingLineIndex(null);
    setLineDraft(createBlankQuoteLineDraft());
  };

  const addLine = () => {
    if (!canAddLine) return;
    if (editingLineIndex !== null) {
      onUpdateLine?.(editingLineIndex, draftLine);
    } else {
      onAddLine?.(draftLine);
      setSelectedLineIndex(lines.length);
    }
    closeLineForm();
  };

  const applyDescription = () => {
    const line = lines[selectedLineIndex];
    if (!line) return;

    const pred = line.predecessor ?? "Plate";

    // Rectangle and Square cannot have holes
    if ((pred === "Rectangle" || pred === "Square") && holeRows.length > 0) {
      alert(`You can not have holes in ${pred}. Thank.`);
      onUpdateLine?.(selectedLineIndex, { ...line, predecessor: "Plate" });
      return;
    }

    // Ring and Disc: no extra perimeters check (simplified — just generate)

    const draft: QuoteLineDraft = {
      part: line.part,
      materialRateId: "",
      materialType: line.materialType ?? "",
      material: line.material,
      thickness: line.thickness,
      feed: String(line.feed ?? ""),
      costPerM2: String(line.costPerM2 ?? ""),
      qty: String(line.qty),
      cut: String(line.cut),
      pierce: String(line.pierce),
      predecessor: pred,
      side1: String(line.side1 ?? ""),
      side2: String(line.side2 ?? ""),
      od: String(line.od ?? ""),
      id: String(line.id ?? ""),
    };

    const generated = calcPartDescription(draft, holeRows);

    if (line.part.trim().length <= 1) {
      onUpdateLine?.(selectedLineIndex, { ...line, part: generated });
    } else {
      if (window.confirm("It will replace text you already have in description. Are you sure?")) {
        onUpdateLine?.(selectedLineIndex, { ...line, part: generated });
      }
    }
  };

  const [quoteStatus, setQuoteStatus] = useState(quote.status);
  const statusColor: Record<string, string> = {
    approved: "#3a7d2a", sent: "#b87a00", draft: "#555", review: "#a04000", inactive: "#999", lost: "#c0392b", pending: "#b87a00", internal: "#555",
  };
  const statusBg = statusColor[quoteStatus.toLowerCase()] ?? "#555";
  const statusOptions = ["Approved", "InActive", "Internal", "Lost", "Pending", "Sent", "Draft", "Review"];

  return (
    <article className="quote-panel">
      {/* Back bar */}
      {onBack && (
        <div className="quote-back-bar">
          <button className="secondary-action" onClick={onBack} type="button">← Quote List</button>
          {onNewQuote && (
            <button className="primary-action" onClick={onNewQuote} type="button">+ New Quote</button>
          )}
          <button className="primary-action" onClick={openLineForm} type="button">+ Add Line</button>
          <button className="primary-action" onClick={addOtherRow} type="button">+ Add Category</button>
          <button className="primary-action" onClick={addHoleRow} type="button">+ Add Hole</button>
          {onSave && (
            <button className="qf-save-btn" onClick={() => { onSave(lineOthers); setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); }} type="button">
              {saveStatus === "saved" ? "✓ Saved" : "💾 Save"}
            </button>
          )}
        </div>
      )}

      {/* ── Header strip ── */}
      <div className="qf-header">
        <div className="qf-header-main">
          {/* Row 1: column labels */}
          <div className="qf-hrow qf-hrow-labels">
            <div className="qf-col-head">CLIENT</div>
            <div className="qf-col-head">STAFF</div>
            <div className="qf-col-head">DELIVERY DETAILS</div>
            <div className="qf-col-head">NOTES FOR</div>
            <div className="qf-col-head">FLAGS</div>
          </div>

          {/* Row 2: client data */}
          <div className="qf-hrow qf-hrow-data">
            {/* Client Company */}
            <div className="qf-hcell">
              <select aria-label="Client Company" onChange={(e) => selectClientForQuote(e.target.value)} value={selectedClientName}>
                {contacts.filter((c) => splitContactTypes(c.kind).includes("Client")).map((c) => (
                  <option key={c.id} value={c.company}>{c.company}</option>
                ))}
              </select>
              <span className="qf-subval">{selectedClient.billingAddress?.split(",")[0] ?? ""}</span>
              <span className="qf-subval">{selectedClient.billingAddress?.split(",").slice(1).join(",").trim() ?? ""}</span>
            </div>
            {/* Staff — name and job title only */}
            <div className="qf-hcell">
              <select aria-label="Staff" onChange={(e) => setSelectedStaffName(e.target.value)} value={selectedStaff?.name ?? ""}>
                {selectedClient.staff.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
              <span className="qf-subval">{selectedStaff?.jobTitle ?? ""}</span>
            </div>
            {/* Delivery Street */}
            <div className="qf-hcell">
              <input placeholder="Street" className="qf-subinput" style={{ width: "75%" }} />
              <input placeholder="PostCode" className="qf-subinput" style={{ width: "20%" }} />
              <input placeholder="Suburb" className="qf-subinput" style={{ width: "60%" }} />
              <input placeholder="State" className="qf-subinput" style={{ width: "30%" }} />
            </div>
            {/* Notes For — client notes visible at quote level */}
            <div className="qf-hcell qf-notes-for-cell">
              <span className="qf-subval qf-notes-for-text">{selectedClient.notes || "—"}</span>
            </div>
            {/* Flags */}
            <div className="qf-hcell qf-flags-cell">
              <label><input type="checkbox" /> Pre Invoice</label>
              <label><input type="checkbox" /> Cash Account</label>
              <div className="qf-timestamp">
                <span>Created</span>
                <span>{quote.date ?? "—"}</span>
              </div>
              <div className="qf-timestamp">
                <span>Sent</span>
                <input type="checkbox" />
              </div>
            </div>
          </div>
        </div>

        {/* Right panel: Status / Quote / Date / Sales Staff — vertical, right-aligned */}
        <div className="qf-header-right">
          <select
            className="qf-status-badge"
            style={{ background: statusBg, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", width: "100%" }}
            value={quoteStatus}
            onChange={(e) => setQuoteStatus(e.target.value)}
          >
            {statusOptions.map(s => <option key={s} value={s} style={{ background: "#fff", color: "#333" }}>{s.toUpperCase()}</option>)}
          </select>
          <div className="qf-right-row">
            <span className="qf-label">QUOTE</span>
            <span className="qf-field-val">{quote.quote}</span>
          </div>
          <div className="qf-right-row">
            <span className="qf-label">DATE</span>
            <span className="qf-field-val">{quote.date ?? "—"}</span>
          </div>
          <div className="qf-right-row">
            <span className="qf-label">SALES STAFF</span>
            <span className="qf-field-val">{quote.contact}</span>
          </div>
        </div>
      </div>

      {/* ── Calculator panel ── */}
      <div className="qf-calc-panel">
        <div className="qf-calc-layout">

          {/* Left: calculator grid */}
          <div className="qf-calc-left" style={detailTab === "others" ? { gridColumn: "1 / -1" } : undefined}>
            <div className="qf-calc-tabs">
              <button aria-selected={detailTab === "detail"} className="qf-calc-tab" onClick={() => setDetailTab("detail")} type="button">Calculator</button>
              <button aria-selected={detailTab === "others"} className="qf-calc-tab" onClick={() => setDetailTab("others")} type="button">Others</button>
            </div>

            {/* Material grid — hidden when Others tab active */}
            <table className="qf-calc-table" style={detailTab === "others" ? { display: "none" } : undefined}>
              <thead>
                <tr>
                  <th className="qf-row-head">Material</th>
                  <th>{selectedLine?.material ?? "M/S"}</th>
                  <th>Supplied</th>
                  <th>Offset</th>
                  <th>Side1</th>
                  <th>Side2</th>
                  <th>Incl.</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="qf-row-label">Thick</td>
                  <td>{selectedLine?.thickness.replace(" mm","") ?? "—"}</td>
                  <td>NO</td>
                  <td>{selectedLine ? "10" : "—"}</td>
                  <td>{selectedLine?.side1 ?? (selectedLine ? "—" : "—")}</td>
                  <td>{selectedLine?.side2 ?? (selectedLine ? "—" : "—")}</td>
                  <td><input type="checkbox" readOnly /></td>
                </tr>
                <tr>
                  <td className="qf-row-label">Feed Rate</td>
                  <td>{formatMaterialValue(selectedLine?.feed ?? null)}</td>
                  <td colSpan={2} className="qf-row-label">Material :</td>
                  <td>{selectedLine ? String(Math.round(selectedLine.cut*12+580)) : "—"}</td>
                  <td>{selectedLine ? String(Math.round(selectedLine.cut*15+690)) : "—"}</td>
                  <td>{selectedLine ? String(Math.round(selectedLine.cut*28+2800)) : "—"}</td>
                </tr>
                <tr>
                  <td className="qf-row-label">Cut Rate</td>
                  <td>{selectedLine?.cut.toFixed(2) ?? "—"}</td>
                  <td className="qf-btn-cell" colSpan={1}><button className="qf-all-btn" type="button">All</button></td>
                  <td className="qf-row-label">Laser Holes</td>
                  <td className="qf-col-hdr">HOLES</td>
                  <td className="qf-col-hdr">DIA</td>
                  <td>{selectedLine?.qty ?? "—"}</td>
                </tr>
                <tr>
                  <td className="qf-row-label">$ m2 Rate</td>
                  <td>{formatMaterialValue(selectedLine?.costPerM2 ?? null)}</td>
                  <td colSpan={2} className="qf-row-label">Slots</td>
                  <td className="qf-col-hdr">QTY</td>
                  <td className="qf-col-hdr">S1</td>
                  <td className="qf-col-hdr">S2</td>
                </tr>
                <tr>
                  <td className="qf-row-label">Piercing</td>
                  <td>{selectedLine?.pierce.toFixed(2) ?? "—"}</td>
                  <td colSpan={2} className="qf-row-label">Len</td>
                  <td colSpan={3} className="qf-col-hdr">LEN</td>
                </tr>
              </tbody>
            </table>

            {/* Others table */}
            {detailTab === "others" && (
              <div className="qf-others-wrap">
                <table className="qf-others-tbl">
                  <thead>
                    <tr>
                      <th>Category</th><th>Qty</th><th>Cost</th><th>$ago</th><th>Sales</th><th>Cost</th><th>Amount</th><th>Supplier</th><th>Staff</th><th>Ref.</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOthers.map((o) => {
                      const salesEach = o.cost * (1 + o.markupPct / 100);
                      const costTotal = o.cost * o.qty;
                      const amountTotal = salesEach * o.qty;
                      return (
                        <tr key={o.id}>
                          <td className="qf-others-cat-cell">
                            <select className="qf-others-cat-input" onChange={(e) => updateOtherRow(o.id, "category", e.target.value)} value={o.category}>
                              {["BENDING","FABRICATION","GALVANISING","PAINTING","PRESSING"].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input className="qf-others-desc-input" onChange={(e) => updateOtherRow(o.id, "description", e.target.value)} placeholder="Description" value={o.description} />
                          </td>
                          <td><input className="qf-num-input" onChange={(e) => updateOtherRow(o.id, "qty", Number(e.target.value))} type="number" value={o.qty} /></td>
                          <td><input className="qf-num-input" onChange={(e) => updateOtherRow(o.id, "cost", Number(e.target.value))} type="number" value={o.cost} /></td>
                          <td><input className="qf-num-input" onChange={(e) => updateOtherRow(o.id, "markupPct", Number(e.target.value))} type="number" value={o.markupPct} /></td>
                          <td>{salesEach.toFixed(2)}</td>
                          <td>{costTotal.toFixed(2)}</td>
                          <td>{amountTotal.toFixed(2)}</td>
                          <td>{(() => {
                            const suppliers = contacts.filter(c => splitContactTypes(c.kind).includes("Supplier"));
                            return (
                              <select className="qf-others-text-input" value={o.supplier} onChange={(e) => updateOtherRow(o.id, "supplier", e.target.value)}>
                                <option value="">— Supplier —</option>
                                {suppliers.map(s => <option key={s.id} value={s.company}>{s.company}</option>)}
                              </select>
                            );
                          })()}</td>
                          <td>{(() => {
                            const supplierContact = contacts.find(c => c.company === o.supplier && splitContactTypes(c.kind).includes("Supplier"));
                            const staffList = supplierContact?.staff ?? [];
                            return (
                              <select className="qf-others-text-input" value={o.staff} onChange={(e) => updateOtherRow(o.id, "staff", e.target.value)}>
                                <option value="">— Staff —</option>
                                {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                              </select>
                            );
                          })()}</td>
                          <td><input className="qf-others-text-input" onChange={(e) => updateOtherRow(o.id, "ref", e.target.value)} placeholder="REFERENCE" value={o.ref} /></td>
                          <td><button className="qf-others-del" onClick={() => removeOtherRow(o.id)} title="Remove" type="button">✕</button></td>
                        </tr>
                      );
                    })}
                    {currentOthers.length === 0 && (
                      <tr className="qf-others-placeholder"><td colSpan={11}>No others for this line — click + Add Category above</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", fontWeight: 700 }}>Total:</td>
                      <td style={{ fontWeight: 700, background: "#d4b8e0" }}>{currency.format(othersCostTotal)}</td>
                      <td style={{ fontWeight: 700, background: "#d4b8e0" }}>{currency.format(othersAmountTotal)}</td>
                      <td colSpan={4}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Right: Hole Type table — hidden when Others tab active */}
          <div className="qf-calc-right" style={detailTab === "others" ? { display: "none" } : undefined}>
            <div className="qf-calc-right-spacer" />
            <table className="qf-calc-table">
              <thead>
                <tr>
                  <th>Hole Type</th><th>Qty</th><th>Dia</th><th>Side 1</th><th>Side 2</th><th>Len</th><th>Perimeter</th><th>Hole Desc</th><th>Weight</th><th></th>
                </tr>
              </thead>
              <tbody>
                {holeRows.map(h => {
                  const isSlot = h.holeType === "Slots";
                  const isLen = h.holeType === "Len";
                  const needsDia = h.holeType === "Laser Cut Holes" || h.holeType === "Drilled Holes";
                  return (
                    <tr key={h.id}>
                      <td>
                        <select style={{ width: "100%", border: "none", background: "transparent", fontWeight: 600 }} value={h.holeType} onChange={e => updateHoleRow(h.id, "holeType", e.target.value)}>
                          {HOLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td><input className="qf-num-input" value={h.qty} onChange={e => updateHoleRow(h.id, "qty", e.target.value)} placeholder="Qty" /></td>
                      <td><input className="qf-num-input" value={h.dia} onChange={e => updateHoleRow(h.id, "dia", e.target.value)} disabled={!needsDia} style={{ opacity: needsDia ? 1 : 0.3 }} placeholder="Dia" /></td>
                      <td><input className="qf-num-input" value={h.side1} onChange={e => updateHoleRow(h.id, "side1", e.target.value)} disabled={!isSlot} style={{ opacity: isSlot ? 1 : 0.3 }} placeholder="S1" /></td>
                      <td><input className="qf-num-input" value={h.side2} onChange={e => updateHoleRow(h.id, "side2", e.target.value)} disabled={!isSlot} style={{ opacity: isSlot ? 1 : 0.3 }} placeholder="S2" /></td>
                      <td><input className="qf-num-input" value={h.len} onChange={e => updateHoleRow(h.id, "len", e.target.value)} disabled={!isLen} style={{ opacity: isLen ? 1 : 0.3 }} placeholder="Len" /></td>
                      <td style={{ fontWeight: 700, textAlign: "center" }}>{calcPerimeter(h)}</td>
                      <td><input style={{ width: "100%", border: "none", background: "transparent" }} value={h.holeDesc} onChange={e => updateHoleRow(h.id, "holeDesc", e.target.value)} placeholder="Description" /></td>
                      <td><input className="qf-num-input" value={h.weight} onChange={e => updateHoleRow(h.id, "weight", e.target.value)} placeholder="kg" /></td>
                      <td className="qf-del-cell"><button style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer" }} onClick={() => removeHoleRow(h.id)} type="button">✕</button></td>
                    </tr>
                  );
                })}
                {holeRows.length === 0 && (
                  <tr><td colSpan={10} style={{ color: "#bbb", fontStyle: "italic", padding: "8px", textAlign: "center" }}>No holes — click + Add Hole above</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary bar: Material / Cutting / Piercing / Other / Rate / Weight / Time | Description | Total */}
        <div className="qf-calc-summary">
          <div className="qf-summary-cells">
            <div><span>Material</span><strong>{selectedLine ? currency.format(selectedLine.costPerM2 ?? 0) : "—"}</strong></div>
            <div><span>Cutting</span><strong>{selectedLine ? currency.format(selectedLine.cut) : "—"}</strong></div>
            <div><span>Piercing</span><strong>{selectedLine ? selectedLine.pierce.toFixed(2) : "—"}</strong></div>
            <div><span>Other</span><strong>{currency.format(othersAmountTotal)}</strong></div>
            <div><span>Rate</span><strong>{selectedLine ? currency.format(selectedLine.total / Math.max(selectedLine.qty,1)) : "—"}</strong></div>
            <div><span>Weight</span><strong>0</strong></div>
            <div><span>Time (min)</span><strong>{selectedLine ? (selectedLine.total/30).toFixed(2) : "—"}</strong></div>
          </div>
          <div className="qf-summary-desc">
            <span className="qf-label">{selectedLine?.predecessor?.toUpperCase() ?? "PLATE"}</span>
            <input placeholder="Part Description" readOnly value={selectedLine?.part ?? ""} />
            <button
              className="qf-desc-btn"
              disabled={!selectedLine}
              onClick={applyDescription}
              title="Auto-fill description from shape and dimensions"
              type="button"
            >
              Description
            </button>
          </div>
          <div className="qf-summary-qty">
            <input className="qf-num-input" readOnly value={selectedLine?.qty ?? ""} />
          </div>
          <div className="qf-summary-total">
            <span>Total :</span>
            <strong>{selectedLine ? currency.format(selectedLine.total) : "—"}</strong>
          </div>
        </div>
      </div>

      {/* ── Add / Edit line drawer ── */}
      {isLineFormOpen && <div className="qf-drawer-overlay" onClick={closeLineForm} />}
      <aside className={`qf-drawer${isLineFormOpen ? " qf-drawer--open" : ""}`} aria-label="Line item form">
        <div className="qf-drawer-header">
          <div><p className="eyebrow">Line Item</p><h3>{editingLineIndex !== null ? "Edit Part" : "Add Part"}</h3></div>
          <div className="quote-picker-actions">
            <button className="secondary-action" onClick={closeLineForm} type="button">Cancel</button>
            <button className="primary-action" disabled={!canAddLine} onClick={addLine} type="button">
              <Plus size={16} /><span>{editingLineIndex !== null ? "Save" : "Add"}</span>
            </button>
          </div>
        </div>
        <div className="qf-drawer-body">
          <div className="qf-dim-row">
            <label className="field" style={{ flex: 1 }}>
              <span>Predecessor</span>
              <select onChange={(e) => updateLineDraft("predecessor", e.target.value)} value={lineDraft.predecessor}>
                {PREDECESSOR_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>Successor</span>
              <select disabled style={{ opacity: 0.5 }}>
                <option>— None —</option>
              </select>
            </label>
          </div>
          {(lineDraft.predecessor === "Plate" || lineDraft.predecessor === "Rectangle" || lineDraft.predecessor === "Square" || lineDraft.predecessor === "Flange" || lineDraft.predecessor === "Rect Flange") && (
            <div className="qf-dim-row">
              <label className="field">
                <span>Side 1 (mm)</span>
                <input min="0" onChange={(e) => updateLineDraft("side1", e.target.value)} type="number" value={lineDraft.side1} />
              </label>
              {lineDraft.predecessor !== "Square" && (
                <label className="field">
                  <span>Side 2 (mm)</span>
                  <input min="0" onChange={(e) => updateLineDraft("side2", e.target.value)} type="number" value={lineDraft.side2} />
                </label>
              )}
            </div>
          )}
          {(lineDraft.predecessor === "Ring" || lineDraft.predecessor === "Flange" || lineDraft.predecessor === "Disc" || lineDraft.predecessor === "Rect Flange") && (
            <div className="qf-dim-row">
              <label className="field">
                <span>OD (mm)</span>
                <input min="0" onChange={(e) => updateLineDraft("od", e.target.value)} type="number" value={lineDraft.od} />
              </label>
              {lineDraft.predecessor !== "Disc" && (
                <label className="field">
                  <span>ID (mm)</span>
                  <input min="0" onChange={(e) => updateLineDraft("id", e.target.value)} type="number" value={lineDraft.id} />
                </label>
              )}
            </div>
          )}
          <div className="field">
            <span>Part description</span>
            <div className="qf-desc-field-row">
              <input
                onChange={(e) => updateLineDraft("part", e.target.value)}
                placeholder="PLATE 200 x 100"
                value={lineDraft.part}
                style={{ flex: 1 }}
              />
              <button
                className="qf-desc-btn"
                onClick={() => {
                  const generated = calcPartDescription(lineDraft, holeRows);
                  if (!lineDraft.part.trim() || lineDraft.part.trim().length <= 1) {
                    updateLineDraft("part", generated);
                  } else if (window.confirm("Replace existing description?")) {
                    updateLineDraft("part", generated);
                  }
                }}
                title="Auto-generate from shape and dimensions"
                type="button"
              >
                Description
              </button>
            </div>
          </div>
          <label className="field">
            <span>Material</span>
            <select onChange={(e) => selectMaterialRate(e.target.value)} value={lineDraft.materialRateId}>
              {materialRates.map((rate) => (
                <option key={rate.id} value={rate.id}>{getMaterialRateLabel(rate)}</option>
              ))}
            </select>
          </label>
          <label className="field"><span>Type</span><input readOnly value={lineDraft.materialType} /></label>
          <label className="field"><span>Thickness</span><input readOnly value={lineDraft.thickness} /></label>
          <label className="field"><span>Feed</span><input readOnly value={lineDraft.feed} /></label>
          <label className="field">
            <span>Qty</span>
            <input min="1" onChange={(e) => updateLineDraft("qty", e.target.value)} type="number" value={lineDraft.qty} />
          </label>
          <label className="field">
            <span>Cut Rate</span>
            <input min="0" onChange={(e) => updateLineDraft("cut", e.target.value)} step="0.01" type="number" value={lineDraft.cut} />
          </label>
          <label className="field"><span>Cost per M2</span><input readOnly value={lineDraft.costPerM2} /></label>
          <label className="field">
            <span>Piercing Rate</span>
            <input min="0" onChange={(e) => updateLineDraft("pierce", e.target.value)} step="0.01" type="number" value={lineDraft.pierce} />
          </label>
          <div className="quote-line-total">
            <span>Line total</span>
            <strong>{currency.format(draftLine.total)}</strong>
          </div>
        </div>
      </aside>

      {/* ── Line items table ── */}
      <div className="qf-lines-heading">
        <div className="qf-calc-tabs" style={{ flex: 1 }}>
          <button aria-selected={detailTab !== "others"} className="qf-calc-tab" onClick={() => setDetailTab("detail")} type="button">Detail</button>
          <button aria-selected={detailTab === "others"} className="qf-calc-tab" onClick={() => setDetailTab("others")} type="button">Others</button>
          <button className="qf-calc-tab" type="button">Holes</button>
          <button className="qf-calc-tab" type="button">Advanced</button>
        </div>
        <span className="qf-label" style={{ padding: "0 12px" }}>Minimum Cutting Charge</span>
        <button className="qf-dup-btn" type="button">DUPLICATE</button>
      </div>
      <div className="quote-lines-table table-wrap">
        <table className="qf-lines-tbl">
          <thead>
            <tr>
              {/* S_No | Program No | Customers Part No | CC_CostCode | Part Description | Thick | Material | Qty | Free Material | TMaterialCost | U_Cutting Cost | TOtherSales | Sales Amount | Status */}
              <th>S/N</th><th>Prog. No</th><th>Part number</th><th>CC</th>
              <th style={{ minWidth: 220 }}>Description</th>
              <th>mm</th><th>Material</th><th>Qty</th>
              <th>SUPPL</th><th>Matrl</th><th>Rate</th><th>Other</th><th>Total$</th>
              <th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr
                aria-current={selectedLineIndex === index ? "true" : undefined}
                key={`${line.part}-${index}`}
                onClick={() => setSelectedLineIndex(index)}
              >
                <td>{index}</td>
                <td>{1372916 + index}</td>
                <td className="qf-muted">PART NUMBER</td>
                <td>CC</td>
                <td style={{ textAlign: "left" }}>{line.part}</td>
                <td>{line.thickness.replace(" mm","")}</td>
                <td>{line.material}</td>
                <td>{line.qty}</td>
                <td>NO</td>
                <td>{currency.format(line.costPerM2 ?? 0)}</td>
                <td>{currency.format(line.cut)}</td>
                <td>{detailTab === "others" ? "OTHERS" : ""}</td>
                <td>{currency.format(line.total)}</td>
                <td>{(() => {
                  const s = lineStatuses[index] ?? "Q";
                  return (
                    <select
                      value={s}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); setLineStatuses(prev => ({ ...prev, [index]: e.target.value })); }}
                      style={{ background: lineStatusColor[s] ?? "#555", color: "#fff", border: "none", borderRadius: 3, fontWeight: 700, padding: "2px 4px", cursor: "pointer", width: "100%" }}
                    >
                      {LINE_STATUSES.map(o => <option key={o.value} value={o.value} style={{ background: "#fff", color: "#333" }}>{o.value}</option>)}
                    </select>
                  );
                })()}</td>
                <td className="qf-del-cell">
                  <button className="qf-edit-btn" onClick={(e) => { e.stopPropagation(); openEditLineForm(index); }} title="Edit" type="button">✎</button>
                  <span style={{ margin: "0 2px", color: "#ccc" }}>|</span>
                  <span className="qf-del-x">✕</span>
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr><td className="empty-table-cell" colSpan={15}>No line items yet. Click + Add Line to begin.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div className="qf-footer">
        {/* NOTES */}
        <div className="qf-notes-col">
          <div className="qf-section-head">NOTES</div>
          <textarea onChange={(e) => setQuoteComments(e.target.value)} placeholder="Quote Notes" value={quoteComments} />
        </div>

        {/* Delivery Notes | Quote Delivery | Summary table */}
        <div className="qf-delivery-col">
          <div className="qf-delivery-top">
            <div style={{ flex: 1 }}>
              <div className="qf-label" style={{ padding: "3px 6px" }}>Delivery Notes :</div>
              <textarea placeholder="Quote Delivery" style={{ width: "100%", minHeight: 40, border: "none", background: "transparent", fontSize: 10, padding: "3px 6px" }} />
            </div>
          </div>
          <table className="qf-summary-table">
            <thead>
              <tr><th></th><th>Material</th><th>Total</th><th>Weight</th><th>Time</th></tr>
            </thead>
            <tbody>
              <tr>
                <td className="qf-row-label">Laser :</td>
                <td>{currency.format(lines.reduce((s, l) => s + (l.costPerM2 ?? 0), 0))}</td>
                <td>{currency.format(lines.reduce((s, l) => s + l.total, 0))}</td>
                <td>0</td>
                <td>{lines.reduce((s, l) => s + l.total / 30, 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="qf-row-label">Plasma :</td>
                <td>0</td><td></td><td></td><td></td>
              </tr>
            </tbody>
          </table>
          <div className="qf-valid-row"><span>Quote Valid for :</span><span>QUOTE IS VALID FOR 30 DAYS</span></div>
          <div className="qf-valid-row"><span>Approved by :</span><span></span></div>
        </div>

        {/* Subtotal / Delivery / Total Del Inc / GST / Total GST Inc */}
        <div className="qf-totals-col">
          <div><span>Subtotal :</span><strong>{currency.format(quote.total)}</strong></div>
          <div><span>Delivery :</span><strong>{currency.format(quote.delivery ?? 0)}</strong></div>
          <div><span>Total Del. Inc. :</span><strong>{currency.format(quote.total + (quote.delivery ?? 0))}</strong></div>
          <div><span>GST :</span><strong>{currency.format(gst)}</strong></div>
          <div><span>Total GST Inc. :</span><strong>{currency.format(totalIncGst)}</strong></div>
        </div>

        {/* Cost Amount (Del___Total_Material Cost) */}
        <div className="qf-cost-col">
          <div className="qf-section-head">Cost Amount</div>
          <strong>{currency.format(lines.reduce((s, l) => s + (l.costPerM2 ?? 0) * l.qty, 0))}</strong>
        </div>
      </div>
    </article>
  );
}

function PagePanel({
  actionLabel,
  children,
  eyebrow,
  hideHeading = false,
  onAction,
  title,
}: {
  actionLabel: string;
  children: React.ReactNode;
  eyebrow: string;
  hideHeading?: boolean;
  onAction?: () => void;
  title: string;
}) {
  return (
    <article className="page-panel">
      {!hideHeading && <PanelHeading actionLabel={actionLabel} eyebrow={eyebrow} onAction={onAction} title={title} />}
      {children}
    </article>
  );
}

function PanelHeading({
  actionLabel,
  eyebrow,
  onAction,
  title,
}: {
  actionLabel: string;
  eyebrow: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <div className="panel-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {actionLabel && (
        <button className="primary-action" onClick={onAction} type="button">
          <Plus size={16} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

function Toolbar({
  onChange,
  placeholder,
  value,
}: {
  onChange?: (value: string) => void;
  placeholder: string;
  value?: string;
}) {
  return (
    <div className="toolbar">
      <Search size={18} />
      <input
        aria-label={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

function Field({
  fieldId,
  label,
  onChange,
  rows,
  value,
}: {
  fieldId: string;
  label: string;
  onChange?: (value: string) => void;
  rows?: number;
  value: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {rows ? (
        <textarea
          data-testid={`customer-${fieldId}`}
          onChange={(event) => onChange?.(event.target.value)}
          readOnly={!onChange}
          rows={rows}
          value={value}
        />
      ) : (
        <input
          data-testid={`customer-${fieldId}`}
          onChange={(event) => onChange?.(event.target.value)}
          readOnly={!onChange}
          value={value}
        />
      )}
    </label>
  );
}

function DataTable({
  columns,
  compact = false,
  emptyMessage,
  onRowClick,
  rows,
}: {
  columns: string[];
  compact?: boolean;
  emptyMessage?: string;
  onRowClick?: (index: number) => void;
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <div className="table-wrap">
      <table className={compact ? "data-table compact" : "data-table"}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="empty-table-cell" colSpan={columns.length}>{emptyMessage ?? "No records found."}</td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={onRowClick ? () => onRowClick(rowIndex) : undefined}
                style={onRowClick ? { cursor: "pointer" } : undefined}
              >
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
