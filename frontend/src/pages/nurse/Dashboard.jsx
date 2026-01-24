import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { visitAPI, vitalAPI } from '../../services/api';
import PatientDetailsModal from '../doctor/PatientDetailsModal';

export default function NurseDashboard() {
    const [loading, setLoading] = useState(true);
    const [visitsByCategory, setVisitsByCategory] = useState({ today: [], upcoming: [], past: [] });
    // Keep total count for stats
    const [totalAssigned, setTotalAssigned] = useState(0);

    const [selectedVisit, setSelectedVisit] = useState(null); // For Vitals Modal
    const [modalVitals, setModalVitals] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVitalId, setEditingVitalId] = useState(null); // New: Track which vital is being edited

    const [detailsModalData, setDetailsModalData] = useState(null); // For Patient Details Modal

    // New Vital Form State
    const [vitalForm, setVitalForm] = useState({
        bp_systolic: '',
        bp_diastolic: '',
        pulse: '',
        temperature: '',
        spo2: '',
        respiratory_rate: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Helper to check for critical vitals
    const isCritical = (type, val, val2 = null) => {
        if (!val) return false;
        const num = parseFloat(val);
        const num2 = val2 ? parseFloat(val2) : null;

        switch (type) {
            case 'BP': // val=systolic, val2=diastolic
                if (!num2) return false;
                // Low: Sys < 90 OR Dia < 60
                // High: Sys >= 180 OR Dia >= 120
                return (num < 90 || num2 < 60 || num >= 180 || num2 >= 120);
            case 'HR':
                // Low < 40, High > 130
                return (num < 40 || num > 130);
            case 'TEMP':
                // Assuming stored in F per display label. 
                // Critical Low < 35C (95F), Critical High >= 40C (104F)
                return (num < 95 || num >= 104);
            case 'SPO2':
                // Low < 90
                return (num < 90);
            default:
                return false;
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const visitsRes = await visitAPI.getAll({ status: 'ACTIVE' });
            const visits = Array.isArray(visitsRes.data) ? visitsRes.data : [];
            setTotalAssigned(visits.length);

            // Use local date ensuring YYYY-MM-DD format
            const d = new Date();
            const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const categories = { today: [], upcoming: [], past: [] };
            let completedCount = 0;

            visits.forEach(v => {
                const visitDate = v.visit_date;

                const patientObj = {
                    id: v.id,
                    patientId: v.patient?.id,
                    name: v.patient?.name || `Patient #${v.patient}`,
                    room: v.bed || 'N/A',
                    status: v.has_vitals_today ? 'completed' : 'pending',
                    hasVitals: v.has_vitals_today,
                    lastVitals: 'N/A',
                    visit_type: v.visit_type,
                    visit_date: visitDate
                };

                if (v.has_vitals_today) completedCount++;

                if (visitDate === todayStr) {
                    categories.today.push(patientObj);
                } else if (visitDate > todayStr) {
                    categories.upcoming.push(patientObj);
                } else {
                    categories.past.push(patientObj);
                }
            });

            setVisitsByCategory(categories);
            // We can update stats in render or state, but here is fine if we used state. 
            // Better to drive stats from the processed lists in render to avoid double state.
            // But stats structure is currently static derived.

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenVitals = async (visitId, patientName, patientId) => {
        setIsModalOpen(true);
        setSelectedVisit({ id: visitId, name: patientName, patientId: patientId });
        setEditingVitalId(null);
        setModalVitals([]);
        setVitalForm({
            bp_systolic: '',
            bp_diastolic: '',
            pulse: '',
            temperature: '',
            spo2: '',
            respiratory_rate: ''
        });

        try {
            // Fetch ALL vitals for this patient to show history
            // We need to pass patientId. If not passed to function (legacy call?), fallback to just visit fetch? 
            // Ideally we need patientId. The lists have it.

            let vitals = [];
            if (patientId) {
                const res = await vitalAPI.getAll({ patient: patientId });
                vitals = Array.isArray(res.data) ? res.data : [];
            } else {
                // Fallback if no patientId (shouldn't happen with updated calls)
                const res = await vitalAPI.getAll({ visit: visitId });
                vitals = Array.isArray(res.data) ? res.data : [];
            }

            // Sort by date desc
            vitals.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
            setModalVitals(vitals);

            // Check if there is a vital for the CURRENT visit
            const currentVisitVital = vitals.find(v => v.visit === visitId);

            if (currentVisitVital) {
                startEdit(currentVisitVital);
            }
        } catch (err) {
            console.error("Failed to load vitals", err);
        }
    };

    const startEdit = (vital) => {
        setEditingVitalId(vital.id);
        setVitalForm({
            bp_systolic: vital.bp_systolic,
            bp_diastolic: vital.bp_diastolic,
            pulse: vital.pulse,
            temperature: vital.temperature,
            spo2: vital.spo2,
        });
    };

    // cancelEdit is no longer needed in UI as we force Edit mode if data exists, and close on save.
    // Keeping function structure if needed internally but logic acts different.
    const cancelEdit = () => {
        setEditingVitalId(null);
        setVitalForm({
            bp_systolic: '',
            bp_diastolic: '',
            pulse: '',
            temperature: '',
            spo2: '',
        });
    };

    const handleVitalSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVisit) return;

        try {
            const payload = {
                visit: selectedVisit.id,
                bp_systolic: parseInt(vitalForm.bp_systolic),
                bp_diastolic: parseInt(vitalForm.bp_diastolic),
                pulse: parseInt(vitalForm.pulse),
                temperature: parseFloat(vitalForm.temperature),
                spo2: parseInt(vitalForm.spo2),
            };

            if (editingVitalId) {
                // UPDATE existing vital
                await vitalAPI.update(editingVitalId, payload);
            } else {
                // CREATE new vital
                await vitalAPI.create(payload);
            }

            // Refresh dashboard and close modal
            fetchDashboardData();
            setIsModalOpen(false);

        } catch (err) {
            console.error("Failed to save vital", err);
            alert("Failed to save vitals. Please check inputs.");
        }
    };

    // We can also implement "Edit" by populating form and using Update. 
    // For simplicity given constraints, I'll support Adding New. Real editing implies selecting a row.
    // I will add a "Delete" or "Edit" button on the Vitals List inside Modal later if needed.

    // Derived stats
    const allVisits = [...visitsByCategory.today, ...visitsByCategory.upcoming, ...visitsByCategory.past];
    const completedCount = allVisits.filter(p => p.hasVitals).length;

    const stats = {
        assignedPatients: totalAssigned,
        vitalsCompleted: completedCount,
        pendingVitals: totalAssigned - completedCount,
        careNotes: 0
    };

    const renderPatientCard = (patient) => (
        <div key={patient.id} className={`border ${patient.hasVitals ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'} rounded-lg p-5 hover:shadow-sm transition-all mb-3`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${patient.hasVitals ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                        {patient.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            {patient.name}
                            {patient.hasVitals && <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Completed</span>}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {patient.visit_type} • Room {patient.room} • <span className="text-gray-400">Date: {patient.visit_date || 'N/A'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleOpenVitals(patient.id, patient.name, patient.patientId)}
                        className={`btn-medical-secondary px-3 py-2 font-semibold text-sm rounded-lg transition-colors ${patient.hasVitals ? 'bg-white border border-green-200 text-green-600 hover:bg-green-50' : ''}`}
                    >
                        {patient.hasVitals ? 'View / Edit' : 'Record Vitals'}
                    </button>
                    <button
                        onClick={() => {
                            setDetailsModalData({
                                id: patient.id,
                                name: patient.name,
                                patientData: {
                                    id: patient.patientId,
                                }
                            });
                        }}
                        className="btn-medical-primary px-3 py-2 font-semibold text-sm rounded-lg"
                    >
                        Add Progress Notes
                    </button>
                </div>
            </div>
        </div>
    );

    const renderListSection = (title, patients, emptyMsg) => {
        const remaining = patients.filter(p => !p.hasVitals);
        const completed = patients.filter(p => p.hasVitals);

        return (
            <div className="card-medical p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-900">{title} <span className="text-gray-400 text-sm font-normal">({patients.length})</span></h2>
                </div>

                {loading ? (
                    <div className="text-center py-6">Loading...</div>
                ) : patients.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400 italic text-sm">{emptyMsg}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Remaining Subsection */}
                        {remaining.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Remaining ({remaining.length})
                                </h3>
                                <div className="space-y-3">
                                    {remaining.map(renderPatientCard)}
                                </div>
                            </div>
                        )}

                        {/* Completed Subsection */}
                        {completed.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Completed ({completed.length})
                                </h3>
                                <div className="space-y-3">
                                    {completed.map(renderPatientCard)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 medical-theme">
            <Sidebar role="nurse" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Nurse'} userRole="Nurse" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="card-medical p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center p-2">
                                        <img src="/icons/nurse.png" alt="Nurse" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Nurse Dashboard</h1>
                                        <p className="text-sm text-gray-600 mt-1">Manage active patients and record vitals</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 font-medium uppercase">Today</p>
                                    <p className="text-sm font-semibold text-gray-900">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats - Simplified */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="card-medical p-6 border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Active Patients</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.assignedPatients}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            {/* Additional stats cards can be added here */}
                        </div>

                        {/* Lists Sections */}
                        <div className="space-y-6">
                            {renderListSection("Today's Active Visits", visitsByCategory.today, "No active visits scheduled for today.")}
                            {renderListSection("Upcoming Visits", visitsByCategory.upcoming, "No upcoming visits found.")}
                            {renderListSection("Past Active Visits", visitsByCategory.past, "No past active visits found.")}
                        </div>
                    </div>
                </main>
            </div>

            {/* Vitals Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Patient Vitals</h2>
                                <p className="text-sm text-gray-500">Manage vitals for {selectedVisit?.name}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Add New Vital Form */}
                            <form onSubmit={handleVitalSubmit} className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">
                                    {editingVitalId ? 'Edit Vitals' : 'Record New Vitals'}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 block mb-1">BP Systolic</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300"
                                            value={vitalForm.bp_systolic}
                                            onChange={e => setVitalForm({ ...vitalForm, bp_systolic: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 block mb-1">BP Diastolic</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300"
                                            value={vitalForm.bp_diastolic}
                                            onChange={e => setVitalForm({ ...vitalForm, bp_diastolic: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 block mb-1">Pulse (bpm)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300"
                                            value={vitalForm.pulse}
                                            onChange={e => setVitalForm({ ...vitalForm, pulse: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 block mb-1">Temp (°F)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300"
                                            value={vitalForm.temperature}
                                            onChange={e => setVitalForm({ ...vitalForm, temperature: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 block mb-1">SpO2 (%)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300"
                                            value={vitalForm.spo2}
                                            onChange={e => setVitalForm({ ...vitalForm, spo2: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-4">
                                    <button type="submit" className={`btn-medical-secondary px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${editingVitalId ? 'btn-medical-primary' : ''}`}>
                                        {editingVitalId ? 'Update Vitals' : 'Save Vitals'}
                                    </button>
                                </div>
                            </form>

                            {/* History */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Patient Vitals History</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {modalVitals.map(v => (
                                        <div key={v.id} className={`flex items-center justify-between p-3 border rounded-lg ${v.visit === selectedVisit?.id ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                            <div>
                                                <div className="text-sm font-bold text-gray-800">
                                                    BP: <span className={isCritical('BP', v.bp_systolic, v.bp_diastolic) ? 'text-red-600 font-extrabold' : ''}>{v.bp_systolic}/{v.bp_diastolic}</span> •
                                                    HR: <span className={isCritical('HR', v.pulse) ? 'text-red-600 font-extrabold' : ''}>{v.pulse}</span> •
                                                    SpO2: <span className={isCritical('SPO2', v.spo2) ? 'text-red-600 font-extrabold' : ''}>{v.spo2}%</span> •
                                                    Temp: <span className={isCritical('TEMP', v.temperature) ? 'text-red-600 font-extrabold' : ''}>{v.temperature}°F</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Recorded at {new Date(v.recorded_at).toLocaleString()}
                                                    {v.visit === selectedVisit?.id && <span className="font-semibold text-emerald-600 ml-1">(Current Visit)</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {modalVitals.length === 0 && <p className="text-sm text-gray-400">No vitals recorded yet.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Patient Details Modal */}
            {detailsModalData && (
                <PatientDetailsModal
                    patient={detailsModalData}
                    initialTab="progress_notes"
                    onClose={() => setDetailsModalData(null)}
                />
            )}
        </div>
    );
}
