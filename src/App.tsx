import { useEffect, useMemo, useRef, useState } from "react";
import { analyseDxf } from "./dxfUtils";
import { createSvgString } from "@dxfom/svg";
import { parseDxfFileString } from "@dxfom/dxf";
import {
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  ClipboardList,
  Factory,
  FileText,
  Gauge,
  Inbox,
  PackageCheck,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import { materialRates, type MaterialRate } from "./materialRates";

type PageId = "dashboard" | "contacts" | "quotes" | "jobs" | "materials" | "purchases" | "invoices" | "requests" | "settings";

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
  successor?: string;
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
  successor: string;
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
  { id: "requests", title: "Requests", description: "Client portal quote requests", icon: Inbox },
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
    successor: "To Email",
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
    successor: draft.successor,
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

const STATUS_COLOR: Record<string, string> = {
  approved: "#3a7d2a", sent: "#b87a00", draft: "#555", review: "#a04000",
  inactive: "#999", lost: "#c0392b", pending: "#b87a00", internal: "#555",
};

export function App() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [contactTypes, setContactTypes] = useState<ContactTypeOption[]>(defaultContactTypes);
  const [successorOptions, setSuccessorOptions] = useState<string[]>(() =>
    loadFromLS(LS_SUCCESSOR_OPTIONS, DEFAULT_SUCCESSOR_OPTIONS)
  );

  const saveSuccessorOptions = (options: string[]) => {
    setSuccessorOptions(options);
    localStorage.setItem(LS_SUCCESSOR_OPTIONS, JSON.stringify(options));
  };

  const [bizProfile, setBizProfile] = useState<BusinessProfile>(() =>
    loadFromLS(LS_BIZ_PROFILE, DEFAULT_BIZ_PROFILE)
  );
  const saveBizProfile = (p: BusinessProfile) => {
    setBizProfile(p);
    localStorage.setItem(LS_BIZ_PROFILE, JSON.stringify(p));
  };
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
        {activePage === "quotes" && <QuotesPage successorOptions={successorOptions} bizProfile={bizProfile} />}
        {activePage === "jobs" && <JobsPage />}
        {activePage === "materials" && <MaterialsPage />}
        {activePage === "purchases" && <PurchasesPage />}
        {activePage === "invoices" && <InvoicesPage />}
        {activePage === "requests" && <PortalRequestsPage onGoToQuotes={() => setActivePage("quotes")} />}
        {activePage === "settings" && <SettingsPage contactTypes={contactTypes} onContactTypesChange={setContactTypes} successorOptions={successorOptions} onSuccessorOptionsChange={saveSuccessorOptions} bizProfile={bizProfile} onBizProfileChange={saveBizProfile} />}
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
  const [contactRecords, setContactRecords] = useState<Contact[]>(() => loadFromLS(LS_CONTACTS, contacts));
  const [searchQuery, setSearchQuery] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Contact>(contacts[0]);
  const [customerDetailTab, setCustomerDetailTab] = useState<"details" | "staff" | "delivery" | "notes">("details");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [inviteMsg, setInviteMsg] = useState("");
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
    setContactRecords((current) => {
      const next = current.map((contact) => (contact.id === nextCustomer.id ? nextCustomer : contact));
      localStorage.setItem(LS_CONTACTS, JSON.stringify(next));
      return next;
    });
    setNewNoteText("");
    setCustomerDetailTab("notes");
  };

  const removeContactNote = (noteId: string) => {
    const nextCustomer = {
      ...selectedCustomer,
      notesHistory: selectedCustomer.notesHistory.filter((note) => note.id !== noteId),
    };

    setSelectedCustomer(nextCustomer);
    setContactRecords((current) => {
      const next = current.map((contact) => (contact.id === nextCustomer.id ? nextCustomer : contact));
      localStorage.setItem(LS_CONTACTS, JSON.stringify(next));
      return next;
    });
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
      const next = existingIndex === -1
        ? [selectedCustomer, ...current]
        : current.map((contact) => (contact.id === selectedCustomer.id ? selectedCustomer : contact));
      localStorage.setItem(LS_CONTACTS, JSON.stringify(next));
      return next;
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

            <section className="portal-invite-section">
              <h3>Client Portal Access</h3>
              <p style={{ fontSize: 12, color: "#666", margin: "4px 0 10px" }}>
                Send an invite so this client can log in, upload DXF files and submit quote requests online.
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Invite will be sent to:</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedCustomer.email || <span style={{ color: "#c0392b" }}>No email on file — add one above first</span>}</div>
                </div>
                <button
                  className="portal-invite-btn"
                  disabled={!selectedCustomer.email || inviteStatus === "sending" || !supabase}
                  type="button"
                  onClick={async () => {
                    if (!supabase || !selectedCustomer.email) return;
                    setInviteStatus("sending");
                    const redirectTo = `${window.location.origin}/portal`;
                    const { error } = await supabase.auth.signInWithOtp({
                      email: selectedCustomer.email,
                      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
                    });
                    if (error) {
                      setInviteStatus("error");
                      setInviteMsg(error.message);
                    } else {
                      setInviteStatus("sent");
                      setInviteMsg(`Invite sent to ${selectedCustomer.email}`);
                    }
                    setTimeout(() => setInviteStatus("idle"), 5000);
                  }}
                >
                  {inviteStatus === "sending" ? "Sending…" : inviteStatus === "sent" ? "✓ Invite Sent!" : "Send Portal Invite"}
                </button>
              </div>
              {inviteMsg && (
                <div className={`portal-invite-msg portal-invite-msg--${inviteStatus}`}>{inviteMsg}</div>
              )}
              <div style={{ marginTop: 8, fontSize: 11, color: "#999" }}>
                Portal URL: <strong>{window.location.origin}/portal</strong>
              </div>
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
const LS_SUCCESSOR_OPTIONS = "msf_successor_options";
const LS_BIZ_PROFILE = "msf_biz_profile";
const LS_CONTACTS = "msf_contacts";

type BusinessProfile = {
  name: string;
  tagline: string;
  abn: string;
  acn: string;
  address: string;
  poBox: string;
  phone: string;
  email: string;
  banking: string;
  paymentTerms: string;
  validity: string;
  disclaimer: string;
  logoBase64: string;
};

const DEFAULT_BIZ_PROFILE: BusinessProfile = {
  name: "MySwiftFab",
  tagline: "LASER CUTTING | PLASMA CUTTING | FABRICATION",
  abn: "",
  acn: "",
  address: "",
  poBox: "",
  phone: "",
  email: "",
  banking: "",
  paymentTerms: "NET 30 DAYS EOM",
  validity: "DAY OF QUOTE",
  disclaimer: "*ALL QUOTES ARE SUBJECT TO MATERIAL COST & AVAILABILITY AT TIME OF ORDER.",
  logoBase64: "",
};

const DEFAULT_SUCCESSOR_OPTIONS = ["To Email", "To Drawing"];

