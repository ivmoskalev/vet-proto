// src/app/components/AudioRecorder.tsx

"use client";

import React, { useState, useRef, useEffect } from "react";
import { fields } from "../data/fields";
import "../globals.css"; // Import the CSS file

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const AudioRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [showData, setShowData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleAudioEnded = () => {
    // Start recording
    handleStartRecording();
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener("ended", handleAudioEnded);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleAudioEnded);
      }
    };
  }, [currentFieldIndex]);

  const handleStartRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];

        // Convert audioBlob for Chrome
        await handleSendAudio(audioBlob);
        handleNextField();
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      setError("Failed to start recording. Please check your microphone permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("id", fields[currentFieldIndex].id.toString());

      const res = await fetch(`${basePath}/api/speech/recognize`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to send audio for recognition");
      }

      // No need to handle response here
    } catch (error) {
      console.error(error);
      setError("Error sending audio.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextField = () => {
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
      playAudio();
    } else {
      // All fields processed
      setRecording(false);
    }
  };

  const toggleShowData = async () => {
    setShowData(!showData);
    if (!showData) {
      // Fetch transcriptions from backend
      const res = await fetch(`${basePath}/api/data`);
      if (res.ok) {
        const data = await res.json();
        fields.forEach((field) => {
          field.transcription = data[field.id] || "";
        });
      } else {
        setError("Failed to fetch data");
      }
    }
  };

  const startApplication = () => {
    playAudio();
  };


  return (
    <div className="container">
      <button onClick={startApplication} className="button">
        Начать
      </button>
      <p className="status">Статус: {recording ? "Запись..." : "Ожидание"}</p>

      <audio
        ref={audioRef}
        src={basePath + fields[currentFieldIndex].audioUrl}
        preload="auto"
      />

      <div className="controls">
        <button onClick={playAudio} className="button">
          Повторить сообщение
        </button>
        <button onClick={handleStopRecording} disabled={!recording} className="button">
          Остановить запись
        </button>
        <button onClick={handleStartRecording} disabled={recording} className="button">
          Продолжить запись
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <button onClick={toggleShowData} className="button">
        {showData ? "Скрыть данные" : "Показать все данные"}
      </button>

      {showData && (
        <div className="data">
          <h3>Распознанные данные:</h3>
          {fields.map((field) => (
            <div key={field.id}>
              <strong>{field.fieldNameRu}:</strong> {field.transcription}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
