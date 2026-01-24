import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import { visitAPI, patientAPI } from '../../services/api';

export default function Dashboard() {
    const [stats, setStats] = useState({
        todayAppointments: 0,
        registeredPatients: 0,
        pendingVisits: 0,
    });

    const [recentPatients, setRecentPatients] = useState([]);
    const [allPatientsList, setAllPatientsList] = useState([]);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [allAppointmentsList, setAllAppointmentsList] = useState([]);

    const [isPatientsModalOpen, setIsPatientsModalOpen] = useState(false);
    const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];

                // Fetch Visits
                const visitsRes = await visitAPI.getAll();
                const allVisits = Array.isArray(visitsRes.data) ? visitsRes.data : [];

                const todayVisits = allVisits.filter(v => v.visit_date === today);
                const activeVisits = allVisits.filter(v => v.status === 'ACTIVE');

                // Fetch Patients
                const patientsRes = await patientAPI.getAll();
                const allPatients = Array.isArray(patientsRes.data) ? patientsRes.data : [];

                setStats({
                    todayAppointments: todayVisits.length,
                    registeredPatients: allPatients.length,
                    pendingVisits: activeVisits.length,
                });

                // Recent Patients (Last 5)
                const sortedPatients = [...allPatients].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                setAllPatientsList(sortedPatients);
                setRecentPatients(sortedPatients.slice(0, 4).map(p => ({
                    id: p.id,
                    name: p.name,
                    age: p.age,
                    gender: p.gender,
                    phone: p.phone,
                    lastVisit: 'N/A'
                })));

                // Today's Appointments List
                setAllAppointmentsList(todayVisits);
                setTodayAppointments(todayVisits.slice(0, 5).map(v => ({
                    id: v.id,
                    time: v.slot_booked || 'N/A',
                    patient: v.patient?.name || 'Unknown',
                    doctor: v.doctor?.name || 'Unassigned',
                    department: v.doctor?.department || v.visit_type,
                    status: v.status
                })));

            } catch (err) {
                console.error("Failed to load dashboard data", err);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 medical-theme">
            <Sidebar role="reception" />

            <div className="ml-72 transition-all duration-300">
                <Header userName="Receptionist" userRole="Reception" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="card-medical p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <img src="/icons/reception.png" alt="Reception" className="w-8 h-8 object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Reception Dashboard</h1>
                                    <p className="text-sm text-gray-600 mt-1">Manage patient registrations and visits</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: "Today's Appointments", value: stats.todayAppointments, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "blue" },
                                { label: "Registered Patients", value: stats.registeredPatients, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", color: "indigo" },
                                { label: "Pending Visits", value: stats.pendingVisits, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "amber" }
                            ].map((stat, i) => (
                                <div key={i} className="card-medical p-6 border-l-4 border-blue-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">{stat.label}</p>
                                            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                                        </div>
                                        <div className={`w-12 h-12 bg-${stat.color}-600 rounded-lg flex items-center justify-center`}>
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <Link
                                to="/reception/register-patient"
                                className="gradient-medical-primary rounded-lg p-6 text-white flex items-center justify-between group hover:shadow-lg transition-all duration-200"
                            >
                                <div>
                                    <h3 className="text-xl font-bold">Register New Patient</h3>
                                    <p className="text-blue-100 text-sm mt-1">Add a new patient to the system</p>
                                </div>
                                <svg className="w-8 h-8 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>

                            <Link
                                to="/reception/create-visit"
                                className="gradient-medical-secondary rounded-lg p-6 text-white flex items-center justify-between group hover:shadow-lg transition-all duration-200"
                            >
                                <div>
                                    <h3 className="text-xl font-bold">Create Visit</h3>
                                    <p className="text-green-100 text-sm mt-1">Schedule a new patient visit</p>
                                </div>
                                <svg className="w-8 h-8 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>

                            <Link
                                to="/reception/admissions"
                                className="gradient-medical-accent rounded-lg p-6 text-white flex items-center justify-between group hover:shadow-lg transition-all duration-200"
                            >
                                <div>
                                    <h3 className="text-xl font-bold">Create Admission</h3>
                                    <p className="text-purple-100 text-sm mt-1">Admit a patient or manage beds</p>
                                </div>
                                <svg className="w-8 h-8 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </Link>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Recent Patients */}
                            <div className="card-medical p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-800">Recent Patients</h2>
                                    <button
                                        onClick={() => setIsPatientsModalOpen(true)}
                                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                    >
                                        View All →
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {recentPatients.map((patient) => (
                                        <div key={patient.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{patient.name}</p>
                                                <p className="text-xs text-gray-500 font-medium mt-0.5">{patient.phone}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-600">{patient.age}Y • {patient.gender}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{patient.lastVisit}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {recentPatients.length === 0 && (
                                        <p className="text-sm text-gray-400 text-center italic">No patients registered yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Today's Appointments */}
                            <div className="card-medical p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-800">Today's Appointments</h2>
                                    <button
                                        onClick={() => setIsAppointmentsModalOpen(true)}
                                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                    >
                                        View All →
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {todayAppointments.map((appointment) => (
                                        <div key={appointment.id} className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                            <div className="w-16">
                                                <p className="text-xs font-bold text-blue-600">{appointment.time}</p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-800">{appointment.patient}</p>
                                                <p className="text-xs text-gray-500 font-medium">{appointment.doctor} • {appointment.department}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${appointment.status === 'ACTIVE'
                                                ? 'badge-info'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {appointment.status}
                                            </span>
                                        </div>
                                    ))}
                                    {todayAppointments.length === 0 && (
                                        <p className="text-sm text-gray-400 text-center italic">No appointments for today.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Patients Modal */}
            <Modal
                isOpen={isPatientsModalOpen}
                onClose={() => setIsPatientsModalOpen(false)}
                title="All Registered Patients"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient Name</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Age/Gender</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Registered On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {allPatientsList.map(patient => (
                                <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-2">
                                        <p className="text-sm font-bold text-gray-800">{patient.name}</p>
                                        <p className="text-[10px] text-gray-400">ID: {patient.id}</p>
                                    </td>
                                    <td className="py-4 px-2">
                                        <p className="text-sm text-gray-600 font-medium">{patient.phone}</p>
                                        <p className="text-[10px] text-gray-400">{patient.email || 'No email'}</p>
                                    </td>
                                    <td className="py-4 px-2">
                                        <p className="text-sm text-gray-600 font-medium">{patient.age}Y • {patient.gender}</p>
                                    </td>
                                    <td className="py-4 px-2">
                                        <p className="text-sm text-gray-500">{new Date(patient.created_at).toLocaleDateString()}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {allPatientsList.length === 0 && (
                        <p className="py-10 text-center text-gray-400 italic">No patients registered.</p>
                    )}
                </div>
            </Modal>

            {/* Appointments Modal */}
            <Modal
                isOpen={isAppointmentsModalOpen}
                onClose={() => setIsAppointmentsModalOpen(false)}
                title="Today's Appointments"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Time</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Doctor/Dept</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {allAppointmentsList.map(appointment => (
                                <tr key={appointment.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-2">
                                        <p className="text-sm font-bold text-emerald-600">{appointment.slot_booked || 'N/A'}</p>
                                    </td>
                                    <td className="py-4 px-2">
                                        <p className="text-sm font-bold text-gray-800">{appointment.patient?.name || 'Unknown'}</p>
                                        <p className="text-[10px] text-gray-400">{appointment.patient?.phone}</p>
                                    </td>
                                    <td className="py-4 px-2">
                                        <p className="text-sm text-gray-600 font-medium">{appointment.doctor?.name || 'Unassigned'}</p>
                                        <p className="text-[10px] text-gray-400">{appointment.doctor?.department || appointment.visit_type}</p>
                                    </td>
                                    <td className="py-4 px-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${appointment.status === 'ACTIVE'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {appointment.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {allAppointmentsList.length === 0 && (
                        <p className="py-10 text-center text-gray-400 italic">No appointments for today.</p>
                    )}
                </div>
            </Modal>
        </div>
    );
}
