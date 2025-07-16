// pages/index.js
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tu navegador no soporta Speech Recognition API');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      setTranscript(text);
      sendToAI(text);
    };

    recognitionRef.current = recognition;
  }, []);

  function toggleListening() {
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  async function sendToAI(text) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    speak(data.reply);
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      alert('Tu navegador no soporta Speech Synthesis API');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) utterance.voice = voices[0];
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Asistente de Voz</h1>
      <button onClick={toggleListening} className="p-2 bg-blue-500 text-white rounded">
        {listening ? 'Detener' : 'Hablar'}
      </button>
      <p className="mt-4">Transcripción: {transcript}</p>
    </div>
  );
}
