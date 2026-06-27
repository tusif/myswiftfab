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
  };
}

function calculateQuoteTotal(lines: QuoteLine[]) {
  return lines.reduce((total, line) => total + line.total, 0);
}

const quotes: QuoteRecord[] = [
  { quote: "400120", client: "Willis Engineering", contact: "Anne Willis", status: "Draft", lines: 8, total: 4814.35, margin: "34%" },
  { quote: "400121", client: "Bayside Fabrication", contact: "Matt Cooper", status: "Sent", lines: 5, total: 2240.1, margin: "29%" },
  { quote: "400122", client: "Henderson Marine", contact: "Priya Nair", status: "Approved", lines: 14, total: 9133.8, margin: "37%" },
  { quote: "400123", client: "Perth Access", contact: "Site contact", status: "Review", lines: 3, total: 1184.5, margin: "25%" },
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
            {activePage !== "materials" && <p className="eyebrow">MySwiftFab</p>}
            <h1>{activePage === "materials" ? "Materials and Cutting Rates" : currentModule.title}</h1>
            {activePage !== "materials" && <p className="page-description">{currentModule.description}</p>}
          </div>
          <div className="topbar-actions">
            <div className={hasSupabaseConfig ? "status-dot online" : "status-dot"}>
              {hasSupabaseConfig ? "Supabase connected" : "Add Supabase env"}
            </div>
          </div>
        </header>

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

function QuotesPage() {
  const [quoteRecords, setQuoteRecords] = useState<QuoteRecord[]>(quotes);
  const [currentQuote, setCurrentQuote] = useState<QuoteRecord>(quotes[0]);
  const [quoteLineRecords, setQuoteLineRecords] = useState<Record<string, QuoteLine[]>>({
    [quotes[0].quote]: quoteLines,
  });
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

  return (
    <section className="page-grid">
      <PagePanel eyebrow="Estimator" title="Quote Register" actionLabel="New Quote" onAction={openNewQuoteClientPicker}>
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
          columns={["Quote", "Client", "Status", "Lines", "Total", "Margin"]}
          rows={filteredQuoteRecords.map((quote) => [
            quote.quote,
            quote.client,
            <Badge key={quote.quote} label={quote.status} />,
            quote.lines,
            currency.format(quote.total),
            quote.margin,
          ])}
        />
      </PagePanel>
      <QuoteWorkbench
        compact
        lines={quoteLineRecords[currentQuote.quote] ?? []}
        onAddLine={addQuoteLine}
        quote={currentQuote}
      />
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
  quote = quotes[0],
}: {
  compact?: boolean;
  lines?: QuoteLine[];
  onAddLine?: (line: QuoteLine) => void;
  quote?: QuoteRecord;
}) {
  const [isLineFormOpen, setIsLineFormOpen] = useState(false);
  const [lineDraft, setLineDraft] = useState<QuoteLineDraft>(createBlankQuoteLineDraft);
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [detailTab, setDetailTab] = useState<"detail" | "others" | "holes" | "advanced">("detail");
  const [selectedClientName, setSelectedClientName] = useState(quote.client);
  const selectedClient = contacts.find((contact) => contact.company === selectedClientName) ?? contacts[0];
  const [selectedStaffName, setSelectedStaffName] = useState(quote.contact);
  const [quoteComments, setQuoteComments] = useState("");
  const [subcontractCost, setSubcontractCost] = useState("0");
  const [markupPercent, setMarkupPercent] = useState("20");
  const selectedStaff = selectedClient.staff.find((staffMember) => staffMember.name === selectedStaffName) ?? selectedClient.staff[0];
  const selectedLine = lines[selectedLineIndex] ?? null;
  const gst = quote.total * 0.1;
  const totalIncGst = quote.total + gst;
  const subcontractTotal = (Number(subcontractCost) || 0) * (1 + (Number(markupPercent) || 0) / 100);
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
    setLineDraft(createBlankQuoteLineDraft());
  };

  const addLine = () => {
    if (!canAddLine) return;

    onAddLine?.(draftLine);
    setSelectedLineIndex(lines.length);
    closeLineForm();
  };

  return (
    <article className={compact ? "quote-panel compact" : "quote-panel"}>
      <div className="quote-form-header">
        <div className="quote-party-grid">
          <label>
            <span>Client</span>
            <select onChange={(event) => selectClientForQuote(event.target.value)} value={selectedClientName}>
              {contacts
                .filter((contact) => splitContactTypes(contact.kind).includes("Client"))
                .map((contact) => (
                  <option key={contact.id} value={contact.company}>{contact.company}</option>
                ))}
            </select>
          </label>
          <label>
            <span>Staff</span>
            <select onChange={(event) => setSelectedStaffName(event.target.value)} value={selectedStaff?.name ?? ""}>
              {selectedClient.staff.map((staffMember) => (
                <option key={staffMember.id} value={staffMember.name}>{staffMember.name}</option>
              ))}
            </select>
          </label>
          <div>
            <span>Quote</span>
            <strong>{quote.quote}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{quote.status}</strong>
          </div>
        </div>
        <div className="quote-client-detail">
          <div>
            <span>Address</span>
            <strong>{selectedClient.billingAddress}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{selectedStaff?.email || selectedClient.email}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{selectedStaff?.direct || selectedStaff?.mobile || selectedClient.phone}</strong>
          </div>
        </div>
      </div>

      <div className="quote-calculator-panel">
        <div className="quote-detail-tabs" role="tablist" aria-label="Quote line sections">
          {(["detail", "others", "holes", "advanced"] as const).map((tab) => (
            <button
              aria-selected={detailTab === tab}
              key={tab}
              onClick={() => setDetailTab(tab)}
              type="button"
            >
              {tab === "detail" ? "Detail" : tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="quote-selected-line">
          <div className="quote-selected-main">
            <span>Selected Line</span>
            <strong>{selectedLine?.part ?? "No line selected"}</strong>
            <small>{selectedLine ? `${selectedLine.thickness} ${selectedLine.material}` : "Add or select a quote line."}</small>
          </div>
          <div className="quote-line-metrics">
            <div><span>Material</span><strong>{selectedLine?.material ?? "-"}</strong></div>
            <div><span>Qty</span><strong>{selectedLine?.qty ?? "-"}</strong></div>
            <div><span>Cut</span><strong>{selectedLine?.cut.toFixed(2) ?? "-"}</strong></div>
            <div><span>Pierce</span><strong>{selectedLine?.pierce.toFixed(2) ?? "-"}</strong></div>
            <div><span>Total</span><strong>{selectedLine ? currency.format(selectedLine.total) : "-"}</strong></div>
          </div>
        </div>

        {detailTab === "detail" && (
          <div className="quote-line-detail-grid">
            <div><span>Size / Description</span><strong>{selectedLine?.part ?? "-"}</strong></div>
            <div><span>Material Type</span><strong>{selectedLine?.materialType ?? "-"}</strong></div>
            <div><span>Thickness</span><strong>{selectedLine?.thickness ?? "-"}</strong></div>
            <div><span>Feed</span><strong>{formatMaterialValue(selectedLine?.feed ?? null)}</strong></div>
          </div>
        )}

        {detailTab === "holes" && (
          <div className="quote-line-detail-grid">
            <div><span>Hole Type</span><strong>Laser cut holes</strong></div>
            <div><span>Nos</span><strong>4</strong></div>
            <div><span>Dia</span><strong>50</strong></div>
            <div><span>Containing Holes</span><strong>{selectedLine ? "Yes" : "-"}</strong></div>
          </div>
        )}

        {detailTab === "others" && (
          <div className="quote-others-grid">
            <label className="field">
              <span>Subcontractor Charge</span>
              <input onChange={(event) => setSubcontractCost(event.target.value)} type="number" value={subcontractCost} />
            </label>
            <label className="field">
              <span>Markup %</span>
              <input onChange={(event) => setMarkupPercent(event.target.value)} type="number" value={markupPercent} />
            </label>
            <div className="quote-line-total">
              <span>Other Total</span>
              <strong>{currency.format(subcontractTotal)}</strong>
            </div>
          </div>
        )}

        {detailTab === "advanced" && (
          <div className="quote-line-detail-grid">
            <div><span>Supplied</span><strong>No</strong></div>
            <div><span>Offset</span><strong>10</strong></div>
            <div><span>Minimum Cutting Charge</span><strong>{currency.format(0)}</strong></div>
            <div><span>Status</span><strong>Complete</strong></div>
          </div>
        )}
      </div>

      {isLineFormOpen && (
        <section className="quote-line-form" aria-label="Add quote line">
          <div className="quote-line-form-heading">
            <div>
              <p className="eyebrow">Line Item</p>
              <h3>Add Part</h3>
            </div>
            <div className="quote-picker-actions">
              <button className="secondary-action" onClick={closeLineForm} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={!canAddLine} onClick={addLine} type="button">
                <Plus size={16} />
                <span>Add</span>
              </button>
            </div>
          </div>
          <div className="quote-line-form-grid">
            <label className="field quote-line-part">
              <span>Part description</span>
              <input
                onChange={(event) => updateLineDraft("part", event.target.value)}
                placeholder="PLATE 200 x 100"
                value={lineDraft.part}
              />
            </label>
            <label className="field">
              <span>Material</span>
              <select onChange={(event) => selectMaterialRate(event.target.value)} value={lineDraft.materialRateId}>
                {materialRates.map((rate) => (
                  <option key={rate.id} value={rate.id}>{getMaterialRateLabel(rate)}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Type</span>
              <input readOnly value={lineDraft.materialType} />
            </label>
            <label className="field">
              <span>Thickness</span>
              <input readOnly value={lineDraft.thickness} />
            </label>
            <label className="field">
              <span>Feed</span>
              <input readOnly value={lineDraft.feed} />
            </label>
            <label className="field">
              <span>Qty</span>
              <input
                min="1"
                onChange={(event) => updateLineDraft("qty", event.target.value)}
                type="number"
                value={lineDraft.qty}
              />
            </label>
            <label className="field">
              <span>Cut Rate</span>
              <input
                min="0"
                onChange={(event) => updateLineDraft("cut", event.target.value)}
                step="0.01"
                type="number"
                value={lineDraft.cut}
              />
            </label>
            <label className="field">
              <span>Cost per M2</span>
              <input readOnly value={lineDraft.costPerM2} />
            </label>
            <label className="field">
              <span>Piercing Rate</span>
              <input
                min="0"
                onChange={(event) => updateLineDraft("pierce", event.target.value)}
                step="0.01"
                type="number"
                value={lineDraft.pierce}
              />
            </label>
            <div className="quote-line-total">
              <span>Line total</span>
              <strong>{currency.format(draftLine.total)}</strong>
            </div>
          </div>
        </section>
      )}

      <div className="quote-line-list-heading">
        <div className="quote-detail-tabs">
          <button aria-selected={true} type="button">Detail</button>
          <button type="button">Others</button>
          <button type="button">Holes</button>
          <button type="button">Advanced</button>
        </div>
        <button className="primary-action" onClick={openLineForm} type="button">
          <Plus size={16} />
          <span>Add Line</span>
        </button>
      </div>

      <div className="quote-lines-table table-wrap">
        <table>
          <thead>
            <tr>
              <th>S/N</th>
              <th>Part number</th>
              <th>Description</th>
              <th>mm</th>
              <th>Material</th>
              <th>Qty</th>
              <th>Matrl</th>
              <th>Rate</th>
              <th>Other</th>
              <th>Total$</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr
                aria-current={selectedLineIndex === index ? "true" : undefined}
                key={`${line.part}-${index}`}
                onClick={() => setSelectedLineIndex(index)}
              >
                <td>{index + 1}</td>
                <td>{1372916 + index}</td>
                <td>{line.part}</td>
                <td>{line.thickness.replace(" mm", "")}</td>
                <td>{line.material}</td>
                <td>{line.qty}</td>
                <td>{currency.format(line.costPerM2 ?? 0)}</td>
                <td>{currency.format(line.cut)}</td>
                <td>{detailTab === "others" ? currency.format(subcontractTotal) : ""}</td>
                <td>{currency.format(line.total)}</td>
                <td>Complete</td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr>
                <td className="empty-table-cell" colSpan={11}>No line items yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="quote-footer-grid">
        <label className="quote-notes-panel">
          <span>Notes</span>
          <textarea onChange={(event) => setQuoteComments(event.target.value)} placeholder="Comments about this quote" value={quoteComments} />
        </label>
        <div className="quote-totals-panel">
          <div><span>Subtotal</span><strong>{currency.format(quote.total)}</strong></div>
          <div><span>Other</span><strong>{currency.format(subcontractTotal)}</strong></div>
          <div><span>GST</span><strong>{currency.format(gst)}</strong></div>
          <div><span>Total GST Inc.</span><strong>{currency.format(totalIncGst + subcontractTotal)}</strong></div>
        </div>
        <div className="quote-customer-notes">
          <span>Customer Notes</span>
          <p>{selectedClient.notes || "No customer notes recorded."}</p>
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
  emptyMessage,
  rows,
}: {
  columns: string[];
  emptyMessage?: string;
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
          {rows.length === 0 ? (
            <tr>
              <td className="empty-table-cell" colSpan={columns.length}>{emptyMessage ?? "No records found."}</td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
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
