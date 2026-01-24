import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { admissionAPI, visitAPI, bedAPI, patientAPI } from '../../services/api';

export default function AdmissionManagement() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Selection State
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedAdmission, setSelectedAdmission] = useState(null);

    // Data State
    const [activeVisits, setActiveVisits] = useState([]);
    const [availableBeds, setAvailableBeds] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        visitId: '',
        bedId: '',
        admissionDate: new Date().toISOString().slice(0, 16), // datetime-local format
        dischargeDate: '',
    });

    // Load available beds on mount
    useEffect(() => {
        const fetchBeds = async () => {
            try {
                const response = await bedAPI.getAll();
                const beds = Array.isArray(response.data) ? response.data : [];
                setAvailableBeds(beds);
            } catch (err) {
                console.error("Failed to fetch beds", err);
            }
        };
        fetchBeds();
    }, []);

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchTerm(query);

        if (query.length > 2) {
            try {
                const response = await patientAPI.getAll({ search: query });
                setSearchResults(response.data || []);
                if ((response.data || []).length === 0) setError(''); // Clear error if no results, let UI handle empty state
            } catch (err) {
                console.error("Search failed", err);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);
        setSearchResults([]);
        setSearchTerm('');
        setLoading(true);
        setActiveVisits([]);
        setSelectedAdmission(null);

        try {
            // Get patient visits
            const visitsRes = await visitAPI.getAll({ patient: patient.id });
            const visits = Array.isArray(visitsRes.data) ? visitsRes.data : [];
            const eligible = visits.filter(v => v.status === 'ACTIVE' || v.status === 'COMPLETED');

            // Get patient admissions
            const admitRes = await admissionAPI.getAll();
            const allAdmissions = Array.isArray(admitRes.data) ? admitRes.data : [];
            const patientAdmissions = allAdmissions.filter(a => (a.visit.patient === patient.id || a.visit.patient?.id === patient.id));

            // Map status
            const visitsWithStatus = eligible.map(v => {
                const admission = patientAdmissions.find(a => a.visit.id === v.id || a.visit === v.id);
                return { ...v, existingAdmission: admission };
            });

            setActiveVisits(visitsWithStatus);

        } catch (err) {
            console.error(err);
            setError("Failed to load patient details");
        } finally {
            setLoading(false);
        }
    };

    const handlePrepareForm = (visit, admission = null) => {
        if (admission) {
            setSelectedAdmission(admission);
            setFormData({
                visitId: visit.id,
                bedId: admission.bed,
                admissionDate: admission.admission_date ? admission.admission_date.slice(0, 16) : '',
                dischargeDate: admission.discharge_date ? admission.discharge_date.slice(0, 16) : '',
            });
        } else {
            setSelectedAdmission(null);
            setFormData({
                visitId: visit.id,
                bedId: '',
                admissionDate: new Date().toISOString().slice(0, 16),
                dischargeDate: '',
            });
        }
        // Scroll to form only if needed, but usually visible
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                visit_id: formData.visitId,
                bed_id: formData.bedId,
                admission_date: formData.admissionDate,
                discharge_date: formData.dischargeDate || null,
            };

            if (selectedAdmission) {
                await admissionAPI.update(selectedAdmission.admission_id, payload);
                setSuccess("Admission updated successfully");
            } else {
                await admissionAPI.create(payload);
                setSuccess("Patient admitted successfully");
            }

            setTimeout(() => {
                navigate('/reception/dashboard');
            }, 2000);

        } catch (err) {
            console.error("Submit failed", err);
            setError("Failed to save admission. " + (err.response?.data?.message || err.message));
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
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
                            <h1 className="text-2xl font-bold text-gray-900 border-b pb-4 mb-4">Create / Edit Admission</h1>

                            {success && <div className="p-4 mb-4 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-100">{success}</div>}
                            {error && <div className="p-4 mb-4 bg-red-50 text-red-700 font-bold rounded-lg border border-red-100">{error}</div>}

                            {/* Search */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Search Patient</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        placeholder="Name, ID, or Phone..."
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none pr-10"
                                    />
                                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>
                                {searchResults.length > 0 && (
                                    <ul className="mt-2 text-sm border rounded-lg divide-y bg-white shadow-lg overflow-hidden">
                                        {searchResults.map(p => (
                                            <li key={p.id} onClick={() => handleSelectPatient(p)} className="p-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center group">
                                                <div>
                                                    <span className="font-bold text-gray-800 block">{p.name}</span>
                                                    <span className="text-gray-500 text-xs">{p.phone} (ID: {p.id})</span>
                                                </div>
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{p.uhid || 'No UHID'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Patient Details & Visits */}
                            {selectedPatient && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg text-emerald-800">{selectedPatient.name}</h3>
                                            <p className="text-sm text-emerald-600">ID: {selectedPatient.id} • UHID: {selectedPatient.uhid || 'N/A'} • {selectedPatient.gender}, {selectedPatient.age}y</p>
                                        </div>
                                        <button onClick={() => setSelectedPatient(null)} className="text-sm text-red-500 underline">Change</button>
                                    </div>

                                    <h3 className="text-sm font-bold text-gray-500 uppercase">Select Visit to Admit</h3>
                                    {activeVisits.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No active visits found.</p>
                                    ) : (
                                        <div className="grid gap-4">
                                            {activeVisits.map(visit => (
                                                <div key={visit.id} className={`p-4 border rounded-xl flex justify-between items-center ${visit.existingAdmission ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                                                    <div>
                                                        <div className="font-bold text-gray-800">{visit.visit_type} Visit on {visit.visit_date}</div>
                                                        <div className="text-xs text-gray-500">{visit.chief_complaint}</div>
                                                        {visit.existingAdmission && (
                                                            <div className="text-xs font-bold text-blue-600 mt-1">
                                                                Current Bed: {availableBeds.find(b => b.bed_id == visit.existingAdmission.bed)?.bed_number || visit.existingAdmission.bed}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handlePrepareForm(visit, visit.existingAdmission)}
                                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${visit.existingAdmission ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}
                                                    >
                                                        {visit.existingAdmission ? 'Edit Admission' : 'Admit Patient'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Form */}
                            {formData.visitId && selectedPatient && (
                                <form onSubmit={handleSubmit} className="mt-8 pt-8 border-t border-gray-100 space-y-6 animate-slideUp">
                                    <h3 className="font-bold text-lg text-gray-900">{selectedAdmission ? 'Update Admission' : 'New Admission'}</h3>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Assigned Bed</label>
                                            <select
                                                required
                                                value={formData.bedId}
                                                onChange={e => setFormData(prev => ({ ...prev, bedId: e.target.value }))}
                                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 outline-none"
                                            >
                                                <option value="">Select Bed</option>
                                                {availableBeds.map(bed => (
                                                    <option
                                                        key={bed.bed_id}
                                                        value={bed.bed_id}
                                                        disabled={bed.status === 'OCCUPIED' && (!selectedAdmission || selectedAdmission.bed != bed.bed_id)}
                                                    >
                                                        {bed.bed_type || 'General'} | Ward {bed.ward} - Bed {bed.bed_number} ({bed.status}) [{bed.cleaning_status?.replace('_', ' ') || 'CLEANED'}]
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Admission Time</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={formData.admissionDate}
                                                onChange={e => setFormData(prev => ({ ...prev, admissionDate: e.target.value }))}
                                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                        </div>

                                        {selectedAdmission && (
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Discharge Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={formData.dischargeDate}
                                                    onChange={e => setFormData(prev => ({ ...prev, dischargeDate: e.target.value }))}
                                                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-4">
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, visitId: '' }))} className="px-6 py-2 border rounded-lg font-bold text-gray-500">Cancel</button>
                                        <button type="submit" disabled={loading} className="px-8 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700">
                                            {loading ? 'Saving...' : (selectedAdmission ? 'Update Admission' : 'Confirm Admission')}
                                        </button>
                                    </div>
                                </form>
                            )}

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
