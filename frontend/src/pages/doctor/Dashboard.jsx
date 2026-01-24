import { useState, useEffect } from 'react';
import { visitAPI, admissionAPI, bedAPI } from '../../services/api';
import PatientDetailsModal from './PatientDetailsModal';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function DoctorDashboard() {
    const [stats, setStats] = useState({
        todayAppointments: 0,
        pendingConsultations: 0,
        completedToday: 0,
        totalPatients: 0
    });

    const [selectedPatient, setSelectedPatient] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Data States
    const [visits, setVisits] = useState([]);
    const [admissions, setAdmissions] = useState([]);
    const [beds, setBeds] = useState([]);
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        const fetchData = async () => {
            try {
                const [visitsRes, admissionsRes, bedsRes] = await Promise.all([
                    visitAPI.getAll(),
                    admissionAPI.getAll(),
                    bedAPI.getAll()
                ]);
                setVisits(Array.isArray(visitsRes.data) ? visitsRes.data : []);
                setAdmissions(Array.isArray(admissionsRes.data) ? admissionsRes.data : []);
                setBeds(Array.isArray(bedsRes.data) ? bedsRes.data : []);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);

                // Calculate Stats
                if (visitsRes && Array.isArray(visitsRes.data)) {
                    // Use local date for stats
                    const d = new Date();
                    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    const todayVisits = visitsRes.data.filter(v => v.visit_date === today);

                    setStats({
                        todayAppointments: todayVisits.length,
                        pendingConsultations: todayVisits.filter(v => ['ACTIVE', 'ON_HOLD', 'ON_HOLD'].includes(v.status) || v.status === 'ORDERED').length, // Assuming ACTIVE/ON_HOLD are pending
                        completedToday: todayVisits.filter(v => v.status === 'COMPLETED').length,
                        totalPatients: new Set(visitsRes.data.map(v => v.patient?.id || v.patient)).size
                    });
                }
            }
        };
        fetchData();
    }, []);

    // Derived Data
    // Filter for Today
    const d = new Date();
    const todayDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const opdPatients = visits.filter(v => v.visit_type === 'OPD' && v.visit_date === todayDate).map(v => ({
        id: v.id,
        name: v.patient?.name || `Patient #${v.patient}`,
        date: v.visit_date ? new Date(v.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        time: v.slot_booked || 'Not Scheduled',
        status: (v.status || 'active').toLowerCase(),
        complaint: "Routine Checkup",
        patientData: v.patient,
        availableSlots: v.doctor?.available_slots || []
    }));

    const emergencyPatients = visits.filter(v => v.visit_type === 'EMERGENCY' && v.status === 'ACTIVE' && v.visit_date === todayDate).map(v => ({
        id: v.id,
        name: v.patient?.name || `Patient #${v.patient}`,
        arrival: v.created_at ? new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        complaint: "Emergency",
        urgency: "critical",
        vitals: "Monitor Vitals",
        patientData: v.patient,
        color_coding: v.color_coding
    }));

    // Helper to find bed for IPD visit
    const getBedForVisit = (visitId) => {
        if (!admissions) return 'Unassigned';
        const admission = admissions.find(a => a.visit === visitId);
        if (admission && admission.bed) {
            const bed = beds?.find(b => b.bed_id === admission.bed);
            return bed ? `${bed.ward}-${bed.bed_number}` : 'Assigned';
        }
        return 'Unassigned';
    };

    const ipdCurrent = visits.filter(v => v.visit_type === 'IPD' && v.status === 'ACTIVE' && v.visit_date === todayDate).map(v => ({
        id: v.id,
        name: v.patient?.name || `Patient #${v.patient}`,
        bed: getBedForVisit(v.id),
        admitted: v.visit_date ? new Date(v.visit_date).toLocaleDateString() : 'N/A',
        diagnosis: "Under Observation",
        severity: "stable",
        patientData: v.patient
    }));

    // Handle status change
    const handleStatusChange = async (visitId, newStatus) => {
        try {
            // Normalize status to backend expected format (e.g. on-hold -> ON_HOLD)
            const formattedStatus = newStatus.replace('-', '_').toUpperCase();
            await visitAPI.update(visitId, { status: formattedStatus });
            // Refresh visits to show updated status
            const visitsRes = await visitAPI.getAll();
            setVisits(Array.isArray(visitsRes.data) ? visitsRes.data : []);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status. Please try again.');
        }
    };

    // Handle slot change (Reschedule)
    const handleSlotChange = async (visitId, newSlot) => {
        try {
            await visitAPI.update(visitId, { slot_booked: newSlot });
            const visitsRes = await visitAPI.getAll();
            setVisits(Array.isArray(visitsRes.data) ? visitsRes.data : []);
            alert('Appointment rescheduled successfully');
        } catch (error) {
            console.error('Error updating slot:', error);
            alert(error.response?.data?.slot_booked?.[0] || 'Failed to reschedule. Slot might be taken.');
        }
    };

    const handleColorCodingChange = async (visitId, newColor) => {
        try {
            await visitAPI.update(visitId, { color_coding: newColor });
            const visitsRes = await visitAPI.getAll();
            setVisits(Array.isArray(visitsRes.data) ? visitsRes.data : []);
        } catch (error) {
            console.error('Error updating color coding:', error);
            alert('Failed to update color coding.');
        }
    };

    // Update stats based on real data
    useEffect(() => {
        if (!loading) {
            const today = new Date().toDateString();
            const todayVisits = visits.filter(v => v.visit_date && new Date(v.visit_date).toDateString() === today);

            setStats({
                todayAppointments: todayVisits.length,
                pendingConsultations: visits.filter(v => v.status === 'ACTIVE').length,
                completedToday: todayVisits.filter(v => v.status === 'COMPLETED').length,
                totalPatients: new Set(visits.map(v => v.patient?.id || v.patient)).size
            });
        }
    }, [visits, loading]);


    const getStatusBadge = (status) => {
        if (!status) return "bg-gray-100 text-gray-700";
        const badges = {
            active: "bg-blue-100 text-blue-700",
            waiting: "bg-amber-100 text-amber-700",
            "in-progress": "bg-blue-100 text-blue-700",
            "on-hold": "bg-orange-100 text-orange-700",
            completed: "bg-green-100 text-green-700",
            cancelled: "bg-red-100 text-red-700",
            processing: "bg-blue-100 text-blue-700",
            ready: "bg-green-100 text-green-700",
            pending: "bg-amber-100 text-amber-700",
            scheduled: "bg-purple-100 text-purple-700",
            critical: "bg-red-100 text-red-700",
            high: "bg-orange-100 text-orange-700",
            medium: "bg-yellow-100 text-yellow-700",
            stable: "bg-green-100 text-green-700",
            moderate: "bg-amber-100 text-amber-700",
        };
        return badges[status.toLowerCase()] || "bg-gray-100 text-gray-700";
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            <Sidebar role="doctor" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Dr. Smith'} userRole="Doctor" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <img
                                            src="/icons/doctor.png"
                                            alt="Doctor"
                                            className="w-10 h-10 object-contain"
                                        />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
                                        <p className="text-sm text-gray-600 mt-1">Manage your patients and consultations</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Today</p>
                                    <p className="text-base font-semibold text-gray-900">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-emerald-100 p-6 transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Today's Appointments</p>
                                        <p className="text-4xl font-bold text-gray-900">{stats.todayAppointments}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-amber-100 p-6 transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pending Consultations</p>
                                        <p className="text-4xl font-bold text-gray-900">{stats.pendingConsultations}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-green-100 p-6 transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Completed Today</p>
                                        <p className="text-4xl font-bold text-gray-900">{stats.completedToday}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-blue-100 p-6 transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Total Patients</p>
                                        <p className="text-4xl font-bold text-gray-900">{stats.totalPatients}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Patients */}
                        {emergencyPatients.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md border-l-4 border-red-500 p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-11 h-11 bg-red-50 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-red-900">Emergency Patients</h2>
                                </div>
                                <div className="space-y-3">
                                    {emergencyPatients.map(patient => (
                                        <div key={patient.id} className="p-4 bg-red-50 rounded-lg flex items-center justify-between border border-red-100 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setSelectedPatient(patient)}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full animate-pulse ${patient.color_coding === 'RED' ? 'bg-red-600' :
                                                    patient.color_coding === 'ORANGE' ? 'bg-orange-500' :
                                                        patient.color_coding === 'YELLOW' ? 'bg-yellow-400' :
                                                            patient.color_coding === 'GREEN' ? 'bg-green-500' :
                                                                patient.color_coding === 'BLACK' ? 'bg-black' : 'bg-gray-400'
                                                    }`}></div>
                                                <div>
                                                    <p className="text-base font-bold text-red-900">{patient.name}</p>
                                                    <p className="text-sm text-red-700">{patient.complaint} • {patient.vitals}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        value={patient.color_coding || ""}
                                                        onChange={(e) => handleColorCodingChange(patient.id, e.target.value)}
                                                        className="px-2 py-1 text-sm rounded border border-red-200 text-red-800 focus:outline-none focus:border-red-500 bg-white"
                                                    >
                                                        <option value="">Color Code</option>
                                                        <option value="RED">Red</option>
                                                        <option value="ORANGE">Orange</option>
                                                        <option value="YELLOW">Yellow</option>
                                                        <option value="GREEN">Green</option>
                                                        <option value="BLACK">Black</option>
                                                    </select>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(patient.urgency)}`}>
                                                        {patient.urgency.toUpperCase()}
                                                    </span>
                                                    <p className="text-xs text-red-600 mt-1">{patient.arrival}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* OPD Patients */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-5">Today's OPD Patients</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Patient Name</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {opdPatients.map(patient => (
                                            <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4 font-medium text-gray-900">{patient.name}</td>
                                                <td className="py-4 px-4 text-gray-600">{patient.date}</td>
                                                <td className="py-4 px-4 text-gray-600">
                                                    <select
                                                        value={patient.time}
                                                        onChange={(e) => handleSlotChange(patient.id, e.target.value)}
                                                        className="px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:border-emerald-500"
                                                    >
                                                        <option value={patient.time}>{patient.time}</option>
                                                        {patient.availableSlots.filter(s => s !== patient.time).map(slot => (
                                                            <option key={slot} value={slot}>{slot}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <select
                                                        value={patient.status.toLowerCase()}
                                                        onChange={(e) => handleStatusChange(patient.id, e.target.value)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all ${getStatusBadge(patient.status)} border-transparent`}
                                                        style={{
                                                            backgroundColor: patient.status === 'active' ? '#DBEAFE' :
                                                                patient.status === 'on-hold' ? '#FED7AA' :
                                                                    patient.status === 'cancelled' ? '#FECACA' :
                                                                        patient.status === 'completed' ? '#D1FAE5' : '#F3F4F6',
                                                            color: patient.status === 'active' ? '#1E40AF' :
                                                                patient.status === 'on-hold' ? '#C2410C' :
                                                                    patient.status === 'cancelled' ? '#B91C1C' :
                                                                        patient.status === 'completed' ? '#047857' : '#6B7280'
                                                        }}
                                                    >
                                                        <option value="active" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>● ACTIVE</option>
                                                        <option value="on-hold" style={{ backgroundColor: '#FED7AA', color: '#C2410C' }}>● ON HOLD</option>
                                                        <option value="cancelled" style={{ backgroundColor: '#FECACA', color: '#B91C1C' }}>● CANCELLED</option>
                                                        <option value="completed" style={{ backgroundColor: '#D1FAE5', color: '#047857' }}>● COMPLETED</option>
                                                    </select>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <button onClick={() => setSelectedPatient(patient)} className="px-4 py-1.5 text-sm bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors">
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {opdPatients.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="py-4 text-center text-gray-500">No OPD Patients Found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* IPD Patients */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Current IPD */}
                            <div className="bg-white rounded-xl shadow-md border border-teal-100 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-5">Current IPD Patients</h2>
                                <div className="space-y-3">
                                    {ipdCurrent.map(patient => (
                                        <div key={patient.id} className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedPatient(patient)}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{patient.name}</p>
                                                    <p className="text-sm text-gray-600">Bed: {patient.bed}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(patient.severity)}`}>
                                                    {patient.severity.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-2">{patient.diagnosis}</p>
                                            <p className="text-xs text-gray-500 mt-1">Admitted: {patient.admitted}</p>
                                        </div>
                                    ))}
                                    {ipdCurrent.length === 0 && <p className="text-gray-500 text-center">No IPD Patients</p>}
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            {/* Patient Details Modal */}
            {selectedPatient && (
                <PatientDetailsModal
                    patient={selectedPatient}
                    onClose={() => setSelectedPatient(null)}
                />
            )}

        </div >
    );
}
