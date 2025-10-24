import React, { useState, useEffect, useRef } from "react";
import { Mic, Globe, Cpu } from "lucide-react";

const languageOptions = [
  { value: "detect", label: "Detect Language" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "de-DE", label: "Deutsch (Deutschland)" },
  { value: "ja-JP", label: "日本語 (日本)" },
  { value: "ko-KR", label: "한국어 (대한민국)" },
  { value: "hi-IN", label: "हिन्दी (भारत)" },
  { value: "ar-SA", label: "العربية (السعودية)" },
];

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("detect");
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setRecordingTime(0);
      setIsRecording(true);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- Unified design colors ---
  const lightGreen = "#b8ffb0";
  const deepBg = "#08140d";
  const blendedBg = "#0b1c12";

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-end font-sans antialiased"
      style={{
        background: `radial-gradient(circle at top, #0f2618 0%, ${deepBg} 70%, #050a06 100%)`,
        padding: "0 16px 82px",
        overflow: "hidden",
      }}
    >
      {/* Floating header (centered vertically above box) */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "140px",
          transform: "translateY(-40px)",
        }}
      >
        <h1
          style={{
            color: lightGreen,
            fontSize: 30,
            fontWeight: 800,
          }}
        >
          AI Voice Chat
        </h1>
        <p style={{ color: "#bcd3c0", marginTop: 6, fontSize: 15 }}>
          Select your language and model, then hold the mic to record.
        </p>
      </div>

      {/* Main container */}
      <div
        style={{
          width: "98%",
          maxWidth: "1400px",
          position: "relative",
          padding: "28px",
          background: `linear-gradient(180deg, rgba(11,26,18,0.85) 0%, rgba(10,22,15,0.92) 60%, rgba(8,20,13,1) 100%)`,
          borderLeft: `1px solid ${lightGreen}40`,
          borderRight: `1px solid ${lightGreen}40`,
          borderBottom: `1px solid ${lightGreen}60`,
          borderTop: "none",
          borderRadius: "22px",
          borderTopLeftRadius: "0px",
          borderTopRightRadius: "0px",
          boxShadow: `0 32px 60px rgba(184,255,176,0.07)`,
          overflow: "visible",
        }}
      >
        {/* Infinite upward gradient for “endless glass” illusion */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-100vh",
            left: 0,
            right: 0,
            height: "100vh",
            background: `linear-gradient(to bottom, rgba(8,20,13,0.0), rgba(8,20,13,0.2), rgba(8,20,13,0.5))`,
            pointerEvents: "none",
          }}
        />

        {/* Side fades for smooth blending */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "-60px",
            top: 0,
            bottom: 0,
            width: "140px",
            pointerEvents: "none",
            background: `linear-gradient(to right, ${deepBg} 0%, rgba(11,26,18,0))`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: "-60px",
            top: 0,
            bottom: 0,
            width: "140px",
            pointerEvents: "none",
            background: `linear-gradient(to left, ${deepBg} 0%, rgba(11,26,18,0))`,
          }}
        />

        {/* Bottom glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "-120px",
            left: "10%",
            right: "10%",
            height: "220px",
            background: `radial-gradient(ellipse at bottom, rgba(184,255,176,0.1) 0%, transparent 70%)`,
            pointerEvents: "none",
            filter: "blur(40px)",
          }}
        />

        {/* Content area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {/* Top row: language + model */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              alignItems: "center",
            }}
          >
            <div style={{ flex: "0 0 260px" }}>
              <label
                htmlFor="language-select"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#9fbf95",
                  fontSize: 12,
                }}
              >
                <Globe size={14} color={lightGreen} />
                <span>Language</span>
              </label>
              <select
                id="language-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "7px 9px",
                  background: blendedBg,
                  color: lightGreen,
                  border: `1px solid ${lightGreen}40`,
                  borderRadius: 10,
                  fontSize: 13,
                  outline: "none",
                }}
              >
                {languageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ flex: "0 0 240px", textAlign: "right" }}>
              <label
                htmlFor="model-select"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#9fbf95",
                  fontSize: 12,
                }}
              >
                <Cpu size={14} color={lightGreen} />
                <span>Model</span>
              </label>
              <select
                id="model-select"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "7px 9px",
                  background: blendedBg,
                  color: lightGreen,
                  border: `1px solid ${lightGreen}40`,
                  borderRadius: 10,
                  fontSize: 13,
                  outline: "none",
                }}
              >
                <option value="gpt-voice">GPT Voice Model</option>
                <option value="whisper">Whisper Speech Model</option>
                <option value="custom">Custom Model</option>
              </select>
            </div>
          </div>

          {/* Recording area */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: 86,
              borderRadius: 18,
              overflow: "hidden",
              border: `1px solid ${lightGreen}45`,
              background: blendedBg,
            }}
          >
            {/* Timer */}
            <div
              style={{
                width: 160,
                minWidth: 120,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0a1e13",
                borderRight: `1px solid ${lightGreen}25`,
                borderTopLeftRadius: 18,
                borderBottomLeftRadius: 18,
              }}
            >
              <div
                style={{
                  color: isRecording ? lightGreen : "#97a89a",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
                  fontSize: 20,
                  fontWeight: 600,
                  animation: isRecording ? "pulse 1s linear infinite" : "none",
                }}
              >
                {formatTime(recordingTime)}
              </div>
            </div>

            {/* Placeholder text */}
            <div
              style={{
                flex: 1,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#a5bca8",
                fontSize: 16,
                padding: "0 18px",
                textAlign: "center",
                userSelect: "none",
              }}
            >
              Press and Hold the Microphone button to record
            </div>

            {/* Mic */}
            <div
              style={{
                width: 120,
                minWidth: 110,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0a1e13",
                borderLeft: `1px solid ${lightGreen}25`,
                borderTopRightRadius: 18,
                borderBottomRightRadius: 18,
              }}
            >
              <button
                onClick={handleMicClick}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "999px",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: isRecording
                    ? "0 8px 30px rgba(255,80,80,0.14)"
                    : `0 8px 24px rgba(184,255,176,0.08)`,
                  background: isRecording ? "#d94a4a" : lightGreen,
                  transition: "transform 0.12s ease, box-shadow 0.12s ease",
                  position: "relative",
                }}
                aria-pressed={isRecording}
              >
                {isRecording && (
                  <span
                    style={{
                      position: "absolute",
                      width: 68,
                      height: 68,
                      borderRadius: "999px",
                      background: "rgba(217,74,74,0.16)",
                      animation: "ping 1s cubic-bezier(.4,0,0.6,1) infinite",
                    }}
                  />
                )}
                <Mic size={28} color={isRecording ? "#fff" : "#07140f"} />
              </button>
            </div>
          </div>
        </div>

        {/* Animations */}
        <style>
          {`
            @keyframes ping {
              0% { transform: scale(1); opacity: 0.8; }
              70% { transform: scale(1.9); opacity: 0; }
              100% { transform: scale(2); opacity: 0; }
            }
            @keyframes pulse {
              0% { opacity: 1; transform: translateY(0); }
              50% { opacity: 0.65; transform: translateY(-1px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
      </div>
    </div>
  );
}
