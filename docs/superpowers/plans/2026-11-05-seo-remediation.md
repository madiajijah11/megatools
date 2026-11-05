# SEO Remediations Plan: MegaTools

## Target Problem
Google & search engines flag errors due to:
1. Missing `canonical` tags across ~71 tool pages (causing duplicate/competing URL issues).
2. Missing structured data (`WebApplication` schema) across ~106 tool pages.
3. Lack of category-based internal linking between related tools (weak topical authority and crawl depth).
4. `sitemap.ts` dynamic fake `lastModified` on every request.
5. Missing default page-level OG image / Twitter card assets consistency.

---

## Phase 1: Technical Foundation (Sitemap & Canonical Automation)
- Update `src/app/sitemap.ts`:
  - Map tool pages to real `lastModified` dates derived from `CHANGELOG_ITEMS` or tool registration date (fallback to stable repo baseline date, not dynamic `new Date()`).
- Verify domain baseline in `metadataBase` matches `process.env.NEXT_PUBLIC_SITE_URL || 'https://megatools-tau.vercel.app'`.

## Phase 2: Batch Standardize Tool Metadata & JSON-LD
- Create a script or systematically update all 119 tool `src/app/<tool-slug>/page.tsx`:
  - Inject `alternates: { canonical: "/<tool-slug>" }`.
  - Inject standardized schema.org `WebApplication` JSON-LD in `page.tsx` server component with:
    - `@type: "WebApplication"`
    - `name: "<Tool Title>"`
    - `url: "https://megatools-tau.vercel.app/<tool-slug>"`
    - `applicationCategory: "UtilityApplication"` / `"DeveloperApplication"`
    - `operatingSystem: "All"`
    - `offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }`

## Phase 3: Internal Linking (Related Tools in InfoPanel)
- Update `src/components/InfoPanel.tsx` & `src/components/MobileInfoDrawer.tsx`:
  - Show "Related Tools" section based on category in `TOOL_CATEGORIES`.
  - 3-4 contextual links per tool page with descriptive anchor text (`href="/tool-slug"`).
  - Keeps crawl depth <= 2 clicks from any tool page to any other tool in the same category.

## Phase 4: Verification & Zero-Type-Error Gate
- Run `npx tsc --noEmit`
- Run `npm run build`
- Inspect generated `sitemap.xml` & headers to ensure 0 errors.
