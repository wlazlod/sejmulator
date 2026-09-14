/**
 * Fetches the 2011 Sejm election results per district from the official PKW site
 * and writes a CSV in the same shape as the 2019/2023 PKW exports, so that
 * `scripts/prepare-pkw-data.ts` (processParlamentarne) can consume it unchanged.
 *
 * Source: https://wybory2011.pkw.gov.pl/wyn/pl/000000.html — the national results page
 * contains the table "Wyniki głosowania w okręgach wyborczych według komitetów wyborczych"
 * (41 districts × 11 committees, absolute votes + %). The per-district pages
 * (/wsw/pl/sjm-N.html) only carry percentages, so a single request is enough.
 *
 * Usage: npx tsx scripts/fetch-pkw-2011.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";

const SOURCE_URL = "https://wybory2011.pkw.gov.pl/wyn/pl/000000.html";
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "raw-data", "parlamentarne-2011");
const OUT_FILE = path.join(OUT_DIR, "wyniki_gl_na_listy_po_okregach_sejm_2011.csv");
const TABLE_TITLE = "według komitetów wyborczych";
const TOTAL_COLUMN = "Liczba głosów ważnych oddanych łącznie na wszystkie listy kandydatów";

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\u00a0/g, " ")
    .trim();
}

function cellsOf(row: string): string[] {
  return [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => stripTags(m[1]));
}

/** "95 277\n27,68%" → 95277; "x" (not on ballot) → 0 */
function parseVotes(cell: string): number {
  const first = cell.split("\n")[0].replace(/\s+/g, "");
  if (!/^\d+$/.test(first)) return 0;
  return parseInt(first, 10);
}

async function main(): Promise<void> {
  console.log(`Fetching ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${SOURCE_URL}`);
  const html = (await res.text()).replace(/^\uFEFF/, "");

  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  const matrix = tables.find((t) => t.includes(TABLE_TITLE));
  if (!matrix) throw new Error(`Table "${TABLE_TITLE}" not found (${tables.length} tables on page)`);

  const rows = [...matrix.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) => cellsOf(m[0]));
  const headerRow = rows.find((r) => r[0] === "Nr okręgu");
  if (!headerRow) throw new Error("Header row 'Nr okręgu' not found");
  const committees = headerRow.slice(1);
  console.log(
    `  ${committees.length} committees: ${committees.map((c) => c.replace(/^Komitet Wyborczy /, "")).join(", ")}`,
  );

  const districts: { number: number; votes: number[] }[] = [];
  for (const row of rows) {
    const num = parseInt(row[0], 10);
    if (!/^\d+$/.test(row[0]) || num < 1 || num > 41 || row.length !== committees.length + 1) continue;
    districts.push({ number: num, votes: row.slice(1).map(parseVotes) });
  }
  if (districts.length !== 41) throw new Error(`Expected 41 districts, parsed ${districts.length}`);

  // Sanity: national shares (PJN ≈ 2.2%, PO ≈ 39%, PiS ≈ 30% in 2011)
  const totals = committees.map((_, i) => districts.reduce((s, d) => s + d.votes[i], 0));
  const grandTotal = totals.reduce((s, v) => s + v, 0);
  const share = (needle: string): number => {
    const i = committees.findIndex((c) => c.includes(needle));
    return i >= 0 ? (100 * totals[i]) / grandTotal : NaN;
  };
  const pjn = share("Polska Jest Najważniejsza");
  const po = share("Platforma Obywatelska");
  const pis = share("Prawo i Sprawiedliwość");
  console.log(`  National shares: PJN ${pjn.toFixed(2)}%, PO ${po.toFixed(2)}%, PiS ${pis.toFixed(2)}%`);
  if (!(pjn >= 2.0 && pjn <= 2.4 && po >= 38 && po <= 40.5 && pis >= 29 && pis <= 31)) {
    throw new Error("Sanity check failed — parser is probably wrong");
  }

  // CSV in the PKW export shape: "Nr okręgu";...;"<TOTAL_COLUMN>";<one column per committee>
  const header = ["Nr okręgu", "Liczba głosów ważnych", TOTAL_COLUMN, ...committees];
  const data = districts
    .sort((a, b) => a.number - b.number)
    .map((d) => {
      const valid = d.votes.reduce((s, v) => s + v, 0);
      return [String(d.number), String(valid), String(valid), ...d.votes.map(String)];
    });
  const csv = Papa.unparse({ fields: header, data }, { delimiter: ";", quotes: true, newline: "\n" });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, `${csv}\n`, "utf-8");
  console.log(`  ✓ Written ${districts.length} districts to ${OUT_FILE}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
