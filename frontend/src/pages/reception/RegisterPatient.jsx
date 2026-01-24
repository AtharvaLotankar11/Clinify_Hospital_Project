import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { patientAPI } from '../../services/api';

export default function RegisterPatient() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState(null);

    const [formData, setFormData] = useState({
        // Personal Information
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        age: '',
        gender: '',
        bloodGroup: '',
        aadhaar: '',

        // Contact Information
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',

        // Emergency Contact
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',

        // Medical History
        allergies: '',
        chronicConditions: '',
        currentMedications: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-calculate age from DOB
        if (name === 'dateOfBirth' && value) {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            setFormData(prev => ({ ...prev, age: age.toString() }));
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            setIsSearching(true);
            try {
                const response = await patientAPI.getAll({ search: query });
                setSearchResults(response.data);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const selectPatient = (patient) => {
        setSelectedPatientId(patient.id);

        // Parse medical history
        let allergies = '';
        let conditions = '';
        let medications = '';

        if (patient.medical_history) {
            const lines = patient.medical_history.split('\n');
            lines.forEach(line => {
                if (line.startsWith('Allergies:')) allergies = line.replace('Allergies:', '').trim();
                if (line.startsWith('Conditions:')) conditions = line.replace('Conditions:', '').trim();
                if (line.startsWith('Medications:')) medications = line.replace('Medications:', '').trim();
            });
        }

        // Parse emergency contact if formatted as "Name (Relation)"
        let eName = patient.emergency_contact_name || '';
        let eRelation = '';
        if (eName.includes('(') && eName.endsWith(')')) {
            const parts = eName.split('(');
            eRelation = parts.pop().replace(')', '').trim();
            eName = parts.join('(').trim();
        }

        // Parse address to try extracting city/state/pin if properly formatted
        // Expected: "Address, City, State - Pincode"
        let address = patient.address || '';
        let city = '';
        let state = '';
        let pincode = '';

        if (address.includes('-')) {
            const parts = address.split('-');
            pincode = parts.pop().trim();
            const rest = parts.join('-').trim();
            if (rest.includes(',')) {
                const locationParts = rest.split(',');
                if (locationParts.length >= 3) {
                    state = locationParts.pop().trim();
                    city = locationParts.pop().trim();
                    address = locationParts.join(',').trim();
                }
            }
        }

        // Handle "None" values
        if (allergies === 'None') allergies = '';
        if (conditions === 'None') conditions = '';
        if (medications === 'None') medications = '';

        setFormData({
            firstName: patient.name.split(' ')[0] || '',
            lastName: patient.name.split(' ').slice(1).join(' ') || '',
            dateOfBirth: patient.date_of_birth || '', // Make sure backend guarantees this format or handle it
            age: patient.age.toString(),
            gender: patient.gender,
            bloodGroup: patient.blood_group || '',
            aadhaar: patient.aadhaar || '',
            phone: patient.phone,
            email: patient.email || '',
            address: address,
            city: city,
            state: state,
            pincode: pincode,
            emergencyContactName: eName,
            emergencyContactPhone: patient.emergency_contact_phone || '',
            emergencyContactRelation: eRelation,
            allergies: allergies,
            chronicConditions: conditions,
            currentMedications: medications,
        });
        setSearchResults([]);
        setSearchQuery('');
    };

    const clearForm = () => {
        setSelectedPatientId(null);
        setFormData({
            firstName: '', lastName: '', dateOfBirth: '', age: '', gender: '', bloodGroup: '', aadhaar: '',
            phone: '', email: '', address: '', city: '', state: '', pincode: '',
            emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
            allergies: '', chronicConditions: '', currentMedications: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Client-side validation
        if (formData.phone.length > 10) {
            setError("Phone number cannot exceed 10 digits.");
            setLoading(false);
            return;
        }

        // Format data for backend
        const contactRelation = formData.emergencyContactRelation ? ` (${formData.emergencyContactRelation})` : '';
        const patientData = {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            age: parseInt(formData.age) || 0,
            gender: formData.gender,
            phone: formData.phone,
            email: formData.email,
            blood_group: formData.bloodGroup,
            aadhaar: formData.aadhaar,
            date_of_birth: formData.dateOfBirth,
            address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
            emergency_contact_name: `${formData.emergencyContactName}${contactRelation}`,
            emergency_contact_phone: formData.emergencyContactPhone,
            medical_history: `Allergies: ${formData.allergies || 'None'}\nConditions: ${formData.chronicConditions || 'None'}\nMedications: ${formData.currentMedications || 'None'}`
        };

        try {
            if (selectedPatientId) {
                await patientAPI.update(selectedPatientId, patientData);
                setSuccess(true);
                // Keep on page or redirect? Usually reset for next patient or stay to confirm?
                // Let's reset after delay
                setTimeout(() => {
                    setSuccess(false);
                    clearForm();
                }, 2000);
            } else {
                await patientAPI.create(patientData);
                setSuccess(true);
                setTimeout(() => {
                    navigate('/reception/dashboard');
                }, 2000);
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data) {
                // Formatting DRF errors which are typically { field: ["error1"], field2: ["error"] }
                const apiErrors = Object.entries(err.response.data)
                    .map(([key, msgs]) => `${key}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`)
                    .join(' | ');
                setError(apiErrors || 'Failed to register patient. Please check your inputs.');
            } else {
                setError('Failed to register patient. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            <Sidebar role="reception" />

            <div className="ml-72 transition-all duration-300">
                <Header userName="Receptionist" userRole="Reception" />

                <main className="p-6">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
                            <div className="flex items-center justify-between gap-5">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">{selectedPatientId ? 'Edit Patient Details' : 'Register New Patient'}</h1>
                                        <p className="text-sm text-gray-600 mt-1">{selectedPatientId ? 'Update existing patient record' : 'Fill in the patient details to create a new record'}</p>
                                    </div>
                                </div>

                                <div className="relative w-96">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={handleSearch}
                                            placeholder="Search patient by Name or ID..."
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm"
                                        />
                                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        {isSearching && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <svg className="animate-spin h-4 w-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto z-50">
                                            {searchResults.map((patient) => (
                                                <div
                                                    key={patient.id}
                                                    onClick={() => selectPatient(patient)}
                                                    className="p-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800">{patient.name}</p>
                                                            <p className="text-xs text-gray-500">{patient.phone} | {patient.gender}, {patient.age}y</p>
                                                        </div>
                                                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 block text-right">
                                                            ID: {patient.id}<br />
                                                            <span className="text-[10px] text-emerald-600 font-bold">{patient.uhid || ''}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Success Message */}
                        {success && (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-fadeIn">
                                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-emerald-700 font-bold">
                                    {selectedPatientId
                                        ? 'Patient details updated successfully!'
                                        : 'Patient registered successfully! Redirecting...'}
                                </p>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-red-700 font-bold">{error}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-gray-100 p-8 space-y-10">
                            {/* Personal Information */}
                            <section>
                                <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-6 h-px bg-emerald-200"></span>
                                    Personal Information
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">First Name *</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            required
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Last Name *</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            required
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Date of Birth *</label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            required
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Age</label>
                                        <input
                                            type="number"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium outline-none"
                                            placeholder="Auto-calculated"
                                            readOnly
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Gender *</label>
                                        <select
                                            name="gender"
                                            required
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Blood Group</label>
                                        <select
                                            name="bloodGroup"
                                            value={formData.bloodGroup}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                        >
                                            <option value="">Select Blood Group</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Aadhar ID</label>
                                        <input
                                            type="text"
                                            name="aadhaar"
                                            value={formData.aadhaar}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                            placeholder="Enter 12-digit Aadhar ID"
                                            maxLength="12"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Contact Information */}
                            <section>
                                <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-6 h-px bg-teal-200"></span>
                                    Contact Information
                                </h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Address *</label>
                                        <input
                                            type="text"
                                            name="address"
                                            required
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                            placeholder="Enter full address"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 md:col-span-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">City *</label>
                                            <input
                                                type="text"
                                                name="city"
                                                required
                                                value={formData.city}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                                placeholder="City"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">State *</label>
                                            <input
                                                type="text"
                                                name="state"
                                                required
                                                value={formData.state}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                                placeholder="State"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Pincode *</label>
                                            <input
                                                type="text"
                                                name="pincode"
                                                required
                                                value={formData.pincode}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                                placeholder="Pincode"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Emergency Contact */}
                            <section>
                                <h2 className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-6 h-px bg-cyan-200"></span>
                                    Emergency Contact
                                </h2>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Contact Name *</label>
                                        <input
                                            type="text"
                                            name="emergencyContactName"
                                            required
                                            value={formData.emergencyContactName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                            placeholder="Contact name"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Phone *</label>
                                        <input
                                            type="tel"
                                            name="emergencyContactPhone"
                                            required
                                            value={formData.emergencyContactPhone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                            placeholder="Contact phone"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Relationship *</label>
                                        <input
                                            type="text"
                                            name="emergencyContactRelation"
                                            required
                                            value={formData.emergencyContactRelation}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                            placeholder="e.g. Spouse"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Medical History */}
                            <section>
                                <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-6 h-px bg-amber-200"></span>
                                    Medical History
                                </h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Allergies</label>
                                        <textarea
                                            name="allergies"
                                            value={formData.allergies}
                                            onChange={handleChange}
                                            rows="2"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium resize-none"
                                            placeholder="List any known allergies"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Chronic Conditions</label>
                                        <textarea
                                            name="chronicConditions"
                                            value={formData.chronicConditions}
                                            onChange={handleChange}
                                            rows="2"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium resize-none"
                                            placeholder="e.g. Diabetes, Hypertension"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Current Medications</label>
                                        <textarea
                                            name="currentMedications"
                                            value={formData.currentMedications}
                                            onChange={handleChange}
                                            rows="2"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium resize-none"
                                            placeholder="List any current medications"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Form Actions */}
                            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                {selectedPatientId && (
                                    <button
                                        type="button"
                                        onClick={clearForm}
                                        className="px-6 py-2 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50 transition-all uppercase tracking-wider"
                                    >
                                        Exit Edit Mode
                                    </button>
                                )}
                                <div className="flex items-center gap-3 ml-auto">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/reception/dashboard')}
                                        className="px-6 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all uppercase tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                {selectedPatientId ? 'Updating...' : 'Registering...'}
                                            </>
                                        ) : (
                                            selectedPatientId ? 'Update Patient' : 'Register Patient'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
