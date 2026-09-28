"use client";

import { useEffect, useRef, useState } from "react";
import ToolLayout from "@/components/ToolLayout";

interface Crop { x: number; y: number; width: number; height: number }
type Handle = "nw" | "ne" | "sw" | "se";
type Mode = "move" | Handle;
type Format = "image/png" | "image/jpeg" | "image/webp";
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const presets = [{ label: "Free", value: 0 }, { label: "1:1", value: 1 }, { label: "4:3", value: 4 / 3 }, { label: "16:9", value: 16 / 9 }];

export default function ImageCropperClient() {
  const [src, setSrc] = useState("");
  const [fileName, setFileName] = useState("image");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, width: 0, height: 0 });
  const [output, setOutput] = useState({ width: 0, height: 0 });
  const [ratio, setRatio] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [format, setFormat] = useState<Format>("image/png");
  const [drag, setDrag] = useState<{ mode: Mode; x: number; y: number; crop: Crop } | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const exportRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setFileName(file.name.replace(/\.[^.]+$/, "") || "image");
    setSrc(url);
  };
  useEffect(() => () => { if (src.startsWith("blob:")) URL.revokeObjectURL(src); }, [src]);

  useEffect(() => {
    if (!src) return;
    const image = new Image();
    image.onload = () => {
      const rotated = Math.abs(rotation % 180) === 90;
      const width = rotated ? image.naturalHeight : image.naturalWidth;
      const height = rotated ? image.naturalWidth : image.naturalHeight;
      setSize({ width, height });
      setCrop({ x: 0, y: 0, width, height });
      setOutput({ width, height });
    };
    image.src = src;
  }, [src]);

  useEffect(() => {
    if (!src || !size.width || !previewRef.current) return;
    const image = new Image();
    image.onload = () => {
      const canvas = previewRef.current!;
      const scale = Math.min(1, 720 / size.width, 460 / size.height);
      canvas.width = Math.max(1, Math.round(size.width * scale)); canvas.height = Math.max(1, Math.round(size.height * scale));
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      ctx.save(); ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(rotation * Math.PI / 180);
      const rotated = Math.abs(rotation % 180) === 90;
      ctx.drawImage(image, -image.naturalWidth * scale / 2, -image.naturalHeight * scale / 2, image.naturalWidth * scale, image.naturalHeight * scale); ctx.restore();
      const x = crop.x * scale, y = crop.y * scale, w = crop.width * scale, h = crop.height * scale;
      ctx.fillStyle = "rgba(0,0,0,.58)"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.clearRect(x, y, w, h);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(rotation * Math.PI / 180); ctx.drawImage(image, -image.naturalWidth * scale / 2, -image.naturalHeight * scale / 2, image.naturalWidth * scale, image.naturalHeight * scale); ctx.restore();
      ctx.strokeStyle = "#4ade80"; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); ctx.setLineDash([6, 5]); ctx.strokeStyle = "rgba(214,232,220,.7)"; ctx.strokeRect(x + w / 3, y, 1, h); ctx.strokeRect(x + w * 2 / 3, y, 1, h); ctx.strokeRect(x, y + h / 3, w, 1); ctx.strokeRect(x, y + h * 2 / 3, w, 1); ctx.setLineDash([]);
      ctx.fillStyle = "#4ade80"; for (const [hx, hy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) ctx.fillRect(hx - 6, hy - 6, 12, 12);
    }; image.src = src;
  }, [src, size, crop, rotation]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return { x: (event.clientX - rect.left) * size.width / rect.width, y: (event.clientY - rect.top) * size.height / rect.height }; };
  const begin = (mode: Mode, event: React.PointerEvent<HTMLCanvasElement>) => { if (!crop.width) return; event.currentTarget.setPointerCapture(event.pointerId); const p = point(event); setDrag({ mode, x: p.x, y: p.y, crop }); };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!drag) return; const p = point(event), dx = p.x - drag.x, dy = p.y - drag.y, o = drag.crop; let next = { ...o };
    if (drag.mode === "move") { next.x = clamp(o.x + dx, 0, size.width - o.width); next.y = clamp(o.y + dy, 0, size.height - o.height); }
    else { const left = drag.mode.includes("w"), top = drag.mode.includes("n"); let x = left ? clamp(o.x + dx, 0, o.x + o.width - 1) : o.x; let y = top ? clamp(o.y + dy, 0, o.y + o.height - 1) : o.y; let w = left ? o.x + o.width - x : clamp(o.width + dx, 1, size.width - o.x); let h = top ? o.y + o.height - y : clamp(o.height + dy, 1, size.height - o.y);
      if (ratio) { if (w / h > ratio) h = w / ratio; else w = h * ratio; if (left) x = o.x + o.width - w; if (top) y = o.y + o.height - h; if (x < 0) { x = 0; w = o.x + o.width; h = w / ratio; } if (y < 0) { y = 0; h = o.y + o.height; w = h * ratio; } if (x + w > size.width) { w = size.width - x; h = w / ratio; } if (y + h > size.height) { h = size.height - y; w = h * ratio; } } next = { x, y, width: Math.max(1, w), height: Math.max(1, h) }; }
    setCrop(next);
  };

  const chooseRatio = (value: number) => { setRatio(value); if (!value || !size.width) return; let width = crop.width, height = width / value; if (height > size.height) { height = size.height; width = height * value; } setCrop({ x: (size.width - width) / 2, y: (size.height - height) / 2, width, height }); };
  const reset = () => { setRotation(0); if (size.width) { setCrop({ x: 0, y: 0, width: size.width, height: size.height }); setOutput(size); } };
  const download = () => { if (!src || !crop.width || !exportRef.current) return; const image = new Image(); image.onload = () => { const work = document.createElement("canvas"); const rotated = Math.abs(rotation % 180) === 90; work.width = rotated ? image.naturalHeight : image.naturalWidth; work.height = rotated ? image.naturalWidth : image.naturalHeight; const c = work.getContext("2d")!; c.translate(work.width / 2, work.height / 2); c.rotate(rotation * Math.PI / 180); c.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2); const out = exportRef.current!; out.width = Math.max(1, Math.round(output.width || crop.width)); out.height = Math.max(1, Math.round(output.height || crop.height)); out.getContext("2d")!.drawImage(work, crop.x, crop.y, crop.width, crop.height, 0, 0, out.width, out.height); const a = document.createElement("a"); a.download = `${fileName}-cropped.${format.split("/")[1]}`; a.href = out.toDataURL(format, .92); a.click(); }; image.src = src; };
  const stats = <span className="text-xs text-text-muted">{src ? `${size.width}×${size.height}` : "Ready"}</span>;
  return <ToolLayout toolId="image-cropper" stats={stats}><div className="space-y-4 font-mono">
    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])} />
    {!src ? <div className="border border-dashed border-border-subtle p-12 text-center"><p className="text-text-secondary">Choose an image to crop, resize, rotate, then download. Files stay in your browser.</p><button className="mt-4 rounded bg-accent px-4 py-2 text-bg-page" onClick={() => inputRef.current?.click()}>Choose Photo</button></div> : <>
      <div className="flex flex-wrap items-center gap-2"><button className="rounded border border-border-subtle px-3 py-1" onClick={() => inputRef.current?.click()}>Replace Photo</button><span className="text-text-muted">{fileName}</span><button className="rounded border border-border-subtle px-3 py-1" onClick={() => setRotation((rotation + 90) % 360)}>Rotate 90°</button><button className="rounded border border-border-subtle px-3 py-1" onClick={reset}>Reset rotation</button></div>
      <div className="overflow-auto rounded border border-border-subtle bg-bg-card p-2"><canvas ref={previewRef} className="mx-auto block max-w-full touch-none" onPointerDown={e => begin("move", e)} onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)} /></div>
      <div className="flex flex-wrap gap-2">{presets.map(p => <button key={p.label} className={`rounded border px-3 py-1 ${ratio === p.value ? "border-accent text-accent" : "border-border-subtle"}`} onClick={() => chooseRatio(p.value)}>{p.label}</button>)}</div>
      <p className="text-xs text-text-muted">Drag inside to move. Drag the four corner handles to resize; edge handles are intentionally not provided.</p>
      <div className="grid gap-3 sm:grid-cols-3"><label>Output W<input type="number" min="1" value={output.width || ""} onChange={e => setOutput({ ...output, width: Math.max(1, Number(e.target.value) || 1) })} className="ml-2 w-24 rounded border border-border-subtle bg-bg-card px-2 py-1" /></label><label>Output H<input type="number" min="1" value={output.height || ""} onChange={e => setOutput({ ...output, height: Math.max(1, Number(e.target.value) || 1) })} className="ml-2 w-24 rounded border border-border-subtle bg-bg-card px-2 py-1" /></label><label>Format<select value={format} onChange={e => setFormat(e.target.value as Format)} className="ml-2 rounded border border-border-subtle bg-bg-card px-2 py-1"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label></div>
      <button className="rounded bg-accent px-4 py-2 text-bg-page" onClick={download}>Download crop</button><canvas ref={exportRef} className="hidden" />
    </>}
  </div></ToolLayout>;
}
