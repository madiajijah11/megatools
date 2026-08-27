"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

export default function SteganographyClient() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [secretText, setSecretText] = useState("");
  const [encodedUrl, setEncodedUrl] = useState<string | null>(null);
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (selectedFile: File) => {
      setError(null);
      setEncodedUrl(null);
      setDecodedMessage(null);

      if (!selectedFile.type.startsWith("image/")) {
        setError("Please upload a valid image file.");
        return;
      }

      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      const img = new Image();
      img.onload = () => {
        // 3 bits per pixel (R, G, B channels, excluding Alpha) minus 4 bytes header
        const maxBytes = Math.floor((img.naturalWidth * img.naturalHeight * 3) / 8) - 4;
        setCapacity(Math.max(0, maxBytes));

        if (mode === "decode") {
          decodeFromImage(img);
        }
      };
      img.src = url;
    },
    [mode]
  );

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (encodedUrl) URL.revokeObjectURL(encodedUrl);
    };
  }, [previewUrl, encodedUrl]);

  const encodeIntoImage = async () => {
    if (!file || !previewUrl || !secretText.trim()) return;
    setProcessing(true);
    setError(null);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = previewUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas context unavailable");

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const textBytes = new TextEncoder().encode(secretText);
      const msgLen = textBytes.length;

      if (msgLen > capacity) {
        throw new Error(
          `Message too large (${msgLen} bytes). Image capacity is ${capacity} bytes.`
        );
      }

      // 4 bytes length header + payload
      const payload = new Uint8Array(4 + msgLen);
      payload[0] = (msgLen >> 24) & 0xff;
      payload[1] = (msgLen >> 16) & 0xff;
      payload[2] = (msgLen >> 8) & 0xff;
      payload[3] = msgLen & 0xff;
      payload.set(textBytes, 4);

      let byteIdx = 0;
      let bitIdx = 0;

      for (let i = 0; i < data.length && byteIdx < payload.length; i++) {
        // Skip alpha channel (i % 4 === 3)
        if (i % 4 === 3) continue;

        const bit = (payload[byteIdx] >> (7 - bitIdx)) & 1;
        data[i] = (data[i] & ~1) | bit;

        bitIdx++;
        if (bitIdx === 8) {
          bitIdx = 0;
          byteIdx++;
        }
      }

      ctx.putImageData(imgData, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("Encoding failed");

      const url = URL.createObjectURL(blob);
      setEncodedUrl(url);
    } catch (err) {
      setError(`Encode failed: ${(err as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  const decodeFromImage = (img: HTMLImageElement) => {
    setProcessing(true);
    setError(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas context unavailable");

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Extract first 32 bits for length header
      let headerBits = 0;
      let bitsRead = 0;
      let dataIdx = 0;

      while (bitsRead < 32 && dataIdx < data.length) {
        if (dataIdx % 4 !== 3) {
          headerBits = (headerBits << 1) | (data[dataIdx] & 1);
          bitsRead++;
        }
        dataIdx++;
      }

      const msgLen = headerBits >>> 0;
      const maxPossible = Math.floor((canvas.width * canvas.height * 3) / 8) - 4;

      if (msgLen === 0 || msgLen > maxPossible) {
        setDecodedMessage(null);
        setError("No hidden message found in this image or format corrupted.");
        return;
      }

      const messageBytes = new Uint8Array(msgLen);
      let byteIdx = 0;
      let curByte = 0;
      let bitIdx = 0;

      while (byteIdx < msgLen && dataIdx < data.length) {
        if (dataIdx % 4 !== 3) {
          curByte = (curByte << 1) | (data[dataIdx] & 1);
          bitIdx++;
          if (bitIdx === 8) {
            messageBytes[byteIdx] = curByte;
            byteIdx++;
            curByte = 0;
            bitIdx = 0;
          }
        }
        dataIdx++;
      }

      const text = new TextDecoder("utf-8", { fatal: true }).decode(messageBytes);
      setDecodedMessage(text);
    } catch {
      setError("Failed to decode text. The image might not contain a steganographic message.");
      setDecodedMessage(null);
    } finally {
      setProcessing(false);
    }
  };

  const textBytesCount = new TextEncoder().encode(secretText).length;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Max Capacity</p>
        <p className="text-text-primary font-mono">
          {capacity ? `${(capacity / 1024).toFixed(1)} KB` : "—"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Message Size</p>
        <p className="text-text-primary font-mono">{textBytesCount ? `${textBytesCount} B` : "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Image Steganography</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Hide secret messages in image pixels (LSB) or reveal embedded text.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="mb-6 flex rounded border border-border-subtle bg-bg-page p-1">
            <button
              onClick={() => {
                setMode("encode");
                setError(null);
                setDecodedMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${
                mode === "encode"
                  ? "bg-accent text-bg-page font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              $ mode --encode (Hide Text)
            </button>
            <button
              onClick={() => {
                setMode("decode");
                setError(null);
                setEncodedUrl(null);
              }}
              className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${
                mode === "decode"
                  ? "bg-accent text-bg-page font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              $ mode --decode (Extract Text)
            </button>
          </div>

          {/* Upload Dropzone */}
          {!file ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed px-6 py-8 text-center transition-colors ${
                dragOver
                  ? "border-accent bg-accent-soft"
                  : "border-border-subtle bg-bg-page hover:border-accent"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <span className="font-mono text-sm text-text-secondary">
                {mode === "encode"
                  ? "$ drop cover image (PNG/JPG)"
                  : "$ drop steganographic PNG image"}
              </span>
              <span className="text-xs text-text-muted">
                {mode === "encode"
                  ? "Lossless PNG output prevents compression artifacts"
                  : "Automatic LSB bit reader"}
              </span>
            </label>
          ) : (
            <div className="space-y-6">
              {/* Selected File Card */}
              <div className="flex items-center justify-between rounded border border-border-subtle bg-bg-page p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold text-text-primary">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {(file.size / 1024).toFixed(1)} KB · Max capacity:{" "}
                    <span className="text-accent font-mono">{(capacity / 1024).toFixed(1)} KB</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setEncodedUrl(null);
                    setDecodedMessage(null);
                  }}
                  className="btn-secondary text-xs shrink-0"
                >
                  Change Image
                </button>
              </div>

              {/* Encode Mode: Message input */}
              {mode === "encode" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-secondary">
                      Secret message to hide
                    </label>
                    <textarea
                      value={secretText}
                      onChange={(e) => {
                        setSecretText(e.target.value);
                        setEncodedUrl(null);
                      }}
                      placeholder="Type your secret payload here..."
                      className="input-field min-h-[120px] resize-y font-mono text-sm"
                    />
                    <div className="flex justify-between text-xs text-text-muted mt-1 font-mono">
                      <span>
                        Size: {textBytesCount} / {capacity} bytes
                      </span>
                      {textBytesCount > capacity && (
                        <span className="text-error">Exceeds capacity!</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={encodeIntoImage}
                    disabled={processing || !secretText.trim() || textBytesCount > capacity}
                    className="btn-primary w-full"
                  >
                    {processing ? "Encoding LSB..." : "$ embed message in pixels"}
                  </button>

                  {/* Encoded output download */}
                  {encodedUrl && (
                    <div className="rounded border border-accent/40 bg-accent-soft p-4 text-center space-y-3">
                      <p className="text-sm font-semibold text-accent">
                        ✓ Message successfully embedded in PNG pixels!
                      </p>
                      <a
                        href={encodedUrl}
                        download={`stego-${file.name.replace(/\.[^/.]+$/, "")}.png`}
                        className="btn-primary inline-block py-1.5 px-6 text-xs"
                      >
                        Download stego.png
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Decode Mode: Extracted Output */}
              {mode === "decode" && (
                <div className="space-y-4">
                  {decodedMessage !== null ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-secondary">
                        Extracted secret message:
                      </label>
                      <div className="relative">
                        <textarea
                          readOnly
                          value={decodedMessage}
                          className="output-field min-h-[140px] text-accent font-mono"
                        />
                        <div className="absolute top-2 right-2">
                          <CopyButton text={decodedMessage} label="copy" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    !error && (
                      <p className="text-center text-xs font-mono text-text-muted">
                        Scanning pixel channels for LSB signature...
                      </p>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-error text-center font-mono">{error}</p>}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="steganography" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="steganography" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
