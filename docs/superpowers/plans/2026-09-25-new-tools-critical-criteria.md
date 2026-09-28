# New Tools — Critical Thinking & Acceptance Criteria

## Scope

Audit and complete the seven recently added tools before claiming feature completeness. All processing remains client-side; no network requests, uploads, or server persistence. Implement one tool at a time, verify its criteria, then continue.

## Shared completion gate

Every tool must:

- Preserve `<ToolLayout toolId="..." stats={stats}>` and SEO metadata.
- Keep input data in browser memory only.
- Provide explicit empty, invalid, and success states.
- Avoid claiming features not implemented.
- Include a top changelog entry (`fixed` or `improved`) for each completed change.
- Pass `npm run verify` and `npx tsc --noEmit` before completion.
- Be manually checked with valid, invalid, empty, boundary, and interaction inputs.

---

## 1. OpenAPI to TypeScript & Zod — `/openapi-to-ts`

### Current scope decision

V1 is a **components schema generator**, not an API client generator. Do not advertise `paths`/fetch/Axios generation until implemented.

### Acceptance criteria

- Input: valid OpenAPI 3 JSON parses.
- Input: valid OpenAPI 3 YAML parses.
- Input: Swagger 2 JSON either converts supported definitions or shows a clear unsupported-version message.
- Output: TypeScript `interface` and `type` modes compile for nested schemas.
- Output: Zod mode emits syntactically valid schemas and inferred types.
- Types: string, integer, number, boolean, null, object, array, enum, `$ref`, `oneOf`, `anyOf`, `allOf`, `additionalProperties`.
- Metadata: `nullable`, `format`, `default`, descriptions handled or explicitly documented as omitted.
- Required fields are non-optional; non-required fields are optional.
- Invalid YAML/JSON shows actionable parse error without clearing input.
- Missing `components.schemas` shows a clear empty-state message.
- Generated identifiers are safe for unusual schema/property names.
- No API calls are executed; output generation is deterministic.

### Manual checks

Valid JSON, valid YAML, nested object, array of `$ref`, enum, `allOf`, malformed YAML, empty input, no schemas, unusual property names.

### Files

- `src/app/openapi-to-ts/OpenapiToTsClient.tsx`
- `src/app/openapi-to-ts/page.tsx` if scope text changes
- `src/lib/changelog-data.ts`
- `README.md` if naming/scope changes

---

## 2. JSONL Analyzer — `/jsonl-analyzer`

### Acceptance criteria

- Parses one JSON value per physical input line without losing original line numbers.
- Reports valid count, invalid count, blank count, and total physical lines.
- Shows each invalid line number and parse error.
- Computes field frequency across valid object records.
- Computes observed type distribution per field.
- Reports schema drift: fields missing from or added to records relative to the union schema.
- Provides valid-only JSONL output with copy action.
- Provides invalid-line report with copy action.
- Empty input has a dedicated empty state, not a misleading zero-result success.
- Primitive/array JSONL values are counted without crashing; field analysis applies only to objects.
- Very long lines remain usable via wrapping/scrolling.
- No input leaves browser memory.

### Manual checks

Mixed valid/invalid/blank lines, nested objects, arrays, primitives, duplicate fields, inconsistent schemas, malformed UTF-8-like text, empty input.

### Files

- `src/app/jsonl-analyzer/JsonlAnalyzerClient.tsx`
- `src/lib/changelog-data.ts`

---

## 3. HTTP Request Builder — `/http-request-builder`

### Acceptance criteria

- Supports GET, POST, PUT, PATCH, DELETE.
- URL validation shows an error without destroying entered values.
- Query parameters can be added, edited, removed, and serialized safely.
- Headers parse only valid `name: value` rows; malformed rows are reported.
- Auth modes: none, Bearer, Basic, API key; generated outputs reflect selected auth.
- Body modes: none, JSON, form URL encoded, raw text.
- JSON body validation is explicit; invalid JSON does not produce misleading formatted code.
- Generates valid cURL with shell escaping.
- Generates valid browser `fetch` with headers, query string, and body handling.
- Generates valid Axios code for every supported method.
- Generates valid Python `requests` code including import and correct payload representation.
- No request is sent; UI states this clearly.
- Copy output preserves exact generated text.

### Manual checks

GET with query params, POST JSON, malformed JSON, bearer token, Basic auth, API key header, quotes in URL/header/body, malformed header, empty URL.

### Files

