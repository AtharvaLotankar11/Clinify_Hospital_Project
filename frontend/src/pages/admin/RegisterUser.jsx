import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { staffAPI } from '../../services/api';

export default function RegisterUser() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        // Personal Information
        name: '',
        user_email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        address: '',

        // Role & Department
        role: '',
        department: '',
        // specialized fields
        fee: '',
        shift_start: '',
        shift_end: '',
        break_start: '',

        break_end: '',
        doctor_type: '',
        experience_years: '',

        // Credentials
        password: '',
        is_active: true
    });

    const [loading, setLoading] = useState(false);
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

    const doctorTypes = [
        { value: 'GENERAL_PHYSICIAN', label: 'General Physician' },
        { value: 'CARDIOLOGIST', label: 'Cardiologist' },
        { value: 'DERMATOLOGIST', label: 'Dermatologist' },
        { value: 'ENT', label: 'ENT Specialist' },
        { value: 'NEUROLOGIST', label: 'Neurologist' },
        { value: 'GYNECOLOGIST', label: 'Gynecologist' },
        { value: 'ORTHOPEDIC', label: 'Orthopedic Surgeon' },
        { value: 'PEDIATRICIAN', label: 'Pediatrician' },
        { value: 'PSYCHIATRIST', label: 'Psychiatrist' },
        { value: 'SURGEON', label: 'General Surgeon' },
        { value: 'UROLOGIST', label: 'Urologist' },
        { value: 'OPHTHALMOLOGIST', label: 'Ophthalmologist' },
        { value: 'DENTIST', label: 'Dentist' },
        { value: 'ENDOCRINOLOGIST', label: 'Endocrinologist' },
        { value: 'GASTROENTEROLOGIST', label: 'Gastroenterologist' },
        { value: 'ONCOLOGIST', label: 'Oncologist' },
        { value: 'PULMONOLOGIST', label: 'Pulmonologist' },
        { value: 'NEPHROLOGIST', label: 'Nephrologist' },
        { value: 'RHEUMATOLOGIST', label: 'Rheumatologist' },
        { value: 'ANESTHESIOLOGIST', label: 'Anesthesiologist' },
        { value: 'RADIOLOGIST', label: 'Radiologist' },
        { value: 'PATHOLOGIST', label: 'Pathologist' },
    ];

    const experienceChoices = [
        { value: 'LESS_5', label: '<5 years' },
        { value: '5_10', label: '5-10 years' },
        { value: 'MORE_10', label: '10+ years' },
    ];

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.user_email) newErrors.user_email = 'Email is required';
        if (!formData.role) newErrors.role = 'Role is required';
        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.password) newErrors.password = 'Password is required';

        // Conditional Validation
        if (formData.role === 'DOCTOR') {
            if (!formData.fee) newErrors.fee = 'Consultation fee is required for doctors';
        }

        // Email validation
        if (formData.user_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user_email)) {
            newErrors.user_email = 'Invalid email format';
        }

        // Password validation
        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            alert('Please fix all errors before submitting');
            return;
        }

        setLoading(true);
        try {
            await staffAPI.create(formData);
            alert(`User registered successfully!`);
            navigate('/admin/users'); // Go to user list
        } catch (err) {
            console.error("Registration failed:", err);
            const msg = err.response?.data?.user_email || err.response?.data?.detail || "Registration failed. Check console matches.";
            alert(`Error: ${msg}`);
            // If backend returns field errors
            if (err.response?.data) {
                setErrors(err.response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
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
            break_start: '',

            break_end: '',
            doctor_type: '',
            experience_years: '',
            password: '',
            is_active: true
        });
        setErrors({});
    };

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
                                    <h1 className="text-2xl font-bold text-gray-900">Register New User</h1>
                                    <p className="text-sm text-gray-600 mt-1">Add new staff members to the system</p>
                                </div>
                                <button
                                    onClick={() => navigate('/admin/dashboard')}
                                    className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    ← Back
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
                                            placeholder="Dr. John Smith"
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email (Username) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="user_email"
                                            value={formData.user_email}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.user_email ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="john.smith@hospital.com"
                                        />
                                        {errors.user_email && <p className="text-red-500 text-xs mt-1">{errors.user_email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="9876543210"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            name="date_of_birth"
                                            value={formData.date_of_birth}
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
                                            value={formData.gender}
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
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            rows="2"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="Street, City, State, PIN"
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
                                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Fee (₹) <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="fee"
                                                        value={formData.fee}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        placeholder="500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Doctor Type
                                                    </label>
                                                    <select
                                                        name="doctor_type"
                                                        value={formData.doctor_type}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    >
                                                        <option value="">Select Specialization</option>
                                                        {doctorTypes.map(type => (
                                                            <option key={type.value} value={type.value}>{type.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Experience
                                                    </label>
                                                    <select
                                                        name="experience_years"
                                                        value={formData.experience_years}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    >
                                                        <option value="">Select Experience</option>
                                                        {experienceChoices.map(exp => (
                                                            <option key={exp.value} value={exp.value}>{exp.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Shift Start</label>
                                                    <input type="time" name="shift_start" value={formData.shift_start} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Shift End</label>
                                                    <input type="time" name="shift_end" value={formData.shift_end} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Break Start</label>
                                                    <input type="time" name="break_start" value={formData.break_start} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Break End</label>
                                                    <input type="time" name="break_end" value={formData.break_end} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Credentials */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-purple-600 rounded"></span>
                                    Login Credentials
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Min 6 characters"
                                        />
                                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                    </div>
                                    <div className="flex items-center">
                                        <p className="text-sm text-gray-500 italic">User ID will be auto-generated. Username will be the email address.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-4 bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Reset Form
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin/dashboard')}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {loading ? 'Registering...' : 'Register User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
