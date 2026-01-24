import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Vitals() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [vitalsData, setVitalsData] = useState({
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        pulse: '',
        temperature: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        weight: '',
        height: ''
    });
    const [careNote, setCareNote] = useState('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            // Mock data for now
            setPatients([
                { id: 1, firstName: 'John', lastName: 'Doe', room: '201A', age: 45, gender: 'Male', lastVitals: '2 hours ago', status: 'pending' },
                { id: 2, firstName: 'Sarah', lastName: 'Wilson', room: '203B', age: 62, gender: 'Female', lastVitals: '30 min ago', status: 'completed' },
                { id: 3, firstName: 'Michael', lastName: 'Brown', room: '205C', age: 38, gender: 'Male', lastVitals: '4 hours ago', status: 'pending' },
                { id: 4, firstName: 'Emily', lastName: 'Davis', room: '207A', age: 55, gender: 'Female', lastVitals: '1 hour ago', status: 'pending' }
            ]);
        } catch (error) {
            console.error('Failed to fetch patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecordVitals = (patient) => {
        setSelectedPatient(patient);
        setShowVitalsModal(true);
    };

    const handleAddCareNote = (patient) => {
        setSelectedPatient(patient);
        setShowNotesModal(true);
    };

    const handleSaveVitals = async () => {
        try {
            console.log('Saving vitals for patient:', selectedPatient.id, vitalsData);
            // API call would go here
            setShowVitalsModal(false);
            setVitalsData({
                bloodPressureSystolic: '',
                bloodPressureDiastolic: '',
                pulse: '',
                temperature: '',
                respiratoryRate: '',
                oxygenSaturation: '',
                weight: '',
                height: ''
            });
            fetchPatients();
        } catch (error) {
            console.error('Failed to save vitals:', error);
        }
    };

    const handleSaveCareNote = async () => {
        try {
            console.log('Saving care note for patient:', selectedPatient.id, careNote);
            // API call would go here
            setShowNotesModal(false);
            setCareNote('');
            fetchPatients();
        } catch (error) {
            console.error('Failed to save care note:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 medical-theme">
            <Sidebar role="nurse" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Nurse Johnson'} userRole="Nurse" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="card-medical p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Vitals & Care Notes</h1>
                                        <p className="text-sm text-gray-600 mt-1">Monitor patient health and record daily care notes</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Patients List */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Patient List</h2>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Pending</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Completed</span>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                            ) : patients.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No patients assigned</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {patients.map((patient) => (
                                        <div key={patient.id} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-sm">
                                                    {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-base font-bold text-gray-900">{patient.firstName} {patient.lastName}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${patient.status === 'completed'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {patient.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                            </svg>
                                                            Room {patient.room}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            {patient.age} yrs • {patient.gender}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Last: {patient.lastVitals}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleRecordVitals(patient)}
                                                        className="px-4 py-1.5 btn-medical-primary text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                    >
                                                        Record
                                                    </button>
                                                    <button
                                                        onClick={() => handleAddCareNote(patient)}
                                                        className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                                    >
                                                        Note
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Vitals Modal */}
            {showVitalsModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Record Vitals</h2>
                                <p className="text-xs text-gray-500 mt-1">{selectedPatient.firstName} {selectedPatient.lastName} • Room {selectedPatient.room}</p>
                            </div>
                            <button
                                onClick={() => setShowVitalsModal(false)}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-1">Systolic BP</label>
                                    <input
                                        type="number"
                                        value={vitalsData.bloodPressureSystolic}
                                        onChange={(e) => setVitalsData({ ...vitalsData, bloodPressureSystolic: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                        placeholder="120"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-1">Diastolic BP</label>
                                    <input
                                        type="number"
                                        value={vitalsData.bloodPressureDiastolic}
                                        onChange={(e) => setVitalsData({ ...vitalsData, bloodPressureDiastolic: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                        placeholder="80"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-1">Pulse (bpm)</label>
                                    <input
                                        type="number"
                                        value={vitalsData.pulse}
                                        onChange={(e) => setVitalsData({ ...vitalsData, pulse: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                        placeholder="72"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-1">Temp (°F)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={vitalsData.temperature}
                                        onChange={(e) => setVitalsData({ ...vitalsData, temperature: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                        placeholder="98.6"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-1">Resp Rate</label>
                                    <input
                                        type="number"
                                        value={vitalsData.respiratoryRate}
                                        onChange={(e) => setVitalsData({ ...vitalsData, respiratoryRate: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                        placeholder="16"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-1">SpO2 (%)</label>
                                    <input
                                        type="number"
                                        value={vitalsData.oxygenSaturation}
                                        onChange={(e) => setVitalsData({ ...vitalsData, oxygenSaturation: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                        placeholder="98"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowVitalsModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveVitals}
                                    className="flex-1 px-4 py-2.5 btn-medical-primary font-semibold rounded-xl shadow-md transition-all"
                                >
                                    Save Vitals
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Care Notes Modal */}
            {showNotesModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Add Care Note</h2>
                                <p className="text-xs text-gray-500 mt-1">{selectedPatient.firstName} {selectedPatient.lastName} • Room {selectedPatient.room}</p>
                            </div>
                            <button
                                onClick={() => setShowNotesModal(false)}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-1">Observations</label>
                                <textarea
                                    value={careNote}
                                    onChange={(e) => setCareNote(e.target.value)}
                                    rows="6"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-sm resize-none"
                                    placeholder="Nursing care provided and observations..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowNotesModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCareNote}
                                    className="flex-1 px-4 py-2.5 btn-medical-primary font-semibold rounded-xl shadow-md transition-all"
                                >
                                    Save Note
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
