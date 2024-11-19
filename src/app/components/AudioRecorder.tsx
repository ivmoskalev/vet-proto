"use client";

import React, { useState, useRef } from "react";

const AudioRecorder = () => {
    const [recording, setRecording] = useState(false);
    const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
    const [transcription, setTranscription] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleStartRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/ogg;codecs=opus" });

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/ogg" });
            const audioUrl = URL.createObjectURL(audioBlob);
            setMediaBlobUrl(audioUrl);
            audioChunksRef.current = [];
        };

        mediaRecorder.start();
        setRecording(true);
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    const handleSendAudio = async () => {
        if (!mediaBlobUrl) return;

        setLoading(true);
        try {
            const response = await fetch(mediaBlobUrl);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append("file", blob, "audio.ogg");

            const res = await fetch("/api/speech/recognize", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("Failed to recognize speech");
            }

            const data = await res.json();
            // Display the transcription
            setTranscription(data.transcription);
        } catch (error) {
            console.error(error);
            setTranscription("Error recognizing speech.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <p>Status: {recording ? "Recording" : "Idle"}</p>
            <button onClick={handleStartRecording} disabled={recording}>
                Start Recording
            </button>
            <button onClick={handleStopRecording} disabled={!recording}>
                Stop Recording
            </button>

            {mediaBlobUrl && (
                <div>
                    <audio src={mediaBlobUrl} controls />
                    <button onClick={handleSendAudio} disabled={loading}>
                        {loading ? "Transcribing..." : "Transcribe Audio"}
                    </button>
                </div>
            )}

            {transcription && (
                <div>
                    <h3>Transcription:</h3>
                    <p>{transcription}</p>
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;
