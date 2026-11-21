/**
 * SchemeSaathi AI - Voice Agent Engine (Web Speech API)
 * Features:
 * - SpeechRecognition (STT) for 15+ Indian languages
 * - window.speechSynthesis (TTS) with Indian accent voice matching
 * - Conversational Voice Assistant Drawer with stateful dialog
 */

class VoiceAgentEngine {
  constructor(options = {}) {
    this.currentLanguage = options.language || 'en-IN';
    this.recognition = null;
    this.isListening = false;
    this.onResultCallback = options.onResult || null;
    this.onErrorCallback = options.onError || null;
    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech Recognition API not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.currentLanguage;

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (this.onResultCallback) {
        this.onResultCallback(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  setLanguage(langCode) {
    this.currentLanguage = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (err) {
        console.error("Speech recognition error:", err);
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  speak(text, langCode) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop ongoing speech

    const targetLang = langCode || this.currentLanguage;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0])) ||
                         voices.find(v => v.lang.includes('IN'));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceAgentEngine;
}
