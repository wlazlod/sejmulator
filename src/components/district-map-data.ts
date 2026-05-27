/**
 * Mapping of SVG path IDs (from Wikipedia Sejm districts SVG) to district numbers (1-41).
 *
 * Source SVG: https://commons.wikimedia.org/wiki/File:Sejm_RP_okr%C4%99gi.svg
 * License: CC BY-SA 4.0 (author: Lukasb1992)
 *
 * This mapping was built by computing centroids of SVG paths and matching them
 * to known geographic positions of district capital cities. Some entries in dense
 * areas (e.g. Silesia) may need manual correction after visual inspection.
 *
 * To verify/fix: run `npm run dev`, open the app, simulate, expand the map,
 * and hover over districts to check the tooltip matches the expected city.
 */
export const PATH_TO_DISTRICT: Record<string, number> = {
  path3408: 1, // Legnica
  path3725: 2, // Wałbrzych
  path3393: 3, // Wrocław
  path3712: 5, // Toruń
  path3617: 4, // Bydgoszcz
  path3428: 6, // Lublin
  path3507: 7, // Chełm
  path3465: 8, // Zielona Góra
  path3626: 9, // Łódź
  path3557: 10, // Piotrków Trybunalski
  path3525: 11, // Sieradz
  path3555: 12, // Chrzanów
  path3510: 13, // Kraków
  path3608: 14, // Nowy Sącz
  path3580: 15, // Tarnów
  path4350: 16, // Płock
  path3614: 17, // Radom
  path3479: 18, // Siedlce
  path4250: 19, // Warszawa
  path4296: 20, // Warszawa (obwarzanek)
  path3453: 21, // Opole
  path3407: 22, // Krosno
  path3444: 23, // Rzeszów
  path3840: 24, // Białystok
  path3498: 25, // Gdańsk
  path3464: 26, // Gdynia
  path3929: 27, // Bielsko-Biała
  path3913: 28, // Częstochowa
  path4467: 29, // Katowice
  path4429: 30, // Rybnik
  path3396: 31, // Sosnowiec
  path3436: 32, // Gliwice
  path3653: 33, // Kielce
  path3488: 34, // Elbląg
  path3532: 35, // Olsztyn
  path3487: 36, // Kalisz
  path3529: 37, // Konin
  path3486: 38, // Piła
  path3506: 39, // Poznań
  path4412: 40, // Koszalin
  path4387: 41, // Szczecin
};

/** Reverse mapping: district number → SVG path ID */
export const DISTRICT_TO_PATH: Record<number, string> = Object.fromEntries(
  Object.entries(PATH_TO_DISTRICT).map(([pathId, districtNum]) => [districtNum, pathId]),
);
