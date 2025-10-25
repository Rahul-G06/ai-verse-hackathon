import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types'; // Added for JS-based type checking
import {
  Mic,
  Globe,
  Cpu,
  Loader2,
  Bot,
  Play,
  Pause,
  Download,
  Send,
  AlertTriangle, // ADDED for error messages
} from "lucide-react";

// --- (languageOptions, createPlaceholderWavBlob, AudioVisualizer, VoiceMessageBubble...
// ...all remain unchanged, so they are omitted for brevity) ---
// --- [Omitting unchanged components: languageOptions, createPlaceholderWavBlob, AudioVisualizer, VoiceMessageBubble] ---

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

/**
 * Creates a placeholder WAV file blob. (Kept for potential fallback)
 * @param {number} duration - The duration of the audio in seconds.
 * @returns {Blob} A blob containing the WAV file.
 */
function createPlaceholderWavBlob(duration = 5) {
  const sampleRate = 44100;
  const numChannels = 1;
  const numSamples = sampleRate * duration;
  const dataSize = numSamples * numChannels * 2; // 16-bit samples
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // "fmt " sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, 1, true); // Audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // Byte rate
  view.setUint16(32, numChannels * 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  // "data" sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true);

  // Generate a simple sine wave (440 Hz)
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const angle = (i / sampleRate) * 440 * 2 * Math.PI;
    const sample = Math.round(Math.sin(angle) * 32767); // 16-bit PCM
    view.setInt16(offset, sample, true);
    offset += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

/**
 * A simple CSS-based audio visualizer component.
 */
const AudioVisualizer = ({ lightGreen }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "4px",
      }}
    >
      {/* Create 5 animated bars */}
      <span
        className="viz-bar"
        style={{ "--delay": "0.1s", backgroundColor: lightGreen }}
      />
      <span
        className="viz-bar"
        style={{ "--delay": "0.3s", backgroundColor: lightGreen }}
      />
      <span
        className="viz-bar"
        style={{ "--delay": "0.2s", backgroundColor: lightGreen }}
      />
      <span
        className="viz-bar"
        style={{ "--delay": "0.4s", backgroundColor: lightGreen }}
      />
      <span
        className="viz-bar"
        style={{ "--delay": "0.1s", backgroundColor: lightGreen }}
      />
    </div>
  );
};

// --- 1. Voice Message Bubble Component ---

