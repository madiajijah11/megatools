# MegaTools Architectural & Component Specifications

MegaTools is a client-side suite of developer, security, AI, multimedia, and web3 utilities.
All data processing occurs in the user's browser runtime with zero remote server leakage.

---

## 1. Single Source of Truth Layout Standard (<ToolLayout />)

All tool pages must strictly render through `<ToolLayout />` (`src/components/ToolLayout.tsx`):

```tsx
import ToolLayout from "@/components/ToolLayout";

export default function MyToolClient() {
  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Metric Label:</span>
        <span className="text-accent font-bold">Value</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="my-tool" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Tool workspace UI */}
      </div>
    </ToolLayout>
  );
}
```

### Elements Automatically Rendered by <ToolLayout />:
1. **Top Nav:** `← [cd .. / home]` + mobile `[?] Tool Info` drawer trigger.
2. **Terminal Badge & Cursor:** `$ megatools --<tool-slug> --client-side █` with pulsing green cursor.
3. **Hero Title:** Bold font-mono title with green keyword highlight and description.
4. **12-Column Responsive Layout:** 8-column workspace on the left + 4-column desktop `<InfoPanel />` on the right.
5. **Mobile Drawer:** `<MobileInfoDrawer />` slide-in panel.

---

## 2. Tool Registry & Synchronization Protocol

### A. tool-data.ts (Dual Registration Requirement)
Every tool must be registered in two places within `src/lib/tool-data.ts`:
1. **`TOOLS` Array**: Object containing schema (`id`, `title`, `shortTitle`, `description`, `emoji`, `href`, `tech`, `steps`, `tips`, `example`).
2. **`TOOL_CATEGORIES` Array**: The `tool.id` must be present in the matching category's `toolIds` list.
   *Failure to register in `TOOL_CATEGORIES` causes the tool to be hidden on the homepage grid and search filters.*

### B. changelog-data.ts (Notification Bell Protocol)
1. Add entry at the **TOP** of `CHANGELOG_ITEMS`.
2. Must use real current date: `new Date().toISOString().split('T')[0]` (`YYYY-MM-DD`).
3. Powers the `<NotificationBell />` unread badge and `/changelog` page.

### C. README.md & SEO
1. Update matching table in `README.md`.
2. Dynamic sitemap at `src/app/sitemap.ts` automatically maps over `TOOLS`.

---

## 3. Tool Generation Command

Always use the scaffolding generator:
```bash
npm run make:tool <slug> "<Title>" <category> "<Tech>"
```