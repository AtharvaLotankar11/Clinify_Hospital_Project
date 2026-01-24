import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { patientAPI, allergyAPI, aiAPI } from '../../services/api';

export default function InteractionAlerts() {
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [allergies, setAllergies] = useState([]);
    const [newAllergy, setNewAllergy] = useState({ allergen: '', severity: 'LOW', reaction: '' });
    const [medicinesToCheck, setMedicinesToCheck] = useState([]);
    const [currentMedicine, setCurrentMedicine] = useState('');
    const [alerts, setAlerts] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Search patients
    useEffect(() => {
        if (searchTerm.length > 2) {
            const delayDebounceFn = setTimeout(async () => {
                try {
                    const response = await patientAPI.getAll({ search: searchTerm });
                    setPatients(response.data);
                } catch (error) {
                    console.error('Error searching patients:', error);
                }
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setPatients([]);
        }
    }, [searchTerm]);

    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);
        setSearchTerm('');
        setPatients([]);
        try {
            const response = await allergyAPI.getAll({ patient: patient.id });
            setAllergies(response.data);
        } catch (error) {
            console.error('Error fetching allergies:', error);
        }
    };

    const handleAddAllergy = async (e) => {
        e.preventDefault();
        if (!selectedPatient || !newAllergy.allergen) return;

        try {
            const response = await allergyAPI.create({
                ...newAllergy,
                patient: selectedPatient.id
            });
            setAllergies([...allergies, response.data]);
            setNewAllergy({ allergen: '', severity: 'LOW', reaction: '' });
        } catch (error) {
            console.error('Error adding allergy:', error);
            alert('Failed to add allergy');
        }
    };

    const handleDeleteAllergy = async (id) => {
        try {
            await allergyAPI.delete(id);
            setAllergies(allergies.filter(a => a.id !== id));
        } catch (error) {
            console.error('Error deleting allergy:', error);
        }
    };

    const handleAddMedicine = (e) => {
        e.preventDefault();
        if (currentMedicine && !medicinesToCheck.includes(currentMedicine)) {
            setMedicinesToCheck([...medicinesToCheck, currentMedicine]);
            setCurrentMedicine('');
        }
    };

    const handleRemoveMedicine = (med) => {
        setMedicinesToCheck(medicinesToCheck.filter(m => m !== med));
    };

    const handleCheckInteractions = async () => {
        if (!selectedPatient && medicinesToCheck.length < 2) {
            alert('Please select a patient or add at least two medicines to check drug-drug interactions.');
            return;
        }

        try {
            setChecking(true);
            setAlerts(null);
            const response = await aiAPI.checkInteractions(selectedPatient?.id, medicinesToCheck);
            setAlerts(response.data.alerts);
        } catch (error) {
            console.error('Error checking interactions:', error);
            const errorMessage = error.response?.data?.error || 'Failed to check interactions. Please try again.';
            alert(errorMessage);
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            <Sidebar role="pharmacy" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Pharmacist'} userRole="Pharmacy" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Allergy & Interaction Alerts</h1>
                                    <p className="text-sm text-gray-600 mt-1">Check for drug-drug and drug-allergy interactions using AI</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Panel - Patient Search & Allergies */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Patient Selection</h2>
                                    <div className="relative mb-4">
                                        <input
                                            type="text"
                                            placeholder="Search Patient (Name, UHID, Phone)..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                        />
                                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>

                                        {patients.length > 0 && (
                                            <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                                {patients.map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => handleSelectPatient(p)}
                                                        className="p-3 hover:bg-emerald-50 cursor-pointer border-b last:border-0"
                                                    >
                                                        <div className="font-semibold text-gray-900">{p.name}</div>
                                                        <div className="text-xs text-gray-500">{p.uhid} | {p.phone}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {selectedPatient && (
                                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-emerald-900">{selectedPatient.name}</p>
                                                    <p className="text-xs text-emerald-700">UHID: {selectedPatient.uhid}</p>
                                                    <p className="text-xs text-emerald-700">Age/Gender: {selectedPatient.age}/{selectedPatient.gender}</p>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedPatient(null)}
                                                    className="text-emerald-700 hover:text-emerald-900"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedPatient && (
                                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                        <h2 className="text-lg font-bold text-gray-900 mb-4">Patient Allergies</h2>

                                        <div className="space-y-3 mb-6">
                                            {allergies.map(a => (
                                                <div key={a.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-lg">
                                                    <div>
                                                        <p className="font-semibold text-red-900">{a.allergen}</p>
                                                        <p className="text-xs text-red-700">Severity: {a.severity}</p>
                                                        {a.reaction && <p className="text-xs text-red-600">Reaction: {a.reaction}</p>}
                                                    </div>
                                                    <button onClick={() => handleDeleteAllergy(a.id)} className="text-red-400 hover:text-red-700">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                            {allergies.length === 0 && <p className="text-gray-500 text-sm italic">No known allergies recorded.</p>}
                                        </div>

                                        <form onSubmit={handleAddAllergy} className="space-y-3">
                                            <input
                                                type="text"
                                                placeholder="Allergen (e.g. Penicillin)"
                                                value={newAllergy.allergen}
                                                onChange={(e) => setNewAllergy({ ...newAllergy, allergen: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                required
                                            />
                                            <select
                                                value={newAllergy.severity}
                                                onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            >
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                                <option value="CRITICAL">Critical</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Reaction (optional)"
                                                value={newAllergy.reaction}
                                                onChange={(e) => setNewAllergy({ ...newAllergy, reaction: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                            >
                                                Add Allergy
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>

                            {/* Middle & Right Panel - Medicine Selection & AI Alerts */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Medicines to Check</h2>
                                    <form onSubmit={handleAddMedicine} className="flex gap-3 mb-6">
                                        <input
                                            type="text"
                                            placeholder="Enter Medicine Name (e.g. Aspirin, Warfarin)..."
                                            value={currentMedicine}
                                            onChange={(e) => setCurrentMedicine(e.target.value)}
                                            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 outline-none"
                                        />
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </form>

                                    <div className="flex flex-wrap gap -3 mb-8">
                                        {medicinesToCheck.map(med => (
                                            <div key={med} className="flex items-center gap-2 px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700">
                                                {med}
                                                <button onClick={() => handleRemoveMedicine(med)} className="text-gray-400 hover:text-red-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                        {medicinesToCheck.length === 0 && <p className="text-gray-400 text-sm">No medicines added yet.</p>}
                                    </div>

                                    <button
                                        onClick={handleCheckInteractions}
                                        disabled={checking || (medicinesToCheck.length === 0 && !selectedPatient)}
                                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${checking || (medicinesToCheck.length === 0 && !selectedPatient)
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-orange-500/30'
                                            }`}
                                    >
                                        {checking ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Analyzing Interactions...
                                            </span>
                                        ) : 'Run AI Interaction Check'}
                                    </button>
                                </div>

                                {alerts && (
                                    <div className="bg-white rounded-xl shadow-md border-l-8 border-red-500 p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900">AI Analysis Results</h2>
                                        </div>
                                        <div className="prose prose-red max-w-none text-gray-800 whitespace-pre-wrap">
                                            {alerts}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