- `src/app/http-request-builder/HttpRequestBuilderClient.tsx`
- `src/lib/changelog-data.ts`

---

## 4. Environment File Editor & Sanitizer — `/env-file-editor`

### Acceptance criteria

- Parses `KEY=value`, optional `export`, blank lines, and comments while preserving line order.
- Handles quoted values and `#` inside quoted values.
- Detects duplicate keys and displays line numbers.
- Supports secret masking/unmasking in the UI without changing source content.
- Generates `.env.example` with configurable secret classification; does not blank safe values blindly.
- Generates JSON with deterministic duplicate-key behavior and a warning.
- Preserves comments and untouched lines in `.env` output.
- Invalid key syntax is reported with line number.
- Multiline values are either supported correctly or explicitly rejected with guidance.
- Clear input does not leave stale export output.
- Never logs or transmits values.

### Manual checks

Quoted URL, `#` in quotes, export prefix, duplicate keys, malformed key, blank/comment-only input, multiline value, secret-like names, safe `PORT` value.

### Files

- `src/app/env-file-editor/EnvFileEditorClient.tsx`
- `src/lib/changelog-data.ts`

---

## 5. Color Converter & Palette Studio — `/color-converter-pro`

### Acceptance criteria

- Accepts HEX 3/4/6/8-digit, RGB(A), HSL(A), and validates range.
- Outputs normalized HEX, RGB, HSL, and alpha where applicable.
- Computes actual tint/shade palette values; no hardcoded swatches.
- Provides OKLCH and LAB conversions with documented gamut behavior.
- Computes WCAG contrast ratios against white and black.
- Suggests accessible foreground color based on contrast.
- Generates copyable CSS variables and individual format values.
- Invalid input retains text and shows an actionable error.
- Color picker and text input stay synchronized.
- Boundary values (0/255, 0%/100%, alpha 0/1) are correct.

### Manual checks

Black, white, transparent, 3-digit HEX, 8-digit HEX, invalid HEX, out-of-range RGB, saturated colors, contrast edge cases.

### Files

- `src/app/color-converter-pro/ColorConverterProClient.tsx`
- `src/lib/changelog-data.ts`

---

## 6. Image Cropper & Resizer — `/image-cropper`

### Acceptance criteria

- Choose photo and Replace Photo both work without page reload.
- Preview displays the source image at usable scale.
- Dragging inside crop rectangle moves it.
- Four corner handles resize it with bounds.
- Edge handles or documented corner-only behavior is clear.
- Aspect-ratio lock works during mouse/touch resize.
- Crop rectangle cannot leave source bounds or become zero-sized.
- Output resize is separate from crop dimensions.
- Ratio presets (1:1, 4:3, 16:9, free) produce correct crop dimensions.
- Rotation preview matches exported result.
- PNG/JPEG/WebP download works with correct extension and dimensions.
- Large images fail gracefully or are downscaled intentionally with visible behavior.
- Empty state explains exactly how to load and replace an image.

### Manual checks

Portrait, landscape, square, transparent PNG, large image, corner drag in all directions, locked/unlocked ratio, replace image, rotate then export, output resize.

### Files

- `src/app/image-cropper/ImageCropperClient.tsx`
- `src/lib/changelog-data.ts`

---

## 7. Gitignore Generator — `/gitignore-generator`

### Acceptance criteria

- Presets cover framework/language, OS, IDE, and container categories with documented names.
- Multiple presets compose deterministically.
- Duplicate patterns are removed without changing negation semantics.
- Output includes readable section comments identifying each preset.
- Custom patterns append in a dedicated section.
- Reset presets/custom input works.
- Download `.gitignore` works in addition to copy.
- Preset selection shows active state and rule count.
- Empty custom input does not add blank noise.
- Output remains valid gitignore syntax; negation lines retain order.

### Manual checks

Single preset, all presets, overlapping presets, negation pattern, custom comments, reset, copy, download.

### Files

- `src/app/gitignore-generator/GitignoreGeneratorClient.tsx`
- `src/lib/changelog-data.ts`

---

## Implementation order

1. OpenAPI correctness and scope.
2. JSONL diagnostics/schema analysis.
3. HTTP serializer correctness.
4. ENV parser/editor correctness.
5. Color math and accessibility.
6. Image crop interaction and export.
7. Gitignore template quality.

Each step ends with manual criteria checks, a changelog entry, `npm run verify`, and `npx tsc --noEmit` before the next tool.
