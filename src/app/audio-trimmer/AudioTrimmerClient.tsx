"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useRef, useEffect, useCallback } from "react";

// Encode AudioBuffer to 16-bit PCM WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const dataByteCount = numSamples * blockAlign;
  const headerByteCount = 44;
  const totalByteCount = headerByteCount + dataByteCount;

  const arrayBuffer = new ArrayBuffer(totalByteCount);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(0, "RIFF");
  view.setUint32(4, totalByteCount - 8, true);
  writeString(8, "WAVE");

  // fmt sub-chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(36, "data");
  view.setUint32(40, dataByteCount, true);

  // Interleave channels & write PCM samples
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: "audio/wav" });
}

export default function AudioTrimmerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (exportUrl) URL.revokeObjectURL(exportUrl);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, [exportUrl]);

  // Draw Waveform on Canvas
  const drawWaveform = useCallback((buffer: AudioBuffer, start: number, end: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const rawData = buffer.getChannelData(0);
    const step = Math.ceil(rawData.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "#101713";
    ctx.fillRect(0, 0, width, height);

    // Selected range background highlight
    const startX = (start / buffer.duration) * width;
    const endX = (end / buffer.duration) * width;
    ctx.fillStyle = "rgba(74, 222, 128, 0.15)";
    ctx.fillRect(startX, 0, endX - startX, height);

    // Draw Waveform bars
    ctx.fillStyle = "#8aa396";
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = rawData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      // Highlight active selection bars
      if (i >= startX && i <= endX) {
        ctx.fillStyle = "#4ade80";
      } else {
        ctx.fillStyle = "#2d4435";
      }

      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }

    // Start & End indicator lines
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();
  }, []);

  const loadAudioFile = useCallback(async (selectedFile: File) => {
    setError(null);
    setExportUrl(null);
    setFile(selectedFile);

    try {
      const arrayBuf = await selectedFile.arrayBuffer();
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const decoded = await audioCtxRef.current.decodeAudioData(arrayBuf);
      setAudioBuffer(decoded);
      setDuration(decoded.duration);
      setStartTime(0);
      setEndTime(decoded.duration);

      drawWaveform(decoded, 0, decoded.duration);
    } catch (err) {
      setError(`Audio decode error: ${(err as Error).message}`);
    }
  }, [drawWaveform]);

  useEffect(() => {
    if (audioBuffer) {
      drawWaveform(audioBuffer, startTime, endTime);
    }
  }, [audioBuffer, startTime, endTime, drawWaveform]);

  const handlePlaySelection = () => {
    if (!audioBuffer) return;

    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtxRef.current.destination);

    const playDuration = Math.max(0, endTime - startTime);
    source.start(0, startTime, playDuration);
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      setIsPlaying(false);
    };
  };

  const handleExportTrimmed = async () => {
    if (!audioBuffer) return;
    setExporting(true);
    setError(null);

    try {
      const sampleRate = audioBuffer.sampleRate;
      const numChannels = audioBuffer.numberOfChannels;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const length = Math.max(1, endSample - startSample);

      const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
      const newBuffer = offlineCtx.createBuffer(numChannels, length, sampleRate);

      for (let ch = 0; ch < numChannels; ch++) {
        const srcData = audioBuffer.getChannelData(ch);
        const destData = newBuffer.getChannelData(ch);
        destData.set(srcData.subarray(startSample, endSample));
      }

      const wavBlob = audioBufferToWav(newBuffer);
      const url = URL.createObjectURL(wavBlob);
      setExportUrl(url);
    } catch (err) {
      setError(`Export error: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  };

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Clip Duration</p>
        <p className="text-accent font-mono font-bold">
          {endTime > startTime ? `${(endTime - startTime).toFixed(2)}s` : "—"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Total Duration</p>
        <p className="text-text-primary font-mono">{duration ? `${duration.toFixed(1)}s` : "—"}</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="audio-trimmer" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
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
                if (f) loadAudioFile(f);
              }}
              className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed px-6 py-8 text-center transition-colors ${
                dragOver
                  ? "border-accent bg-accent-soft"
                  : "border-border-subtle bg-bg-page hover:border-accent"
              }`}
            >
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadAudioFile(f);
                }}
              />
              <span className="font-mono text-sm text-text-secondary">
                $ drop audio file here -- or click to select
              </span>
              <span className="text-xs text-text-muted">MP3 · WAV · OGG · AAC · FLAC</span>
            </label>
          ) : (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex items-center justify-between rounded border border-border-subtle bg-bg-page p-4">
                <div className="min-w-0 flex-1 font-mono text-xs">
                  <p className="truncate font-semibold text-text-primary text-sm">{file.name}</p>
                  <p className="text-text-muted mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · {formatTime(duration)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setAudioBuffer(null);
                    setExportUrl(null);
                    setIsPlaying(false);
                  }}
                  className="btn-secondary text-xs shrink-0"
                >
                  Change Audio
                </button>
              </div>

              {/* Waveform Canvas */}
              <div className="rounded border border-border-subtle overflow-hidden bg-bg-card p-2 space-y-2">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={140}
                  className="w-full h-32 rounded bg-bg-page block"
                />

                <div className="flex justify-between items-center text-xs font-mono text-text-muted px-1">
                  <span>Start: <strong className="text-accent">{formatTime(startTime)}</strong></span>
                  <span>Clip: <strong className="text-text-primary">{formatTime(endTime - startTime)}</strong></span>
                  <span>End: <strong className="text-accent">{formatTime(endTime)}</strong></span>
                </div>
              </div>

              {/* Range Slider Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded border border-border-subtle bg-bg-page p-4 font-mono text-xs">
                <div>
                  <label className="text-text-muted block mb-1">
                    START TIME ({startTime.toFixed(2)}s)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, endTime - 0.1)}
                    step={0.05}
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(parseFloat(e.target.value));
                      setExportUrl(null);
                    }}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-text-muted block mb-1">
                    END TIME ({endTime.toFixed(2)}s)
                  </label>
                  <input
                    type="range"
                    min={startTime + 0.1}
                    max={duration}
                    step={0.05}
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(parseFloat(e.target.value));
                      setExportUrl(null);
                    }}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handlePlaySelection}
                  className="btn-secondary py-2 px-6 text-xs flex items-center gap-2"
                >
                  <span>{isPlaying ? "⏹ Stop" : "▶ Preview Selection"}</span>
                </button>

                <button
                  onClick={handleExportTrimmed}
                  disabled={exporting}
                  className="btn-primary py-2 px-6 text-xs"
                >
                  {exporting ? "Exporting..." : "$ export trimmed .wav"}
                </button>
              </div>

              {/* Download Ready Banner */}
              {exportUrl && (
                <div className="rounded border border-accent/40 bg-accent-soft p-4 text-center space-y-3 font-mono text-xs">
                  <p className="text-sm font-semibold text-accent">
                    ✓ Trimmed Audio Ready ({formatTime(endTime - startTime)})
                  </p>
                  <a
                    href={exportUrl}
                    download={`trimmed-${file.name.replace(/\.[^/.]+$/, "")}.wav`}
                    className="btn-primary inline-block py-2 px-6"
                  >
                    Download trimmed-audio.wav
                  </a>
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-4 text-xs text-error font-mono text-center">{error}</p>}
      </div>
    </ToolLayout>
  );
}