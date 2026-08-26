# Header Navigation & Command Palette Design

## Problem
With 18 tools currently available in MegaTools, rendering all tool links horizontally in the header navbar (`QuickSwitchBar`) overflows screen width, creates visual clutter, and harms user experience on desktop and mobile viewports.

## Solution
Replace the horizontal list of tool links with a compact, structured header containing:
1. **Tools Dropdown Menu**: A grouped menu classifying all 18 tools into 4 logical categories with icons and active route indicators.
2. **Command Palette (`⌘K` / `Ctrl+K`)**: A quick search dialog allowing instant keyboard navigation and search across all tools by name, description, or keyword.
3. **Responsive Header Layout**: Retains logo on the left and Support button on the right, keeping the header clean and compact across all screen sizes.

---

## Architecture & Components

### 1. Categories Mapping (`src/lib/tool-data.ts`)
Add category metadata to `ToolInfo` or define a categorized helper in `src/lib/tool-data.ts`:
- **Format & Text**: JSON Formatter, Base64, URL Encoder, Text Diff, Text Transformer, Markdown Preview
- **Security & Cryptography**: Password Generator, UUID Generator, Hash Generator, AES Encrypt/Decrypt, JWT Decoder
- **Media & QR**: QR Code Generator, QR Scanner, Image Compressor
- **Dev & Network**: Timestamp Converter, Regex Tester, Chmod Calculator, CIDR Calculator

### 2. Header Navigation Dropdown (`src/components/ToolsDropdown.tsx` or enhanced `QuickSwitchBar.tsx`)
- Trigger button: "Tools" with chevron icon, highlighting when current page is any tool page.
- Dropdown panel:
  - 2-column or 4-group grid layout inside a floating popover card.
  - Backdrop blur / shadow styled matching design tokens (`bg-bg-card`, `border-border-subtle`).
  - Clicking any tool navigates to the route and closes the dropdown.
  - Accessible via mouse click and keyboard (Escape to close, outside click dismissal).

### 3. Command Palette Modal (`src/components/CommandPalette.tsx`)
- Trigger button in header: Shows search icon and `⌘K` / `Ctrl+K` badge.
- Keyboard listeners: Global listener for `keydown` (`Meta+k` / `Control+k` / `/` / `Escape`).
- Dialog overlay:
  - Backdrop overlay with blur.
  - Search input with auto-focus and clear button.
  - Filtered results list with instant fuzzy/substring matching on title, shortTitle, and description.
  - Keyboard navigation: Arrow Up (`↑`), Arrow Down (`↓`), Enter (`↵`) to open tool, and Escape (`Esc`) to close.
  - Shows category badge or emoji for each item.
  - Empty state when no matching tool is found.

### 4. Root Layout Integration (`src/app/layout.tsx`)
- Replace direct `QuickSwitchBar` horizontal list in `<header>` with the new navigation controls.
- Keep layout clean: `[Logo]` -> `[Tools Dropdown + Search Button]` -> `[Support Link]`.

---

## Verification & Testing
1. Build verification: `npm run build` passes with zero type errors.
2. Responsiveness: Verify header at mobile (<640px), tablet (640-1024px), and desktop (>1024px) screen sizes.
3. Keyboard navigation: Test `Cmd+K` / `Ctrl+K`, arrow key selection, and Enter to navigate.
4. Active indicator: Ensure current active tool is visually distinguished in the dropdown.
