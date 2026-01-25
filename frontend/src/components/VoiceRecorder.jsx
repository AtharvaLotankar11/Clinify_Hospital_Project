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

    const languages = [
        { code: 'en-US', name: 'US English' },
        { code: 'hi-IN', name: 'Hindi' },
        { code: 'mr-IN', name: 'Marathi' }
    ];

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
                setError("Network error. Type manually.");
            }
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.abort();
        };
    }, []); // Only init once, but we handle language change below

    // Handle language change dynamically
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = language;
            // If recording, restart to apply language change
            if (isRecording) {
                stopRecording();
                setTimeout(() => startRecording(), 100);
            }
        }
    }, [language]);

    const startRecording = () => {
        setError(null);
        if (!recognitionRef.current) return;

        committedTextRef.current = transcript;
        latestTranscriptRef.current = transcript;

        isUserRecordingRef.current = true;
        try {
            recognitionRef.current.start();
            setIsRecording(true);
        } catch (err) {
            // Already started?
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
            setError("Failed to improve text (AI Error).");
        } finally {
            setIsProcessingAI(false);
        }
    };

    const translateText = async () => {
        if (!transcript.trim()) return;
        setIsProcessingAI(true);
        setError(null);
        try {
            const response = await aiAPI.translate(transcript, 'English');
            const translated = response.data.translated_text;
            if (translated) {
                setTranscript(translated);
                latestTranscriptRef.current = translated;
                committedTextRef.current = translated;
                onTranscriptChange(translated);
            }
        } catch (err) {
            console.error("AI Translate Error:", err);
            setError("Failed to translate text.");
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
                    disabled={isRecording || isProcessingAI}
                    className="h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 w-auto min-w-[120px]"
                >
                    {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                </select>


                {!isRecording ? (
                    <button
                        type="button"
                        onClick={startRecording}
                        disabled={isProcessingAI}
                        className="h-10 flex items-center gap-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm font-medium text-sm disabled:bg-red-300 whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        Record
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="h-10 flex items-center gap-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm font-medium text-sm animate-pulse whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /></svg>
                        Stop
                    </button>
                )}

                {/* AI Tools */}
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    <button
                        type="button"
                        onClick={fixGrammar}
                        disabled={isProcessingAI || transcript.length < 5}
                        className="h-10 flex items-center gap-2 px-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm disabled:bg-indigo-300 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {isProcessingAI ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        )}
                        AI Fix Grammar
                    </button>

                    {(language === 'hi-IN' || language === 'mr-IN') && (
                        <button
                            type="button"
                            onClick={translateText}
                            disabled={isProcessingAI || transcript.length < 5}
                            className="h-10 flex items-center gap-2 px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium text-sm disabled:bg-purple-300 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                            AI Translate
                        </button>
                    )}
                </div>
            </div>

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
                    placeholder={language === 'hi-IN' ? "हिंदी में बोलें..." : language === 'mr-IN' ? "मराठीत बोला..." : "Speak or type progress notes..."}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                    {language.startsWith('en') ? 'AI Grammar Fix available.' : 'AI Translation available.'}
                </p>
            </div>
        </div>
    );
}
