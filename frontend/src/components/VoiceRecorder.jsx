import { useState, useEffect, useRef } from 'react';
import { aiAPI } from '../services/api';

export default function VoiceRecorder({ onTranscriptChange, initialValue = '' }) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState(initialValue);
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(true);
    const [isProcessingAI, setIsProcessingAI] = useState(false);

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
        recognition.lang = 'en-US';

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

                // console.log('Auto-restarting speech recognition...');
                try {
                    recognition.start();
                } catch (e) {
                    // console.error("Restart failed:", e);
                    setIsRecording(false);
                    isUserRecordingRef.current = false;
                }
            } else {
                setIsRecording(false);
            }
        };

        recognition.onerror = (event) => {
            // console.error('Speech error:', event.error);
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
    }, []);

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
            // console.error('Start error:', err);
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
            <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                    {!isRecording ? (
                        <button
                            type="button"
                            onClick={startRecording}
                            disabled={isProcessingAI}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm font-medium text-sm disabled:bg-red-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            Start Recording
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm font-medium text-sm animate-pulse"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /></svg>
                            Stop Recording
                        </button>
                    )}

                    {isRecording && <span className="text-red-600 text-sm font-semibold animate-pulse">Recording...</span>}
                </div>

                {/* AI Fix Button */}
                {!isRecording && transcript.trim().length > 5 && (
                    <button
                        type="button"
                        onClick={fixGrammar}
                        disabled={isProcessingAI}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm disabled:bg-indigo-300"
                    >
                        {isProcessingAI ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Refining...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                AI Fix Grammar
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Inline Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-fadeIn">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            {/* Safety Message */}
            {!error && !isProcessingAI && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs text-blue-800">
                        {isRecording ? "Listening..." : "Review text before saving. " + (transcript.length > 5 ? "Use 'AI Fix Grammar' to polish." : "")}
                    </p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {error ? "Please Type Here:" : "Transcribed Text (Editable)"}
                </label>
                <textarea
                    value={transcript}
                    onChange={handleManualEdit}
                    disabled={isProcessingAI}
                    className={`w-full h-32 p-3 border rounded-lg focus:ring-2 text-sm resize-none transition-colors ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} ${isProcessingAI ? 'bg-gray-100 cursor-wait' : ''}`}
                    placeholder="Type progress note here..."
                />
            </div>
        </div>
    );
}
