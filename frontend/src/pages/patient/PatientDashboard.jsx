import { useState, useEffect } from 'react';
import { patientDashboardAPI, visitAPI, patientAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function PatientDashboard({ initialTab = 'overview' }) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        visits: 0,
        prescriptions: 0,
        labReports: 0,
        bills: 0
    });

    // Data States
    const [visits, setVisits] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [labTests, setLabTests] = useState([]);
    const [vitals, setVitals] = useState([]);
    const [notes, setNotes] = useState([]);
    const [operations, setOperations] = useState([]);
    const [bills, setBills] = useState([]);
    const [doctors, setDoctors] = useState([]);

    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    // Appointment Booking State
    const [bookingMode, setBookingMode] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [isAutoBook, setIsAutoBook] = useState(false);
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [severity, setSeverity] = useState('NORMAL');


    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData();
        }
    }, [user.id]);

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            fetchSlots();
        }
    }, [selectedDoctor, selectedDate]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                patientDashboardAPI.getProfile(user.id),
                patientDashboardAPI.getVisits(user.id),
                patientDashboardAPI.getPrescriptions(user.id),
                patientDashboardAPI.getLabTests(user.id),
                patientDashboardAPI.getVitals(user.id),
                patientDashboardAPI.getClinicalNotes(user.id),
                patientDashboardAPI.getOperations(user.id),
                patientDashboardAPI.getBills(user.id),
                patientDashboardAPI.getDoctors()
            ]);

            // Helper to get data or empty array
            const getData = (index, defaultVal = []) =>
                results[index].status === 'fulfilled' ? results[index].value.data : defaultVal;

            setProfile(getData(0, null));
            setVisits(getData(1));
            setPrescriptions(getData(2));
            setLabTests(getData(3));
            setVitals(getData(4));
            setNotes(getData(5));
            setOperations(getData(6));
            setBills(getData(7));
            setDoctors(getData(8));

            setStats({
                visits: getData(1).length,
                prescriptions: getData(2).length,
                labReports: getData(3).length,
                bills: getData(7).filter(b => b.status !== 'PAID').length
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSlots = async () => {
        try {
            const res = await visitAPI.getBookedSlots(selectedDoctor.user_id, selectedDate);
            const booked = res.data;
            const allPossibleSlots = selectedDoctor.available_slots || [];
            const available = allPossibleSlots.filter(s => !booked.includes(s));
            setAvailableSlots(available);
        } catch (err) {
            console.error("Error fetching slots:", err);
        }
    };

    const handleCreateAppointment = async () => {
        if (!selectedDoctor || !selectedSlot) return;
        setBookingLoading(true);
        try {
            await visitAPI.create({
                patient_id: user.id,
                doctor_id: selectedDoctor.user_id,
                visit_date: selectedDate,
                slot_booked: selectedSlot,
                visit_type: 'OPD',
                status: 'ACTIVE',
                chief_complaint: 'Patient Self-Booking'
            });
            alert("Appointment Booked Successfully!");
            setBookingMode(false);
            fetchDashboardData();
        } catch (err) {
            alert("Failed to book appointment: " + (err.response?.data?.detail || "Unknown error"));
        } finally {
            setBookingLoading(false);
        }
    };

    const handleAutoBook = async () => {
        if (!chiefComplaint) return alert("Please explain your symptoms");
        setBookingLoading(true);
        try {
            const res = await visitAPI.autoBook({
                patient_id: user.id,
                chief_complaint: chiefComplaint,
                severity: severity
            });
            const d = res.data;
            alert(`Appointment Booked!\nDr. ${d.doctor} (${d.specialization})\nTime: ${d.date} ${d.time}\nReason: ${d.ai_reasoning}`);
            setBookingMode(false);
            fetchDashboardData();
        } catch (e) {
            alert("Failed: " + (e.response?.data?.error || e.message));
        } finally {
            setBookingLoading(false);
        }
    };

    const handleDownloadBill = async (billId) => {
        try {
            const response = await patientDashboardAPI.downloadBill(billId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Bill_${billId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download bill.');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading portal...</div>;

    const getStatusBadge = (status) => {
        const badges = {
            completed: "bg-green-100 text-green-700",
            active: "bg-blue-100 text-blue-700",
            cancelled: "bg-red-100 text-red-700",
            pending: "bg-amber-100 text-amber-700",
            paid: "bg-emerald-100 text-emerald-700",
            unpaid: "bg-rose-100 text-rose-700",
        };
        return badges[status?.toLowerCase()] || "bg-gray-100 text-gray-700";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 medical-theme">
            <Sidebar role="patient" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={profile?.name || 'Patient'} userRole="Patient" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* Header Card */}
                        <div className="card-medical p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-2xl">
                                        👤
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
                                        <p className="text-sm text-gray-600 mt-1">UHID: {profile?.uhid} • {profile?.gender}, {profile?.age} Years</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await patientAPI.exportEHR(user.id);
                                                const blob = new Blob([response.data], { type: 'application/pdf' });
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `My_Medical_Records_${profile?.uhid}_${new Date().toISOString().split('T')[0]}.pdf`;
                                                document.body.appendChild(a);
                                                a.click();
                                                window.URL.revokeObjectURL(url);
                                                document.body.removeChild(a);
                                            } catch (error) {
                                                console.error('Export failed:', error);
                                                alert('Failed to download medical records. Please try again.');
                                            }
                                        }}
                                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Export My Records
                                    </button>
                                    <button
                                        onClick={() => setBookingMode(!bookingMode)}
                                        className="px-6 py-2 btn-medical-primary font-bold rounded-lg transition-colors shadow-sm"
                                    >
                                        {bookingMode ? 'View Dashboard' : 'Book Appointment +'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {bookingMode ? (
                            <div className="bg-white rounded-xl shadow-md border border-emerald-100 p-8 animate-fadeIn">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Schedule Appointment</h2>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button onClick={() => setIsAutoBook(false)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${!isAutoBook ? 'bg-white shadow text-emerald-700' : 'text-gray-500'}`}>Manual Select</button>
                                        <button onClick={() => setIsAutoBook(true)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${isAutoBook ? 'bg-white shadow text-purple-700' : 'text-gray-500'}`}>🤖 AI Match</button>
                                    </div>
                                </div>
                                {isAutoBook ? (
                                    <div className="max-w-2xl mx-auto space-y-6 py-8">
                                        <div className="text-center space-y-2">
                                            <div className="text-4xl">🤖</div>
                                            <h3 className="text-lg font-bold text-gray-900">AI Doctor Matching</h3>
                                            <p className="text-sm text-gray-500">Describe your symptoms, and our AI will find the best specialist and earliest slot for you.</p>
                                        </div>
                                        <textarea
                                            value={chiefComplaint}
                                            onChange={(e) => setChiefComplaint(e.target.value)}
                                            placeholder="e.g. Severe ear pain since last night, slightly dizzy..."
                                            className="w-full p-4 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none h-32 resize-none"
                                        />
                                        <div className="flex gap-4 items-center">
                                            <div className="w-1/3">
                                                <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Severity Condition</label>
                                                <select
                                                    value={severity}
                                                    onChange={(e) => setSeverity(e.target.value)}
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:border-purple-500 outline-none text-sm font-bold"
                                                >
                                                    <option value="NORMAL">Normal</option>
                                                    <option value="MODERATE">Moderate</option>
                                                    <option value="CRITICAL">Critical</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={handleAutoBook}
                                                disabled={bookingLoading || !chiefComplaint}
                                                className="flex-1 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                {bookingLoading ? 'Analyzing & Booking...' : 'Find Best Doctor & Book Now'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <label className="text-sm font-bold text-gray-700">Select Doctor</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {doctors.map(doc => (
                                                    <button
                                                        key={doc.user_id}
                                                        onClick={() => setSelectedDoctor(doc)}
                                                        className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${selectedDoctor?.user_id === doc.user_id
                                                            ? 'border-emerald-500 bg-emerald-50'
                                                            : 'border-gray-100 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">👨‍⚕️</div>
                                                        <div>
                                                            <div className="font-bold text-gray-900">Dr. {doc.name}</div>
                                                            <div className="text-[10px] text-emerald-600 font-bold uppercase">
                                                                {doc.department}
                                                                {doc.doctor_type && <span className="text-gray-400"> • {doc.doctor_type.replace(/_/g, ' ')}</span>}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">Date</label>
                                                <input
                                                    type="date"
                                                    value={selectedDate}
                                                    onChange={(e) => setSelectedDate(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                            {selectedDoctor && (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-700">Available Slots</label>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {availableSlots.map(slot => (
                                                            <button
                                                                key={slot}
                                                                onClick={() => setSelectedSlot(slot)}
                                                                className={`p-2 rounded-lg text-xs font-bold border transition-all ${selectedSlot === slot
                                                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                                                                    }`}
                                                            >
                                                                {slot}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                disabled={!selectedSlot || bookingLoading}
                                                onClick={handleCreateAppointment}
                                                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg disabled:opacity-50 transition-all"
                                            >
                                                {bookingLoading ? 'Confirming...' : 'Confirm Appointment'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Total Visits', value: stats.visits, color: 'blue', icon: '/icons/visit.png' },
                                        { label: 'Active Meds', value: stats.prescriptions, color: 'indigo', icon: '/icons/medicine.png' },
                                        { label: 'Lab Reports', value: stats.labReports, color: 'purple', icon: '/icons/lab.png' },
                                        { label: 'Pending Bills', value: stats.bills, color: 'rose', icon: '/icons/bill.png' }
                                    ].map((stat, i) => (
                                        <div key={i} className="card-medical p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{stat.label}</p>
                                                    <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
                                                </div>
                                                <div className={`w-14 h-14 bg-${stat.color}-500 rounded-xl flex items-center justify-center shadow-md text-2xl`}>
                                                    {i === 0 ? '🗓️' : i === 1 ? '💊' : i === 2 ? '🧪' : '💰'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Main Tabs Layout */}
                                <div className="card-medical overflow-hidden">
                                    <div className="flex border-b border-gray-100 overflow-x-auto">
                                        {[
                                            { id: 'overview', label: 'History' },
                                            { id: 'vitals', label: 'Vitals' },
                                            { id: 'reports', label: 'Lab' },
                                            { id: 'notes', label: 'Doctor Notes' },

                                            { id: 'meds', label: 'Meds' },
                                            { id: 'bills', label: 'Bills' }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`px-8 py-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                                                    : 'text-gray-500 hover:text-blue-500'
                                                    }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-6">
                                        {activeTab === 'overview' && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                                            <th className="pb-4 px-4">Date</th>
                                                            <th className="pb-4 px-4">Time</th>
                                                            <th className="pb-4 px-4">Doctor</th>
                                                            <th className="pb-4 px-4">Specialization</th>
                                                            <th className="pb-4 px-4">Reason</th>
                                                            <th className="pb-4 px-4">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {visits.length > 0 ? visits.map(v => (
                                                            <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                                <td className="py-4 px-4 text-sm font-bold text-gray-900">{v.visit_date}</td>
                                                                <td className="py-4 px-4 text-sm text-gray-600">{v.slot_booked || '-'}</td>
                                                                <td className="py-4 px-4 text-sm text-gray-600">Dr. {v.doctor?.name || 'Staff'}</td>
                                                                <td className="py-4 px-4 text-sm text-gray-500 uppercase">{v.doctor?.doctor_type?.replace(/_/g, ' ') || '-'}</td>
                                                                <td className="py-4 px-4 text-sm text-gray-500 italic">{v.chief_complaint || '-'}</td>
                                                                <td className="py-4 px-4">
                                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(v.status)}`}>
                                                                        {v.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )) : (
                                                            <tr>
                                                                <td colSpan="6" className="py-12 text-center text-gray-400 font-medium">No medical history found.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {activeTab === 'vitals' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {vitals.length > 0 ? vitals.map(v => (
                                                    <div key={v.id} className="p-4 border border-blue-100 rounded-xl bg-blue-50/20">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="text-xs font-bold text-blue-700">{new Date(v.recorded_at).toLocaleDateString()}</span>
                                                            <span className="text-[10px] text-gray-400">By {v.recorded_by_name || 'Nurse'}</span>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2 text-center">
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase">BP</p>
                                                                <p className="text-sm font-bold text-gray-900">{v.bp_systolic}/{v.bp_diastolic}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase">Heart</p>
                                                                <p className="text-sm font-bold text-gray-900">{v.pulse}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase">Temp</p>
                                                                <p className="text-sm font-bold text-gray-900">{v.temperature}°F</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase">SpO2</p>
                                                                <p className="text-sm font-bold text-gray-900">{v.spo2}%</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="col-span-2 py-12 text-center text-gray-400 font-medium">No vitals recorded yet.</div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'reports' && (
                                            <div className="space-y-3">
                                                {labTests.length > 0 ? labTests.map(test => (
                                                    <div key={test.id} className="p-4 border border-gray-100 rounded-xl flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                        <div>
                                                            <div className="font-bold text-gray-900">{test.test_name}</div>
                                                            <div className="text-[10px] text-gray-400 mt-1 uppercase">{new Date(test.ordered_at || test.completed_at).toLocaleDateString()}</div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(test.status)}`}>{test.status}</span>
                                                            {test.report_file && (
                                                                <a href={test.report_file} target="_blank" className="text-blue-600 hover:text-blue-700 font-bold text-sm">Download ↓</a>
                                                            )}
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="py-12 text-center text-gray-400 font-medium">No lab reports found.</div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'notes' && (
                                            <div className="space-y-4">
                                                {notes.map(note => (
                                                    <div key={note.id} className="p-5 border border-amber-100 rounded-xl bg-amber-50/10">
                                                        <div className="flex justify-between items-center mb-4 border-b border-amber-100/50 pb-2">
                                                            <span className="text-xs font-bold text-amber-700 uppercase">{note.note_type}</span>
                                                            <span className="text-xs text-gray-400 italic">Dr. {note.doctor_name} • {new Date(note.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Diagnosis</p>
                                                                <p className="text-sm font-bold text-gray-900">{note.diagnosis || 'General Observation'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Doctors Summary</p>
                                                                <p className="text-sm text-gray-600 italic leading-relaxed">{note.notes}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === 'meds' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {prescriptions.length > 0 ? prescriptions.map(p => (
                                                    <div key={p.id} className="p-4 border border-blue-100 rounded-xl bg-blue-50/20">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="text-lg">💊</span>
                                                            <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${getStatusBadge(p.status)}`}>{p.status}</span>
                                                        </div>
                                                        <h3 className="font-bold text-gray-900">{p.medicine?.name || 'Medicine'}</h3>
                                                        <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Dr. {p.visit?.doctor?.name || 'Staff'}</p>
                                                        <div className="mt-3 flex gap-4">
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 uppercase">Dosage</p>
                                                                <p className="text-xs font-bold">{p.dosage_per_day}x/day</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 uppercase">Days</p>
                                                                <p className="text-xs font-bold">{p.duration} Days</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="col-span-2 py-12 text-center text-gray-400 font-medium">No medications prescribed.</div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'bills' && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                                            <th className="pb-4 px-4">Bill ID</th>
                                                            <th className="pb-4 px-4">Date</th>
                                                            <th className="pb-4 px-4">Total Amount</th>
                                                            <th className="pb-4 px-4">Status</th>
                                                            <th className="pb-4 px-4">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bills.length > 0 ? bills.map(b => (
                                                            <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                                <td className="py-4 px-4 text-sm font-bold text-gray-900">#{b.id}</td>
                                                                <td className="py-4 px-4 text-sm text-gray-600">{new Date(b.created_at).toLocaleDateString()}</td>
                                                                <td className="py-4 px-4 text-sm font-bold text-gray-900">₹{b.total_amount}</td>
                                                                <td className="py-4 px-4">
                                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(b.status)}`}>
                                                                        {b.status.replace(/_/g, ' ')}
                                                                    </span>
                                                                </td>
                                                                <td className="py-4 px-4">
                                                                    <button
                                                                        onClick={() => handleDownloadBill(b.id)}
                                                                        className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg transition-colors flex items-center gap-2"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                        </svg>
                                                                        Download PDF
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        )) : (
                                                            <tr>
                                                                <td colSpan="5" className="py-12 text-center text-gray-400 font-medium">No bills found.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div >

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>
        </div >
    );
}
