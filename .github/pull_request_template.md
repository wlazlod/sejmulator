## Co się zmienia

<!-- jedno–dwa zdania; link do context/changes/<change-id>/ jeśli dotyczy -->

## Checklista

- [ ] `npm run lint`, `npm test`, `npm run build` zielone lokalnie
- [ ] `npm run test:e2e` zielone (albo uzasadnienie, dlaczego E2E nie dotyczy)
- [ ] nowe testy mają nagłówek `// test-plan: R-0X`; nowe ryzyko dopisane do `context/foundation/test-plan.md`
- [ ] dokumenty zaktualizowane, jeśli zmienia się produkt lub infrastruktura (`prd.md`, `roadmap.md`, `infrastructure.md`, `README.md`, `CLAUDE.md`)
- [ ] brak zmian w silniku (`src/lib/{dhondt,confidence,normalization}.ts`) bez aktualizacji oczekiwań w `dhondt.test.ts`
- [ ] brak sekretów w diffie (`.env`, `.dev.vars` pozostają lokalne)
