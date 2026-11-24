/** Web Speech API wrapper (Chromium-based browsers and Safari). */

import { SPEECH_LANG } from '../config.js';

const getCtor = () =>
  typeof window === 'undefined' ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null;

export const isSpeechSupported = () => getCtor() !== null;

/**
 * Create a one-shot recognizer. Call start() to listen, stop() to end early.
 * @param {{ onStart: () => void, onResult: (text: string) => void, onError: (code: string) => void, onEnd: () => void }} handlers
 */
export function createRecognizer({ onStart, onResult, onError, onEnd }) {
  const Ctor = getCtor();
  const recognition = new Ctor();
  recognition.lang = SPEECH_LANG;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = onStart;
  recognition.onresult = (event) => onResult(event.results[0][0].transcript);
  recognition.onerror = (event) => onError(event.error);
  recognition.onend = onEnd;

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
  };
}
