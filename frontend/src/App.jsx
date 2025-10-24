import React, { useState, useEffect, useRef } from 'react';
import { Mic, Globe } from 'lucide-react';

// Language options for the dropdown
const languageOptions = [
  { value: 'detect', label: 'Detect Language' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español (España)' },
  { value: 'fr-FR', label: 'Français (France)' },
  { value: 'de-DE', label: 'Deutsch (Deutschland)' },
  { value: 'ja-JP', label: '日本語 (日本)' },
  { value: 'ko-KR', label: '한국어 (대한민국)' },
  { value: 'hi-IN', label: 'हिन्दी (भारत)' },
  { value: 'ar-SA', label: 'العربية (السعودية)' },
];

/**
 * Main application component.
 * Renders the UI for the multilingual AI voice chatbot.
 */
export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('detect');
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  // Effect to handle the recording timer
  useEffect(() => {
    if (isRecording) {
      // Start the timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      // Stop the timer
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Cleanup function to clear interval on unmount
    return () => {
      clearInterval(timerRef.current);
    };
  }, [isRecording]);

  /**
   * Toggles the recording state and resets the timer.
   */
  const handleMicClick = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
    } else {
      // Start recording
      setRecordingTime(0); // Reset timer
      setIsRecording(true);
    }
  };

  /**
   * Formats time in seconds to MM:SS format.
   * @param {number} timeInSeconds - The total time in seconds.
   * @returns {string} The formatted time string (e.g., "01:23").
   */
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-bg-color text-gray-700 font-sans antialiased">
      <div className="w-full max-w-md mx-4 p-8 bg-bg-color border border-[#15ff00] rounded-2xl shadow-2xl space-y-8">
        
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to AI Voice Chat
          </h1>
          <p className="text-lg text-gray-400">
            Select your language and tap the mic to start.
          </p>
        </div>

        {/* Language Selection */}
        <div className="space-y-3">
          <label
            htmlFor="language-select"
            className="flex items-center text-sm font-medium text-gray-500"
          >
            <Globe className="w-5 h-5 mr-2" />
            Choose a Language
          </label>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full p-3 bg-gray-100 border border-gray-400 rounded-lg text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Microphone Button and Timer */}
        <div className="flex flex-col items-center justify-center space-y-6 pt-4">
          <button
            onClick={handleMicClick}
            className={`relative flex items-center justify-center w-28 h-28 rounded-full transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50
              ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'
              }
            `}
          >
            {/* Pulsing animation when recording */}
            {isRecording && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
            )}
            <Mic className="w-12 h-12 text-white z-10" />
          </button>

          {/* Recording Timer */}
          <div className="h-8">
            {isRecording && (
              <p className="text-xl font-mono text-gray-300 animate-pulse">
                {formatTime(recordingTime)}
              </p>
            )}
            {!isRecording && recordingTime > 0 && (
              <p className="text-xl font-mono text-gray-500">
                {formatTime(recordingTime)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}