"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

// Standard ASCII mini font mappings
const FONT_MAPS: Record<string, Record<string, string[]>> = {
  standard: {
    A: [" ___ ", "/ _ \\", "|/_\\|", "|   |"],
    B: [" ___ ", "| _ )", "| _ \\", "|___/"],
    C: [" ___ ", "/ __|", "| (__ ", "\\___|"],
    D: [" ___ ", "|   \\", "| |) |", "|___/"],
    E: [" ___ ", "| __|", "| _| ", "|___|"],
    F: [" ___ ", "| __|", "| _| ", "|_|  "],
    G: [" ___ ", "/ __|", "| (_|", "\\___|"],
    H: [" _ _ ", "| | |", "| - |", "|_|_|"],
    I: [" ___ ", " |_| ", " | | ", " | | "],
    J: ["   _ ", "  | |", "_ | |", "\\__/ "],
    K: [" _  _", "| |/ /", "| ' < ", "|_|\\_\\"],
    L: [" _   ", "| |  ", "| |__", "|____|"],
    M: [" _ _ ", "| \\/ |", "| |\\/|", "|_|  |"],
    N: [" _  _", "| \\| |", "| .` |", "|_|\\_|"],
    O: [" ___ ", "/ _ \\", "| (_) |", "\\___/"],
    P: [" ___ ", "| _ \\", "|  _/", "|_|  "],
    Q: [" ___ ", "/ _ \\", "| (_) |", " \\__\\_\\"],
    R: [" ___ ", "| _ \\", "|   /", "|_|_\\"],
    S: [" ___ ", "/ __|", "\\__ \\", "|___/"],
    T: [" ___ ", "|_ _|", " | | ", " |_| "],
    U: [" _ _ ", "| | |", "| |_|", "\\___/"],
    V: [" _ _ ", "| | |", "| V |", " \\_/ "],
    W: [" _ _ ", "| | |", "| |/|", "|__/|"],
    X: [" _  _", "\\ \\/ /", " >  < ", "/_/\\_\\"],
    Y: [" _ _ ", "\\ V /", " | | ", " |_| "],
    Z: [" ___ ", "|_  /", " / / ", "/___|"],
    "0": [" _ ", "| |", "|_|"],
    "1": ["  |", "  |", "  |"],
    "2": [" _ ", " _|", "|_ "],
    "3": [" _ ", " _|", " _|"],
    "4": ["   ", "|_|", "  |"],
    "5": [" _ ", "|_ ", " _|"],
    "6": [" _ ", "|_ ", "|_|"],
    "7": [" _ ", "  |", "  |"],
    "8": [" _ ", "|_|", "|_|"],
    "9": [" _ ", "|_|", " _|"],
    " ": ["   ", "   ", "   ", "   "],
    "!": [" | ", " | ", " . "],
    "-": ["   ", "---", "   "],
    "_": ["   ", "   ", "___"],
    ".": ["   ", "   ", " . "],
  },
  slant: {
    A: ["   /\\   ", "  /  \\  ", " / /\\ \\ ", "/_/  \\_\\"],
    B: [" ____  ", "| __ ) ", "|  _ \\ ", "|____/ "],
    C: ["  ____ ", " / ___|", "| |    ", " \\____|"],
    D: [" ____  ", "|  _ \\ ", "| | | |", "|____/ "],
    E: [" _____ ", "| ____|", "|  _|  ", "|_____|"],
    F: [" _____ ", "|  ___|", "| |_   ", "|_|    "],
    G: ["  ____ ", " / ___|", "| |__- ", " \\____|"],
    H: [" _   _ ", "| | | |", "| |_| |", "|_| |_|"],
    I: [" ___ ", "|_ _|", " | | ", "|___|"],
    J: ["     _ ", "    | |", " _  | |", "| |/ / "],
    K: [" _  __", "| |/ /", "| ' < ", "|_|\\_\\"],
    L: [" _     ", "| |    ", "| |___ ", "|_____|"],
    M: [" _   _ ", "| \\ / |", "| |V| |", "|_| |_|"],
    N: [" _   _ ", "| \\ | |", "|  \\| |", "|_|\\__|"],
    O: ["  ___  ", " / _ \\ ", "| (_) |", " \\___/ "],
    P: [" ____  ", "|  _ \\ ", "| |_) |", "| .__/ "],
    Q: ["  ___  ", " / _ \\ ", "| | | |", " \\_\\_\\ "],
    R: [" ____  ", "|  _ \\ ", "| |_) |", "|_|_\\_\\"],
    S: [" ____  ", "/ ___| ", "\\___ \\ ", "|____/ "],
    T: [" _____ ", "|_   _|", "  | |  ", "  |_|  "],
    U: [" _   _ ", "| | | |", "| |_| |", " \\___/ "],
    V: [" _   _ ", "| | | |", " \\ \\/ /", "  \\_/  "],
    W: [" _     _ ", "| | _ | |", "| || || |", " \\__/\\__/"],
    X: ["__  __", "\\ \\/ /", " >  < ", "/_/\\_\\"],
    Y: ["__   __", "\\ \\ / /", " \\ V / ", "  |_|  "],
    Z: [" _____ ", "|__  / ", "  / /  ", " /____|"],
    " ": ["   ", "   ", "   ", "   "],
  },
  blocks: {
    A: ["███", "█ █", "███", "█ █"],
    B: ["██ ", "██▄", "█ █", "██▀"],
    C: ["███", "█  ", "█  ", "███"],
    D: ["██ ", "█ █", "█ █", "██ "],
    E: ["███", "██ ", "█  ", "███"],
    F: ["███", "██ ", "█  ", "█  "],
    G: ["███", "█  ", "█ █", "███"],
    H: ["█ █", "███", "█ █", "█ █"],
    I: ["███", " █ ", " █ ", "███"],
    J: ["  █", "  █", "█ █", "███"],
    K: ["█ █", "██ ", "█ █", "█ █"],
    L: ["█  ", "█  ", "█  ", "███"],
    M: ["█ █", "███", "█ █", "█ █"],
    N: ["██ ", "█ █", "█ █", "█ █"],
    O: ["███", "█ █", "█ █", "███"],
    P: ["███", "███", "█  ", "█  "],
    Q: ["███", "█ █", "███", "  █"],
    R: ["███", "███", "██ ", "█ █"],
    S: ["███", "██ ", "  █", "███"],
    T: ["███", " █ ", " █ ", " █ "],
    U: ["█ █", "█ █", "█ █", "███"],
    V: ["█ █", "█ █", "█ █", " █ "],
    W: ["█ █", "█ █", "███", "█ █"],
    X: ["█ █", " █ ", " █ ", "█ █"],
    Y: ["█ █", "███", " █ ", " █ "],
    Z: ["███", "  █", " █ ", "███"],
    " ": ["  ", "  ", "  ", "  "],
  },
};

