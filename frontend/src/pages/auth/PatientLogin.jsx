import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAuthAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PatientLogin() {
    const navigate = useNavigate();
    const { login, isAuthenticated, user } = useAuth();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('email'); // 'email' or 'otp'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && user?.role === 'patient') {
            navigate('/patient/dashboard', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await patientAuthAPI.sendOtp(email);
            setStep('otp');
            setMessage('OTP has been sent to your registered email.');
        } catch (err) {
            console.error("OTP Error:", err);
            const msg = err.response?.data?.error
                || err.response?.data?.detail
                || (err.response?.status === 404 ? 'Email not registered.' : null)
                || 'Failed to connect to server. Please check your network.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await patientAuthAPI.verifyOtp(email, otp);
            login(response.data.access, response.data.user);
            navigate('/patient/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid or expired OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            {/* Login Container */}
            <div className="relative w-full max-w-5xl grid md:grid-cols-2 gap-0 bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">

                {/* Left Side - Branding */}
                <div className="relative gradient-medical-primary p-12 flex flex-col justify-center items-center text-white overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10 text-center space-y-8">
                        {/* Logo */}
                        <div className="inline-flex items-center justify-center w-40 h-40 bg-white rounded-3xl shadow-xl transform hover:scale-110 transition-transform duration-300 p-4">
                            <img
                                src="/clinify-logo.png"
                                alt="CLINIFY Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <h1 className="text-3xl font-bold">Patient Portal</h1>

                        {/* Features */}
                        <div className="space-y-4 pt-8">
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="text-blue-50">Access Your EMR Anytime</span>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <span className="text-blue-50">Secure OTP Login</span>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <span className="text-blue-50">Real-time Lab Reports</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="p-12 flex flex-col justify-center">
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-gray-800">
                                {step === 'email' ? 'Patient Access' : 'Verify OTP'}
                            </h2>
                            <p className="text-gray-500">
                                {step === 'email'
                                    ? 'Enter your registered email to receive an OTP'
                                    : `We've sent an OTP to ${email}`}
                            </p>
                        </div>

                        {step === 'email' ? (
                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 input-medical"
                                        placeholder="Enter your registered email"
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-slideIn">
                                        <p className="text-red-700 text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 px-6 btn-medical-primary font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending OTP...' : 'Send OTP'}
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Back to Staff Login
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="otp" className="text-sm font-semibold text-gray-700">
                                        6-Digit OTP
                                    </label>
                                    <input
                                        id="otp"
                                        type="text"
                                        required
                                        maxLength="6"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 tracking-[1em] text-center text-2xl font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 input-medical"
                                        placeholder="------"
                                    />
                                </div>

                                {message && (
                                    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg animate-slideIn">
                                        <p className="text-blue-700 text-sm">{message}</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-slideIn">
                                        <p className="text-red-700 text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 px-6 btn-medical-primary font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Verifying...' : 'Verify & Login'}
                                </button>

                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setStep('email')}
                                        className="text-sm font-medium text-gray-500 hover:text-blue-600"
                                    >
                                        Change Email
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Resend OTP
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div >

            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out;
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>
        </div >
    );
}
