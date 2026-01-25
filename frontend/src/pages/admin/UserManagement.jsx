import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { staffAPI } from '../../services/api';

export default function UserManagement() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await staffAPI.getAll();
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            // Fallback empty or alert
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadgeColor = (role) => {
        // ... (styles) ...
        const map = {
            'ADMIN': 'bg-gray-800 text-white',
            'DOCTOR': 'bg-emerald-100 text-emerald-700',
            'NURSE': 'bg-teal-100 text-teal-700',
            'LAB_TECH': 'bg-blue-100 text-blue-700',
            'BILLING': 'bg-amber-100 text-amber-700',
            'RECEPTION': 'bg-purple-100 text-purple-700',
            'PHARMACIST': 'bg-pink-100 text-pink-700',
            'SUPPORT': 'bg-gray-200 text-gray-800'
        };
        return map[role] || 'bg-gray-100 text-gray-700';
    };

    const getRoleLabel = (role) => {
        if (!role) return '';
        // Capitalize nicely
        return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const filteredUsers = users.filter(user => {
        const s = searchTerm.toLowerCase();
        const matchesSearch = user.name?.toLowerCase().includes(s) ||
            user.user_email?.toLowerCase().includes(s) ||
            String(user.user_id).includes(s);
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const handleDeactivate = async (userId) => {
        if (window.confirm('Are you sure you want to deactivate this user? They will no longer be able to log in.')) {
            try {
                await staffAPI.update(userId, { is_active: false });
                alert('User deactivated successfully.');
                fetchUsers(); // Refresh list
            } catch (err) {
                console.error('Deactivation failed:', err);
                alert('Failed to deactivate user.');
            }
        }
    };

    const handleDelete = async (userId, userName) => {
        if (window.confirm(`PERMANENT DELETE: Are you sure you want to delete ${userName}? This cannot be undone.`)) {
            try {
                await staffAPI.delete(userId);
                alert('User deleted permanently.');
                fetchUsers();
            } catch (err) {
                console.error('Delete failed:', err);
                const msg = err.response?.data?.detail || 'Failed to delete user.';
                alert(msg);
            }
        }
    };


    const handleResetPassword = async (userId, userName) => {
        const newPassword = window.prompt(`Enter new password for ${userName}:`);
        if (!newPassword) return; // User cancelled or empty

        if (newPassword.length < 3) {
            alert('Password must be at least 3 characters.');
            return;
        }

        try {
            await staffAPI.adminResetPassword(userId, newPassword);
            alert('Password has been reset successfully. User can now login.');
        } catch (error) {
            console.error('Failed to reset password:', error);
            alert('Failed to reset password. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
                <Sidebar role="admin" />
                <div className="ml-72 transition-all duration-300">
                    <Header userName={user.name || 'Admin'} userRole="Administrator" />
                    <main className="p-6">
                        <div className="text-center py-12">
                            <p className="text-gray-500">Loading users...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            <Sidebar role="admin" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Admin'} userRole="Administrator" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                                    <p className="text-sm text-gray-600 mt-1">Manage staff accounts, roles, and permissions</p>
                                </div>
                                <button
                                    onClick={() => navigate('/admin/register-user')}
                                    className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                    + Add New User
                                </button>
                            </div>
                        </div>

                        {/* Search & Filter */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search by name, email, or employee ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
                                    <select
                                        value={filterRole}
                                        onChange={(e) => setFilterRole(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="ADMIN">Administrator</option>
                                        <option value="DOCTOR">Doctor</option>
                                        <option value="NURSE">Nurse</option>
                                        <option value="LAB_TECH">Lab Technician</option>
                                        <option value="BILLING">Billing Staff</option>
                                        <option value="RECEPTION">Reception Staff</option>
                                        <option value="PHARMACIST">Pharmacist</option>
                                        <option value="SUPPORT">Support Staff</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Employee ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Department</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.user_id} className="hover:bg-emerald-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-semibold text-gray-900">{user.user_id}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                    {getRoleLabel(user.role)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600">{user.department}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600">{user.user_email}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/admin/users/${user.user_id}`)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetPassword(user.user_id, user.name)}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                        title="Reset Password"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                        </svg>
                                                    </button>
                                                    {user.is_active ? (
                                                        <button
                                                            onClick={() => handleDeactivate(user.user_id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Deactivate (Prevent Login)"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await staffAPI.update(user.user_id, { is_active: true });
                                                                    alert('User activated successfully.');
                                                                    fetchUsers();
                                                                } catch (err) { alert('Failed to activate user'); }
                                                            }}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                            title="Activate User"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(user.user_id, user.name)}
                                                        className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete Permanently"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredUsers.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No users found matching your criteria.</p>
                                </div>
                            )}
                        </div>


                    </div>
                </main>
            </div>
        </div>
    );
}
