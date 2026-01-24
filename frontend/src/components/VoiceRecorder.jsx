import { useState, useEffect, useRef } from 'react';

export default function VoiceRecorder({ onTranscriptChange, initialValue = '' }) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState(initialValue);
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef(null);
    const isUserRecordingRef = useRef(false);

    // We need to keep a ref of the latest transcript to preserve it across restarts
    const latestTranscriptRef = useRef(initialValue);
    // We also track "committed" text (text before the current speech session started)
    const committedTextRef = useRef(initialValue);

    // Sync external initialValue changes if user edits elsewhere (optional but good practice)
    useEffect(() => {
        // Only update if we are NOT recording to avoid overwriting active speech
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
            let finalForSession = '';
            let interimForSession = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalForSession += event.results[i][0].transcript + ' ';
                } else {
                    interimForSession += event.results[i][0].transcript;
                }
            }

            // Logic: Total Text = (Text before this session) + (New finalized text) + (Live interim text)
            // We need to be careful not to duplicate.
            // Actually, simpler logic for "continuous" restart support:
            // The API resets its buffer on restart.
            // So we treat 'committedTextRef' as the base.

            // However, inside a single session, 'event.results' accumulates.
            // We need to know if we are in a fresh session or mid-stream.
            // The simplest sustainable way: 
            // 1. Calculate new part of text.
            // 2. newFullText = committedTextRef.current + " " + newPart

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
                // User wants to keep recording, but API stopped (silence/network).
                // We must "commit" the text so next session starts fresh.
                committedTextRef.current = latestTranscriptRef.current;

                console.log('Auto-restarting speech recognition...');
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Restart failed:", e);
                    setIsRecording(false);
                    isUserRecordingRef.current = false;
                }
            } else {
                setIsRecording(false);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech error:', event.error);
            // Critical errors should stop the loop
            if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(event.error)) {
                setIsRecording(false);
                isUserRecordingRef.current = false;
                if (event.error === 'not-allowed') setError("Mic access denied.");
                if (event.error === 'audio-capture') setError("No mic found.");
                if (event.error === 'service-not-allowed') setError("HTTPS required.");
            } else if (event.error === 'network') {
                setError("Network error. Type manually.");
                // Network error usually triggers onend, which triggers restart.
                // We let it try to restart, but show error.
            } else if (event.error === 'no-speech') {
                // Ignore, onend will restart
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

        // "Commit" whatever takes is currently in the box before starting
        committedTextRef.current = transcript;
        latestTranscriptRef.current = transcript;

        isUserRecordingRef.current = true;
        try {
            recognitionRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Start error:', err);
            setIsRecording(true); // Assume it started or is restarting
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
        committedTextRef.current = newValue; // Sync commit ref so voice appends correctly
        onTranscriptChange(newValue);
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
            <div className="flex flex-wrap items-center gap-3">
                {!isRecording ? (
                    <button
                        type="button"
                        onClick={startRecording}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm font-medium text-sm"
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

            {/* Inline Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-fadeIn">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            {/* Safety Message */}
            {!error && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs text-blue-800">Review text before saving. Voice input may have errors.</p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {error ? "Please Type Here:" : "Transcribed Text (Editable)"}
                </label>
                <textarea
                    value={transcript}
                    onChange={handleManualEdit}
                    className={`w-full h-32 p-3 border rounded-lg focus:ring-2 text-sm resize-none transition-colors ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="Type progress note here..."
                />
            </div>
        </div>
    );
}
