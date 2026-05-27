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
  path3712: 4, // Bydgoszcz
  path3617: 5, // Toruń
  path3507: 6, // Lublin
  path3428: 7, // Chełm
  path3465: 8, // Zielona Góra
  path3557: 9, // Łódź
  path3626: 10, // Piotrków Trybunalski
  path3487: 11, // Sieradz
  path3653: 12, // Kraków (I)
  path3580: 13, // Kraków (II)
  path3608: 14, // Nowy Sącz
  path3555: 15, // Tarnów
  path3529: 16, // Płock
  path3525: 17, // Radom
  path3614: 18, // Siedlce
  path4296: 19, // Warszawa (I)
  path4250: 20, // Warszawa (II)
  path3913: 21, // Opole
  path3444: 22, // Krosno
  path3407: 23, // Rzeszów
  path3840: 24, // Białystok
  path3488: 25, // Gdańsk
  path3464: 26, // Gdynia
  path3436: 27, // Bielsko-Biała
  path3510: 28, // Częstochowa
  path4467: 29, // Katowice
  path4429: 30, // Bieruń
  path3396: 31, // Sosnowiec
  path3929: 32, // Gliwice
  path3453: 33, // Kielce
  path3498: 34, // Elbląg
  path3532: 35, // Olsztyn
  path4350: 36, // Kalisz
  path3479: 37, // Konin
  path3486: 38, // Piła
  path3506: 39, // Poznań
  path4387: 40, // Koszalin
  path4412: 41, // Szczecin
};

/** Reverse mapping: district number → SVG path ID */
export const DISTRICT_TO_PATH: Record<number, string> = Object.fromEntries(
  Object.entries(PATH_TO_DISTRICT).map(([pathId, districtNum]) => [districtNum, pathId]),
);
