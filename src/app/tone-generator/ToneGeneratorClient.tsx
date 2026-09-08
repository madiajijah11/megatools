"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

type SoundMode = "tone" | "binaural" | "noise";
type OscillatorTypeCustom = "sine" | "square" | "sawtooth" | "triangle";
type NoiseColor = "white" | "pink" | "brown";

const PITCH_PRESETS = [
  { name: "Sub-Bass", hz: 60, desc: "60 Hz Mains hum / Subwoofers" },
  { name: "Verdi A4", hz: 432, desc: "432 Hz Philosophical pitch" },
  { name: "Concert A4", hz: 440, desc: "440 Hz Standard orchestra tuning" },
  { name: "Reference", hz: 1000, desc: "1,000 Hz 1kHz test tone" },
  { name: "High Treble", hz: 10000, desc: "10 kHz Upper treble / Tweeters" },
];
export default function ToneGeneratorClient() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [soundMode, setSoundMode] = useState<SoundMode>("tone");
  const [waveType, setWaveType] = useState<OscillatorTypeCustom>("sine");
  const [frequency, setFrequency] = useState<number>(440);
  const [volume, setVolume] = useState<number>(30); // 0-100%

  // Binaural state
  const [binauralBase, setBinauralBase] = useState<number>(200);
  const [binauralBeat, setBinauralBeat] = useState<number>(10); // 10 Hz Alpha
  // Noise state
  const [noiseColor, setNoiseColor] = useState<NoiseColor>("white");

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Web Audio Nodes Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const oscLeftRef = useRef<OscillatorNode | null>(null);
  const oscRightRef = useRef<OscillatorNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const stopAudio = useCallback(() => {
    try {
      oscRef.current?.stop();
      oscRef.current?.disconnect();
    } catch {
      // ignore
    }
    try {
      oscLeftRef.current?.stop();
      oscLeftRef.current?.disconnect();
    } catch {
      // ignore
    }
    try {
      oscRightRef.current?.stop();
      oscRightRef.current?.disconnect();
    } catch {
      // ignore
    }
    try {
      noiseSourceRef.current?.stop();
      noiseSourceRef.current?.disconnect();
    } catch {
      // ignore
    }
    oscRef.current = null;
    oscLeftRef.current = null;
    oscRightRef.current = null;
    noiseSourceRef.current = null;
    setIsPlaying(false);
  }, []);

  // Generate White / Pink / Brown Noise Buffer
  const createNoiseBuffer = (ctx: AudioContext, color: NoiseColor): AudioBuffer => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds loop
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (color === "white") {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (color === "pink") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else {
      // Brown noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Gain compensation
      }
    }
    return buffer;
  };

  const startAudio = useCallback(() => {
    const ctx = getAudioContext();
    stopAudio();

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume / 100, ctx.currentTime);
    gainNodeRef.current = gainNode;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    gainNode.connect(analyser);
    analyser.connect(ctx.destination);

    if (soundMode === "tone") {
      const osc = ctx.createOscillator();
      osc.type = waveType;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.connect(gainNode);
      osc.start();
      oscRef.current = osc;
    } else if (soundMode === "binaural") {
      // Stereo splitter for binaural beats
      const merger = ctx.createChannelMerger(2);

      const leftOsc = ctx.createOscillator();
      leftOsc.type = "sine";
      leftOsc.frequency.setValueAtTime(binauralBase, ctx.currentTime);
      leftOsc.connect(merger, 0, 0); // Left channel

      const rightOsc = ctx.createOscillator();
      rightOsc.type = "sine";
      rightOsc.frequency.setValueAtTime(binauralBase + binauralBeat, ctx.currentTime);
      rightOsc.connect(merger, 0, 1); // Right channel

      merger.connect(gainNode);
      leftOsc.start();
      rightOsc.start();

      oscLeftRef.current = leftOsc;
      oscRightRef.current = rightOsc;
    } else if (soundMode === "noise") {
      const noiseBuffer = createNoiseBuffer(ctx, noiseColor);
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;
      source.connect(gainNode);
      source.start();
      noiseSourceRef.current = source;
    }

    setIsPlaying(true);
  }, [getAudioContext, stopAudio, volume, soundMode, waveType, frequency, binauralBase, binauralBeat, noiseColor]);

  // Update volume live
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume / 100, audioCtxRef.current.currentTime, 0.03);
    }
  }, [volume]);

  // Update frequency live for tone
  useEffect(() => {
    if (oscRef.current && audioCtxRef.current && soundMode === "tone") {
      oscRef.current.frequency.setTargetAtTime(frequency, audioCtxRef.current.currentTime, 0.03);
    }
  }, [frequency, soundMode]);

  // Live Canvas Oscilloscope Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      // Dark background
      ctx2d.fillStyle = "#0a0f0d";
      ctx2d.fillRect(0, 0, width, height);

      // Grid lines
      ctx2d.strokeStyle = "#1f2b24";
      ctx2d.lineWidth = 1;
      ctx2d.beginPath();
      ctx2d.moveTo(0, height / 2);
      ctx2d.lineTo(width, height / 2);
      ctx2d.moveTo(width / 2, 0);
      ctx2d.lineTo(width / 2, height);
      ctx2d.stroke();

      if (!analyserRef.current || !isPlaying) {
        // Flat center line
        ctx2d.strokeStyle = "#4ade8055";
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        ctx2d.moveTo(0, height / 2);
        ctx2d.lineTo(width, height / 2);
        ctx2d.stroke();
        return;
      }

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(dataArray);

      // Oscilloscope trace
      ctx2d.lineWidth = 2.5;
      ctx2d.strokeStyle = "#4ade80";
      ctx2d.shadowColor = "#4ade80";
      ctx2d.shadowBlur = 8;
      ctx2d.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx2d.moveTo(x, y);
        else ctx2d.lineTo(x, y);
        x += sliceWidth;
      }

      ctx2d.stroke();
      ctx2d.shadowBlur = 0;
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      audioCtxRef.current?.close();
    };
  }, [stopAudio]);

  const stats = (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Audio State:</span>
        <span className={"font-bold " + (isPlaying ? "text-success" : "text-text-muted")}>
          {isPlaying ? "ACTIVE PLAYING" : "IDLE / MUTED"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Audio Synthesis:</span>
        <span className="text-accent font-bold">Web Audio API</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Oscilloscope:</span>
        <span className="text-accent font-bold">2048-pt FFT Canvas</span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-text-muted">Sample Rate:</span>
        <span className="text-text-primary font-bold">44.1 / 48 kHz</span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-accent transition-colors"
        >
          <span>←</span> [cd .. / home]
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden text-xs font-mono px-2.5 py-1 rounded border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
        >
          [?] Tool Info
        </button>
      </div>

      {/* Hero Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-border-subtle bg-bg-card font-mono text-xs text-text-secondary mb-3">
          <span className="text-accent">$</span>
          <span>megatools --tone-synthesizer --web-audio</span>
          <span className="animate-pulse text-accent">▊</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Web Audio Tone & <span className="gradient-text">Frequency Synthesizer</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Generate acoustic pure tones (20Hz - 20,000Hz), binaural brainwave beats, and colored noise with a real-time oscilloscope.
        </p>

        {/* Pitch Presets Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-text-muted">PITCH PRESETS:</span>
          {PITCH_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSoundMode("tone");
                setFrequency(p.hz);
              }}
              className="px-2 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent/40 hover:text-accent transition-colors"
              title={p.desc}
            >
              [{p.name}: {p.hz} Hz]
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Synthesizer Controls & Canvas */}
        <div className="lg:col-span-2 space-y-6 font-mono text-xs">
          {/* Main Control Panel */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-5 space-y-5">
            {/* Header standard: h-8 flex items-center justify-between */}
            <div className="h-8 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-bg-page border border-border-subtle rounded p-0.5">
                <button
                  onClick={() => {
                    stopAudio();
                    setSoundMode("tone");
                  }}
                  className={"px-2.5 py-0.5 rounded transition-colors " + (
                    soundMode === "tone"
                      ? "bg-accent-soft text-accent font-bold border border-accent/40"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  Pure Tone
                </button>
                <button
                  onClick={() => {
                    stopAudio();
                    setSoundMode("binaural");
                  }}
                  className={"px-2.5 py-0.5 rounded transition-colors " + (
                    soundMode === "binaural"
                      ? "bg-accent-soft text-accent font-bold border border-accent/40"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  Binaural Beats
                </button>
                <button
                  onClick={() => {
                    stopAudio();
                    setSoundMode("noise");
                  }}
                  className={"px-2.5 py-0.5 rounded transition-colors " + (
                    soundMode === "noise"
                      ? "bg-accent-soft text-accent font-bold border border-accent/40"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  Noise Generator
                </button>
              </div>

              {/* Master Play / Stop Button */}
              <button
                onClick={isPlaying ? stopAudio : startAudio}
                className={"px-4 py-1.5 rounded font-bold transition-all cursor-pointer shadow-md text-xs " + (
                  isPlaying
                    ? "bg-error text-bg-page hover:bg-error/90 animate-pulse"
                    : "bg-accent text-bg-page hover:bg-accent-hover"
                )}
              >
                {isPlaying ? "■ STOP AUDIO" : "▶ PLAY AUDIO"}
              </button>
            </div>

            {/* Mode 1: Pure Tone Controls */}
            {soundMode === "tone" && (
              <div className="space-y-4 pt-1 border-t border-border-subtle">
                {/* Waveform Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-[11px]">WAVEFORM:</span>
                  {(["sine", "square", "sawtooth", "triangle"] as OscillatorTypeCustom[]).map((w) => (
                    <button
                      key={w}
                      onClick={() => setWaveType(w)}
                      className={"px-2.5 py-1 rounded capitalize transition-colors " + (
                        waveType === w
                          ? "border border-accent bg-accent-soft text-accent font-bold"
                          : "border border-border-subtle bg-bg-page text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                {/* Frequency Slider & Input */}
                <div className="space-y-2 p-3.5 rounded bg-bg-page border border-border-subtle">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary font-medium">Oscillator Frequency:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="20"
                        max="20000"
                        value={frequency}
                        onChange={(e) => setFrequency(Math.max(20, Math.min(20000, parseInt(e.target.value, 10) || 20)))}
                        className="w-20 bg-bg-card border border-border-subtle rounded px-2 py-0.5 text-right font-bold text-accent focus:border-accent focus:outline-none"
                      />
                      <span className="text-text-muted">Hz</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="5000"
                    step="1"
                    value={frequency}
                    onChange={(e) => setFrequency(parseInt(e.target.value, 10))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>20 Hz (Sub-bass)</span>
                    <span>440 Hz (Concert A)</span>
                    <span>5,000 Hz+ (Treble)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Binaural Beats Controls */}
            {soundMode === "binaural" && (
              <div className="space-y-4 pt-1 border-t border-border-subtle">
                <div className="p-3 rounded bg-accent-soft/50 border border-accent/20 text-[11px] text-text-secondary leading-relaxed">
                  🎧 <span className="text-accent font-bold">Stereo Headphones Required:</span> Binaural beats work by feeding different frequencies to each ear. Your brain synchronizes to the difference ({binauralBeat} Hz).
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-bg-page border border-border-subtle space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Base Carrier:</span>
                      <span className="text-accent font-bold">{binauralBase} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="500"
                      value={binauralBase}
                      onChange={(e) => setBinauralBase(parseInt(e.target.value, 10))}
                      className="w-full accent-accent cursor-pointer"
                    />
                    <span className="text-[10px] text-text-muted block">Pitch heard in left ear</span>
                  </div>

                  <div className="p-3 rounded bg-bg-page border border-border-subtle space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Target Beat:</span>
                      <span className="text-warning font-bold">{binauralBeat} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="40"
                      step="0.5"
                      value={binauralBeat}
                      onChange={(e) => setBinauralBeat(parseFloat(e.target.value))}
                      className="w-full accent-warning cursor-pointer"
                    />
                    <span className="text-[10px] text-text-muted block">
                      {binauralBeat <= 4 ? "Delta (Deep Sleep)" : binauralBeat <= 8 ? "Theta (Meditation)" : binauralBeat <= 13 ? "Alpha (Relaxation)" : "Beta (Focus)"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3: Noise Generator Controls */}
            {soundMode === "noise" && (
              <div className="space-y-4 pt-1 border-t border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-[11px]">COLOR SPECTRUM:</span>
                  {(["white", "pink", "brown"] as NoiseColor[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setNoiseColor(c);
                        if (isPlaying) {
                          stopAudio();
                          setTimeout(startAudio, 50);
                        }
                      }}
                      className={"px-3 py-1 rounded capitalize transition-colors " + (
                        noiseColor === c
                          ? "border border-accent bg-accent-soft text-accent font-bold"
                          : "border border-border-subtle bg-bg-page text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {c} Noise
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded bg-bg-page border border-border-subtle text-[11px] text-text-secondary leading-relaxed">
                  {noiseColor === "white" && "White noise has equal energy per frequency across all audio bands. Useful for sound masking."}
                  {noiseColor === "pink" && "Pink noise features a 3dB per octave drop-off, mimicking natural sounds (rainfall, wind) and acoustic calibration."}
                  {noiseColor === "brown" && "Brown (Brownian/Red) noise has a 6dB per octave roll-off, delivering a deep, low-frequency rumble for sleep and focus."}
                </div>
              </div>
            )}

            {/* Master Volume Slider */}
            <div className="p-3 rounded bg-bg-page border border-border-subtle flex items-center gap-4">
              <span className="text-text-muted text-[11px] shrink-0">Master Volume:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                className="flex-1 accent-accent cursor-pointer"
              />
              <span className="text-text-primary font-bold w-12 text-right">{volume}%</span>
            </div>
          </div>

          {/* Oscilloscope Card */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-3">
            <div className="h-8 flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <span className="text-accent">&gt;</span> REALTIME_OSCILLOSCOPE_TRACE
              </span>
              <span className="text-text-muted text-[11px]">
                {isPlaying ? "Live Stream (FFT)" : "Muted"}
              </span>
            </div>

            <div className="rounded bg-bg-page border border-border-subtle overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={700}
                height={180}
                className="w-full h-[180px] block"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Info Panel Desktop */}
        <div className="hidden lg:block">
          <InfoPanel toolId="tone-generator" stats={stats} />
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="tone-generator" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
