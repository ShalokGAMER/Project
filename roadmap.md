# CommunityGuardian — Task Roadmap

Base build (brief 1)
- [x] Design system (forest green/emerald tokens, Inter), header/footer shell
- [x] Home page (hero, how it works, impact, recent reports, why, CTA)
- [x] Report flow (upload, form, simulated scan, complaint letter)
- [ ] Dashboard (stats, filters, search, upvotes)
- [ ] Community map (Leaflet, severity markers, legend, list toggle)
- [ ] Report detail + tracking timeline + demo status changes
- [ ] About / Contact / Privacy page
- [ ] Store + AI-sim tests (vitest)

PWA upgrade (brief 2 — focused, no redesign)
- [ ] Manifest (name CommunityGuardian, short_name Guardian, standalone, portrait, icons from logo)
- [ ] Service worker via vite-plugin-pwa (generateSW, guarded registration, NetworkFirst nav, CacheFirst assets)
- [ ] iOS meta (apple-mobile-web-app-*, viewport), safe-area insets
- [ ] Camera + gallery capture on report upload
- [ ] Small install option (no aggressive popup), offline indicator
- [ ] Mobile polish: overflow, touch targets, image sizing, nav
- [ ] Verify build + tests + Playwright end-to-end (report flow, map, dashboard)
