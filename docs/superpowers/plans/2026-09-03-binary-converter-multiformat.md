# Binary Converter Multi-Format Implementation Plan

> **Goal:** Support multi-format input (Text, Binary, Hex, Base58, Base32, Decimal) in `/binary-converter`.

---

### Task 1: Add Decoders and Parsers to BinaryConverterClient.tsx
- Add decoder functions:
  - `binaryToBytes(input: string): Uint8Array`
  - `hexToBytes(input: string): Uint8Array`
  - `base58ToBytes(input: string): Uint8Array`
  - `base32ToBytes(input: string): Uint8Array`
  - `decimalToBytes(input: string): Uint8Array`
  - `bytesToText(bytes: Uint8Array): string`
- Handle formatting nuances:
  - Strip spaces, delimiters, `0x` prefixes, uppercase/lowercase handling where appropriate.
  - Return informative error messages for invalid input.

### Task 2: Update State & UI in BinaryConverterClient.tsx
- Add input format selector buttons:
  - Text, Binary, Hex, Base58, Base32, Decimal
- Compute bytes via the selected decoder in `useMemo`.
- Render Text (UTF-8) output field along with Binary, Hex, Base58, Base32, Decimal.
- Render error alert if decoding fails.
- Update InfoPanel example/details if needed.

### Task 3: Verify and Build
- Run `npm run build` to verify TypeScript & Turbopack build pass without error.
- Verify decoding & encoding across all formats.
