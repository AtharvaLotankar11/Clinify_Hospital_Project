import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { operationAPI, staffAPI, patientAPI, visitAPI, doctorAPI, bedAPI } from '../../services/api';

export default function OTDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [operations, setOperations] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [otRooms, setOtRooms] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        patient_id: '', // We need to lookup patient
        operation_name: '',
        surgeon_id: '',
        ot_room: '',
        scheduled_time: '',
        price: 0 // Default price
    });
    const [patientPhone, setPatientPhone] = useState('');
    const [foundPatient, setFoundPatient] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [opsRes, staffRes, bedsRes] = await Promise.all([
                operationAPI.getAll(),
                staffAPI.getAll(),
                bedAPI.getAll()
            ]);
            setOperations(opsRes.data);

            // Filter Beds for OT Rooms
            const rooms = bedsRes.data.filter(b => b.bed_type === 'OT');
            setOtRooms(rooms);
            // Robust client-side filtering
            const allDoctors = staffRes.data.filter(s => s.role?.toUpperCase() === 'DOCTOR');
            console.log("Doctors found:", allDoctors.length, "Total staff:", staffRes.data.length);
            setDoctors(allDoctors);
        } catch (error) {
            console.error("Failed to load OT data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFindPatient = async () => {
        if (!patientPhone) return;
        try {
            // Backend handles search by Phone, Name, or ID via ?search= param
            const res = await patientAPI.getAll({ search: patientPhone });

            // Trust the backend result. If we get data, take the first match.
            const match = res.data.length > 0 ? res.data[0] : null;

            if (match) {
                setFoundPatient(match);
                setFormData({ ...formData, patient_id: match.id });
                // Optional: show a small toast or log
                console.log("Found patient:", match.name);
            } else {
                alert('Patient not found. Try exact phone or Full Name.');
                setFoundPatient(null);
            }
        } catch (err) {
            console.error(err);
            alert('Error searching patient');
        }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            if (!formData.patient_id && !foundPatient) {
                alert("Please find a patient first (search by phone)");
                return;
            }

            const patientId = formData.patient_id || foundPatient?.id;
            const today = new Date().toISOString().split('T')[0];

            // 1. Get or Create Active Visit
            let visitId = null;
            const visitRes = await visitAPI.getAll({ patient: patientId, date: today });
            const activeVisit = visitRes.data.find(v => v.status === 'ACTIVE' || v.status === 'ADMITTED');

            if (activeVisit) {
                visitId = activeVisit.id;
            } else {
                if (!confirm("No active visit found. Create new Emergency Outcome visit?")) return;
                const newVisit = await visitAPI.create({
                    patient_id: patientId,
                    doctor_id: formData.surgeon_id || user.user_id,
                    visit_type: 'EMERGENCY',
                    visit_date: today,
                    status: 'ACTIVE',
                    chief_complaint: 'Surgery Admission'
                });
                visitId = newVisit.data.id;
            }

            // 2. Create Order
            const payload = {
                visit: visitId,
                doctor_id: formData.surgeon_id,
                order_type: 'OPERATION',
                details: {
                    operation_name: formData.operation_name,
                    scheduled_time: formData.scheduled_time,
                    ot_room: formData.ot_room,
                    price: parseFloat(formData.price) || 0
                }
            };

            await doctorAPI.createOrder(payload);

            alert("Surgery Scheduled Successfully! ✅");
            setShowScheduleModal(false);
            fetchData();

        } catch (err) {
            console.error('Full error object:', err);
            console.error('Error response data:', err.response?.data);

            let msg = 'Unknown error occurred';

            if (err.response?.data) {
                const data = err.response.data;

                // Try to extract error message in various DRF formats
                if (typeof data === 'string') {
                    msg = data;
                } else if (data.detail) {
                    msg = data.detail;
                } else if (data.non_field_errors) {
                    msg = Array.isArray(data.non_field_errors)
                        ? data.non_field_errors.join('\n')
                        : data.non_field_errors;
                } else if (Array.isArray(data)) {
                    msg = data[0] || JSON.stringify(data);
                } else if (typeof data === 'object') {
                    // Get first error from any field
                    const firstKey = Object.keys(data)[0];
                    const firstError = data[firstKey];
                    msg = Array.isArray(firstError) ? firstError[0] : firstError;
                }
            } else if (err.message) {
                msg = err.message;
            }

            alert("❌ Surgery Scheduling Failed\n\n" + msg);
        }
    };

    // Placeholder data for UI dev
    const mockOps = [
        { id: 1, operation_name: 'Appendectomy', patient_name: 'John Doe', surgeon_name: 'Dr. Smith', status: 'SCHEDULED', scheduled_time: '2025-10-24T10:00:00Z', ot_room: 'OT-1' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar role={user.role?.toLowerCase() || 'reception'} />
            <div className="ml-72">
                <Header userName={user.name} userRole={user.role} />
                <main className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Operation Theater Schedule</h1>
                        <button
                            onClick={() => setShowScheduleModal(true)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                            + Schedule Surgery
                        </button>
                    </div>

                    {/* Calendar/List View */}
                    {/* Calendar/List View - Premium Grid */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h2 className="font-bold text-gray-700">Today's Schedule</h2>
                            <span className="text-sm text-gray-500">{operations.length} Surgeries scheduled</span>
                        </div>

                        <div className="p-6">
                            {operations.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    </div>
                                    <p className="text-gray-500 font-medium">No surgeries scheduled yet.</p>
                                    <p className="text-sm text-gray-400 mt-1">Use the button above to book a slot.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {operations.map(op => (
                                        <div key={op.operation_id} className="group flex items-center justify-between p-5 bg-white border border-gray-100 rounded-xl hover:shadow-lg hover:border-emerald-100 transition-all duration-300">
                                            <div className="flex items-start gap-5">
                                                {/* Time Badge */}
                                                <div className="flex flex-col items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-700 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                                    <span className="text-lg font-bold">
                                                        {op.scheduled_time ? new Date(op.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                                                    </span>
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider">Time</span>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded uppercase tracking-wide border border-gray-200">
                                                            {op.ot_room || 'No Room'}
                                                        </span>
                                                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${op.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100' :
                                                            op.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                'bg-blue-50 text-blue-700 border-blue-100'
                                                            }`}>
                                                            {op.status}
                                                        </span>
                                                    </div>

                                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">
                                                        {op.operation_name}
                                                    </h3>

                                                    <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                                            <span>{op.patient_name || 'Unknown Patient'}</span>
                                                        </div>
                                                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                                        <div className="flex items-center gap-1 text-emerald-600">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                                            <span className="font-medium">{op.doctor_name || 'Unassigned'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                className="flex items-center gap-2 px-4 py-2 text-emerald-600 bg-emerald-50 rounded-lg font-semibold hover:bg-emerald-600 hover:text-white transition-all transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                                                onClick={() => navigate(`/ot/surgery/${op.operation_id}`)}
                                            >
                                                <span>Console</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                                            </button>
                                        </div>
                                    ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Simplified Modal just for visual now - logic needs Visit ID */}
                {/* Modernized Modal */}
                {showScheduleModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
                                <h2 className="text-xl font-bold text-white tracking-wide">Schedule Surgery</h2>
                                <p className="text-emerald-100 text-sm mt-1">Book a new operation slot</p>
                            </div>

                            <form onSubmit={handleSchedule} className="p-6 space-y-5">
                                {/* Patient Search */}
                                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Find Patient</label>
                                    <div className="flex gap-2 relative">
                                        <input
                                            type="text"
                                            className="flex-1 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm shadow-sm"
                                            placeholder="Search by Name, Phone, or UHID..."
                                            value={patientPhone}
                                            onChange={e => setPatientPhone(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleFindPatient}
                                            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition w-auto"
                                        >
                                            Search
                                        </button>
                                    </div>
                                    {foundPatient && (
                                        <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 bg-white p-2 rounded-lg border border-emerald-100 shadow-sm animate-fadeIn">
                                            <span className="bg-emerald-100 p-1 rounded-full">✅</span>
                                            <div>
                                                <span className="font-bold">{foundPatient.name}</span>
                                                <span className="text-emerald-600 mx-1">•</span>
                                                <span>Age: {foundPatient.age}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Operation Details */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Operation Name</label>
                                    <input
                                        className="w-full border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-sm"
                                        type="text"
                                        required
                                        placeholder="e.g. Laparoscopic Appendectomy"
                                        value={formData.operation_name}
                                        onChange={e => setFormData({ ...formData, operation_name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Surgeon</label>
                                    <div className="relative">
                                        <select
                                            className="w-full border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-sm appearance-none bg-white"
                                            value={formData.surgeon_id}
                                            onChange={e => setFormData({ ...formData, surgeon_id: e.target.value })}
                                        >
                                            <option value="">Select Lead Surgeon...</option>
                                            {doctors.map(d => <option key={d.user_id} value={d.user_id}>{d.name} ({d.department || 'Surgery'})</option>)}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-sm text-gray-600"
                                            value={formData.scheduled_time}
                                            onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">OT Room</label>
                                        <div className="relative">
                                            <select
                                                className="w-full border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-sm appearance-none bg-white"
                                                value={formData.ot_room}
                                                onChange={e => setFormData({ ...formData, ot_room: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Room</option>
                                                {otRooms.length > 0 ? (
                                                    otRooms.map(room => (
                                                        <option key={room.bed_id} value={`OT-${room.bed_number}`}>
                                                            OT-{room.bed_number} (Ward {room.ward})
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option disabled>No OT Rooms Available</option>
                                                )}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Surgery Cost (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-sm"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                {/* Footer Actions */}
                                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 mt-2">
                                    <button
                                        onClick={() => setShowScheduleModal(false)}
                                        type="button"
                                        className="px-5 py-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/30 font-medium transition-all transform hover:-translate-y-0.5 text-sm"
                                    >
                                        Confirm Schedule
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
