/**
 * PKW Data Processing Script
 *
 * Processes raw PKW election data (CSV) into structured JSON files
 * consumed by the Sejmulator simulation engine.
 *
 * Usage: npx tsx scripts/prepare-pkw-data.ts
 *
 * Input:  scripts/raw-data/<election-id>/*.csv
 * Output: src/data/<election-id>.json
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";
import type { ElectionData, ElectionMeta, DistrictResult, PartyResult, DistrictMeta } from "../src/data/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DATA_DIR = path.join(__dirname, "raw-data");
const OUTPUT_DIR = path.join(__dirname, "..", "src", "data");

// District sizes (number of seats) for parliamentary elections - from PKW
// Source: https://pkw.gov.pl/obwieszczenia/obwieszczenie-panstwowej-komisji-wyborczej
const DISTRICT_SIZES: Record<number, { name: string; size: number }> = {
  1: { name: "Legnica", size: 12 },
  2: { name: "Wałbrzych", size: 8 },
  3: { name: "Wrocław", size: 14 },
  4: { name: "Bydgoszcz", size: 12 },
  5: { name: "Toruń", size: 13 },
  6: { name: "Lublin", size: 15 },
  7: { name: "Chełm", size: 12 },
  8: { name: "Zielona Góra", size: 12 },
  9: { name: "Łódź", size: 10 },
  10: { name: "Piotrków Trybunalski", size: 9 },
  11: { name: "Sieradz", size: 12 },
  12: { name: "Kraków (I)", size: 8 },
  13: { name: "Kraków (II)", size: 14 },
  14: { name: "Nowy Sącz", size: 10 },
  15: { name: "Tarnów", size: 9 },
  16: { name: "Płock", size: 10 },
  17: { name: "Radom", size: 9 },
  18: { name: "Siedlce", size: 12 },
  19: { name: "Warszawa (I)", size: 20 },
  20: { name: "Warszawa (II)", size: 12 },
  21: { name: "Opole", size: 12 },
  22: { name: "Krosno", size: 11 },
  23: { name: "Rzeszów", size: 15 },
  24: { name: "Białystok", size: 14 },
  25: { name: "Gdańsk", size: 12 },
  26: { name: "Gdynia", size: 14 },
  27: { name: "Bielsko-Biała", size: 9 },
  28: { name: "Częstochowa", size: 7 },
  29: { name: "Katowice", size: 9 },
  30: { name: "Bieruń", size: 9 },
  31: { name: "Sosnowiec", size: 12 },
  32: { name: "Gliwice", size: 9 },
  33: { name: "Kielce", size: 16 },
  34: { name: "Elbląg", size: 8 },
  35: { name: "Olsztyn", size: 10 },
  36: { name: "Kalisz", size: 12 },
  37: { name: "Konin", size: 9 },
  38: { name: "Piła", size: 9 },
  39: { name: "Poznań", size: 10 },
  40: { name: "Koszalin", size: 8 },
  41: { name: "Szczecin", size: 12 },
};

// Election metadata
const ELECTIONS: Record<string, ElectionMeta> = {
  "parlamentarne-2023": {
    id: "parlamentarne-2023",
    name: "Parlamentarne 2023",
    type: "parlamentarne",
    year: 2023,
    date: "2023-10-15",
  },
  "parlamentarne-2019": {
    id: "parlamentarne-2019",
    name: "Parlamentarne 2019",
    type: "parlamentarne",
    year: 2019,
    date: "2019-10-13",
  },
  "prezydenckie-2025": {
    id: "prezydenckie-2025",
    name: "Prezydenckie 2025 (I tura)",
    type: "prezydenckie",
    year: 2025,
    date: "2025-05-18",
  },
  "prezydenckie-2020": {
    id: "prezydenckie-2020",
    name: "Prezydenckie 2020 (I tura)",
    type: "prezydenckie",
    year: 2020,
    date: "2020-06-28",
  },
};

// --- CSV Parsing Helpers ---

function readCsv(filePath: string): string[][] {
  const content = fs.readFileSync(filePath, "utf-8");
  // Remove BOM if present
  const clean = content.replace(/^\uFEFF/, "");
  const result = Papa.parse<string[]>(clean, {
    delimiter: ";",
    header: false,
    skipEmptyLines: true,
  });
  if (result.errors.length > 0) {
    console.warn(`  Warnings in ${filePath}:`, result.errors.slice(0, 3));
  }
  return result.data;
}

function normalizePartyId(name: string): string {
  // Strip committee prefixes and registration numbers, normalize to kebab-case ID
  return name
    .replace(/^"?KOMITET WYBORCZY /i, "")
    .replace(/^"?KOALICYJNY KOMITET WYBORCZY /i, "")
    .replace(/ - ZPOW-\d+-\d+\/\d+"?$/, "")
    .replace(/"$/g, "")
    .trim()
    .toLowerCase()
    .replace(/[ąà]/g, "a")
    .replace(/[ćč]/g, "c")
    .replace(/[ęè]/g, "e")
    .replace(/[łl]/g, "l")
    .replace(/[ńñ]/g, "n")
    .replace(/[óò]/g, "o")
    .replace(/[śš]/g, "s")
    .replace(/[źżž]/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeCandidateId(name: string): string {
  // For presidential: "TRZASKOWSKI Rafał Kazimierz" or "Rafał Kazimierz TRZASKOWSKI" → "trzaskowski"
  // Find the all-uppercase word (the surname)
  const clean = name.replace(/^"|"$/g, "").trim();
  const parts = clean.split(/\s+/);
  // Find surname: the word that is ALL UPPERCASE (at least 2 chars)
  const surname = parts.find((p) => p.length >= 2 && p === p.toUpperCase()) || parts[0];
  return surname
    .toLowerCase()
    .replace(/[ąà]/g, "a")
    .replace(/[ćč]/g, "c")
    .replace(/[ęè]/g, "e")
    .replace(/[łl]/g, "l")
    .replace(/[ńñ]/g, "n")
    .replace(/[óò]/g, "o")
    .replace(/[śš]/g, "s")
    .replace(/[źżž]/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// --- TERYT → District Mapping ---

function buildTerytToDistrictMap(): Map<string, number> {
  console.log("Building TERYT → district mapping from parlamentarne-2023 per-gmina data...");
  const csvPath = path.join(RAW_DATA_DIR, "parlamentarne-2023", "wyniki_gl_na_listy_po_gminach_sejm_utf8.csv");

  if (!fs.existsSync(csvPath)) {
    throw new Error(`Missing per-gmina file for mapping: ${csvPath}`);
  }

  const rows = readCsv(csvPath);
  const header = rows[0];

  // Find column indices
  const terytCol = header.findIndex((h) => h.includes("TERYT"));
  const districtCol = header.findIndex((h) => h.includes("Nr okręgu") || h.includes("okręgu"));

  if (terytCol === -1 || districtCol === -1) {
    throw new Error(`Cannot find TERYT or district column in ${csvPath}`);
  }

  const map = new Map<string, number>();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const teryt = row[terytCol]?.replace(/"/g, "").trim();
    const district = parseInt(row[districtCol]?.replace(/"/g, "").trim(), 10);
    if (teryt && !isNaN(district)) {
      map.set(teryt, district);
    }
  }

  console.log(`  Mapped ${map.size} TERYT codes to ${new Set(map.values()).size} districts`);
  return map;
}

// --- Parliamentary Processing (per-okręg) ---

function processParlamentarne(electionId: string): ElectionData {
  console.log(`\nProcessing ${electionId} (per-okręg)...`);

  const dir = path.join(RAW_DATA_DIR, electionId);
  const files = fs.readdirSync(dir).filter((f) => f.includes("okregach") && f.endsWith(".csv"));

  if (files.length === 0) {
    throw new Error(`No per-okręg CSV found in ${dir}`);
  }

  const csvPath = path.join(dir, files[0]);
  const rows = readCsv(csvPath);
  const header = rows[0];

  // Find where party columns start (after "Liczba głosów ważnych oddanych łącznie...")
  const totalVotesCol = header.findIndex((h) => h.includes("Liczba głosów ważnych oddanych łącznie"));
  const partyStartCol = totalVotesCol + 1;
  const partyNames = header.slice(partyStartCol).filter((h) => h.trim().length > 0);

  console.log(`  Found ${partyNames.length} parties/committees`);
  console.log(`  Party columns start at index ${partyStartCol}`);

  // Find district number column
  const districtCol = header.findIndex((h) => h.includes("Nr okręgu") || h.includes("Numer okręgu"));

  const districts: DistrictResult[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[districtCol]) continue;

    const districtNum = parseInt(row[districtCol].replace(/"/g, "").trim(), 10);
    if (isNaN(districtNum) || districtNum < 1 || districtNum > 41) continue;

    const districtInfo = DISTRICT_SIZES[districtNum];
    const totalValidVotes = parseInt(row[totalVotesCol]?.replace(/"/g, "").trim() || "0", 10);

    const results: PartyResult[] = [];
    for (let j = 0; j < partyNames.length; j++) {
      const colIdx = partyStartCol + j;
      const votes = parseInt(row[colIdx]?.replace(/"/g, "").trim() || "0", 10);
      if (isNaN(votes)) continue;

      results.push({
        partyId: normalizePartyId(partyNames[j]),
        partyName: partyNames[j]
          .replace(/^"|"$/g, "")
          .replace(/ - ZPOW-\d+-\d+\/\d+$/, "")
          .trim(),
        votes,
        percentage: totalValidVotes > 0 ? Math.round((votes / totalValidVotes) * 10000) / 100 : 0,
      });
    }

    // Filter out parties with 0 votes (not on ballot in this district)
    const nonZeroResults = results.filter((r) => r.votes > 0);

    districts.push({
      district: {
        number: districtNum,
        name: districtInfo.name,
        districtSize: districtInfo.size,
      },
      results: nonZeroResults,
      totalValidVotes,
    });
  }

  // Sort by district number
  districts.sort((a, b) => a.district.number - b.district.number);
  console.log(`  Processed ${districts.length} districts`);

  return {
    election: ELECTIONS[electionId],
    districts,
  };
}

// --- Presidential Processing (per-gmina → aggregate to okręg) ---

function processPrezydenckie(electionId: string, terytMap: Map<string, number>): ElectionData {
  console.log(`\nProcessing ${electionId} (per-gmina → aggregate to okręg)...`);

  const dir = path.join(RAW_DATA_DIR, electionId);
  const files = fs.readdirSync(dir).filter((f) => f.includes("gminach") && f.endsWith(".csv"));

  if (files.length === 0) {
    throw new Error(`No per-gmina CSV found in ${dir}`);
  }

  const csvPath = path.join(dir, files[0]);
  const rows = readCsv(csvPath);
  const header = rows[0];

  // Find TERYT column (varies: "TERYT Gminy" or "Kod TERYT")
  const terytCol = header.findIndex((h) => h.includes("TERYT") || h.includes("Kod TERYT"));

  // Find total valid votes column
  const totalVotesCol = header.findIndex((h) => h.includes("Liczba głosów ważnych oddanych łącznie"));

  // Candidate columns start after total valid votes
  const candidateStartCol = totalVotesCol + 1;
  const candidateNames = header
    .slice(candidateStartCol)
    .filter((h) => h.trim().length > 0 && !h.includes("Liczba obwodów"));

  console.log(`  Found ${candidateNames.length} candidates`);
  console.log(`  TERYT column at index ${terytCol}`);

  // Aggregate per district
  const districtAgg = new Map<
    number,
    { totalValidVotes: number; candidates: Map<string, { name: string; votes: number }> }
  >();

  // Initialize all 41 districts
  for (let d = 1; d <= 41; d++) {
    const candidates = new Map<string, { name: string; votes: number }>();
    for (const name of candidateNames) {
      const id = normalizeCandidateId(name);
      candidates.set(id, { name: name.replace(/^"|"$/g, "").trim(), votes: 0 });
    }
    districtAgg.set(d, { totalValidVotes: 0, candidates });
  }

  let unmappedCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const teryt = row[terytCol]?.replace(/"/g, "").trim();
    if (!teryt) continue;

    // Normalize TERYT: strip leading zeros to match 2023 format (5 digits)
    const normalizedTeryt = teryt.replace(/^0+/, "");
    const districtNum = terytMap.get(normalizedTeryt) ?? terytMap.get(teryt);
    if (districtNum === undefined) {
      unmappedCount++;
      continue;
    }

    const agg = districtAgg.get(districtNum)!;
    const rowTotalVotes = parseInt(row[totalVotesCol]?.replace(/"/g, "").trim() || "0", 10);
    agg.totalValidVotes += isNaN(rowTotalVotes) ? 0 : rowTotalVotes;

    for (let j = 0; j < candidateNames.length; j++) {
      const colIdx = candidateStartCol + j;
      const votes = parseInt(row[colIdx]?.replace(/"/g, "").trim() || "0", 10);
      if (isNaN(votes)) continue;

      const candidateId = normalizeCandidateId(candidateNames[j]);
      const candidate = agg.candidates.get(candidateId);
      if (candidate) {
        candidate.votes += votes;
      }
    }
  }

  if (unmappedCount > 0) {
    console.warn(`  WARNING: ${unmappedCount} rows with unmapped TERYT codes`);
  }

  // Build district results
  const districts: DistrictResult[] = [];
  for (let d = 1; d <= 41; d++) {
    const agg = districtAgg.get(d)!;
    const districtInfo = DISTRICT_SIZES[d];

    const results: PartyResult[] = [];
    for (const [candidateId, data] of agg.candidates) {
      if (data.votes > 0) {
        results.push({
          partyId: candidateId,
          partyName: data.name,
          votes: data.votes,
          percentage: agg.totalValidVotes > 0 ? Math.round((data.votes / agg.totalValidVotes) * 10000) / 100 : 0,
        });
      }
    }

    // Sort by votes descending
    results.sort((a, b) => b.votes - a.votes);

    districts.push({
      district: {
        number: d,
        name: districtInfo.name,
        districtSize: districtInfo.size,
      },
      results,
      totalValidVotes: agg.totalValidVotes,
    });
  }

  console.log(`  Processed ${districts.length} districts`);

  return {
    election: ELECTIONS[electionId],
    districts,
  };
}

// --- Main ---

function main() {
  console.log("=== PKW Data Processing Script ===\n");

  // Step 1: Build TERYT → district mapping
  const terytMap = buildTerytToDistrictMap();

  // Step 2: Process parliamentary elections (per-okręg)
  const parlElections = ["parlamentarne-2023", "parlamentarne-2019"];
  for (const electionId of parlElections) {
    try {
      const data = processParlamentarne(electionId);
      const outPath = path.join(OUTPUT_DIR, `${electionId}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`  ✓ Written to ${outPath}`);
    } catch (e) {
      console.error(`  ✗ Failed: ${(e as Error).message}`);
    }
  }

  // Step 3: Process presidential elections (per-gmina → aggregate)
  const prezElections = ["prezydenckie-2025", "prezydenckie-2020"];
  for (const electionId of prezElections) {
    try {
      const data = processPrezydenckie(electionId, terytMap);
      const outPath = path.join(OUTPUT_DIR, `${electionId}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`  ✓ Written to ${outPath}`);
    } catch (e) {
      console.error(`  ✗ Failed: ${(e as Error).message}`);
    }
  }

  console.log("\n=== Done ===");
}

main();
