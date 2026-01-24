import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { staffAPI } from '../../services/api';

export default function EditUser() {
    const navigate = useNavigate();
    const { userId } = useParams();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        user_email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        address: '',
        role: '',
        department: '',
        fee: '',
        shift_start: '',
        shift_end: '',
        is_active: true
    });

    const [errors, setErrors] = useState({});
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const roles = [
        { value: 'ADMIN', label: 'Administrator' },
        { value: 'DOCTOR', label: 'Doctor' },
        { value: 'NURSE', label: 'Nurse' },
        { value: 'LAB_TECH', label: 'Lab Technician' },
        { value: 'BILLING', label: 'Billing Staff' },
        { value: 'RECEPTION', label: 'Reception Staff' },
        { value: 'PHARMACIST', label: 'Pharmacist' },
        { value: 'SUPPORT', label: 'Support Staff' }
    ];

    const departments = [
        'ADMIN',
        'OPD',
        'IPD',
        'EMERGENCY',
        'LAB',
        'BILLING',
        'PHARMACY',
        'SUPPORT'
    ];

    useEffect(() => {
        fetchUserData();
    }, [userId]);

    const fetchUserData = async () => {
        try {
            const response = await staffAPI.getById(userId);
            setFormData(response.data);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            alert('User not found');
            navigate('/admin/users');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.role) newErrors.role = 'Role is required';
        if (!formData.department) newErrors.department = 'Department is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            alert('Please fix all errors before submitting');
            return;
        }

        try {
            await staffAPI.update(userId, formData);
            alert(`User updated successfully!`);
            navigate('/admin/users');
        } catch (err) {
            console.error("Update failed", err);
            alert("Failed to update user: " + (err.response?.data?.detail || err.message));
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
                            <p className="text-gray-500">Loading user data...</p>
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
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                                    <p className="text-sm text-gray-600 mt-1">Update user information and settings</p>
                                </div>
                                <button
                                    onClick={() => navigate('/admin/users')}
                                    className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    ← Back to Users
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Information */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-emerald-600 rounded"></span>
                                    Personal Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email (Read-only)
                                        </label>
                                        <input
                                            type="email"
                                            name="user_email"
                                            value={formData.user_email || ''}
                                            disabled
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone || ''}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            name="date_of_birth"
                                            value={formData.date_of_birth || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Gender
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address
                                        </label>
                                        <textarea
                                            name="address"
                                            value={formData.address || ''}
                                            onChange={handleInputChange}
                                            rows="2"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Role & Department */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-blue-600 rounded"></span>
                                    Role & Department
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Role <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                                        >
                                            <option value="">Select Role</option>
                                            {roles.map(role => (
                                                <option key={role.value} value={role.value}>{role.label}</option>
                                            ))}
                                        </select>
                                        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Department <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="department"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {formData.role === 'DOCTOR' && (
                                        <>
                                            <div className="md:col-span-2 grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Fee (₹)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="fee"
                                                        value={formData.fee || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Shift Start</label>
                                                    <input type="time" name="shift_start" value={formData.shift_start || ''} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Shift End</label>
                                                    <input type="time" name="shift_end" value={formData.shift_end || ''} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Account & Status */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-purple-600 rounded"></span>
                                    Account Status
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Is Active?
                                        </label>
                                        <div className="flex items-center space-x-4 mt-2">
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    name="is_active"
                                                    checked={formData.is_active === true}
                                                    onChange={() => setFormData(prev => ({ ...prev, is_active: true }))}
                                                    className="form-radio text-emerald-600"
                                                />
                                                <span className="ml-2">Active</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    name="is_active"
                                                    checked={formData.is_active === false}
                                                    onChange={() => setFormData(prev => ({ ...prev, is_active: false }))}
                                                    className="form-radio text-red-600"
                                                />
                                                <span className="ml-2">Inactive</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-4 bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin/users')}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
