import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function UploadReport() {
    const [testOrders, setTestOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadNotes, setUploadNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchTestOrders();
    }, []);

    const fetchTestOrders = async () => {
        try {
            // Mock data for now
            setTestOrders([
                {
                    id: 1,
                    patientName: 'John Doe',
                    patientId: 'P001',
                    testType: 'Complete Blood Count',
                    orderedBy: 'Dr. Smith',
                    priority: 'urgent',
                    orderedAt: '2 hours ago',
                    status: 'pending'
                },
                {
                    id: 2,
                    patientName: 'Sarah Wilson',
                    patientId: 'P002',
                    testType: 'Lipid Profile',
                    orderedBy: 'Dr. Johnson',
                    priority: 'normal',
                    orderedAt: '4 hours ago',
                    status: 'pending'
                },
                {
                    id: 3,
                    patientName: 'Michael Brown',
                    patientId: 'P003',
                    testType: 'Chest X-Ray',
                    orderedBy: 'Dr. Smith',
                    priority: 'urgent',
                    orderedAt: '1 hour ago',
                    status: 'pending'
                },
                {
                    id: 4,
                    patientName: 'Emily Davis',
                    patientId: 'P004',
                    testType: 'Thyroid Function Test',
                    orderedBy: 'Dr. Johnson',
                    priority: 'normal',
                    orderedAt: '5 hours ago',
                    status: 'pending'
                }
            ]);
        } catch (error) {
            console.error('Failed to fetch test orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = (test) => {
        setSelectedTest(test);
        setShowUploadModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setUploadFile(file);
        } else {
            alert('Please upload a PDF file');
        }
    };

    const handleUploadReport = async () => {
        if (!uploadFile) {
            alert('Please select a PDF file to upload');
            return;
        }

        setUploading(true);
        try {
            // Here you would integrate with your Gemini API
            // For now, just simulate upload
            console.log('Uploading report for test:', selectedTest.id);
            console.log('File:', uploadFile);
            console.log('Notes:', uploadNotes);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            setShowUploadModal(false);
            setUploadFile(null);
            setUploadNotes('');
            fetchTestOrders();
        } catch (error) {
            console.error('Failed to upload report:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            <Sidebar role="lab_tech" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Lab Technician'} userRole="Lab Technician" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <img src="/icons/lab.png" alt="Lab" className="w-10 h-10 object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Upload Test Reports</h1>
                                    <p className="text-sm text-gray-600 mt-1">Upload and manage test results for pending orders.</p>
                                </div>
                            </div>
                        </div>

                        {/* Test Orders List */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Test Orders</h2>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Urgent</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Normal</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <svg className="animate-spin h-6 w-6 text-emerald-600" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    </div>
                                ) : testOrders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-sm text-gray-500 font-medium">No pending test orders</p>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {testOrders.map((test) => (
                                            <div key={test.id} className="group bg-white border border-gray-100 rounded-xl p-6 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-sm border border-gray-100 group-hover:bg-emerald-50 transition-colors">
                                                            {test.patientName.split(' ').map(n => n.charAt(0)).join('')}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-bold text-gray-900">{test.patientName}</h3>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ID: {test.patientId}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${test.priority === 'urgent'
                                                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                        }`}>
                                                        {test.priority}
                                                    </span>
                                                </div>

                                                <div className="space-y-3 mb-6">
                                                    <div className="flex items-center gap-3 text-gray-500">
                                                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                        <span className="text-xs font-bold text-gray-700">{test.testType}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                        <span className="flex items-center gap-1.5">
                                                            Ordered by {test.orderedBy}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            {test.orderedAt}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleUploadClick(test)}
                                                    className="w-full py-2.5 bg-gray-50 group-hover:bg-emerald-600 group-hover:text-white text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 group-hover:border-emerald-600 shadow-sm transition-all duration-300 flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    Upload Report
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Upload Modal */}
            {showUploadModal && selectedTest && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 border border-gray-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Upload Test Report</h2>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">
                                    {selectedTest.patientName} • {selectedTest.testType}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                                    PDF Report File
                                </label>
                                <div className="border-2 border-dashed border-gray-100 rounded-xl p-8 text-center hover:border-emerald-300 hover:bg-emerald-50/10 transition-all group overflow-hidden relative">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        id="file-upload"
                                    />
                                    <div className="space-y-2">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">Click to upload PDF</p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Max size 10MB</p>
                                        </div>
                                    </div>
                                    {uploadFile && (
                                        <div className="mt-4 p-2 bg-emerald-600 rounded-lg border border-emerald-500 shadow-sm animate-in slide-in-from-bottom-2">
                                            <p className="text-[10px] font-bold text-white flex items-center justify-center gap-2">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {uploadFile.name}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                                    Additional Notes
                                </label>
                                <textarea
                                    value={uploadNotes}
                                    onChange={(e) => setUploadNotes(e.target.value)}
                                    rows="3"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium resize-none"
                                    placeholder="Enter observations..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-[10px] font-bold rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUploadReport}
                                    disabled={uploading || !uploadFile}
                                    className="flex-1 py-2.5 bg-emerald-600 text-white text-[10px] font-bold rounded-xl shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Uploading...
                                        </>
                                    ) : (
                                        'Confirm Upload'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
