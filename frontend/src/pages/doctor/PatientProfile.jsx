import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI, visitAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import PatientDetailsModal from './PatientDetailsModal';

export default function PatientProfile() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [consultationNote, setConsultationNote] = useState('');
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [filterType, setFilterType] = useState('All');

    // List State
    const [myPatients, setMyPatients] = useState([]);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (patientId) {
            fetchPatientData();
        } else {
            fetchMyPatients();
        }
    }, [patientId]);

    const fetchMyPatients = async () => {
        setLoading(true);
        try {
            const response = await visitAPI.getAll();
            const allVisits = Array.isArray(response.data) ? response.data : [];

            // Filter for doctor's visits if needed (though backend handles this usually)
            // Sorting visits by date descending
            const sortedVisits = allVisits.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

            const processed = sortedVisits.map(v => {
                const pId = typeof v.patient === 'object' ? v.patient.id : v.patient;
                // Determine if new patient (simplified logic: check if this is their first visit in the list, or rely on other date checks)
                // For now, let's mark based on if it's their first visit in this filtered list or backend flag
                // A better approach for "New" vs "Old" requires knowing total visit count for patient.
                // We'll simplisticly set isNew to false for now or based on some visit data if available.
                // Or we can check if there are prior visits in the full list for this patient.
                const priorVisits = allVisits.filter(av => (typeof av.patient === 'object' ? av.patient.id : av.patient) === pId && new Date(av.visit_date) < new Date(v.visit_date));
                const isNew = priorVisits.length === 0;

                return {
                    id: v.id, // Use Visit ID as key
                    patientId: pId,
                    name: v.patient?.name || `Patient #${pId}`,
                    type: v.visit_type,
                    status: v.status,
                    isNew: isNew,
                    visitDate: v.visit_date,
                    visitData: v,
                    patientData: v.patient
                };
            });

            setMyPatients(processed);
        } catch (error) {
            console.error('Failed to fetch patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientData = async () => {
        // ... (existing code)
    };

    // ... (existing code)

    const filteredPatients = myPatients.filter(patient => {
        if (filterType === 'All') return true;
        return patient.type === filterType;
    });

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/30">
            {/* ... Sidebar and Header ... */}
            <Sidebar role="doctor" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Dr. Smith'} userRole="Doctor" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {!patientId ? (
                            <div className="space-y-6">
                                {/* ... Header Info ... */}
                                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h1 className="text-2xl font-bold text-gray-900">My Patients (Visits)</h1>
                                                <p className="text-sm text-gray-600 mt-1">All patient visits assigned to you</p>
                                            </div>
                                        </div>
                                        {/* ... Filters ... */}
                                        <div className="flex gap-2">
                                            {['All', 'OPD', 'IPD', 'EMERGENCY'].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setFilterType(type)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${filterType === type
                                                        ? 'bg-blue-600 text-white shadow-blue-200'
                                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold border-b border-gray-200">
                                                <tr>
                                                    <th className="p-5">Patient Name</th>
                                                    <th className="p-5">Visit Type</th>
                                                    <th className="p-5">Patient Status</th>
                                                    <th className="p-5">Visit Date</th>
                                                    <th className="p-5 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredPatients.length > 0 ? (
                                                    filteredPatients.map(p => (
                                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                                                            <td
                                                                className="p-5 font-semibold text-gray-900 flex items-center gap-3 cursor-pointer hover:text-blue-600 transition-colors"
                                                                onClick={() => navigate(`/doctor/patients/${p.patientId}`)}
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                                    {p.name.charAt(0)}
                                                                </div>
                                                                {p.name}
                                                            </td>
                                                            <td className="p-5">
                                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border
                                                                    ${p.type === 'OPD' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                        p.type === 'IPD' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                                                                            'bg-red-50 text-red-700 border-red-100'}`}>
                                                                    {p.type}
                                                                </span>
                                                            </td>
                                                            <td className="p-5">
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                                                                    ${p.isNew ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {p.isNew ? 'NEW' : 'RETURNING'}
                                                                </span>
                                                            </td>
                                                            <td className="p-5 text-gray-500 text-sm">
                                                                {new Date(p.visitDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                            </td>
                                                            <td className="p-5 text-right">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedVisit({
                                                                            id: p.id, // Visit ID
                                                                            name: p.name,
                                                                            patientData: p.patientData,
                                                                        });
                                                                    }}
                                                                    className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 text-sm font-medium rounded-lg hover:bg-blue-100 transition-all shadow-sm"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="p-12 text-center text-gray-400">
                                                            <p className="text-lg font-medium">No visits found</p>
                                                            <p className="text-sm">No clinical visits match the selected filter.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Existing Patient Profile View */
                            <>
                                {/* Patient Header */}
                                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
                                    <div className="flex items-center gap-8">
                                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-md">
                                            {patient?.name?.charAt(0) || 'P'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h1 className="text-2xl font-bold text-gray-900">{patient?.name || 'Patient Name'}</h1>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Active Patient</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    <span className="font-semibold">{patient?.age || '42'} yrs • {patient?.gender || 'Male'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span className="font-semibold">{patient?.phone || '+1 (555) 0123'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                    </svg>
                                                    <span className="font-semibold">MRN: {patient?.id || '2847192'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm">
                                                Summary
                                            </button>
                                            <button className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm">
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs & Content */}
                                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                                    <div className="flex border-b border-gray-100">
                                        {['overview', 'history', 'vitals', 'consultation'].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${activeTab === tab
                                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-8">
                                        {activeTab === 'overview' && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm">
                                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-3">Blood Type</p>
                                                        <p className="text-3xl font-bold text-blue-600">{patient?.bloodType || 'A+'}</p>
                                                    </div>
                                                    <div className="bg-white border border-amber-100 rounded-xl p-6 shadow-sm">
                                                        <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-3">Allergies</p>
                                                        <p className="text-xl font-bold text-amber-600">{patient?.allergies || 'Penicillin, Shellfish'}</p>
                                                    </div>
                                                    <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm">
                                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-3">Last Visit</p>
                                                        <p className="text-2xl font-bold text-blue-600">{patient?.lastVisit || 'Oct 12, 2023'}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-white border border-gray-100 rounded-xl p-6">
                                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        Clinical Background
                                                    </h3>
                                                    <p className="text-gray-600 leading-relaxed text-sm">
                                                        {patient?.conditions || 'Patient shows a history of Type 2 Diabetes (managed) and Hypertension. Regular monitoring of glucose levels and BP is required. Previous surgical history includes Appendectomy in 2015.'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'history' && (
                                            <div className="space-y-3">
                                                {patient?.visitHistory?.map((visit, index) => (
                                                    <div key={index} className="border border-gray-100 rounded-lg p-5 hover:border-blue-200 transition-colors">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800">{visit.date}</p>
                                                                <p className="text-xs text-gray-500 mt-1">{visit.diagnosis}</p>
                                                            </div>
                                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                                {visit.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === 'vitals' && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[
                                                    { label: 'Blood Pressure', value: patient?.vitals?.bp, unit: 'mmHg' },
                                                    { label: 'Heart Rate', value: patient?.vitals?.hr, unit: 'bpm' },
                                                    { label: 'Temperature', value: patient?.vitals?.temp, unit: '°C' },
                                                    { label: 'Weight', value: patient?.vitals?.weight, unit: 'kg' }
                                                ].map((vital, i) => (
                                                    <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{vital.label}</p>
                                                        <p className="text-xl font-bold text-gray-900">{vital.value || 'N/A'} <span className="text-xs font-normal text-gray-400">{vital.unit}</span></p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === 'consultation' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 ml-1">Consultation Notes</label>
                                                    <textarea
                                                        value={consultationNote}
                                                        onChange={(e) => setConsultationNote(e.target.value)}
                                                        rows="6"
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-sm resize-none"
                                                        placeholder="Enter diagnosis and treatment plan..."
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleSaveConsultation}
                                                    className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all text-sm"
                                                >
                                                    Save Consultation
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
            {/* Patient Details Modal */}
            {selectedVisit && (
                <PatientDetailsModal
                    patient={selectedVisit}
                    onClose={() => setSelectedVisit(null)}
                />
            )}
        </div>
    );
}
