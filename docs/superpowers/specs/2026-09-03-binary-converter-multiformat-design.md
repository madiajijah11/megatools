# Binary Converter Multi-Format Input Support

## Problem Statement
The current `/binary-converter` tool only accepts raw UTF-8 text as input and converts it into binary, hex, base58, base32, and decimal outputs. Users cannot enter binary, hex, base58, base32, or decimal data to decode back into text or convert between alternative formats.

## Goals
1. Provide an input format selector: `text`, `binary`, `hex`, `base58`, `base32`, `decimal`.
2. Convert input format into a normalized `Uint8Array` byte representation.
3. Show all target formats (Text, Binary, Hex, Base58, Base32, Decimal) in real time.
4. Display clear inline validation errors when the input format is malformed without breaking the UI.
5. Retain client-side only processing, zero external dependencies.

## Architecture & Logic
- **State**:
  - `inputFormat`: `"text" | "binary" | "hex" | "base58" | "base32" | "decimal"`
  - `inputValue`: string
  - `error`: string | null
- **Decoders** (`string` -> `Uint8Array`):
  - `text`: `new TextEncoder().encode(input)`
  - `binary`: strips non-0/1 characters or accepts whitespace-separated bytes, validates binary string, parses 8-bit groups.
  - `hex`: strips prefix `0x`, spaces, colons, parses byte pairs (`[0-9a-fA-F]{2}`).
  - `base58`: reverse base58 lookup using Bitcoin alphabet.
  - `base32`: reverse base32 lookup using RFC 4648 alphabet.
  - `decimal`: splits by commas/spaces/newlines, parses numbers `0..255`.
- **Encoders** (`Uint8Array` -> `string`):
  - `text`: `new TextDecoder("utf-8", { fatal: false }).decode(bytes)`
  - Existing: `bytesToBinary`, `bytesToHex`, `bytesToBase58`, `bytesToBase32`, `bytesToDecimal`
- **Outputs**:
  - Displays cards for all output formats. If input is not text, Text output is prominently displayed.
