"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useRef, useEffect, useCallback } from "react";

export default function ScreenRecorderClient() {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [includeMic, setIncludeMic] = useState(true);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedBlobSize, setRecordedBlobSize] = useState<number>(0);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const isSupported =
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices &&
        !!navigator.mediaDevices.getDisplayMedia &&
        typeof MediaRecorder !== "undefined";
      setSupported(isSupported);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [recordedUrl]);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setPaused(false);
    stopTracks();
  }, [stopTracks]);

  const handleStartRecording = async () => {
    setError(null);
    setRecordedUrl(null);
    setRecordedBlobSize(0);
    setElapsedSeconds(0);
    chunksRef.current = [];

    try {
      // 1. Get Screen Stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true,
      });

      streamRef.current = screenStream;

      // Handle user clicking browser's built-in "Stop sharing" bar
      screenStream.getVideoTracks()[0].onended = () => {
        handleStopRecording();
      };

      let finalStream = screenStream;

      // 2. Mix with Mic if enabled
      if (includeMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = micStream;

          const audioCtx = new AudioContext();
          const destination = audioCtx.createMediaStreamDestination();

          // Screen audio track if exists
          if (screenStream.getAudioTracks().length > 0) {
            const screenSource = audioCtx.createMediaStreamSource(
              new MediaStream(screenStream.getAudioTracks())
            );
            screenSource.connect(destination);
          }

          // Mic audio track
          const micSource = audioCtx.createMediaStreamSource(micStream);
          micSource.connect(destination);

          // Combined stream with video track + mixed audio track
          finalStream = new MediaStream([
            ...screenStream.getVideoTracks(),
            ...destination.stream.getAudioTracks(),
          ]);
        } catch {
          // Mic denied or unavailable, proceed with screen stream only
          finalStream = screenStream;
        }
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";

      const recorder = new MediaRecorder(finalStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlobSize(fullBlob.size);
        const url = URL.createObjectURL(fullBlob);
        setRecordedUrl(url);
      };

      recorder.start(1000); // 1s slice
      setRecording(true);
      setPaused(false);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError(`Failed to start recording: ${(err as Error).message}`);
      stopTracks();
    }
  };

  const handlePauseResume = () => {
    if (!mediaRecorderRef.current) return;
    if (paused) {
      mediaRecorderRef.current.resume();
      setPaused(false);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    return `${hrs.toString().padStart(2, "0")}:${(mins % 60).toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Duration</p>
        <p className="text-accent font-mono font-bold">{formatTimer(elapsedSeconds)}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">File Size</p>
        <p className="text-text-primary font-mono">
          {recordedBlobSize ? `${(recordedBlobSize / (1024 * 1024)).toFixed(1)} MB` : "—"}
        </p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="screen-recorder" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {supported === false && (
            <p className="mb-6 text-center text-xs text-warning border border-border-subtle rounded bg-bg-page p-3 font-mono">
              Your browser does not support the Screen Capture API (getDisplayMedia). Please use Chrome, Edge, or Firefox desktop.
            </p>
          )}

          {/* Recording Control Banner */}
          <div className="mb-6 rounded border border-border-subtle bg-bg-page p-6 text-center space-y-4">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="text-4xl font-mono font-bold tracking-widest text-text-primary">
                {formatTimer(elapsedSeconds)}
              </div>
              {recording && (
                <div className="flex items-center gap-2 text-xs font-mono text-error font-semibold animate-pulse">
                  <span>●</span> {paused ? "RECORDING PAUSED" : "RECORDING LIVE"}
                </div>
              )}
            </div>

            {/* Mic checkbox */}
            {!recording && (
              <div className="flex justify-center">
                <label className="flex items-center gap-2 text-xs font-mono text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMic}
                    onChange={(e) => setIncludeMic(e.target.checked)}
                    className="accent-accent"
                  />
                  <span>Include Microphone Audio Commentary</span>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {!recording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={supported === false}
                  className="btn-primary py-2 px-8 text-sm"
                >
                  $ record --start
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseResume}
                    className="btn-secondary py-2 px-6 text-sm"
                  >
                    {paused ? "▶ Resume" : "⏸ Pause"}
                  </button>
                  <button
                    onClick={handleStopRecording}
                    className="btn-primary py-2 px-8 text-sm !bg-error hover:!bg-error/80 text-white"
                  >
                    ⏹ Stop Recording
                  </button>
                </>
              )}
            </div>
          </div>

          {error && <p className="mb-6 text-xs text-error font-mono text-center">{error}</p>}

          {/* Video Preview & Download */}
          {recordedUrl && (
            <div className="rounded border border-border-subtle bg-bg-page p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-border-subtle pb-2 font-mono text-xs">
                <span className="text-success font-semibold">✓ Recording Ready ({formatTimer(elapsedSeconds)})</span>
                <span className="text-text-muted">{(recordedBlobSize / (1024 * 1024)).toFixed(2)} MB</span>
              </div>

              <div className="rounded overflow-hidden bg-bg-card border border-border-subtle aspect-video flex items-center justify-center">
                <video
                  src={recordedUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex justify-end pt-2">
                <a
                  href={recordedUrl}
                  download="screen-recording.webm"
                  className="btn-primary py-2 px-6 text-xs"
                >
                  Download .webm Video
                </a>
              </div>
            </div>
          )}
      </div>
    </ToolLayout>
  );
}