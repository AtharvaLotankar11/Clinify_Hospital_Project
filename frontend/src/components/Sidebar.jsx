import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Modal from './Modal';

export default function Sidebar({ role = 'doctor' }) {
    const [isRestrictedModalOpen, setIsRestrictedModalOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = {
        reception: [
            { path: '/reception/dashboard', icon: 'dashboard', label: 'Dashboard' },
            { path: '/reception/register-patient', icon: 'add', label: 'Register/Edit Patient' },
            { path: '/reception/create-visit', icon: 'visits', label: 'Create/Edit Visit' },
            { path: '/reception/admissions', icon: 'calendar', label: 'Create/Edit Admission' },
            { path: '/reception/view-all', icon: 'folder', label: 'View All Records' }
        ],
        doctor: [
            { path: '/doctor/dashboard', icon: 'dashboard', label: 'Dashboard' },
            { path: '/doctor/patients', icon: 'patients', label: 'Patients' },
            { path: '/doctor/orders', icon: 'orders', label: 'Orders' },
            { path: '/ot/dashboard', icon: 'surgery', label: 'Operation Theater' }
        ],
        nurse: [
            { path: '/nurse/dashboard', icon: 'dashboard', label: 'Dashboard' },
            { path: '/nurse/vitals', icon: 'vitals', label: 'Record Vitals' },
            { path: '/nurse/beds', icon: 'beds', label: 'Bed Management' },
            { path: '/ot/dashboard', icon: 'surgery', label: 'Operation Theater' }
        ],
        lab_tech: [
            { path: '/lab_tech/dashboard', icon: 'dashboard', label: 'Lab Details' },
            { path: '/lab_tech/upload', icon: 'upload', label: 'Upload' }
        ],
        billing: [
            { path: '/billing/dashboard', icon: 'dashboard', label: 'Dashboard' },
            { path: '/billing/create', icon: 'add', label: 'Create Bill' },
            { path: '/billing/bills', icon: 'billing', label: 'Patient Bills' }
        ],
        pharmacy: [
            { path: '/pharmacy/dashboard', icon: 'dashboard', label: 'Dashboard' },
            { path: '/pharmacy/prescriptions', icon: 'prescriptions', label: 'Prescriptions' },
            { path: '/pharmacy/inventory', icon: 'inventory', label: 'Inventory' },
            { path: '/pharmacy/dispense', icon: 'dispense', label: 'Dispense Medicine' },
            { path: '/pharmacy/alerts', icon: 'alerts', label: 'Allergy & Interactions' }
        ],
        admin: [
            { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
            { path: '/admin/register-user', icon: 'add', label: 'Register User' },
            { path: '/admin/users', icon: 'users', label: 'Manage Users' }
        ],
        support: [
            { path: '/support/dashboard', icon: 'beds', label: 'Bed Management' }
        ]
    };

    const icons = {
        dashboard: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        patients: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        beds: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-2 0v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5m14-4V7a1 1 0 00-1-1H6a1 1 0 00-1 1v3" />
            </svg>
        ),
        orders: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        calendar: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        reports: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        add: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
        ),
        visits: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
        vitals: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
        upload: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
        ),
        billing: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        users: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        prescriptions: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        inventory: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
        dispense: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        surgery: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ),
        alerts: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        )
    };

    const currentMenu = menuItems[role] || menuItems.doctor;

    return (
        <div className="w-72 bg-white h-screen fixed left-0 top-0 transition-all duration-300 z-50 flex flex-col">
            {/* Logo Section */}
            <div className="p-6 border-b-2 border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-xl border border-gray-100 p-2">
                            <img
                                src="/clinify-logo.png"
                                alt="CLINIFY"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">CLINIFY</h1>
                            <p className="text-xs text-gray-500 capitalize">{role} Portal</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-2">
                    {currentMenu.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={(e) => {
                                        if (role === 'billing' && item.path === '/billing/create') {
                                            e.preventDefault();
                                            setIsRestrictedModalOpen(true);
                                        }
                                    }}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                                        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                                        }`}
                                >
                                    {icons[item.icon]}
                                    <span className="font-semibold">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>


            {/* Restriction Modal */}
            <Modal
                isOpen={isRestrictedModalOpen}
                onClose={() => setIsRestrictedModalOpen(false)}
                title="Action Required"
                maxWidth="max-w-md"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Select a Pending Bill</h3>
                    <p className="text-gray-600 mb-6">
                        To create a new bill, please select a patient from the <strong>Pending Bills</strong> section on the Dashboard.
                    </p>
                    <button
                        onClick={() => {
                            setIsRestrictedModalOpen(false);
                            if (location.pathname !== '/billing/dashboard') {
                                navigate('/billing/dashboard');
                            }
                        }}
                        className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors w-full"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </Modal>
        </div>
    );
}
