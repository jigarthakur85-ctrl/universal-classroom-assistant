/**
 * Voice utilities for speech-to-text and text-to-speech
 */

// Check browser support for Web Speech API
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const SpeechSynthesis = (window as any).speechSynthesis;

export interface VoiceOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * Start speech-to-text recognition
 */
export function startSpeechRecognition(
  onResult: (text: string) => void,
  onError: (error: string) => void,
  language: string = 'en-US'
): any {
  if (!SpeechRecognition) {
    onError('Speech Recognition not supported in this browser');
    return null;
  }

  const recognition = new SpeechRecognition();
  (recognition as any).language = language;
  (recognition as any).continuous = false;
  (recognition as any).interimResults = false;

  (recognition as any).onstart = () => {
    console.log('Speech recognition started');
  };

  (recognition as any).onresult = (event: any) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    onResult(transcript);
  };

  (recognition as any).onerror = (event: any) => {
    onError(`Speech recognition error: ${event.error}`);
  };

  (recognition as any).onend = () => {
    console.log('Speech recognition ended');
  };

  (recognition as any).start();
  return recognition;
}

/**
 * Stop speech recognition
 */
export function stopSpeechRecognition(recognition: any) {
  if (recognition) {
    (recognition as any).stop();
  }
}

/**
 * Convert language code to speech recognition language
 */
export function getLanguageCode(language: string): string {
  const languageMap: Record<string, string> = {
    english: 'en-US',
    hindi: 'hi-IN',
    gujarati: 'gu-IN',
    marathi: 'mr-IN',
    punjabi: 'pa-IN',
    bengali: 'bn-IN',
    tamil: 'ta-IN',
    telugu: 'te-IN',
    kannada: 'kn-IN',
    malayalam: 'ml-IN',
  };
  return languageMap[language] || 'en-US';
}

/**
 * Speak text using text-to-speech
 */
export function speakText(
  text: string,
  options: VoiceOptions = {},
  onEnd?: () => void
): void {
  if (!SpeechSynthesis) {
    console.error('Text-to-Speech not supported in this browser');
    return;
  }

  // Cancel any ongoing speech
  SpeechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  (utterance as any).lang = options.language || 'en-US';
  utterance.rate = options.rate || 1;
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 1;

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (event) => {
    console.error('Text-to-Speech error:', event.error);
  };

  SpeechSynthesis.speak(utterance);
}

/**
 * Stop text-to-speech
 */
export function stopSpeech(): void {
  if (SpeechSynthesis) {
    SpeechSynthesis.cancel();
  }
}

/**
 * Check if speech synthesis is speaking
 */
export function isSpeaking(): boolean {
  return SpeechSynthesis ? SpeechSynthesis.speaking : false;
}
