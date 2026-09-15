"use client";

import { useState, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type Mode = "encode" | "decode";

export default function SteganographyClient() {
  const [mode, setMode] = useState<Mode>("encode");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [secretText, setSecretText] = useState("");
  const [encodedUrl, setEncodedUrl] = useState<string | null>(null);
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Maximum characters that can fit (each char is 8 bits -> 8 bytes/pixels)
  const maxCapacity = imageSize ? Math.floor((imageSize.width * imageSize.height * 3) / 8) - 4 : 0;

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG recommended).");
      return;
    }
    setError(null);
    setEncodedUrl(null);
    setDecodedMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);

      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleEncode = useCallback(() => {
    if (!imageSrc || !imageSize || !secretText) return;
    setError(null);

    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;

        const textBytes = new TextEncoder().encode(secretText);
        const length = textBytes.length;

        if (length > maxCapacity) {
          setError(`Message is too long for this image capacity (Max: ${maxCapacity} chars).`);
          return;
        }

        // Store length in first 32 bits (4 bytes)
        for (let i = 0; i < 32; i++) {
          const bit = (length >> (31 - i)) & 1;
          data[i] = (data[i] & ~1) | bit;
        }

        // Store message bits in RGB channels
        let bitIndex = 32;
        for (let i = 0; i < textBytes.length; i++) {
          const byte = textBytes[i];
          for (let b = 7; b >= 0; b--) {
            const bit = (byte >> b) & 1;
            data[bitIndex] = (data[bitIndex] & ~1) | bit;
            bitIndex++;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            setEncodedUrl(URL.createObjectURL(blob));
          }
        }, "image/png");
      };
      img.src = imageSrc;
    } catch {
      setError("Failed to encode secret text into image.");
    }
  }, [imageSrc, imageSize, secretText, maxCapacity]);

  const handleDecode = useCallback(() => {
    if (!imageSrc || !imageSize) return;
    setError(null);
    setDecodedMessage(null);

    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;

        // Read length (first 32 bits)
        let length = 0;
        for (let i = 0; i < 32; i++) {
          length = (length << 1) | (data[i] & 1);
        }

        if (length <= 0 || length > (data.length / 8)) {
          setError("No hidden message found in this image or format corrupted.");
          return;
        }

        const bytes = new Uint8Array(length);
        let bitIndex = 32;
        for (let i = 0; i < length; i++) {
          let byte = 0;
          for (let b = 0; b < 8; b++) {
            byte = (byte << 1) | (data[bitIndex] & 1);
            bitIndex++;
          }
          bytes[i] = byte;
        }

        const decoded = new TextDecoder().decode(bytes);
        setDecodedMessage(decoded);
      };
      img.src = imageSrc;
    } catch {
      setError("Failed to decode secret message from image.");
    }
  }, [imageSrc, imageSize]);

  useEffect(() => {
    return () => {
      if (encodedUrl) URL.revokeObjectURL(encodedUrl);
    };
  }, [encodedUrl]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Mode:</span>
        <span className="text-accent font-bold uppercase">{mode}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Dimensions:</span>
        <span className="text-text-primary">
          {imageSize ? `${imageSize.width} × ${imageSize.height} px` : "—"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Max Capacity:</span>
        <span className="text-success font-bold">
          {maxCapacity > 0 ? `${maxCapacity.toLocaleString()} chars` : "—"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Payload:</span>
        <span className="text-text-primary">{secretText.length} chars</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="steganography" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Mode Selector */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 p-1 bg-bg-page rounded-lg border border-border-subtle text-xs">
            <button
              onClick={() => {
                setMode("encode");
                setError(null);
                setDecodedMessage(null);
              }}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                mode === "encode" ? "bg-accent text-bg-page" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Hide Secret Message (Encode)
            </button>
            <button
              onClick={() => {
                setMode("decode");
                setError(null);
                setDecodedMessage(null);
              }}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                mode === "decode" ? "bg-accent text-bg-page" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Reveal Secret Message (Decode)
            </button>
          </div>
        </div>

        {/* Carrier Image Upload */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-text-primary block">
            {mode === "encode" ? "Carrier Image (PNG)" : "Steganographic Image to Read"}
          </span>

          {!imageSrc ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                dragOver
                  ? "border-accent bg-accent/5"
                  : "border-border-subtle hover:border-accent/40 bg-bg-page"
              }`}
            >
              <span className="text-2xl mb-2">🖼️</span>
              <span className="text-sm font-semibold text-text-primary">
                Upload carrier image (PNG / WebP / JPEG)
              </span>
              <span className="text-xs text-text-muted mt-1">
                Zero server upload — 100% Canvas LSB encoding in browser RAM
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
              />
            </label>
          ) : (
            <div className="p-3 rounded-lg border border-border-subtle bg-bg-page flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🖼️</span>
                <span className="font-bold text-text-primary">Image loaded:</span>
                <span className="text-text-muted">
                  {imageSize?.width} × {imageSize?.height} px (Max: {maxCapacity.toLocaleString()} chars)
                </span>
              </div>
              <button
                onClick={() => {
                  setImageSrc(null);
                  setImageSize(null);
                  setEncodedUrl(null);
                  setDecodedMessage(null);
                }}
                className="text-xs text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle"
              >
                [Change Image]
              </button>
            </div>
          )}
        </div>

        {/* Encode Inputs */}
        {mode === "encode" && imageSrc && (
          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Secret Message to Embed</span>
              <span className="text-text-muted">
                {secretText.length} / {maxCapacity} chars
              </span>
            </div>
            <textarea
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              placeholder="Type your confidential message, private key, or password to hide inside pixels..."
              rows={4}
              className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            />
            <button
              type="button"
              onClick={handleEncode}
              disabled={!secretText.trim() || secretText.length > maxCapacity}
              className="px-4 py-2 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Encode & Hide Message
            </button>
          </div>
        )}

        {/* Decode Action */}
        {mode === "decode" && imageSrc && (
          <div className="pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={handleDecode}
              className="px-4 py-2 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
            >
              Extract & Reveal Hidden Message
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {error}
          </div>
        )}

        {/* Encoded Download Area */}
        {encodedUrl && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-success">✓ Secret Embedded Successfully</span>
              <a
                href={encodedUrl}
                download="stego-image.png"
                className="px-3 py-1 rounded bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
              >
                Download Stego PNG
              </a>
            </div>
            <p className="text-xs text-text-muted">
              Always save and share as a lossless **PNG** file. JPEG compression will destroy the LSB payload.
            </p>
          </div>
        )}

        {/* Decoded Message Result */}
        {decodedMessage !== null && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Extracted Hidden Message</span>
              <CopyButton text={decodedMessage} label="Copy Message" />
            </div>
            <pre className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-72 overflow-y-auto leading-relaxed">
              {decodedMessage}
            </pre>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