const DENSITY_RAMPS: Record<string, string> = {
  standard: "@%#*+=-:. ",
  detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  blocks: "█▓▒░ ",
  simple: "#O+-. ",
};

export default function AsciiBannerClient() {
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");

  // Text Banner States
  const [textInput, setTextInput] = useState("MEGATOOLS");
  const [selectedFont, setSelectedFont] = useState<"standard" | "slant" | "blocks">("standard");

  // Image to ASCII States
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [asciiWidth, setAsciiWidth] = useState<number>(60);
  const [charRamp, setCharRamp] = useState<"standard" | "detailed" | "blocks" | "simple">("standard");
  const [invertRamp, setInvertRamp] = useState<boolean>(false);
  const [imageAsciiOutput, setImageAsciiOutput] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Generate Text FIGlet Banner
  const textBannerOutput = useMemo(() => {
    if (!textInput.trim()) return "";
    const font = FONT_MAPS[selectedFont] || FONT_MAPS.standard;
    const clean = textInput.toUpperCase();
    const height = 4;
    const lines: string[] = ["", "", "", ""];

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      const glyph = font[char] || [char, char, char, char];
      for (let row = 0; row < height; row++) {
        lines[row] += (glyph[row] || "    ") + " ";
      }
    }
    return lines.join("\n");
  }, [textInput, selectedFont]);

  // Convert Image to ASCII
  useEffect(() => {
    if (!imageSrc || activeTab !== "image") return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const aspectRatio = img.height / img.width;
      // Monospace characters are roughly 2x as tall as they are wide
      const targetHeight = Math.round(asciiWidth * aspectRatio * 0.55);

      canvas.width = asciiWidth;
      canvas.height = targetHeight;

      ctx.drawImage(img, 0, 0, asciiWidth, targetHeight);
      const imgData = ctx.getImageData(0, 0, asciiWidth, targetHeight).data;

      let ramp = DENSITY_RAMPS[charRamp] || DENSITY_RAMPS.standard;
      if (invertRamp) {
        ramp = ramp.split("").reverse().join("");
      }

      let asciiResult = "";
      for (let y = 0; y < targetHeight; y++) {
        let line = "";
        for (let x = 0; x < asciiWidth; x++) {
          const idx = (y * asciiWidth + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          // Grayscale luminance
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const rampIdx = Math.floor((gray / 255) * (ramp.length - 1));
          line += ramp[rampIdx];
        }
        asciiResult += line + "\n";
      }
      setImageAsciiOutput(asciiResult);
    };
  }, [imageSrc, asciiWidth, charRamp, invertRamp, activeTab]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === "string") {
        setImageSrc(evt.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const finalOutput = activeTab === "text" ? textBannerOutput : imageAsciiOutput;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Generator Mode</p>
        <p className="text-accent font-mono text-xs font-bold uppercase">{activeTab}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Charset</p>
        <p className="text-text-primary font-mono text-xs">Monospace ASCII</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1 font-mono"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">ASCII Art & Terminal Banner Generator</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Generate retro ASCII font headers, terminal MOTD banners, and convert images into ASCII art.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 mb-6 bg-bg-page p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => setActiveTab("text")}
              className={`flex-1 py-2 text-xs font-mono rounded transition-colors ${
                activeTab === "text"
                  ? "bg-accent-soft text-accent font-bold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Text to ASCII Banner
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={`flex-1 py-2 text-xs font-mono rounded transition-colors ${
                activeTab === "image"
                  ? "bg-accent-soft text-accent font-bold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Image to ASCII Art
            </button>
          </div>

          {activeTab === "text" ? (
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-text-secondary block mb-1">Banner Text:</label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text..."
                    maxLength={20}
                    className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-text-secondary block mb-1">ASCII Font Style:</label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value as "standard" | "slant" | "blocks")}
                    className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="standard">Standard Outline</option>
                    <option value="slant">Slanted / Italic</option>
                    <option value="blocks">Solid Block / Matrix</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-text-secondary font-bold">Upload Source Image:</label>
                  <label className="cursor-pointer text-xs font-mono text-accent hover:text-accent-hover transition-colors">
                    <span>Choose Image</span>
                    <input type="file" onChange={handleImageUpload} accept="image/*" className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Width: {asciiWidth} cols</label>
                    <input
                      type="range"
                      min={30}
                      max={100}
                      step={5}
                      value={asciiWidth}
                      onChange={(e) => setAsciiWidth(Number(e.target.value))}
                      className="w-full accent-accent cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Density Ramp:</label>
                    <select
                      value={charRamp}
                      onChange={(e) => setCharRamp(e.target.value as "standard" | "detailed" | "blocks" | "simple")}
                      className="w-full p-1.5 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    >
                      <option value="standard">Standard (@%#*+=-:. )</option>
                      <option value="detailed">Detailed (70 chars)</option>
                      <option value="blocks">Blocks (█▓▒░ )</option>
                      <option value="simple">Simple (#O+-. )</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-xs font-mono text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invertRamp}
                        onChange={(e) => setInvertRamp(e.target.checked)}
                        className="accent-accent"
                      />
                      Invert Dark/Light
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ASCII Output Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-text-secondary uppercase">
                Generated ASCII Art:
              </span>
              <CopyButton text={finalOutput} />
            </div>
            <div className="p-4 bg-bg-page border border-border-subtle rounded-xl font-mono text-[10px] sm:text-xs text-accent overflow-x-auto max-h-[360px] overflow-y-auto leading-[1.15]">
              <pre className="whitespace-pre">{finalOutput || "(ASCII preview will appear here)"}</pre>
            </div>
          </div>
        </div>

        {/* Right: InfoPanel */}
        <div className="hidden lg:block">
          <InfoPanel toolId="ascii-banner" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="ascii-banner" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