const VoiceMessageBubble = ({
  audioUrl,
  isUser,
  timestamp,
  duration: initialDuration,
  error, // NEW: Prop to handle error messages
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const audioRef = useRef(null); 

  useEffect(() => {
    // Don't run effect if this is an error bubble
    if (error) return;

    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    
    // --- ADDED: Event listeners for audio lifecycle ---
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", () => setIsPlaying(false));
    
    // Set duration on load, in case metadata is already loaded
    updateDuration();

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", () => setIsPlaying(false));
    };
    // --- END: Event listeners ---
    
  }, [audioUrl, error]); // Re-run if audioUrl changes or if error exists

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = audioUrl;
    // Note: The backend returns an mp3, but the original frontend
    // was saving as .webm. We'll keep .webm for consistency for now
    // unless the backend filename is used.
    link.download = `voice-message-${timestamp.getTime()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Using inline styles to avoid needing Tailwind context for hsl(var(...))
  const lightGreen = "#b8ffb0";
  const darkGreen = "#07140f";
  const secondaryBg = "#1f2937";
  const secondaryFg = "#f9fafb";
  const mutedFg = "#9ca3af";
  const errorBg = "#450a0a"; // bg-red-950
  const errorFg = "#fecaca"; // text-red-200
  
  const isUserStyle = {
    bg: lightGreen, // primary
    fg: darkGreen, // primary-foreground
    bubbleBg: lightGreen,
    bubbleFg: darkGreen,
    btnBg: `${darkGreen}20`, // bg-primary-foreground/20
    btnHoverBg: `${darkGreen}30`, // hover:bg-primary-foreground/30
    barActive: darkGreen, // bg-primary-foreground
    barInactive: `${darkGreen}30`, // bg-primary-foreground/30
    timeFg: `${darkGreen}B3`, // text-primary-foreground/70
    dlFg: darkGreen, // text-primary-foreground
    timestampFg: `${darkGreen}99`, // text-primary-foreground/60
  };
  
  const aiStyle = {
    bg: secondaryBg, // secondary
    fg: secondaryFg, // secondary-foreground
    bubbleBg: secondaryBg,
    bubbleFg: secondaryFg,
    btnBg: lightGreen, // bg-accent
    btnHoverBg: `${lightGreen}CC`, // hover:bg-accent/80
    barActive: lightGreen, // bg-accent
    barInactive: `${mutedFg}30`, // bg-muted-foreground/30
    timeFg: mutedFg, // text-muted-foreground
    dlFg: mutedFg, // text-muted-foreground
    timestampFg: mutedFg, // text-muted-foreground
  };
  
  // NEW: Style for error bubbles
  const errorStyle = {
    bg: errorBg,
    fg: errorFg,
    bubbleBg: errorBg,
    bubbleFg: errorFg,
    btnBg: `${errorFg}20`,
    btnHoverBg: `${errorFg}30`,
    barActive: errorFg,
    barInactive: `${errorFg}30`,
    timeFg: `${errorFg}B3`,
    dlFg: errorFg,
    timestampFg: `${errorFg}99`,
  };
  
  const style = isUser ? isUserStyle : (error ? errorStyle : aiStyle);

  // NEW: Render a special error bubble
  if (error) {
    return (
      <div
        className={`flex justify-start mb-4 animate-in fade-in slide-in-from-bottom-2`}
        style={{ animationDuration: "300ms" }}
      >
        <div
          className={`flex flex-col max-w-[320px] rounded-2xl p-3 shadow-lg`}
          style={{ background: style.bubbleBg, color: style.bubbleFg }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: style.btnBg, color: style.fg }}
            >
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <span className="font-bold">Error</span>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          {/* Timestamp */}
          <div
            className={`text-xs mt-2`}
            style={{ color: style.timestampFg }}
          >
            {timestamp.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    );
  }

  // Regular audio bubble
  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } mb-4 animate-in fade-in slide-in-from-bottom-2`}
      style={{ animationDuration: "300ms" }}
    >
      <div
        className={`flex flex-col max-w-[320px] rounded-2xl p-3 shadow-lg`}
        style={{ background: style.bubbleBg, color: style.bubbleFg }}
      >
        {/* --- MODIFIED: Added key prop to force re-render on new URL --- */}
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          preload="metadata" 
          key={audioUrl} 
        />

        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95`}
            style={{ background: style.btnBg }}
            onMouseOver={e => e.currentTarget.style.background = style.btnHoverBg}
            onMouseOut={e => e.currentTarget.style.background = style.btnBg}
          >
            {isPlaying ? (
              <Pause className={`w-5 h-5`} style={{ color: style.fg }} />
            ) : (
              <Play className={`w-5 h-5`} style={{ color: style.fg }} />
            )}
          </button>

          {/* Waveform & Progress */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center gap-1 h-8 overflow-hidden">
              {[...Array(24)].map((_, i) => {
                const barProgress = (i / 24) * 100;
                const isActive = barProgress <= progress;
                // Use a pseudo-random but consistent height for each bar
                const height = (Math.sin(i * 0.4) * 0.3 + 0.7) * 50 + 40;
                return (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150`}
                    style={{
                      height: `${height}%`,
                      background: isActive ? style.barActive : style.barInactive,
                    }}
                  />
                );
              })}
            </div>
            <div className={`text-xs`} style={{ color: style.timeFg }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95`}
            style={{ background: style.btnBg }}
            onMouseOver={e => e.currentTarget.style.background = style.btnHoverBg}
            onMouseOut={e => e.currentTarget.style.background = style.btnBg}
          >
            <Download className={`w-4 h-4`} style={{ color: style.dlFg }} />
          </button>
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs mt-2 ${isUser ? "text-right" : ""}`}
          style={{ color: style.timestampFg }}
        >
          {timestamp.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

VoiceMessageBubble.propTypes = {
  audioUrl: PropTypes.string, // Can be null for error messages
  isUser: PropTypes.bool.isRequired,
  timestamp: PropTypes.instanceOf(Date).isRequired,
  duration: PropTypes.number,
  error: PropTypes.string, // NEW: error prop
};

// --- Main App Component ---

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("detect");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]); 
  
  const timerRef = useRef(null); 
  const mediaRecorderRef = useRef(null); 
  const audioChunksRef = useRef([]); 
  const messagesEndRef = useRef(null); 

  // --- ADDED: Log API URL ---
  const API_URL = "http://localhost:8000/echo";
  console.log("React App component rendered. API URL set to:", API_URL);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Recording timer logic
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  /**
   * Starts the audio recording process.
   */
  const startRecording = async () => {
    // --- ADDED: Log ---
    console.log("startRecording() triggered.");
    if (isProcessing) {
      console.warn("Recording disabled: Processing is active.");
      return;
    }
    audioChunksRef.current = [];

    try {
      console.log("Requesting user media (microphone)...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log("Microphone access granted.");

      // Use webm format
      const options = { mimeType: "audio/webm;codecs=opus" };
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // --- ADDED: Log ---
          console.log(`MediaRecorder: data available. Chunk size: ${event.data.size}`);
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // --- ADDED: Log ---
        console.log("MediaRecorder: stopped.");
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        
        // --- ADDED: Log ---
        console.log(`Created audio blob. Size: ${audioBlob.size} bytes. Type: ${audioBlob.type}`);
        
        // Pass to the chat handler
        handleRecordingComplete(audioBlob, recordingTime);

        stream.getTracks().forEach((track) => track.stop());
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      console.log("Recording started.");
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      // NEW: Show error in chat
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        audioUrl: null,
        isUser: false,
        timestamp: new Date(),
        duration: 0,
        error: "Could not access microphone. Please check permissions."
      }]);
    }
  };

  /**
   * Stops the audio recording process.
   */
  const stopRecording = () => {
    // --- ADDED: Log ---
    console.log("stopRecording() triggered.");
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("MediaRecorder.stop() called.");

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      console.warn("stopRecording() called, but no recorder or not recording.");
    }
  };

  /**
   * Handles sending the recording to the backend and receiving the response.
   */
  const handleRecordingComplete = async (audioBlob, duration) => {
    // --- ADDED: Log ---
    console.log(`handleRecordingComplete() called. Blob size: ${audioBlob.size}, Duration: ${duration}s`);
    
    // --- NEW: Client-side validation ---
    if (audioBlob.size < 1000) { // < 1KB
      console.warn("Recording is too short (< 1KB), not sending.");
      // Add error message to chat
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        audioUrl: null,
        isUser: false,
        timestamp: new Date(),
        duration: 0,
        error: "Recording was too short. Please press and hold to record."
      }]);
      setIsProcessing(false); // Reset processing state
      return; // Stop here
    }
    // --- END: Client-side validation ---

    // Create user message immediately
    const userMessage = {
      id: `user-${Date.now()}`,
      audioUrl: URL.createObjectURL(audioBlob),
      isUser: true,
      timestamp: new Date(),
      duration,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    // --- ADDED: Log ---
    console.log("User message added to chat. isProcessing set to true.");

    // --- UPDATED: API Call to Python Backend ---
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "recording.webm");

    try {
      // --- ADDED: Log ---
      console.log(`Sending POST request to ${API_URL}...`);
      
      // Send audio to the /echo endpoint
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      // --- ADDED: Log ---
      console.log(`Received response from server. Status: ${response.status}, OK: ${response.ok}`);

      // NEW: Check for 4xx/5xx error responses
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json(); // FastAPI sends { "detail": "..." }
          console.error("API Error (from JSON):", errorData.detail);
        } catch (e) {
          errorData = { detail: await response.text() }; // Fallback to text
          console.error("API Error (from text):", errorData.detail);
        }
        throw new Error(errorData.detail || `API request failed with status ${response.status}`);
      }

      // Get the AI's audio response
      // --- ADDED: Log ---
      console.log("Response is OK. Attempting to get response.blob()...");
      const aiAudioBlob = await response.blob();
      // --- ADDED: Log ---
      console.log(`Received AI audio blob. Size: ${aiAudioBlob.size}, Type: ${aiAudioBlob.type}`);
      
      if (aiAudioBlob.type !== "audio/mp3") {
         console.error("Server didn't return an MP3 file, got:", aiAudioBlob.type);
         // Try to read as JSON to see if it's an error message
         if (aiAudioBlob.type === "application/json") {
            const errorJson = JSON.parse(await aiAudioBlob.text());
            console.error("Error from server (as JSON blob):", errorJson.detail);
            throw new Error(errorJson.detail || "Invalid audio response from server");
         }
         throw new Error("Invalid audio response from server");
      }
      
      const aiAudioUrl = URL.createObjectURL(aiAudioBlob);
      // --- ADDED: Log ---
      console.log("Created Object URL for AI audio.");

      // Create AI message
      const aiMessage = {
        id: `ai-${Date.now()}`,
        audioUrl: aiAudioUrl,
        isUser: false,
        timestamp: new Date(),
        duration: 0, // Duration will be set by the bubble's `loadedmetadata` event
      };

      setMessages((prev) => [...prev, aiMessage]);
      // --- ADDED: Log ---
      console.log("AI message added to chat.");
      
    } catch (error) {
      console.error("Error calling /echo endpoint:", error);
      console.error("Full error object:", error);
      // NEW: Add a user-facing error message to chat
      // Customize error message for known issues
      let friendlyError = "Sorry, I couldn't process that. Please try again.";
      if (String(error.message).includes("Audio file is too small")) {
        friendlyError = "Recording was too short. Please press and hold.";
      } else if (String(error.message).includes("Failed to fetch")) {
        friendlyError = `Cannot connect to server at ${API_URL}. Is it running?`;
      } else {
        // Show the error message from the API
        friendlyError = error.message;
      }

      const errorMessage = {
        id: `error-${Date.now()}`,
        audioUrl: null, // No audio for an error
        isUser: false,
        timestamp: new Date(),
        duration: 0,
        error: friendlyError, // Pass the friendly error message
      };
      setMessages((prev) => [...prev, errorMessage]);
      // --- ADDED: Log ---
      console.log("Error message added to chat.");
    } finally {
      setIsProcessing(false); // Stop processing state
      // --- ADDED: Log ---
      console.log("isProcessing set to false.");
    }
    // --- END: API Call ---
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

  // Common styles for transition-in content
  const transitionContentStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
  };

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
        {/* ... (decorative gradient divs remain unchanged) ... */}
        {/* Infinite upward gradient */}
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
        {/* Side fades */}
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
          
          {/* --- NEW CHAT HISTORY AREA --- */}
          <div
            className="flex-1 overflow-y-auto px-4 py-6 space-y-2"
            style={{
              height: "400px", // Give it a fixed height to be scrollable
              background: blendedBg,
              borderRadius: 12,
              border: `1px solid ${lightGreen}20`,
              padding: '16px',
            }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ background: `${lightGreen}20` }}
                >
                  <Bot
                    className="w-10 h-10"
                    style={{ color: lightGreen }}
                  />
                </div>
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ color: "#f9fafb" }}
                >
                  Start a Conversation
                </h2>
                <p
                  className="max-w-md"
                  style={{ color: "#9ca3af" }}
                >
                  Hold the microphone button to record a voice message. Your AI
                  assistant will respond with voice.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <VoiceMessageBubble
                    key={message.id}
                    audioUrl={message.audioUrl}
                    isUser={message.isUser}
                    timestamp={message.timestamp}
                    duration={message.duration}
                    error={message.error} // Pass error prop
                  />
                ))}
                {isProcessing && (
                  <div className="flex justify-start mb-4">
                    <div
                      className="rounded-2xl p-4 shadow-lg"
                      style={{
                        background: "#1f2937",
                        color: "#f9fafb",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{
                              background: lightGreen,
                              animationDelay: "0ms",
                            }}
                          />
                          <span
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{
                              background: lightGreen,
                              animationDelay: "150ms",
                            }}
                          />
                          <span
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{
                              background: lightGreen,
                              animationDelay: "300ms",
                            }}
                          />
                        </div>
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          {/* --- END CHAT HISTORY AREA --- */}


          {/* Top row: language + model */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              alignItems: "center",
            }}
          >
            {/* ... (language select dropdown remains unchanged) ... */}
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

            {/* ... (model select dropdown remains unchanged) ... */}
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

            {/* Placeholder / Visualizer / Processing (with transition) */}
            <div
              style={{
                flex: 1,
                height: "100%",
                padding: "0 18px",
                textAlign: "center",
                userSelect: "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* State 1: Default Text */}
              <div
                style={{
                  ...transitionContentStyle,
                  color: "#a5bca8",
                  fontSize: 16,
                  opacity: !isRecording && !isProcessing ? 1 : 0,
                  transform:
                    !isRecording && !isProcessing ? "scale(1)" : "scale(0.9)",
                }}
              >
                Press and Hold the Microphone button to record
              </div>

              {/* State 2: Recording Visualizer */}
              <div
                style={{
                  ...transitionContentStyle,
                  opacity: isRecording ? 1 : 0,
                  transform: isRecording ? "scale(1)" : "scale(0.9)",
                }}
              >
                <AudioVisualizer lightGreen={lightGreen} />
              </div>

              {/* State 3: Processing Text */}
              <div
                style={{
                  ...transitionContentStyle,
                  color: lightGreen,
                  fontSize: 16,
                  opacity: isProcessing ? 1 : 0,
                  transform: isProcessing ? "scale(1)" : "scale(0.9)",
                  gap: "10px",
                }}
              >
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </div>
            </div>

            {/* Mic Button */}
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
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording} // Stop if mouse leaves button
                onTouchStart={startRecording} // Added for mobile
                onTouchEnd={stopRecording} // Added for mobile
                disabled={isProcessing} // Disable button while processing
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "999px",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  boxShadow: isRecording
                    ? "0 8px 30px rgba(255,80,80,0.14)"
                    : `0 8px 24px rgba(184,255,176,0.08)`,
                  background: isRecording
                    ? "#d94a4a" // destructive
                    : isProcessing
                    ? "#4a5548" // Disabled color
                    : lightGreen, // primary
                  transition: "all 0.12s ease",
                  position: "relative",
                  transform: isRecording ? "scale(0.95)" : "scale(1)",
                }}
                aria-pressed={isRecording}
              >
                {isRecording && (
                  <span
                    className="animate-ping"
                    style={{
                      position: "absolute",
                      width: 68,
                      height: 68,
                      borderRadius: "999px",
                      background: "rgba(217,74,74,0.16)",
                    }}
                  />
                )}
                {/* Switch between Mic and Send icon */}
                {isRecording ? (
                  <Send
                    size={28}
                    color={"#f9fafb"} // destructive-foreground
                    className="relative z-10"
                  />
                ) : (
                  <Mic
                    size={28}
                    color={
                      isProcessing
                        ? "#8a998d"
                        : "#07140f" // primary-foreground
                    }
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Animations */}
        <style>
          {`
            /* CSS Variables */
            :root {
              --chat-bg-gradient-start: 160 30% 8%; /* #0f2618 */
              --chat-bg-gradient-end: 160 50% 4%;   /* #050a06 */
              --primary: 115 81% 85%; /* #b8ffb0 (lightGreen) */
              --primary-foreground: 160 50% 6%; /* #07140f (dark green) */
              --secondary: 220 13% 15%; /* #1f2937 */
              --secondary-foreground: 210 40% 98%; /* #f9fafb */
              --card: 160 38% 8%; /* #0b1c12 (blendedBg) */
              --card-foreground: 210 40% 98%; /* #f9fafb */
              --border: 115 81% 85% / 0.2; /* lightGreen 20% */
              --muted: 220 13% 25%; /* #374151 */
              --muted-foreground: 220 10% 65%; /* #9ca3af */
              --accent: 115 81% 85%; /* lightGreen */
              --accent-foreground: 160 50% 6%; /* dark green */
              --destructive: 0 72% 51%; /* #d94a4a (red) */
              --destructive-foreground: 210 40% 98%; /* #f9fafb */
              --foreground: 210 40% 98%; /* #f9fafb */
            }
          
            /* Original Animations */
            @keyframes ping {
              75%, 100% {
                transform: scale(2);
                opacity: 0;
              }
            }
            .animate-ping {
              animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
            }
            @keyframes pulse {
              0% { opacity: 1; transform: translateY(0); }
              50% { opacity: 0.65; transform: translateY(-1px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes bounce {
              0%, 100% {
                transform: translateY(-25%);
                animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
              }
              50% {
                transform: translateY(0);
                animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
              }
            }
            .viz-bar {
              width: 5px;
              height: 35px;
              border-radius: 2px;
              animation: bounce 1.2s ease-in-out infinite;
              animation-delay: var(--delay, 0s);
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-spin {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            
            /* New Animations from Chat */
            .animate-bounce {
              animation: bounce 1s infinite;
            }
            @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-in.fade-in {
              animation: fade-in 0.3s ease-out;
            }
            @keyframes slide-in-from-bottom-2 {
              from { transform: translateY(8px); } /* 8px = 0.5rem (2 * 4px) */
              to { transform: translateY(0); }
            }
            .animate-in.slide-in-from-bottom-2 {
              animation: slide-in-from-bottom-2 0.3s ease-out;
            }

            /* Custom scrollbar for chat */
            .overflow-y-auto::-webkit-scrollbar {
              width: 6px;
            }
            .overflow-y-auto::-webkit-scrollbar-track {
              background: transparent;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb {
              background-color: #b8ffb040; /* lightGreen 40% */
              border-radius: 6px;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb:hover {
              background-color: #b8ffb070; /* lightGreen 70% */
            }
          `}
        </style>
      </div>
    </div>
  );
}