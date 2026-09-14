/**
 * Party mapping and available geographic distributions.
 *
 * Architecture:
 * - `availableDistributions` is generated at runtime from loaded election JSON files
 *   (every party/candidate in every election = one distribution option)
 * - `partyDefaults` maps canonical party IDs to their default distribution + alternatives
 */

/** A single available geographic distribution source */
export interface DistributionSource {
  /** Composite ID: "<electionId>:<partyId>", e.g. "parlamentarne-2023:ko" */
  id: string;
  /** Election file ID, e.g. "parlamentarne-2023" */
  electionId: string;
  /** Party/candidate ID within that election's data */
  partyId: string;
  /** Human-readable label for UI, e.g. "KO — Parlamentarne 2023" */
  label: string;
}

/** Default distribution assignment for a party in the simulator */
export interface PartyDefault {
  /** Canonical display name for UI */
  displayName: string;
  /** Short name / abbreviation */
  shortName: string;
  /** Default distribution ID (from availableDistributions) */
  defaultDistribution: string;
  /** Alternative distributions the user might want to pick */
  alternativeDistributions: string[];
}

export type PartyDefaults = Record<string, PartyDefault>;

/**
 * Default party mappings for major Polish parties.
 * Keys are canonical party IDs used in the simulator UI.
 * Values point to distribution sources (electionId:partyId).
 *
 * Users can override the assigned distribution in the UI —
 * these are just sensible defaults.
 */
export const partyDefaults: PartyDefaults = {
  pis: {
    displayName: "Prawo i Sprawiedliwość",
    shortName: "PiS",
    defaultDistribution: "parlamentarne-2023:prawo-i-sprawiedliwosc",
    alternativeDistributions: [
      "parlamentarne-2019:prawo-i-sprawiedliwosc",
      "prezydenckie-2025:nawrocki",
      "prezydenckie-2020:duda",
    ],
  },
  ko: {
    displayName: "Koalicja Obywatelska",
    shortName: "KO",
    defaultDistribution: "parlamentarne-2023:koalicja-obywatelska-po-n-ipl-zieloni",
    alternativeDistributions: [
      "parlamentarne-2019:koalicja-obywatelska-po-n-ipl-zieloni",
      "prezydenckie-2025:trzaskowski",
      "prezydenckie-2020:trzaskowski",
    ],
  },
  lewica: {
    displayName: "Lewica",
    shortName: "Lewica",
    defaultDistribution: "parlamentarne-2023:nowa-lewica",
    alternativeDistributions: [
      "parlamentarne-2019:sojusz-lewicy-demokratycznej",
      "prezydenckie-2025:biejat",
      "prezydenckie-2020:biedron",
    ],
  },
  polska2050: {
    displayName: "Polska 2050",
    shortName: "PL2050",
    defaultDistribution: "prezydenckie-2025:holownia",
    alternativeDistributions: [
      "parlamentarne-2023:trzecia-droga-polska-2050-szymona-holowni-polskie-stronnictwo-ludowe",
      "prezydenckie-2020:holownia",
    ],
  },
  psl: {
    displayName: "Polskie Stronnictwo Ludowe",
    shortName: "PSL",
    defaultDistribution: "parlamentarne-2019:polskie-stronnictwo-ludowe",
    alternativeDistributions: [
      "parlamentarne-2023:trzecia-droga-polska-2050-szymona-holowni-polskie-stronnictwo-ludowe",
    ],
  },
  konfederacja: {
    displayName: "Konfederacja",
    shortName: "Konf",
    defaultDistribution: "parlamentarne-2023:konfederacja-wolnosc-i-niepodleglosc",
    alternativeDistributions: [
      "parlamentarne-2019:konfederacja-wolnosc-i-niepodleglosc",
      "prezydenckie-2025:mentzen",
      "prezydenckie-2020:bosak",
    ],
  },
  rozwojplus: {
    displayName: "Rozwój Plus",
    shortName: "Rozwój+",
    // Klub wyodrębniony z PiS w lipcu 2026 (M. Morawiecki). Brak własnej historii wyborczej;
    // najbliższe geograficzne proxy: Polska Jest Najważniejsza 2011 (umiarkowany odłam PiS).
    defaultDistribution: "parlamentarne-2011:polska-jest-najwazniejsza",
    alternativeDistributions: [
      "parlamentarne-2023:trzecia-droga-polska-2050-szymona-holowni-polskie-stronnictwo-ludowe",
      "parlamentarne-2023:prawo-i-sprawiedliwosc",
      "prezydenckie-2025:nawrocki",
    ],
  },
  kkp: {
    displayName: "Konfederacja Korony Polskiej",
    shortName: "KKP",
    defaultDistribution: "prezydenckie-2025:braun",
    alternativeDistributions: [],
  },
  razem: {
    displayName: "Razem",
    shortName: "Razem",
    defaultDistribution: "prezydenckie-2025:zandberg",
    alternativeDistributions: ["parlamentarne-2023:nowa-lewica"],
  },
};
