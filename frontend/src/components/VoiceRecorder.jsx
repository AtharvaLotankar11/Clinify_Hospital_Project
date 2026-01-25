import { useState, useEffect, useRef } from 'react';
import { aiAPI } from '../services/api';

export default function VoiceRecorder({ onTranscriptChange, initialValue = '' }) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState(initialValue);
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(true);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [language, setLanguage] = useState('en-US');

    const recognitionRef = useRef(null);
    const isUserRecordingRef = useRef(false);

    // We need to keep a ref of the latest transcript to preserve it across restarts
    const latestTranscriptRef = useRef(initialValue);
    // We also track "committed" text (text before the current speech session started)
    const committedTextRef = useRef(initialValue);

    // Sync external initialValue changes if user edits elsewhere
    useEffect(() => {
        if (!isUserRecordingRef.current && initialValue !== transcript) {
            setTranscript(initialValue);
            latestTranscriptRef.current = initialValue;
            committedTextRef.current = initialValue;
        }
    }, [initialValue]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event) => {
            setError(null);

            // Re-calculating full session text from 0 index for THIS session
            let sessionFullText = '';
            for (let i = 0; i < event.results.length; i++) {
                sessionFullText += event.results[i][0].transcript;
                if (event.results[i].isFinal) sessionFullText += ' ';
            }

            const newTotalText = (committedTextRef.current + ' ' + sessionFullText).replace(/\s+/g, ' ').trim();

            setTranscript(newTotalText);
            latestTranscriptRef.current = newTotalText;
            onTranscriptChange(newTotalText);
        };

        recognition.onend = () => {
            if (isUserRecordingRef.current) {
                // User wants to keep recording, but API stopped.
                // Commit text and restart.
                committedTextRef.current = latestTranscriptRef.current;

                try {
                    recognition.start();
                } catch (e) {
                    setIsRecording(false);
                    isUserRecordingRef.current = false;
                }
            } else {
                setIsRecording(false);
            }
        };

        recognition.onerror = (event) => {
            if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(event.error)) {
                setIsRecording(false);
                isUserRecordingRef.current = false;
                if (event.error === 'not-allowed') setError("Mic access denied.");
                if (event.error === 'audio-capture') setError("No mic found.");
                if (event.error === 'service-not-allowed') setError("HTTPS required.");
            } else if (event.error === 'network') {
                setError("Network error.");
            }
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.abort();
        };
    }, []);

    // Update language dynamically
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = language;
        }
    }, [language]);

    const startRecording = () => {
        setError(null);
        if (!recognitionRef.current) return;

        // Ensure language is set before starting
        recognitionRef.current.lang = language;

        committedTextRef.current = transcript;
        latestTranscriptRef.current = transcript;

        isUserRecordingRef.current = true;
        try {
            recognitionRef.current.start();
            setIsRecording(true);
        } catch (err) {
            setIsRecording(true);
        }
    };

    const stopRecording = () => {
        isUserRecordingRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleManualEdit = (e) => {
        setError(null);
        const newValue = e.target.value;
        setTranscript(newValue);
        latestTranscriptRef.current = newValue;
        committedTextRef.current = newValue;
        onTranscriptChange(newValue);
    };

    const fixGrammar = async () => {
        if (!transcript.trim()) return;

        setIsProcessingAI(true);
        setError(null);

        try {
            const response = await aiAPI.fixGrammar(transcript);
            const fixedText = response.data.fixed_text;

            if (fixedText) {
                setTranscript(fixedText);
                latestTranscriptRef.current = fixedText;
                committedTextRef.current = fixedText;
                onTranscriptChange(fixedText);
            }
        } catch (err) {
            console.error("AI Fix Error:", err);
            setError("Failed to improve text.");
        } finally {
            setIsProcessingAI(false);
        }
    };

    const translateText = async () => {
        if (!transcript.trim()) return;

        setIsProcessingAI(true);
        setError(null);

        try {
            // Frontend Hack: Using fixGrammar endpoint with a Translation Prompt since we are restricted to frontend changes
            const prompt = `Translate the following medical notes to precise English. Maintain all medical facts and terminology accurately:\n\n${transcript}`;

            const response = await aiAPI.fixGrammar(prompt);
            const translatedText = response.data.fixed_text;

            if (translatedText) {
                setTranscript(translatedText);
                latestTranscriptRef.current = translatedText;
                committedTextRef.current = translatedText;
                onTranscriptChange(translatedText);
            }
        } catch (err) {
            console.error("AI Translate Error:", err);
            setError("Translation failed.");
        } finally {
            setIsProcessingAI(false);
        }
    };

    if (!isSupported) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-amber-800">Voice Input Not Supported</p>
                <p className="text-xs text-amber-700">Please use Chrome, Edge, or Safari.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                {/* Language Selector */}
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isRecording}
                    className="w-32 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                    <option value="en-US">US English</option>
                    <option value="hi-IN">Hindi</option>
                    <option value="mr-IN">Marathi</option>
                </select>

                {!isRecording ? (
                    <button
                        type="button"
                        onClick={startRecording}
                        disabled={isProcessingAI}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm font-medium text-sm disabled:bg-red-300 whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        Start
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm font-medium text-sm animate-pulse whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /></svg>
                        Stop
                    </button>
                )}

                {/* AI Tools Group */}
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    {!isRecording && transcript.trim().length > 2 && (
                        <>
                            <button
                                type="button"
                                onClick={fixGrammar}
                                disabled={isProcessingAI}
                                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-xs disabled:bg-indigo-300 whitespace-nowrap"
                                title="Fix grammar and format"
                            >
                                {isProcessingAI ? 'Refining...' : 'AI Fix Grammar'}
                            </button>

                            <button
                                type="button"
                                onClick={translateText}
                                disabled={isProcessingAI}
                                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium text-xs disabled:bg-emerald-300 whitespace-nowrap"
                                title="Translate to English"
                            >
                                {isProcessingAI ? 'Translating...' : 'AI Translate'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isRecording && (
                <div className="flex items-center gap-2 text-red-600 animate-pulse text-xs font-semibold px-1">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Recording in {language === 'hi-IN' ? 'Hindi' : language === 'mr-IN' ? 'Marathi' : 'English'}...
                </div>
            )}

            {/* Inline Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-fadeIn">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            <div>
                <textarea
                    value={transcript}
                    onChange={handleManualEdit}
                    disabled={isProcessingAI}
                    className={`w-full h-32 p-3 border rounded-lg focus:ring-2 text-sm resize-none transition-colors ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} ${isProcessingAI ? 'bg-gray-100 cursor-wait' : ''}`}
                    placeholder="Type notes or start recording..."
                />
            </div>
        </div>
    );
}
