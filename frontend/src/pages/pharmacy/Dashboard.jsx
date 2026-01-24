import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function PharmacyDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pendingPrescriptions: 0,
        dispensedToday: 0,
        lowStock: 0,
        totalMedicines: 0
    });

    const [prescriptions, setPrescriptions] = useState([]);
    const [lowStockMedicines, setLowStockMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Fetch real data from backend
    useEffect(() => {
        const fetchPharmacyData = async () => {
            try {
                setLoading(true);

                // Import API functions
                const { medicineAPI, prescriptionAPI } = await import('../../services/api');

                // Fetch pharmacy stats
                const statsData = await medicineAPI.getStats();

                // Fetch pending prescriptions
                const pendingPrescriptions = await prescriptionAPI.getPending();

                // Fetch low stock medicines
                const lowStock = await medicineAPI.getLowStock();

                // Calculate dispensed today
                const allPrescriptions = await prescriptionAPI.getAll({ status: 'DISPENSED' });
                const today = new Date().toISOString().split('T')[0];
                const dispensedToday = allPrescriptions.filter(p =>
                    p.dispensed_at && p.dispensed_at.startsWith(today)
                ).length;

                // Update state
                setStats({
                    pendingPrescriptions: pendingPrescriptions.length,
                    dispensedToday: dispensedToday,
                    lowStock: statsData.low_stock_count,
                    totalMedicines: statsData.total_medicines
                });

                setPrescriptions(pendingPrescriptions);
                setLowStockMedicines(lowStock);

            } catch (error) {
                console.error('Error fetching pharmacy data:', error);
                // Set empty states on error to prevent blank page
                setPrescriptions([]);
                setLowStockMedicines([]);
                setStats({
                    pendingPrescriptions: 0,
                    dispensedToday: 0,
                    lowStock: 0,
                    totalMedicines: 0
                });
                // Show user-friendly error message
                console.warn('Failed to load pharmacy data. Please ensure you are logged in and the backend is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchPharmacyData();
    }, []);

    const getStatusBadge = (status) => {
        const badges = {
            pending: "bg-amber-100 text-amber-700",
            dispensed: "bg-green-100 text-green-700",
            cancelled: "bg-red-100 text-red-700",
        };
        return badges[status] || "bg-gray-100 text-gray-700";
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            <Sidebar role="pharmacy" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Pharmacist'} userRole="Pharmacy" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <img
                                            src="/icons/pharmacy.png"
                                            alt="Pharmacy"
                                            className="w-10 h-10 object-contain"
                                        />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
                                        <p className="text-sm text-gray-600 mt-1">Manage prescriptions and inventory</p>
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
                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-amber-100 p-6 transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pending Prescriptions</p>
                                        <p className="text-4xl font-bold text-gray-900">{stats.pendingPrescriptions}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-green-100 p-6 transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Dispensed Today</p>
                                        <p className="text-4xl font-bold text-gray-900">{stats.dispensedToday}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-red-100 p-6 transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Low Stock Alerts</p>
                                        <p className="text-4xl font-bold text-gray-900">{stats.lowStock}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-blue-100 p-6 transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Total Medicines</p>
                                        <p className="text-4xl font-bold text-gray-900">{stats.totalMedicines}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Low Stock Alerts */}
                        {lowStockMedicines.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md border-l-4 border-red-500 p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-11 h-11 bg-red-50 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-red-900">Low Stock Medicines</h2>
                                </div>
                                <div className="space-y-3">
                                    {lowStockMedicines.map(medicine => (
                                        <div key={medicine.medicine_id} className="p-4 bg-red-50 rounded-lg flex items-center justify-between border border-red-100">
                                            <div>
                                                <p className="font-semibold text-red-900">{medicine.name}</p>
                                                <p className="text-sm text-red-700">Current Stock: {medicine.stock_qty} units</p>
                                                <p className="text-xs text-red-600 mt-1">Status: {medicine.stock_status}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-red-600">Expires: {new Date(medicine.expiry_date).toLocaleDateString()}</p>
                                                <button
                                                    onClick={() => navigate('/pharmacy/inventory')}
                                                    className="mt-1 px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors">
                                                    Reorder
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