function loadFromLS<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function QuotesPage({ successorOptions, bizProfile }: { successorOptions: string[]; bizProfile: BusinessProfile }) {
  const [view, setView] = useState<"list" | "form">("list");
  const [quoteRecords, setQuoteRecords] = useState<QuoteRecord[]>(() => loadFromLS(LS_QUOTES, quotes));
  const [currentQuote, setCurrentQuote] = useState<QuoteRecord>(() => { const saved = loadFromLS<QuoteRecord[]>(LS_QUOTES, quotes); return saved[0] ?? quotes[0]; });
  const [quoteLineRecords, setQuoteLineRecords] = useState<Record<string, QuoteLine[]>>(() =>
    loadFromLS(LS_LINES, { [quotes[0].quote]: quoteLines })
  );
  const [quoteSearchQuery, setQuoteSearchQuery] = useState("");
  const normalizedQuoteSearch = quoteSearchQuery.trim().toLowerCase();
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

  const createNewQuote = () => {
    const newQuote = createNewQuoteRecord(quoteRecords, "", "");
    setQuoteRecords((prev) => [newQuote, ...prev]);
    setQuoteLineRecords((prev) => ({ ...prev, [newQuote.quote]: [] }));
    setQuoteSearchQuery("");
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
        onSave={saveQuote}
        savedOthers={loadFromLS(LS_OTHERS + "_" + currentQuote.quote, {})}
        successorOptions={successorOptions}
        bizProfile={bizProfile}
      />
    );
  }

  return (
    <PagePanel eyebrow="Estimator" title="Quote Register" actionLabel="+ New Quote" onAction={createNewQuote}>
      <Toolbar
        onChange={setQuoteSearchQuery}
        placeholder="Search quote number or client"
        value={quoteSearchQuery}
      />
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

// ── Portal Requests Page ──────────────────────────────────────────────────

type PortalRequest = {
  id: string;
  created_at: string;
  client_email: string;
  client_name: string | null;
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
  status: "pending" | "reviewed" | "quoted" | "rejected";
  staff_notes: string | null;
};

function PortalRequestsPage({ onGoToQuotes }: { onGoToQuotes: () => void }) {
  const [requests, setRequests] = useState<PortalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PortalRequest | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "quoted" | "rejected">("all");
  const [staffNotes, setStaffNotes] = useState("");
  const [converting, setConverting] = useState(false);
  const [convertMsg, setConvertMsg] = useState("");

  const fetchRequests = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("portal_quotes")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests((data ?? []) as PortalRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    if (!supabase) return;
    const channel = supabase
      .channel("portal-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_quotes" }, fetchRequests)
      .subscribe();
    return () => { supabase?.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (selected) setStaffNotes(selected.staff_notes ?? "");
  }, [selected?.id]);

  const updateStatus = async (req: PortalRequest, status: PortalRequest["status"]) => {
    if (!supabase) return;
    await supabase.from("portal_quotes").update({ status, staff_notes: staffNotes }).eq("id", req.id);
    setSelected(s => s ? { ...s, status, staff_notes: staffNotes } : s);
    fetchRequests();
  };

  const convertToQuote = async (req: PortalRequest) => {
    if (!supabase) return;
    setConverting(true);
    setConvertMsg("");

    // Find matching material rate
    const rate = materialRates.find(r =>
      r.material.toLowerCase().includes(req.material.toLowerCase()) &&
      Math.abs((r.thickness ?? 0) - parseFloat(req.thickness)) < 0.1
    );

    const cutRatePerM = rate?.cutRate ?? 5;
    const costPerM2 = rate?.costPerM2 ?? 0;
    const cutLengthM = req.cut_length / 1000;
    const plateM2 = (req.plate_width / 1000) * (req.plate_height / 1000);
    const materialCost = plateM2 * costPerM2 * req.qty;
    const cuttingCost = cutLengthM * cutRatePerM * req.qty;
    const piercing = (req.pierce_count ?? 0) * 0.20;
    const total = materialCost + cuttingCost + piercing;

    const newQuoteId = `PQ-${Date.now()}`;
    const { error } = await supabase.from("portal_quotes").update({
      status: "quoted",
      staff_notes: staffNotes,
    }).eq("id", req.id);

    if (error) { setConvertMsg(`Error: ${error.message}`); setConverting(false); return; }

    // Save to localStorage so QuotesPage picks it up
    const LS_QUOTES = "msf_quotes";
    const existingQuotes: QuoteRecord[] = JSON.parse(localStorage.getItem(LS_QUOTES) ?? "[]");
    const newQuote: QuoteRecord = {
      quote: newQuoteId,
      client: req.client_email,
      contact: req.client_name ?? req.client_email,
      status: "Q",
      lines: 1,
      total,
      margin: "30%",
      date: new Date().toISOString().slice(0, 10),
    };
    localStorage.setItem(LS_QUOTES, JSON.stringify([newQuote, ...existingQuotes]));

    const LS_LINES = "msf_quote_lines";
    const existingLines: Record<string, QuoteLine[]> = JSON.parse(localStorage.getItem(LS_LINES) ?? "{}");
    const newLine: QuoteLine = {
      part: `PLATE ${req.plate_width} x ${req.plate_height}${req.holes?.length > 0 ? " WITH HOLES" : ""}`,
      material: req.material,
      thickness: req.thickness,
      qty: req.qty,
      cut: cuttingCost / req.qty,
      pierce: piercing / req.qty,
      total,
      costPerM2,
      predecessor: "Plate",
      side1: req.plate_width,
      side2: req.plate_height,
    };
    localStorage.setItem(LS_LINES, JSON.stringify({ ...existingLines, [newQuoteId]: [newLine] }));

    setConverting(false);
    setConvertMsg(`✅ Quote ${newQuoteId} created!`);
    setSelected(s => s ? { ...s, status: "quoted" } : s);
    fetchRequests();
    setTimeout(() => { onGoToQuotes(); }, 1200);
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === "pending").length;

  if (!supabase) {
    return (
      <div style={{ padding: 32, color: "#888", textAlign: "center", gridColumn: "1 / -1" }}>
        Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local
      </div>
    );
  }

  return (
    <section className="customer-workspace">
      {/* Left: request list */}
      <article className="customer-list-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Portal</p>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Requests {pendingCount > 0 && <span className="req-badge">{pendingCount} new</span>}
            </h2>
          </div>
        </div>
        <div className="req-filter-bar">
          {(["all","pending","reviewed","quoted","rejected"] as const).map(f => (
            <button key={f} className={`req-filter-btn${filter === f ? " req-filter-btn--active" : ""}`} onClick={() => setFilter(f)} type="button">
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: 24, color: "#888", textAlign: "center" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, color: "#aaa", textAlign: "center", fontSize: 13 }}>No {filter === "all" ? "" : filter} requests</div>
        ) : (
          <div className="customer-list">
            {filtered.map(req => (
              <button
                key={req.id}
                className={`customer-list-item${selected?.id === req.id ? " req-selected" : ""}`}
                onClick={() => setSelected(req)}
                type="button"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span className="customer-name" style={{ fontSize: 12 }}>{req.client_email}</span>
                  <span className={`req-status-pill req-status-pill--${req.status}`}>{req.status}</span>
                </div>
                <span style={{ fontSize: 11, color: "#667" }}>{req.file_name}</span>
                <span style={{ fontSize: 11, color: "#999" }}>{new Date(req.created_at).toLocaleDateString("en-AU", { day:"2-digit", month:"short", year:"numeric" })}</span>
              </button>
            ))}
          </div>
        )}
      </article>

      {/* Right: detail panel */}
      <article className="customer-detail-panel">
        {!selected ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#aaa", fontSize: 14 }}>
            Select a request to review
          </div>
        ) : (
          <div className="req-detail">
            <div className="req-detail-header">
              <div>
                <p className="eyebrow">Portal Request</p>
                <h2 style={{ fontSize: 16, margin: "4px 0 2px" }}>{selected.file_name}</h2>
                <div style={{ fontSize: 12, color: "#667" }}>{selected.client_email} · {new Date(selected.created_at).toLocaleString("en-AU")}</div>
              </div>
              <span className={`req-status-pill req-status-pill--${selected.status}`} style={{ fontSize: 12 }}>{selected.status.toUpperCase()}</span>
            </div>

            {/* DXF analysis results */}
            <div className="req-analysis-grid">
              <div className="req-metric"><span>Plate Size</span><strong>{selected.plate_width} × {selected.plate_height} mm</strong></div>
              <div className="req-metric"><span>Cut Length</span><strong>{(selected.cut_length / 1000).toFixed(2)} m</strong></div>
              <div className="req-metric"><span>Pierces</span><strong>{selected.pierce_count}</strong></div>
              <div className="req-metric"><span>Material</span><strong>{selected.material}</strong></div>
              <div className="req-metric"><span>Thickness</span><strong>{selected.thickness} mm</strong></div>
              <div className="req-metric"><span>Qty</span><strong>{selected.qty}</strong></div>
              {selected.holes?.length > 0 && (
                <div className="req-metric" style={{ gridColumn: "1 / -1" }}>
                  <span>Detected Holes</span>
                  <strong>{selected.holes.map(h => `${h.qty}× Ø${h.dia}mm`).join("  ·  ")}</strong>
                </div>
              )}
            </div>

            {/* Cost estimate */}
            <div className="req-cost-estimate">
              <div className="req-cost-title">Estimated Cost (from material rates)</div>
              {(() => {
                const rate = materialRates.find(r =>
                  r.material.toLowerCase().includes(selected.material.toLowerCase()) &&
                  Math.abs((r.thickness ?? 0) - parseFloat(selected.thickness)) < 0.1
                );
                const cutRate = rate?.cutRate ?? 5;
                const m2Rate = rate?.costPerM2 ?? 0;
                const cutM = selected.cut_length / 1000;
                const plateM2 = (selected.plate_width / 1000) * (selected.plate_height / 1000);
                const matCost = plateM2 * m2Rate * selected.qty;
                const cutCost = cutM * cutRate * selected.qty;
                const piercing = (selected.pierce_count ?? 0) * 0.20;
                const total = matCost + cutCost + piercing;
                return (
                  <div className="req-cost-rows">
                    <div><span>Material ({m2Rate > 0 ? `$${m2Rate}/m²` : "rate not found"})</span><span>{currency.format(matCost)}</span></div>
                    <div><span>Cutting ({cutM.toFixed(2)}m × ${cutRate}/m)</span><span>{currency.format(cutCost)}</span></div>
                    <div><span>Piercing ({selected.pierce_count} × $0.20)</span><span>{currency.format(piercing)}</span></div>
                    <div className="req-cost-total"><span>Estimated Total</span><span>{currency.format(total)}</span></div>
                  </div>
                );
              })()}
            </div>

            {/* Client notes */}
            {selected.notes && (
              <div className="req-client-notes">
                <div className="req-section-label">Client Notes</div>
                <div style={{ fontSize: 13, color: "#334", lineHeight: 1.5 }}>{selected.notes}</div>
              </div>
            )}

            {/* Staff notes */}
            <div style={{ padding: "0 20px 12px" }}>
              <div className="req-section-label">Staff Notes</div>
              <textarea
                className="req-staff-notes"
                placeholder="Add internal notes about this request…"
                rows={3}
                value={staffNotes}
                onChange={e => setStaffNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            {convertMsg && <div className="req-convert-msg">{convertMsg}</div>}
            <div className="req-actions">
              {selected.status === "pending" && (
                <button className="secondary-action" onClick={() => updateStatus(selected, "reviewed")} type="button">Mark Reviewed</button>
              )}
              {selected.status !== "rejected" && selected.status !== "quoted" && (
                <button className="secondary-action req-reject-btn" onClick={() => updateStatus(selected, "rejected")} type="button">Reject</button>
              )}
              <button
                className="primary-action"
                disabled={converting || selected.status === "quoted"}
                onClick={() => convertToQuote(selected)}
                style={{ marginLeft: "auto" }}
                type="button"
              >
                {converting ? "Creating Quote…" : selected.status === "quoted" ? "✓ Quote Created" : "Convert to Quote →"}
              </button>
            </div>
          </div>
        )}
      </article>
    </section>
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
  successorOptions,
  onSuccessorOptionsChange,
  bizProfile,
  onBizProfileChange,
}: {
  contactTypes: ContactTypeOption[];
  onContactTypesChange: (contactTypes: ContactTypeOption[]) => void;
  successorOptions: string[];
  onSuccessorOptionsChange: (options: string[]) => void;
  bizProfile: BusinessProfile;
  onBizProfileChange: (p: BusinessProfile) => void;
}) {
  const biz = (field: keyof BusinessProfile, value: string) => onBizProfileChange({ ...bizProfile, [field]: value });
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
            <div className="settings-section-heading">
              <div>
                <h3>Successor Options</h3>
                <p>These values appear in the Successor dropdown when adding or editing a quote line item.</p>
              </div>
              <button className="secondary-action" onClick={() => onSuccessorOptionsChange([...successorOptions, "New Option"])} type="button">
                <Plus size={16} />
                <span>Add Option</span>
              </button>
            </div>
            <div className="lookup-list">
              {successorOptions.map((option, index) => (
                <div className="lookup-row" key={index}>
                  <input
                    aria-label={`Successor option ${option}`}
                    onChange={(e) => {
                      const next = [...successorOptions];
                      next[index] = e.target.value;
                      onSuccessorOptionsChange(next);
                    }}
                    value={option}
                  />
                  <button
                    className="row-icon-button"
                    onClick={() => onSuccessorOptionsChange(successorOptions.filter((_, i) => i !== index))}
                    title="Remove option"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3>Business Profile &amp; Print Header</h3>
            <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>This information appears on every quote printout.</p>
            <div className="form-grid two">
              <label className="field"><span>Business Name</span><input value={bizProfile.name} onChange={e => biz("name", e.target.value)} /></label>
              <label className="field"><span>Tagline (footer)</span><input value={bizProfile.tagline} onChange={e => biz("tagline", e.target.value)} /></label>
              <label className="field"><span>ABN</span><input value={bizProfile.abn} onChange={e => biz("abn", e.target.value)} /></label>
              <label className="field"><span>ACN</span><input value={bizProfile.acn} onChange={e => biz("acn", e.target.value)} /></label>
              <label className="field"><span>Address</span><input value={bizProfile.address} onChange={e => biz("address", e.target.value)} /></label>
              <label className="field"><span>PO Box / Postal</span><input value={bizProfile.poBox} onChange={e => biz("poBox", e.target.value)} /></label>
              <label className="field"><span>Phone</span><input value={bizProfile.phone} onChange={e => biz("phone", e.target.value)} /></label>
              <label className="field"><span>Email</span><input value={bizProfile.email} onChange={e => biz("email", e.target.value)} /></label>
              <label className="field"><span>Banking Details</span><input value={bizProfile.banking} onChange={e => biz("banking", e.target.value)} /></label>
              <label className="field"><span>Payment Terms</span><input value={bizProfile.paymentTerms} onChange={e => biz("paymentTerms", e.target.value)} /></label>
              <label className="field"><span>Quote Validity</span><input value={bizProfile.validity} onChange={e => biz("validity", e.target.value)} /></label>
            </div>
            <label className="field" style={{ marginTop: 8 }}><span>Disclaimer (printed on last page)</span><textarea rows={2} style={{ width: "100%", fontFamily: "inherit", fontSize: 12, padding: 4 }} value={bizProfile.disclaimer} onChange={e => biz("disclaimer", e.target.value)} /></label>
            <label className="field" style={{ marginTop: 8 }}>
              <span>Company Logo (for printout)</span>
              <input type="file" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => biz("logoBase64", ev.target?.result as string ?? "");
                reader.readAsDataURL(file);
              }} />
              {bizProfile.logoBase64 && <img src={bizProfile.logoBase64} alt="Logo preview" style={{ height: 48, marginTop: 6, objectFit: "contain" }} />}
            </label>
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
  onSave,
  savedOthers,
  quote = quotes[0],
  successorOptions = DEFAULT_SUCCESSOR_OPTIONS,
  bizProfile = DEFAULT_BIZ_PROFILE,
}: {
  compact?: boolean;
  lines?: QuoteLine[];
  onAddLine?: (line: QuoteLine) => void;
  onUpdateLine?: (index: number, line: QuoteLine) => void;
  onBack?: () => void;
  onSave?: (lineOthers: Record<number, OtherLineItem[]>) => void;
  savedOthers?: Record<number, OtherLineItem[]>;
  quote?: QuoteRecord;
  successorOptions?: string[];
  bizProfile?: BusinessProfile;
}) {
  const [isLineFormOpen, setIsLineFormOpen] = useState(false);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [lineDraft, setLineDraft] = useState<QuoteLineDraft>(createBlankQuoteLineDraft);
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [activeQuoteTab, setActiveQuoteTab] = useState<"lines">("lines");
  const [showOthersPanel, setShowOthersPanel] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState(quote.client);
  const selectedClient = contacts.find((contact) => contact.company === selectedClientName) ?? contacts[0];
  const [selectedStaffName, setSelectedStaffName] = useState(quote.contact);
  const [quoteComments, setQuoteComments] = useState("");
  const [lineOthers, setLineOthers] = useState<Record<number, OtherLineItem[]>>(savedOthers ?? {});
  const [lineHoles, setLineHoles] = useState<Record<number, HoleRow[]>>({});
  const [lineDxfText, setLineDxfText] = useState<Record<number, string>>({});
  const [dxfViewIndex, setDxfViewIndex] = useState<number | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  useEffect(() => {
    if (!showPrint) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        setShowPrint(false);
      });
    });
    return () => cancelAnimationFrame(id);
  }, [showPrint]);
  const [dxfLoading, setDxfLoading] = useState(false);
  const [dxfFileName, setDxfFileName] = useState("");
  const dxfInputRef = useRef<HTMLInputElement>(null);
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

  // Density defaults (kg/m³) used when material rate has no density set
  const DENSITY_DEFAULTS: Record<string, number> = {
    "M/S": 7850, "MS": 7850, "MILD STEEL": 7850,
    "SS": 7900, "STAINLESS": 7900, "S/S": 7900,
    "AL": 2700, "ALI": 2700, "ALUMINIUM": 2700, "ALUMINUM": 2700,
    "COP": 8960, "COPPER": 8960,
    "BRASS": 8500,
  };

  function getMaterialDensity(): number {
    const matKey = lineDraft.material.toUpperCase().trim();
    const rate = materialRates.find(r => r.material === lineDraft.material);
    if (rate?.density) return rate.density;
    return DENSITY_DEFAULTS[matKey] ?? 7850;
  }

  function calcHoleWeight(h: HoleRow): string {
    if (h.holeType !== "Laser Cut Holes") return "—";
    const dia = Number(h.dia) || 0;
    const qty = Number(h.qty) || 0;
    const thickness = parseFloat(lineDraft.thickness) || 0;
    const density = getMaterialDensity();
    if (!dia || !qty || !thickness) return "—";
    const weight = Math.round(((3.1416 * dia * dia / 4) * qty * thickness * density) / 1000000000 * 100) / 100;
    return weight.toFixed(2);
  }
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const selectedStaff = selectedClient.staff.find((staffMember) => staffMember.name === selectedStaffName) ?? selectedClient.staff[0];
  const selectedLine = lines[selectedLineIndex] ?? null;
  const gst = quote.total * 0.1;
  const totalIncGst = quote.total + gst;
  const currentOthers = lineOthers[selectedLineIndex] ?? [];
  const othersCostTotal = currentOthers.reduce((s, o) => s + o.cost * o.qty, 0);
  const othersAmountTotal = currentOthers.reduce((s, o) => s + o.cost * o.qty * (1 + o.markupPct / 100), 0);
  // All others / holes across the entire quote
  const allOthers = Object.entries(lineOthers).flatMap(([idx, rows]) =>
    rows.map(o => ({ ...o, lineIndex: Number(idx), lineLabel: lines[Number(idx)]?.part ?? `Line ${Number(idx)+1}` }))
  );
  const allHoles = Object.entries(lineHoles).flatMap(([idx, rows]) =>
    rows.map(h => ({ ...h, lineIndex: Number(idx), lineLabel: lines[Number(idx)]?.part ?? `Line ${Number(idx)+1}` }))
  );
  const totalOthersCount = allOthers.length;
  const totalHolesCount = allHoles.length;

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
      successor: line.successor ?? "",
      side1: String(line.side1 ?? ""),
      side2: String(line.side2 ?? ""),
      od: String(line.od ?? ""),
      id: String(line.id ?? ""),
    });
    setHoleRows(lineHoles[index] ?? []);
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
    setDxfFileName("");
  };

  const addLine = () => {
    if (!canAddLine) return;
    if (editingLineIndex !== null) {
      onUpdateLine?.(editingLineIndex, draftLine);
      setLineHoles(prev => ({ ...prev, [editingLineIndex]: holeRows }));
    } else {
      const newIndex = lines.length;
      onAddLine?.(draftLine);
      setLineHoles(prev => ({ ...prev, [newIndex]: holeRows }));
      setSelectedLineIndex(newIndex);
    }
    setHoleRows([]);
    closeLineForm();
  };

  const handleDxfUpload = async (file: File) => {
    setDxfLoading(true);
    setDxfFileName(file.name);
    try {
      // Read raw text for viewer before parsing
      const rawText = await file.text();
      const lineIdxForDxf = editingLineIndex !== null ? editingLineIndex : lines.length;
      setLineDxfText(prev => ({ ...prev, [lineIdxForDxf]: rawText }));
      const result = await analyseDxf(file);
      if (result.rawError) {
        alert(`Could not parse DXF: ${result.rawError}`);
        return;
      }
      // Auto-fill dimensions
      updateLineDraft("side1", String(result.plateWidth));
      updateLineDraft("side2", String(result.plateHeight));
      // Cut length → pierce count (stored in pierce field as a note for now)
      updateLineDraft("pierce", String(result.pierceCount));
      // Auto-set predecessor if not already set
      if (!lineDraft.predecessor || lineDraft.predecessor === "Plate") {
        updateLineDraft("predecessor", "Plate");
      }
      // Auto-fill holes
      if (result.holes.length > 0) {
        const newHoles = result.holes.map(h => ({
          id: crypto.randomUUID(),
          holeType: "Laser Cut Holes" as const,
          qty: String(h.qty),
          dia: String(h.dia),
          side1: "", side2: "", len: "", holeDesc: "", weight: "",
        }));
        setHoleRows(newHoles);
      }
      // Auto-generate description
      const draft = { ...lineDraft, side1: String(result.plateWidth), side2: String(result.plateHeight) };
      const desc = `PLATE ${result.plateWidth} x ${result.plateHeight}${result.holes.length > 0 ? " WITH HOLES" : ""}`;
      if (!lineDraft.part.trim()) updateLineDraft("part", desc);
    } finally {
      setDxfLoading(false);
    }
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
      successor: line.successor ?? "",
      side1: String(line.side1 ?? ""),
      side2: String(line.side2 ?? ""),
      od: String(line.od ?? ""),
      id: String(line.id ?? ""),
    };

    const generated = calcPartDescription(draft, lineHoles[selectedLineIndex] ?? []);

    if (line.part.trim().length <= 1) {
      onUpdateLine?.(selectedLineIndex, { ...line, part: generated });
    } else {
      if (window.confirm("It will replace text you already have in description. Are you sure?")) {
        onUpdateLine?.(selectedLineIndex, { ...line, part: generated });
      }
    }
  };

  const [quoteStatus, setQuoteStatus] = useState(quote.status);
  const statusBg = STATUS_COLOR[quoteStatus.toLowerCase()] ?? "#555";
  const statusOptions = ["Approved", "InActive", "Internal", "Lost", "Pending", "Sent", "Draft", "Review"];

  return (
    <article className="quote-panel">
      {/* ── Action bar ── */}
      {onBack && (
        <div className="qf2-bar">
          <button className="secondary-action" onClick={onBack} type="button">← Quote List</button>
          <div className="qf2-bar-sep" />
          <button className="primary-action" onClick={openLineForm} type="button">+ Add Line</button>
          <button className="qf2-others-bar-btn" onClick={() => setShowOthersPanel(true)} type="button">+ Add Others</button>
          {onSave && (
            <button className="qf-save-btn" onClick={() => { onSave(lineOthers); setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); }} type="button">
              {saveStatus === "saved" ? "✓ Saved" : "💾 Save"}
            </button>
          )}
          <button className="qf-print-btn" onClick={() => setShowPrint(true)} type="button">🖨 Print / PDF</button>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, fontSize: 13 }}>
            <span style={{ color: "#889", fontSize: 11 }}>QUOTE</span>
            <strong style={{ fontSize: 14 }}>{quote.quote}</strong>
            <span style={{ color: "#889", fontSize: 11, marginLeft: 8 }}>DATE</span>
            <span>{quote.date ?? "—"}</span>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="qf2-header">
        {/* Col 1: Client */}
        <div className="qf2-hcol">
          <div className="qf2-hlabel">Client</div>
          <select className="qf2-hselect" onChange={(e) => selectClientForQuote(e.target.value)} value={selectedClientName}>
            {contacts.filter((c) => splitContactTypes(c.kind).includes("Client")).map((c) => (
              <option key={c.id} value={c.company}>{c.company}</option>
            ))}
          </select>
          <div className="qf2-hsub">{selectedClient.billingAddress || "—"}</div>
          <div className="qf2-hsub" style={{ marginTop: 2 }}>{selectedClient.email || ""}</div>
        </div>

        {/* Col 2: Contact + Sales Staff */}
        <div className="qf2-hcol">
          <div className="qf2-hlabel">Contact person</div>
          <select className="qf2-hselect" onChange={(e) => setSelectedStaffName(e.target.value)} value={selectedStaff?.name ?? ""}>
            <option value="">— Select —</option>
            {selectedClient.staff.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
          <div className="qf2-hsub">{selectedStaff?.jobTitle ?? ""}{selectedStaff?.direct ? ` · ${selectedStaff.direct}` : ""}</div>
          <div style={{ marginTop: 10 }}>
            <div className="qf2-hlabel">Sales staff</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{quote.contact || "—"}</div>
          </div>
        </div>

        {/* Col 3: Delivery address */}
        <div className="qf2-hcol">
          <div className="qf2-hlabel">Delivery address</div>
          <input className="qf2-dinput" placeholder="Street" />
          <input className="qf2-dinput" placeholder="Suburb, State, Postcode" style={{ marginTop: 4 }} />
          <div className="qf2-hsub" style={{ marginTop: 4 }}>Leave blank to use billing address</div>
        </div>

        {/* Right: Status panel */}
        <div className="qf2-status-panel">
          <div className="qf2-srow" style={{ paddingTop: 10 }}>
            <span className="qf2-slabel">Status</span>
            <select
              style={{ background: statusBg, color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, padding: "4px 8px", cursor: "pointer" }}
              value={quoteStatus}
              onChange={(e) => setQuoteStatus(e.target.value)}
            >
              {statusOptions.map(s => <option key={s} value={s} style={{ background: "#fff", color: "#333" }}>{s.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="qf2-srow">
            <span className="qf2-slabel">Pre-invoice</span>
            <input type="checkbox" />
          </div>
          <div className="qf2-srow">
            <span className="qf2-slabel">Cash account</span>
            <input type="checkbox" />
          </div>
          <div className="qf2-srow">
            <span className="qf2-slabel">Sent</span>
            <input type="checkbox" />
          </div>
          <div className="qf2-srow" style={{ borderBottom: "none" }}>
            <span className="qf2-slabel">Min. cutting charge</span>
            <input type="checkbox" />
          </div>
        </div>
      </div>

      {/* Client notes strip */}
      {selectedClient.notes && (
        <div className="qf2-notes-strip">
          <span style={{ fontSize: 13, opacity: 0.7 }}>ℹ</span>
          <span>{selectedClient.notes}</span>
        </div>
      )}

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
          {/* ── DXF Upload ── */}
          <div className="qf-dxf-upload-zone" onClick={() => dxfInputRef.current?.click()}>
            <input
              ref={dxfInputRef}
              type="file"
              accept=".dxf"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await handleDxfUpload(file);
                e.target.value = "";
              }}
            />
            {dxfLoading ? (
              <span className="qf-dxf-loading">⏳ Analysing DXF...</span>
            ) : dxfFileName ? (
              <span className="qf-dxf-loaded">✅ {dxfFileName} — dimensions auto-filled</span>
            ) : (
              <span className="qf-dxf-prompt">📂 Click to upload DXF — auto-fills dimensions &amp; holes</span>
            )}
          </div>
          <div className="qf-dim-row">
            <label className="field" style={{ flex: 1 }}>
              <span>Predecessor</span>
              <select onChange={(e) => updateLineDraft("predecessor", e.target.value)} value={lineDraft.predecessor}>
                {PREDECESSOR_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>Successor</span>
              <select onChange={(e) => updateLineDraft("successor", e.target.value)} value={lineDraft.successor}>
                <option value="">— None —</option>
                {successorOptions.map((o) => <option key={o} value={o}>{o}</option>)}
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

      {/* ── Tab bar ── */}
      <div className="qf2-tab-bar">
        <button className={`qf2-tab${activeQuoteTab === "lines" ? " qf2-tab--active" : ""}`} onClick={() => setActiveQuoteTab("lines")} type="button">Lines</button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: 14, gap: 8, fontSize: 11, color: "#889" }}>
          {lines.length > 0 && (
            <span>{lines.length} line{lines.length !== 1 ? "s" : ""} · {[...new Set(lines.map(l => l.material))].join(", ")}</span>
          )}
        </div>
      </div>

      {/* ── Lines tab ── */}
      <div className="table-wrap" style={activeQuoteTab !== "lines" ? { display: "none" } : undefined}>
        <table className="qf2-lines-tbl">
          <thead>
            <tr>
              <th style={{ width: 32 }}>#</th>
              <th>Description</th>
              <th>mm</th>
              <th>Material</th>
              <th style={{ textAlign: "right" }}>Qty</th>
              <th style={{ textAlign: "right" }}>Matrl $</th>
              <th style={{ textAlign: "right" }}>Rate $</th>
              <th style={{ textAlign: "right" }}>Others $</th>
              <th style={{ textAlign: "right" }}>Total $</th>
              <th>Status</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const lineOthersAmt = (lineOthers[index] ?? []).reduce((s, o) => s + o.cost * o.qty * (1 + o.markupPct / 100), 0);
              const lineTotal = line.total + lineOthersAmt;
              const othersCount = (lineOthers[index] ?? []).length;
              const s = lineStatuses[index] ?? "Q";
              return (
                  <tr
                    aria-current={selectedLineIndex === index ? "true" : undefined}
                    className={selectedLineIndex === index ? "qf2-row-selected" : ""}
                    key={`${line.part}-${index}`}
                    onClick={() => setSelectedLineIndex(index)}
                  >
                    <td style={{ color: "#aaa", fontSize: 11 }}>{index + 1}</td>
                    <td>
                      <div className="qf2-line-desc">{line.part}</div>
                      <div className="qf2-line-sub">Prog. {1372916 + index} · CC</div>
                    </td>
                    <td>{line.thickness.replace(" mm", "")}</td>
                    <td><span className="qf2-mat-tag">{line.material}</span></td>
                    <td style={{ textAlign: "right" }}>{line.qty}</td>
                    <td style={{ textAlign: "right" }}>{currency.format(line.costPerM2 ?? 0)}</td>
                    <td style={{ textAlign: "right" }}>{currency.format(line.cut)}</td>
                    <td style={{ textAlign: "right" }}>
                      {lineOthersAmt > 0
                        ? <span className="qf2-others-amt">{currency.format(lineOthersAmt)}</span>
                        : <span className="qf2-others-empty">—</span>}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{currency.format(lineTotal)}</td>
                    <td>
                      <select
                        value={s}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); setLineStatuses(prev => ({ ...prev, [index]: e.target.value })); }}
                        className="qf2-status-sel"
                        style={{ background: lineStatusColor[s] ?? "#555" }}
                      >
                        {LINE_STATUSES.map(o => <option key={o.value} value={o.value} style={{ background: "#fff", color: "#333" }}>{o.value}</option>)}
                      </select>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button
                        className={`qf2-act-btn qf2-others-btn${othersCount > 0 ? " qf2-others-btn-active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedLineIndex(index); setShowOthersPanel(true); }}
                        title="Others"
                        type="button"
                      >
                        ⊕{othersCount > 0 ? ` ${othersCount}` : ""}
                      </button>
                      {lineDxfText[index] && (
                        <button className="qf2-act-btn qf2-dxf-view-btn" onClick={(e) => { e.stopPropagation(); setDxfViewIndex(index); }} title="View DXF" type="button">⬡</button>
                      )}
                      <button className="qf2-act-btn" onClick={(e) => { e.stopPropagation(); openEditLineForm(index); }} title="Edit" type="button">✎</button>
                      <button className="qf2-act-btn qf2-act-del" onClick={(e) => { e.stopPropagation(); }} title="Delete" type="button">✕</button>
                    </td>
                  </tr>
              );
            })}
            {lines.length === 0 && (
              <tr><td className="empty-table-cell" colSpan={11}>No line items yet — click + Add Line to begin.</td></tr>
            )}
          </tbody>
        </table>
      </div>


      {/* ── Others side panel ── */}
      {showOthersPanel && (
        <div className="qf-others-overlay" onClick={() => setShowOthersPanel(false)} />
      )}
      <div className={`qf-others-panel${showOthersPanel ? " qf-others-panel--open" : ""}`}>
        <div className="qf-others-panel-head">
          <div>
            <div className="qf-others-panel-title">Others</div>
            {lines[selectedLineIndex] && (
              <div className="qf-others-panel-sub">Line {selectedLineIndex + 1}: {lines[selectedLineIndex].part}</div>
            )}
          </div>
          <button className="qf-others-panel-close" onClick={() => setShowOthersPanel(false)} type="button">✕</button>
        </div>

        {/* Line selector */}
        {lines.length > 1 && (
          <div style={{ padding: "8px 16px", borderBottom: "1px solid #e3e8ee" }}>
            <select
              style={{ width: "100%", font: "inherit", fontSize: 12, padding: "4px 6px", border: "1px solid #dde3ea", borderRadius: 4 }}
              value={selectedLineIndex}
              onChange={e => setSelectedLineIndex(Number(e.target.value))}
            >
              {lines.map((l, i) => <option key={i} value={i}>Line {i + 1}: {l.part}</option>)}
            </select>
          </div>
        )}

        <div className="qf-others-panel-actions">
          <button className="primary-action" onClick={addOtherRow} type="button">+ Add Row</button>
        </div>

        <div className="qf-others-panel-body">
          {(lineOthers[selectedLineIndex] ?? []).length === 0 ? (
            <div className="qf-others-panel-empty">No others for this line yet.<br />Click + Add Row to begin.</div>
          ) : (
            <table className="qf-op-tbl">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Cost $</th>
                  <th style={{ textAlign: "right" }}>Markup %</th>
                  <th style={{ textAlign: "right" }}>Amount $</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(lineOthers[selectedLineIndex] ?? []).map((o) => {
                  const amount = o.cost * o.qty * (1 + o.markupPct / 100);
                  const suppliers = contacts.filter(c => splitContactTypes(c.kind).includes("Supplier"));
                  return (
                    <tr key={o.id}>
                      <td>
                        <select className="qf-op-sel" value={o.category} onChange={(e) => updateOtherRow(o.id, "category", e.target.value)}>
                          {["BENDING","CONSUMABLES","FABRICATION","FREIGHT","GALVANISING","PAINTING","PRESSING","PUNCHING","OTHER"].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td><input className="qf-op-inp" value={o.description} onChange={(e) => updateOtherRow(o.id, "description", e.target.value)} placeholder="Description" /></td>
                      <td><input className="qf-op-num" type="number" value={o.qty} onChange={(e) => updateOtherRow(o.id, "qty", Number(e.target.value))} /></td>
                      <td><input className="qf-op-num" type="number" value={o.cost} onChange={(e) => updateOtherRow(o.id, "cost", Number(e.target.value))} /></td>
                      <td><input className="qf-op-num" type="number" value={o.markupPct} onChange={(e) => updateOtherRow(o.id, "markupPct", Number(e.target.value))} /></td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{currency.format(amount)}</td>
                      <td><button className="qf2-act-btn qf2-act-del" onClick={() => removeOtherRow(o.id)} type="button">✕</button></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="qf-op-foot">
                  <td colSpan={5} style={{ textAlign: "right", fontWeight: 700, paddingRight: 10 }}>Line others total:</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {currency.format((lineOthers[selectedLineIndex] ?? []).reduce((s, o) => s + o.cost * o.qty * (1 + o.markupPct / 100), 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="qf2-footer">
        <div className="qf2-fcol">
          <label className="qf2-flabel">Quote notes</label>
          <textarea className="qf2-ftextarea" onChange={(e) => setQuoteComments(e.target.value)} placeholder="Internal notes for this quote…" value={quoteComments} />
        </div>
        <div className="qf2-fcol">
          <label className="qf2-flabel">Delivery notes</label>
          <textarea className="qf2-ftextarea" placeholder="Delivery instructions, site contact…" />
          <div style={{ marginTop: 8, fontSize: 11, color: "#889" }}>Quote valid for: <strong style={{ color: "#334" }}>30 days</strong></div>
        </div>
        <div className="qf2-totals">
          {(() => {
            const allOthersTotal = Object.values(lineOthers).flat().reduce((s, o) => s + o.cost * o.qty * (1 + o.markupPct / 100), 0);
            const linesTotal = lines.reduce((s, l) => s + l.total, 0);
            const subtotalWithOthers = linesTotal + allOthersTotal;
            const deliveryAmt = quote.delivery ?? 0;
            const gstWithOthers = (subtotalWithOthers + deliveryAmt) * 0.1;
            const grandTotal = subtotalWithOthers + deliveryAmt + gstWithOthers;
            return (<>
              <div className="qf2-trow"><span>Cutting / Material</span><span>{currency.format(linesTotal)}</span></div>
              {allOthersTotal > 0 && <div className="qf2-trow"><span>Others</span><span>{currency.format(allOthersTotal)}</span></div>}
              <div className="qf2-trow"><span>Subtotal</span><span>{currency.format(subtotalWithOthers)}</span></div>
              <div className="qf2-trow"><span>Delivery</span><span>{currency.format(deliveryAmt)}</span></div>
              <div className="qf2-trow"><span>GST (10%)</span><span>{currency.format(gstWithOthers)}</span></div>
              <div className="qf2-trow qf2-trow-grand"><span>Total GST inc.</span><span>{currency.format(grandTotal)}</span></div>
            </>);
          })()}
        </div>
      </div>
      {/* ── DXF Viewer Modal ── */}
      {dxfViewIndex !== null && (() => {
        const dxfText = lineDxfText[dxfViewIndex];
        const line = lines[dxfViewIndex];
        let svgContent = "";
        try { if (dxfText) svgContent = createSvgString(parseDxfFileString(dxfText)); } catch { svgContent = ""; }
        return (
          <div className="dxf-modal-overlay" onClick={() => setDxfViewIndex(null)}>
            <div className="dxf-modal" onClick={e => e.stopPropagation()}>
              <div className="dxf-modal-head">
                <div>
                  <div className="dxf-modal-title">DXF Preview</div>
                  {line && <div className="dxf-modal-sub">{line.part} · {line.thickness} · {line.material}</div>}
                </div>
                <button className="dxf-modal-close" onClick={() => setDxfViewIndex(null)} type="button">✕</button>
              </div>
              <div className="dxf-modal-body">
                {svgContent
                  ? <div className="dxf-svg-wrap" dangerouslySetInnerHTML={{ __html: svgContent }} />
                  : <div className="dxf-modal-err">Could not render DXF preview.</div>}
              </div>
            </div>
          </div>
        );
      })()}

      {showPrint && (
        <div className="print-only">
          <QuotePrintView
            quote={{ ...quote, client: selectedClientName || quote.client, contact: selectedStaffName || quote.contact }}
            lines={lines}
            bizProfile={bizProfile}
            quoteComments={quoteComments}
            quoteStatus={quoteStatus}
            deliveryAddress=""
          />
        </div>
      )}
    </article>
  );
}

// ── Quote Print Layout ────────────────────────────────────────────────────────

function QuotePrintView({ quote, lines, bizProfile, quoteComments, quoteStatus, deliveryAddress }: {
  quote: QuoteRecord;
  lines: QuoteLine[];
  bizProfile: BusinessProfile;
  quoteComments: string;
  quoteStatus: string;
  deliveryAddress: string;
}) {
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const delivery = quote.delivery ?? 0;
  const gst = (subtotal + delivery) * 0.1;
  const grandTotal = subtotal + delivery + gst;
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const printDate = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const quoteDate = quote.date
    ? new Date(quote.date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
    : printDate;

  const ROWS_PER_PAGE = 15;
  const pages: QuoteLine[][] = [];
  for (let i = 0; i < lines.length; i += ROWS_PER_PAGE) pages.push(lines.slice(i, i + ROWS_PER_PAGE));
  if (pages.length === 0) pages.push([]);
  const totalPages = pages.length + 1;

  const Header = () => (
    <div className="pv2-header">
      {/* Top strip: logo left, QUOTATION right */}
      <div className="pv2-header-top">
        <div className="pv2-logo-area">
          {bizProfile.logoBase64
            ? <img src={bizProfile.logoBase64} alt="Logo" className="pv2-logo" />
            : <div className="pv2-biz-name">{bizProfile.name || "MySwiftFab"}</div>}
          {bizProfile.tagline && <div className="pv2-tagline">{bizProfile.tagline}</div>}
        </div>
        <div className="pv2-doc-title">
          <div className="pv2-doc-label">QUOTATION</div>
          <div className="pv2-doc-no">#{quote.quote}</div>
          <div className="pv2-doc-date">{quoteDate}</div>
          <div className="pv2-doc-status" style={{ background: STATUS_COLOR[quoteStatus?.toLowerCase()] ?? "#555" }}>{quoteStatus || "Draft"}</div>
        </div>
      </div>

      {/* FROM / TO grid */}
      <table className="pv2-parties-tbl">
        <tbody>
          <tr>
            <td className="pv2-party-cell" style={{ width: "50%", borderRight: "1px solid #dde" }}>
              <div className="pv2-party-label">FROM</div>
              <div className="pv2-party-name">{bizProfile.name || "—"}</div>
              {bizProfile.address && <div>{bizProfile.address}</div>}
              {bizProfile.poBox && <div>{bizProfile.poBox}</div>}
              {bizProfile.phone && <div>Ph: {bizProfile.phone}</div>}
              {bizProfile.email && <div>{bizProfile.email}</div>}
              {bizProfile.abn && <div>ABN: {bizProfile.abn}</div>}
            </td>
            <td className="pv2-party-cell" style={{ width: "50%" }}>
              <div className="pv2-party-label">TO</div>
              <div className="pv2-party-name">{quote.client || "—"}</div>
              {quote.contact && <div>Attn: {quote.contact}</div>}
              {deliveryAddress && <div style={{ marginTop: 4 }}>{deliveryAddress}</div>}
              {bizProfile.validity && <div style={{ marginTop: 6, fontSize: "8pt", color: "#778" }}>Valid for: {bizProfile.validity}</div>}
            </td>
          </tr>
        </tbody>
      </table>

      {quoteComments && (
        <div className="pv2-notes-bar">
          <strong>Notes:&nbsp;</strong>{quoteComments}
        </div>
      )}
    </div>
  );

  const Footer = ({ page, tot }: { page: number; tot: number }) => (
    <div className="pv2-footer">
      <span>{bizProfile.name}{bizProfile.tagline ? ` · ${bizProfile.tagline}` : ""}</span>
      <span>Printed {printDate} · Page {page} of {tot}</span>
    </div>
  );

  const THead = () => (
    <thead>
      <tr className="pv2-thead">
        <th style={{ width: 28 }}>#</th>
        <th>Part / Description</th>
        <th style={{ width: 60 }}>Thickness</th>
        <th style={{ width: 80 }}>Material</th>
        <th style={{ width: 36, textAlign: "right" }}>Qty</th>
        <th style={{ width: 72, textAlign: "right" }}>Unit $</th>
        <th style={{ width: 80, textAlign: "right" }}>Total $</th>
      </tr>
    </thead>
  );

  return (
    <div className="pv2-root">
      {pages.map((pageLines, pi) => (
        <div key={pi} className="pv2-page">
          <Header />
          <table className="pv2-table">
            <THead />
            <tbody>
              {pageLines.map((line, i) => {
                const rowNum = pi * ROWS_PER_PAGE + i + 1;
                const unit = line.qty > 0 ? line.total / line.qty : 0;
                return (
                  <tr key={i} className={`pv2-row${rowNum % 2 === 0 ? " pv2-row-alt" : ""}`}>
                    <td className="pv2-num">{rowNum}</td>
                    <td>
                      <div className="pv2-line-main">{line.part}</div>
                      {(line.predecessor || line.side1) && (
                        <div className="pv2-line-sub">
                          {[line.predecessor, line.side1 && `${line.side1}${line.side2 ? ` × ${line.side2}` : ""}mm`].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </td>
                    <td>{line.thickness}</td>
                    <td>{line.material}</td>
                    <td style={{ textAlign: "right" }}>{line.qty}</td>
                    <td style={{ textAlign: "right" }}>{currency.format(unit)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{currency.format(line.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ flex: 1 }} />
          <Footer page={pi + 1} tot={totalPages} />
        </div>
      ))}

      {/* Final page — terms + totals */}
      <div className="pv2-page">
        <Header />
        <div className="pv2-terms-totals">
          <div className="pv2-terms">
            {bizProfile.validity && <p><strong>Validity:</strong> {bizProfile.validity}</p>}
            {bizProfile.paymentTerms && <p><strong>Payment terms:</strong> {bizProfile.paymentTerms}</p>}
            {bizProfile.banking && <p style={{ marginTop: 10 }}><strong>Banking details:</strong><br />{bizProfile.banking}</p>}
            {bizProfile.disclaimer && <p className="pv2-disclaimer">{bizProfile.disclaimer}</p>}
          </div>
          <div className="pv2-totals">
            <div className="pv2-trow"><span>Items</span><span>{totalQty} pcs across {lines.length} lines</span></div>
            <div className="pv2-trow"><span>Subtotal</span><span>{currency.format(subtotal)}</span></div>
            <div className="pv2-trow"><span>Delivery</span><span>{delivery > 0 ? currency.format(delivery) : "TBD"}</span></div>
            <div className="pv2-trow"><span>GST (10%)</span><span>{currency.format(gst)}</span></div>
            <div className="pv2-trow pv2-trow-grand"><span>Total (inc. GST)</span><span>{currency.format(grandTotal)}</span></div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <Footer page={totalPages} tot={totalPages} />
      </div>
    </div>
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
