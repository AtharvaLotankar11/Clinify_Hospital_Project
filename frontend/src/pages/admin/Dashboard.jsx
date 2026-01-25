import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { staffAPI, adminAPI } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [hospitalMetrics, setHospitalMetrics] = useState({
        totalPatients: 0,
        opdPatients: 0,
        ipdPatients: 0,
        emergencyPatients: 0,
        dailyInflow: 0,
        weeklyInflow: 0
    });

    const [revenueData, setRevenueData] = useState({
        opdRevenue: 0,
        ipdRevenue: 0,
        procedureCharges: 0,
        totalRevenue: 0,
        collectedToday: 0,
        pendingPayments: 0
    });

    const [bedOccupancy, setBedOccupancy] = useState({
        totalBeds: 0,
        occupiedBeds: 0,
        availableBeds: 0,
        icuBeds: { total: 0, occupied: 0 },
        generalBeds: { total: 0, occupied: 0 }
    });

    const [staffStats, setStaffStats] = useState({
        totalDoctors: 0,
        totalNurses: 0,
        totalAdmins: 0,
        totalLabStaff: 0,
        totalBillingStaff: 0,
        totalReceptionists: 0,
        activeToday: 0,
        newThisWeek: 0
    });

    const [departmentWorkload, setDepartmentWorkload] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [analyticsData, setAnalyticsData] = useState({
        revenueTrend: [],
        patientInflow: []
    });
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch Staff Data
            const staffRes = await staffAPI.getAll();
            const staff = staffRes.data;

            // Calculate Staff Stats
            const totalDoctors = staff.filter(s => s.role === 'DOCTOR').length;
            const totalNurses = staff.filter(s => s.role === 'NURSE').length;
            const totalAdmins = staff.filter(s => s.role === 'ADMIN').length;
            const totalLabStaff = staff.filter(s => s.role === 'LAB_TECH').length;
            const totalBillingStaff = staff.filter(s => s.role === 'BILLING').length;
            const activeToday = staff.filter(s => s.is_active).length;

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const newThisWeek = staff.filter(s => new Date(s.created_at) > oneWeekAgo).length;

            setStaffStats({
                totalDoctors,
                totalNurses,
                totalAdmins,
                totalLabStaff,
                totalBillingStaff,
                totalReceptionists: staff.filter(s => s.role === 'RECEPTION').length,
                activeToday,
                newThisWeek
            });

            // Fetch Real Stats from Backend
            const statsRes = await adminAPI.getDashboardStats();
            const stats = statsRes.data;

            // Update Metrics (using real data where available, fallback to mock if structure differs or missing)
            if (stats.hospital) {
                setHospitalMetrics({
                    totalPatients: stats.hospital.totalPatients || 0,
                    opdPatients: stats.hospital.opdPatients || 0,
                    ipdPatients: stats.hospital.ipdPatients || 0,
                    emergencyPatients: stats.hospital.emergencyPatients || 0,
                    dailyInflow: stats.hospital.dailyInflow || 0,
                    weeklyInflow: 289 // Stats API doesn't calculate this yet
                });
            }

            if (stats.revenue) {
                setRevenueData({
                    opdRevenue: stats.revenue.opdRevenue || 0,
                    ipdRevenue: stats.revenue.ipdRevenue || 0,
                    procedureCharges: stats.revenue.procedureCharges || 0,
                    totalRevenue: stats.revenue.totalRevenue || 0,
                    collectedToday: stats.revenue.collectedToday || 0,
                    pendingPayments: stats.revenue.pendingPayments || 0
                });
            }

            if (stats.beds) {
                setBedOccupancy({
                    totalBeds: stats.beds.totalBeds,
                    occupiedBeds: stats.beds.occupiedBeds,
                    availableBeds: stats.beds.availableBeds,
                    icuBeds: stats.beds.icuBeds,
                    generalBeds: stats.beds.generalBeds
                });
            }

            if (stats.analytics) {
                setAnalyticsData({
                    revenueTrend: stats.analytics.revenueTrend || [],
                    patientInflow: stats.analytics.patientInflow || []
                });
            }

            setDepartmentWorkload([
                { department: 'Cardiology', patients: 45, doctors: 3, avgTime: '25 min' },
                { department: 'Orthopedics', patients: 38, doctors: 2, avgTime: '30 min' },
                { department: 'Neurology', patients: 28, doctors: 2, avgTime: '35 min' },
                { department: 'Pediatrics', patients: 52, doctors: 4, avgTime: '20 min' }
            ]);

            setRecentActivity([
                { id: 1, user: 'Dr. Sarah Johnson', action: 'Created patient record', timestamp: '5 min ago', type: 'create' },
                { id: 2, user: 'Billing Staff (John)', action: 'Generated bill #1245', timestamp: '12 min ago', type: 'billing' },
                { id: 3, user: 'Admin', action: 'Registered new nurse', timestamp: '1 hour ago', type: 'user' },
                { id: 4, user: 'Lab Tech (Emily)', action: 'Uploaded test results', timestamp: '2 hours ago', type: 'lab' }
            ]);

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateOccupancyPercentage = () => {
        return ((bedOccupancy.occupiedBeds / bedOccupancy.totalBeds) * 100).toFixed(1);
    };

    const calculateRevenueCollectionRate = () => {
        const total = revenueData.collectedToday + revenueData.pendingPayments;
        return ((revenueData.collectedToday / total) * 100).toFixed(1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 medical-theme">
            <Sidebar role="admin" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Admin'} userRole="Administrator" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="card-medical p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center p-2">
                                        <img src="/icons/admin.png" alt="Admin" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                                        <p className="text-sm text-gray-600 mt-1">Hospital management and oversight</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => navigate('/admin/register-user')}
                                        className="btn-medical-primary px-4 py-2 rounded-lg font-medium"
                                    >
                                        + Register User
                                    </button>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 font-medium uppercase">Today</p>
                                        <p className="text-sm font-semibold text-gray-900">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🏥 HOSPITAL METRICS */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-blue-600 rounded"></span>
                                Hospital Metrics
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Total Patients */}
                                <div className="card-medical p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Total Patients</p>
                                            <p className="text-3xl font-bold text-gray-900">{hospitalMetrics.totalPatients}</p>
                                            <p className="text-xs text-blue-600 font-medium mt-1">↑ {hospitalMetrics.dailyInflow} today</p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* OPD Patients */}
                                <div className="card-medical p-6 border-l-4 border-blue-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">OPD Patients</p>
                                            <p className="text-3xl font-bold text-gray-900">{hospitalMetrics.opdPatients}</p>
                                            <p className="text-xs text-gray-500 font-medium mt-1">Outpatient</p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* IPD Patients */}
                                <div className="card-medical p-6 border-l-4 border-indigo-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">IPD Patients</p>
                                            <p className="text-3xl font-bold text-gray-900">{hospitalMetrics.ipdPatients}</p>
                                            <p className="text-xs text-gray-500 font-medium mt-1">Admitted</p>
                                        </div>
                                        <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Patients */}
                                <div className="card-medical p-6 border-l-4 border-red-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Emergency</p>
                                            <p className="text-3xl font-bold text-gray-900">{hospitalMetrics.emergencyPatients}</p>
                                            <p className="text-xs text-red-600 font-medium mt-1">Critical cases</p>
                                        </div>
                                        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 💰 REVENUE OVERVIEW */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-green-600 rounded"></span>
                                Revenue Overview
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Total Revenue */}
                                <div className="bg-blue-600 rounded-lg p-6 text-white card-medical">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-gray-700 text-sm font-medium">Total Revenue</p>
                                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-3xl font-bold mb-2 text-gray-900">₹{(revenueData.totalRevenue / 1000).toFixed(0)}K</p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">OPD: ₹{(revenueData.opdRevenue / 1000).toFixed(0)}K</p>
                                            <p className="text-gray-600">IPD: ₹{(revenueData.ipdRevenue / 1000).toFixed(0)}K</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Collected Today */}
                                <div className="card-medical p-6 border-l-4 border-green-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Collected Today</p>
                                            <p className="text-3xl font-bold text-green-600">₹{(revenueData.collectedToday / 1000).toFixed(0)}K</p>
                                            <p className="text-xs text-green-600 font-medium mt-1">{calculateRevenueCollectionRate()}% collection rate</p>
                                        </div>
                                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Pending Payments */}
                                <div className="card-medical p-6 border-l-4 border-amber-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Pending Payments</p>
                                            <p className="text-3xl font-bold text-amber-600">₹{(revenueData.pendingPayments / 1000).toFixed(0)}K</p>
                                            <p className="text-xs text-gray-500 font-medium mt-1">Outstanding</p>
                                        </div>
                                        <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 📊 ANALYTICS & TRENDS */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-purple-600 rounded"></span>
                                Analytics & Trends
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Revenue Trend Chart */}
                                <div className="card-medical p-6">
                                    <h3 className="text-sm font-bold text-gray-700 mb-4">Revenue Trends (Last 7 Days)</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analyticsData.revenueTrend}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(value) => `₹${value / 1000}k`} />
                                                <Tooltip
                                                    cursor={{ fill: '#F3F4F6' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                />
                                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                                <Bar dataKey="OPD" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} barSize={20} />
                                                <Bar dataKey="IPD" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Patient Inflow Chart */}
                                <div className="card-medical p-6">
                                    <h3 className="text-sm font-bold text-gray-700 mb-4">Patient Inflow (Last 7 Days)</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={analyticsData.patientInflow}>
                                                <defs>
                                                    <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                />
                                                <Area type="monotone" dataKey="patients" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🛏️ BED OCCUPANCY */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-indigo-600 rounded"></span>
                                Bed Occupancy
                            </h2>
                            {/* Overall Occupancy */}
                            <div className="card-medical p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-gray-900">Overall Occupancy</h3>
                                    <span className="text-2xl font-bold text-indigo-600">{calculateOccupancyPercentage()}%</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total Beds</span>
                                        <span className="font-semibold text-gray-900">{bedOccupancy.totalBeds}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Occupied</span>
                                        <span className="font-semibold text-red-600">{bedOccupancy.occupiedBeds}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Available</span>
                                        <span className="font-semibold text-green-600">{bedOccupancy.availableBeds}</span>
                                    </div>
                                </div>
                                <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600"
                                        style={{ width: `${calculateOccupancyPercentage()}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* 👥 USER MANAGEMENT - STAFF OVERVIEW */}
                        <div className="card-medical p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-blue-600 rounded"></span>
                                    Staff Overview
                                </h2>
                                <button
                                    onClick={() => navigate('/admin/users')}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View All →
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">Admins</p>
                                    <p className="text-2xl font-bold text-gray-600">{staffStats.totalAdmins}</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">Doctors</p>
                                    <p className="text-2xl font-bold text-blue-600">{staffStats.totalDoctors}</p>
                                </div>
                                <div className="p-4 bg-indigo-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">Nurses</p>
                                    <p className="text-2xl font-bold text-indigo-600">{staffStats.totalNurses}</p>
                                </div>
                                <div className="p-4 bg-cyan-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">Lab Staff</p>
                                    <p className="text-2xl font-bold text-cyan-600">{staffStats.totalLabStaff}</p>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">Billing</p>
                                    <p className="text-2xl font-bold text-amber-600">{staffStats.totalBillingStaff}</p>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Active Today</p>
                                    <p className="text-xl font-bold text-green-600">{staffStats.activeToday}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">New This Week</p>
                                    <p className="text-xl font-bold text-blue-600">{staffStats.newThisWeek}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div >
        </div >
    );
}
