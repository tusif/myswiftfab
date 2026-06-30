import DxfParser from "dxf-parser";

export type DxfHole = {
  dia: number;
  qty: number;
};

export type DxfAnalysis = {
  plateWidth: number;   // bounding box X in mm
  plateHeight: number;  // bounding box Y in mm
  cutLength: number;    // total cut path in mm
  pierceCount: number;  // number of distinct pierces
  holes: DxfHole[];     // detected circular holes (grouped by dia)
  rawError?: string;
};

const DEG = Math.PI / 180;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ── Entity length calculators ──────────────────────────────────────────────

function lineLength(e: any): number {
  const dx = e.vertices[1].x - e.vertices[0].x;
  const dy = e.vertices[1].y - e.vertices[0].y;
  return Math.hypot(dx, dy);
}

function arcLength(e: any): number {
  let start = e.startAngle ?? 0;
  let end = e.endAngle ?? 360;
  if (end <= start) end += 360;
  return e.radius * (end - start) * DEG;
}

function circleLength(e: any): number {
  return 2 * Math.PI * e.radius;
}

function lwpolylineLength(e: any): number {
  const verts = e.vertices ?? [];
  let len = 0;
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    if (i === verts.length - 1 && !e.shape) break;
    const bulge = a.bulge ?? 0;
    if (Math.abs(bulge) < 1e-9) {
      len += Math.hypot(b.x - a.x, b.y - a.y);
    } else {
      // arc segment from bulge
      const chord = Math.hypot(b.x - a.x, b.y - a.y);
      const r = chord * (bulge * bulge + 1) / (4 * Math.abs(bulge));
      const angle = 4 * Math.atan(Math.abs(bulge));
      len += r * angle;
    }
  }
  return len;
}

function splineLength(e: any): number {
  const ctrlPts = e.controlPoints ?? [];
  if (ctrlPts.length < 2) return 0;
  const SAMPLES = 50;
  let len = 0;
  let prev = ctrlPts[0];
  for (let i = 1; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const idx = Math.min(Math.floor(t * (ctrlPts.length - 1)), ctrlPts.length - 2);
    const lt = t * (ctrlPts.length - 1) - idx;
    const curr = { x: lerp(ctrlPts[idx].x, ctrlPts[idx + 1].x, lt), y: lerp(ctrlPts[idx].y, ctrlPts[idx + 1].y, lt) };
    len += Math.hypot(curr.x - prev.x, curr.y - prev.y);
    prev = curr;
  }
  return len;
}

// ── Bounding box helpers ───────────────────────────────────────────────────

function expandBbox(bbox: number[], ...pts: { x: number; y: number }[]) {
  for (const p of pts) {
    if (p.x < bbox[0]) bbox[0] = p.x;
    if (p.y < bbox[1]) bbox[1] = p.y;
    if (p.x > bbox[2]) bbox[2] = p.x;
    if (p.y > bbox[3]) bbox[3] = p.y;
  }
}

function entityBbox(e: any, bbox: number[]) {
  switch (e.type) {
    case "LINE":
      expandBbox(bbox, ...e.vertices);
      break;
    case "ARC": {
      expandBbox(bbox, { x: e.center.x, y: e.center.y });
      const start = e.startAngle * DEG;
      const end = (e.endAngle > e.startAngle ? e.endAngle : e.endAngle + 360) * DEG;
      for (let a = start; a <= end; a += DEG * 10) {
        expandBbox(bbox, { x: e.center.x + e.radius * Math.cos(a), y: e.center.y + e.radius * Math.sin(a) });
      }
      break;
    }
    case "CIRCLE":
      expandBbox(bbox,
        { x: e.center.x - e.radius, y: e.center.y - e.radius },
        { x: e.center.x + e.radius, y: e.center.y + e.radius }
      );
      break;
    case "LWPOLYLINE":
    case "POLYLINE":
      expandBbox(bbox, ...(e.vertices ?? []));
      break;
    case "SPLINE":
      expandBbox(bbox, ...(e.controlPoints ?? []));
      break;
  }
}

// ── Hole detection ─────────────────────────────────────────────────────────
// Circles are detected as holes. Diameter < outer boundary = internal hole.

function isSmallCircle(e: any, plateW: number, plateH: number): boolean {
  const dia = e.radius * 2;
  return dia < plateW * 0.8 && dia < plateH * 0.8;
}

// ── Main export ────────────────────────────────────────────────────────────

export async function analyseDxf(file: File): Promise<DxfAnalysis> {
  const text = await file.text();
  const parser = new DxfParser();
  let dxf: any;
  try {
    dxf = parser.parseSync(text);
  } catch (e: any) {
    return { plateWidth: 0, plateHeight: 0, cutLength: 0, pierceCount: 0, holes: [], rawError: String(e?.message ?? e) };
  }

  const entities: any[] = dxf?.entities ?? [];

  // Collect from blocks too (INSERT references)
  const blocks: Record<string, any[]> = {};
  for (const [name, block] of Object.entries(dxf?.blocks ?? {})) {
    blocks[name] = (block as any).entities ?? [];
  }

  const allEntities: any[] = [...entities];
  for (const e of entities) {
    if (e.type === "INSERT" && blocks[e.name]) {
      allEntities.push(...blocks[e.name]);
    }
  }

  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const e of allEntities) entityBbox(e, bbox);

  const plateWidth  = Math.round(bbox[2] - bbox[0]);
  const plateHeight = Math.round(bbox[3] - bbox[1]);

  let cutLength = 0;
  let pierceCount = 0;
  const circleDias: number[] = [];

  for (const e of allEntities) {
    switch (e.type) {
      case "LINE":
        cutLength += lineLength(e);
        pierceCount++;
        break;
      case "ARC":
        cutLength += arcLength(e);
        pierceCount++;
        break;
      case "CIRCLE":
        cutLength += circleLength(e);
        pierceCount++;
        if (isSmallCircle(e, plateWidth, plateHeight)) {
          circleDias.push(Math.round(e.radius * 2));
        }
        break;
      case "LWPOLYLINE":
      case "POLYLINE":
        cutLength += lwpolylineLength(e);
        pierceCount++;
        break;
      case "SPLINE":
        cutLength += splineLength(e);
        pierceCount++;
        break;
    }
  }

  // Group holes by diameter
  const holeCounts: Record<number, number> = {};
  for (const d of circleDias) holeCounts[d] = (holeCounts[d] ?? 0) + 1;
  const holes: DxfHole[] = Object.entries(holeCounts)
    .map(([dia, qty]) => ({ dia: Number(dia), qty }))
    .sort((a, b) => a.dia - b.dia);

  return {
    plateWidth,
    plateHeight,
    cutLength: Math.round(cutLength),
    pierceCount,
    holes,
  };
}
