import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { visitAPI, patientAPI, staffAPI } from '../../services/api';

export default function CreateVisit() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedVisitId, setSelectedVisitId] = useState(null);
    const [patientVisits, setPatientVisits] = useState([]); // List of visits for selected patient
    const [doctors, setDoctors] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]); // Store plain list of booked slots
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [allPatients, setAllPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(true);

    // Fetch doctors and patients on mount
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await staffAPI.getAll({ role: 'DOCTOR' });
                setDoctors(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error("Failed to fetch doctors", err);
            }
        };

        const fetchPatients = async () => {
            try {
                setLoadingPatients(true);
                const response = await patientAPI.getAll();
                setAllPatients(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error("Failed to fetch patients", err);
            } finally {
                setLoadingPatients(false);
            }
        };

        fetchDoctors();
        fetchPatients();
    }, []);

    const defaultForm = {
        patientId: '',
        visitType: '',
        doctorId: '',
        visitDate: new Date().toISOString().split('T')[0],
        visitTime: '',
        chiefComplaint: '',
        notes: '',
        referralType: 'NONE',
        referralDoctorId: '',
        referralExternalName: '',
        severity: 'NORMAL',
    };

    const [formData, setFormData] = useState(defaultForm);

    // Emergency Logic: Auto-set Date/Time
    useEffect(() => {
        if (formData.visitType === 'EMERGENCY') {
            const now = new Date();
            const date = now.toISOString().split('T')[0];
            const time = now.toTimeString().slice(0, 5); // HH:MM
            setFormData(prev => ({
                ...prev,
                visitDate: date,
                visitTime: time
            }));
        }
    }, [formData.visitType]);

    // Fetch Booked Slots when Doctor or Date changes
    useEffect(() => {
        const fetchSlots = async () => {
            if (!formData.doctorId || !formData.visitDate || formData.visitType === 'EMERGENCY') return;

            setLoadingSlots(true);
            try {
                // Get standard slots for this doctor
                const selectedDoctor = doctors.find(d => d.user_id.toString() === formData.doctorId.toString());
                const standardSlots = selectedDoctor?.available_slots || [];

                // Fetch booked slots from backend
                const response = await visitAPI.getBookedSlots(formData.doctorId, formData.visitDate);
                const booked = response.data || [];
                setBookedSlots(booked);

                // Filter available slots
                setAvailableSlots(standardSlots);
            } catch (err) {
                console.error("Failed to fetch slots", err);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [formData.doctorId, formData.visitDate, formData.visitType, doctors]);

    const handleAutoBook = async () => {
        if (!selectedPatient) {
            alert("Please select a patient first.");
            return;
        }
        if (!formData.chiefComplaint) {
            alert("Please enter a Chief Complaint for AI triage.");
            return;
        }

        setLoading(true);
        try {
            const response = await visitAPI.autoBook({
                patient_id: selectedPatient.id,
                chief_complaint: formData.chiefComplaint,
                severity: formData.severity || 'NORMAL'
            });

            const d = response.data;
            alert(`Auto-Booking Successful!\n\nPatient: ${selectedPatient.name}\nSeverity: ${d.severity}\nDoctor: Dr. ${d.doctor} (${d.specialization})\nTime: ${d.date} ${d.time}\n\nReasoning: ${d.ai_reasoning}`);

            const res = await visitAPI.getAll({ patient: selectedPatient.id });
            setPatientVisits(res.data || []);
            setFormData(prev => ({ ...defaultForm, patientId: selectedPatient.id }));
            setSelectedPatient(null);

        } catch (error) {
            console.error("Auto book error", error);
            alert(error.response?.data?.error || "Auto-booking failed. Please check backend.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 2) {
            try {
                const response = await patientAPI.getAll({ search: term });
                setSearchResults(response.data || []);
            } catch (err) { /*...*/ }
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);
        setFormData(prev => ({ ...prev, patientId: patient.id }));
        setSearchResults([]);
        setSearchTerm('');
        setSelectedVisitId(null);
        setFormData(prev => ({ ...defaultForm, patientId: patient.id }));

        // Fetch visits
        try {
            const res = await visitAPI.getAll({ patient: patient.id }); // Standard filtering
            setPatientVisits(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); }
    };

    const handleEditVisit = (visit) => {
        setSelectedVisitId(visit.id);
        setFormData({
            patientId: visit.patient_id || selectedPatient.id,
            visitType: visit.visit_type,
            doctorId: visit.doctor_id || visit.doctor?.user_id || visit.doctor, // Handle nesting variations
            visitDate: visit.visit_date,
            visitTime: visit.slot_booked, // Or time field
            chiefComplaint: visit.chief_complaint,
            notes: visit.notes || '',
            referralType: visit.referral_doctor ? 'INTERNAL' : (visit.referral_external ? 'EXTERNAL' : 'NONE'),
            referralDoctorId: visit.referral_doctor?.user_id || visit.referral_doctor || '',
            referralExternalName: visit.referral_external || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteVisit = async (id) => {
        if (!window.confirm("Are you sure you want to delete this visit?")) return;
        try {
            await visitAPI.delete(id);
            setPatientVisits(prev => prev.filter(v => v.id !== id));
            if (selectedVisitId === id) {
                setSelectedVisitId(null);
                setFormData(prev => ({ ...defaultForm, patientId: selectedPatient.id }));
            }
        } catch (e) {
            console.error(e);
            alert("Failed to delete visit");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Prepare Payload
        const payload = {
            patient_id: selectedPatient.id,
            doctor_id: formData.doctorId,
            visit_type: formData.visitType,
            visit_date: formData.visitDate,
            slot_booked: formData.visitTime, // sending raw time for now
            status: 'ACTIVE',
            chief_complaint: formData.chiefComplaint,
            notes: formData.notes,
            referral_doctor_id: formData.referralType === 'INTERNAL' ? formData.referralDoctorId : null,
            referral_external: formData.referralType === 'EXTERNAL' ? formData.referralExternalName : null
        };

        try {
            if (selectedVisitId) {
                await visitAPI.update(selectedVisitId, payload);
                setSuccess('Visit updated successfully!');
            } else {
                await visitAPI.create(payload);
                setSuccess('Visit created successfully!');
            }
            // Refresh visits list
            const res = await visitAPI.getAll({ patient: selectedPatient.id });
            setPatientVisits(res.data || []);

            // Don't auto-navigate away, just reset form so they can see result or add another
            setTimeout(() => {
                setSuccess('');
                if (!selectedVisitId) setFormData(prev => ({ ...defaultForm, patientId: selectedPatient.id }));
            }, 2000);

        } catch (err) {
            console.error(err);
            // Handle slot validation error specifically
            if (err.response?.data?.slot_booked) {
                setError(`Slot Error: ${err.response.data.slot_booked}`);
            } else {
                setError(err.response?.data?.message || 'Failed to create visit. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 medical-theme">
            <Sidebar role="reception" />

            <div className="ml-72 transition-all duration-300">
                <Header userName="Receptionist" userRole="Reception" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="card-medical p-8">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{selectedVisitId ? 'Edit Visit' : 'Create / Edit Visit'}</h1>
                                    <p className="text-sm text-gray-600 mt-1">Manage patient visits</p>
                                </div>
                            </div>
                        </div>

                        {/* Success Message */}
                        {success && (
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 animate-fadeIn">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-blue-700 font-bold">{success}</p>
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

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Patient Search */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="card-medical p-6">
                                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Search Patient</h2>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={handleSearch}
                                            placeholder="Name, ID, or Phone..."
                                            className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium"
                                        />
                                        <button
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 rounded-md transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Search Results */}
                                    {searchResults.length > 0 && (
                                        <div className="mt-4 border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-50">
                                            {searchResults.map((patient) => (
                                                <button
                                                    key={patient.id}
                                                    onClick={() => handleSelectPatient(patient)}
                                                    className="w-full p-4 text-left hover:bg-blue-50/50 transition-colors"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800">{patient.name}</p>
                                                            <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">ID: {patient.id} • Age: {patient.age}</p>
                                                        </div>
                                                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">{patient.uhid || 'No UHID'}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* All Patients List - shown when no search is active */}
                                    {searchResults.length === 0 && !selectedPatient && (
                                        <div className="mt-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    All Patients ({allPatients.length})
                                                </h3>
                                            </div>
                                            {loadingPatients ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <svg className="animate-spin h-6 w-6 text-emerald-500" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                </div>
                                            ) : allPatients.length > 0 ? (
                                                <div className="border border-gray-100 rounded-lg overflow-hidden max-h-96 overflow-y-auto custom-scrollbar">
                                                    {allPatients.map((patient) => (
                                                        <button
                                                            key={patient.id}
                                                            onClick={() => handleSelectPatient(patient)}
                                                            className="w-full p-4 text-left hover:bg-blue-50/50 transition-colors border-b border-gray-50 last:border-b-0 group"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                                                        {patient.name}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-500 font-medium uppercase mt-1">
                                                                        ID: {patient.id} • Age: {patient.age} • {patient.gender}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                                        📞 {patient.phone}
                                                                    </p>
                                                                </div>
                                                                <svg className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-400">
                                                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    <p className="text-xs font-medium">No patients registered yet</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Selected Patient Card */}
                                    {selectedPatient && (
                                        <div className="mt-4 space-y-4">
                                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{selectedPatient.name}</p>
                                                    <p className="text-[10px] text-blue-600 font-bold uppercase mt-0.5">
                                                        ID: {selectedPatient.id} • UHID: {selectedPatient.uhid || 'N/A'}
                                                    </p>
                                                </div>
                                                <button onClick={() => { setSelectedPatient(null); setFormData(defaultForm); setSelectedVisitId(null); }} className="text-gray-400 hover:text-red-500">
                                                    Change
                                                </button>
                                            </div>

                                            {/* Visit History List */}
                                            {patientVisits.length > 0 && (
                                                <div className="border border-gray-100 rounded-lg overflow-hidden">
                                                    <div className="bg-gray-50 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">Existing Visits</div>
                                                    <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                                                        {patientVisits.map(v => (
                                                            <div key={v.id} className={`p-3 text-xs flex justify-between items-center ${selectedVisitId === v.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                                                <div>
                                                                    <div className="font-bold text-gray-700">{v.visit_date} <span className="text-[10px] bg-white border px-1 rounded ml-1">{v.visit_type}</span></div>
                                                                    <div className="text-gray-500 mt-0.5">{v.doctor?.name || 'Doctor'} • {v.status}</div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button type="button" onClick={() => handleEditVisit(v)} className="text-blue-600 font-bold hover:underline">Edit</button>
                                                                    <button type="button" onClick={() => handleDeleteVisit(v.id)} className="text-red-600 font-bold hover:underline">Del</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Visit Form */}
                            <div className="lg:col-span-2">
                                <form onSubmit={handleSubmit} className="card-medical p-8 space-y-8">
                                    <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-6 h-px bg-blue-200"></span>
                                        Visit Details
                                    </h2>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Visit Type *</label>
                                            <select
                                                name="visitType"
                                                required
                                                value={formData.visitType}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium"
                                            >
                                                <option value="">Select Visit Type</option>
                                                <option value="OPD">OPD - Outpatient</option>
                                                <option value="IPD">IPD - Inpatient</option>
                                                <option value="EMERGENCY">Emergency</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Assign Doctor *</label>
                                            <select
                                                name="doctorId"
                                                required
                                                value={formData.doctorId}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium"
                                            >
                                                <option value="">Select Doctor</option>
                                                {doctors.map(doctor => (
                                                    <option key={doctor.user_id} value={doctor.user_id}>
                                                        {doctor.name} - {doctor.department}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Visit Date *</label>
                                            <input
                                                type="date"
                                                name="visitDate"
                                                required
                                                value={formData.visitDate}
                                                onChange={handleChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Visit Time / Slot *</label>
                                            {formData.visitType === 'EMERGENCY' ? (
                                                <input
                                                    type="text"
                                                    name="visitTime"
                                                    disabled
                                                    value={formData.visitTime}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 text-sm font-medium"
                                                />
                                            ) : (
                                                <select
                                                    name="visitTime"
                                                    required
                                                    value={formData.visitTime}
                                                    onChange={handleChange}
                                                    disabled={!formData.doctorId || !formData.visitDate || loadingSlots}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium disabled:bg-gray-50 disabled:text-gray-400"
                                                >
                                                    <option value="">{loadingSlots ? 'Loading slots...' : 'Select a Time Slot'}</option>
                                                    {availableSlots.length > 0 ? (
                                                        availableSlots.map((slot, index) => {
                                                            const isBooked = bookedSlots.includes(slot);
                                                            return (
                                                                <option key={index} value={slot} disabled={isBooked} className={isBooked ? 'text-gray-300 bg-gray-50' : ''}>
                                                                    {slot} {isBooked ? '(Booked)' : ''}
                                                                </option>
                                                            );
                                                        })
                                                    ) : (
                                                        <option value="" disabled>No slots configured for this doctor</option>
                                                    )}
                                                </select>
                                            )}
                                        </div>

                                        <div className="md:col-span-2 space-y-3 pt-2 border-t border-gray-100">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Referral (Optional)</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                    <input type="radio" name="referralType" value="NONE" checked={formData.referralType === 'NONE'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                                                    None
                                                </label>
                                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                    <input type="radio" name="referralType" value="INTERNAL" checked={formData.referralType === 'INTERNAL'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                                                    Internal Doctor
                                                </label>
                                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                    <input type="radio" name="referralType" value="EXTERNAL" checked={formData.referralType === 'EXTERNAL'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                                                    External / Other
                                                </label>
                                            </div>

                                            {formData.referralType === 'INTERNAL' && (
                                                <select
                                                    name="referralDoctorId"
                                                    value={formData.referralDoctorId}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium"
                                                >
                                                    <option value="">Select Referring Doctor</option>
                                                    {doctors.map(doctor => (
                                                        <option key={doctor.user_id} value={doctor.user_id}>
                                                            {doctor.name} - {doctor.department}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {formData.referralType === 'EXTERNAL' && (
                                                <input
                                                    type="text"
                                                    name="referralExternalName"
                                                    value={formData.referralExternalName}
                                                    onChange={handleChange}
                                                    placeholder="Enter doctor or hospital name..."
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium"
                                                />
                                            )}
                                        </div>

                                        <div className="md:col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Chief Complaint *</label>
                                            <textarea
                                                name="chiefComplaint"
                                                required
                                                value={formData.chiefComplaint}
                                                onChange={handleChange}
                                                rows="2"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium resize-none"
                                                placeholder="Provide details of the complaint..."
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Severity (For AI Triage)</label>
                                            <select
                                                name="severity"
                                                value={formData.severity || 'NORMAL'}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium"
                                            >
                                                <option value="NORMAL">Normal (Mild Symptoms)</option>
                                                <option value="MODERATE">Moderate (Discomfort)</option>
                                                <option value="CRITICAL">Critical (Severe Pain/Emergency)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData({
                                                    patientId: selectedPatient ? selectedPatient.id : '',
                                                    visitType: '',
                                                    doctorId: '',
                                                    visitDate: new Date().toISOString().split('T')[0],
                                                    visitTime: '',
                                                    chiefComplaint: '',
                                                    notes: '',
                                                    referralType: 'NONE',
                                                    referralDoctorId: '',
                                                    referralExternalName: '',
                                                });
                                                setSelectedVisitId(null);
                                            }}
                                            className="px-6 py-2 border border-gray-200 text-gray-600 text-[10px] font-bold rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAutoBook}
                                            disabled={loading || !selectedPatient}
                                            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-bold rounded-xl shadow-md hover:from-purple-600 hover:to-indigo-700 hover:shadow-lg transition-all uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            Auto-Book with AI
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || !selectedPatient}
                                            className="btn-medical-primary flex items-center gap-2"
                                        >
                                            {loading ? 'Saving...' : (selectedVisitId ? 'Update Visit' : 'Create Visit')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
