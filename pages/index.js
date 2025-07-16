import { useState, useEffect, useRef } from 'react';
import { createModel, createWorker } from 'vosk-browser';

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [worker, setWorker] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Inicializar Vosk worker
    async function initVosk() {
      const model = await createModel('/vosk-model-small');
      const w = await createWorker(model);
      setWorker(w);
    }
    initVosk();
    return () => {
      if (worker) worker.terminate();
    };
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    audioChunksRef.current = [];

    recorder.ondataavailable = event => audioChunksRef.current.push(event.data);
    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const arrayBuffer = await blob.arrayBuffer();
      const result = await worker.postMessage({ command: 'recognize', data: new Uint8Array(arrayBuffer) });
      const text = result.text;
      setTranscript(text);

      // Llamada a Gemini API
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const { reply } = await chatRes.json();
      speak(reply);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const speak = text => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) utterance.voice = voices[0];
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Asistente de Voz (STT Local)</h1>
      <button
        onClick={recording ? stopRecording : startRecording}
        className="p-2 bg-blue-500 text-white rounded"
      >
        {recording ? 'Detener grabación' : 'Empezar grabación'}
      </button>
      <p className="mt-4">Transcripción: {transcript}</p>
    </div>
  );
}
