import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { labTechAPI } from '../../services/api';

export default function LabDashboard() {
    const [stats, setStats] = useState({
        pendingTests: 0,
        completedToday: 0,
        totalTests: 0,
        urgentTests: 0
    });
    const [labTests, setLabTests] = useState([]);
    const [radiologyTests, setRadiologyTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('lab'); // 'lab' or 'radiology'

    // Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);
    const [testResult, setTestResult] = useState('NORMAL');
    const [price, setPrice] = useState(0);
    const [reportFile, setReportFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [labRes, radRes] = await Promise.all([
                labTechAPI.getLabTests(),
                labTechAPI.getRadiologyTests()
            ]);

            const labs = labRes.data;
            const rads = radRes.data;

            setLabTests(labs);
            setRadiologyTests(rads);

            // Calculate Stats
            const allTests = [...labs, ...rads];
            const pending = allTests.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;

            // Allow checking completed_at date if available, otherwise just use status
            const completed = allTests.filter(t => t.status === 'COMPLETED').length;

            setStats({
                pendingTests: pending,
                completedToday: completed, // Simplified: Total completed for now
                totalTests: allTests.length,
                urgentTests: allTests.filter(t => t.priority === 'URGENT').length // assuming priority field exists or derived
            });

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = (test) => {
        setSelectedTest(test);
        setTestResult('NORMAL');
        setPrice(test.price || 0);
        setReportFile(null);
        setIsUploadModalOpen(true);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTest) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('result', testResult);
        formData.append('status', 'COMPLETED');
        formData.append('price', price);
        if (reportFile) {
            formData.append('report_file', reportFile);
        }

        try {
            if (activeTab === 'lab') {
                await labTechAPI.updateLabTest(selectedTest.id, formData);
            } else {
                await labTechAPI.updateRadiologyTest(selectedTest.id, formData);
            }

            setIsUploadModalOpen(false);
            fetchDashboardData(); // Refresh data
        } catch (error) {
            console.error('Failed to upload result:', error);
            alert('Failed to upload result. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const renderTestList = (tests) => {
        const pending = tests.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
        const completed = tests.filter(t => t.status === 'COMPLETED');

        return (
            <div className="space-y-8">
                {/* Pending Orders */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
                        Pending Orders
                        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{pending.length}</span>
                    </h3>

                    {pending.length === 0 ? (
                        <p className="text-gray-500 italic">No pending orders.</p>
                    ) : (
                        <div className="grid gap-4">
                            {pending.map(test => (
                                <div key={test.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg ${activeTab === 'lab' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                                                {test.patient_name ? test.patient_name.charAt(0) : '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{activeTab === 'lab' ? test.test_name : test.scan_type}</h4>
                                                <p className="text-sm text-gray-600 font-medium">{test.patient_name} (ID: {test.patient_id})</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                    <span>By: {test.doctor_name}</span>
                                                    <span>•</span>
                                                    <span>Date: {new Date(test.ordered_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUploadClick(test)}
                                            className="btn-medical-secondary px-4 py-2 text-sm font-medium rounded-lg shadow-sm"
                                        >
                                            Upload Result
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed Orders */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                        Completed Orders
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{completed.length}</span>
                    </h3>

                    {completed.length === 0 ? (
                        <p className="text-gray-500 italic">No completed orders yet.</p>
                    ) : (
                        <div className="grid gap-4 opacity-75">
                            {completed.map(test => (
                                <div key={test.id} className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-bold text-lg">
                                                {test.patient_name ? test.patient_name.charAt(0) : '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-700">{activeTab === 'lab' ? test.test_name : test.scan_type}</h4>
                                                <p className="text-sm text-gray-600">{test.patient_name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${test.result === 'NORMAL' ? 'bg-green-100 text-green-700' :
                                                        test.result === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {test.result}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <a
                                            href={test.report_file}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors ${!test.report_file ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            View Report
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 medical-theme">
            <Sidebar role="lab_tech" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Lab Technician'} userRole="Lab Technician" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="card-medical p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center p-2">
                                        <img src="/icons/lab.png" alt="Lab" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Lab Technician Dashboard</h1>
                                        <p className="text-sm text-gray-600 mt-1">Manage lab orders and radiology reports</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 font-medium uppercase">Today</p>
                                    <p className="text-sm font-semibold text-gray-900">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="card-medical p-6 border-l-4 border-amber-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Pending Orders</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.pendingTests}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="card-medical p-6 border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Completed</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.completedToday}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="card-medical p-6 border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Total Orders</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.totalTests}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="card-medical overflow-hidden">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab('lab')}
                                    className={`flex-1 py-5 text-center font-semibold text-sm transition-colors relative ${activeTab === 'lab'
                                        ? 'text-green-700 bg-green-50/50'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    Lab Reports
                                    {activeTab === 'lab' && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('radiology')}
                                    className={`flex-1 py-5 text-center font-semibold text-sm transition-colors relative ${activeTab === 'radiology'
                                        ? 'text-blue-700 bg-blue-50/50'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    Radiology
                                    {activeTab === 'radiology' && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
                                    )}
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                {loading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                                    </div>
                                ) : (
                                    activeTab === 'lab' ? renderTestList(labTests) : renderTestList(radiologyTests)
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Upload Result</h3>
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                                <div className="p-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                                    {activeTab === 'lab' ? selectedTest?.test_name : selectedTest?.scan_type}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                                <div className="p-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                                    {selectedTest?.patient_name}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    min="0"
                                    placeholder="Enter test price"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Result Status</label>
                                <select
                                    value={testResult}
                                    onChange={(e) => setTestResult(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="ABNORMAL">Abnormal</option>
                                    <option value="CRITICAL">Critical</option>
                                    <option value="INCONCLUSIVE">Inconclusive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Report File (Optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setReportFile(e.target.files[0])}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-emerald-50 file:text-emerald-700
                                        hover:file:bg-emerald-100
                                    "
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="btn-medical-secondary w-full py-3 font-bold rounded-xl shadow-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Uploading...' : 'Submit Result'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
