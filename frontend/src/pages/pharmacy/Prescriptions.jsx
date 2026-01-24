import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Prescriptions() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Fetch prescriptions from backend
    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                setLoading(true);

                // Import API functions
                const { prescriptionAPI } = await import('../../services/api');

                // Fetch all prescriptions
                const data = await prescriptionAPI.getAll();

                // Transform data to match UI expectations
                const transformedData = data.map(p => ({
                    id: p.prescription_id,
                    patientName: p.patient_name,
                    patientId: p.patient_id,
                    doctor: p.doctor_name,
                    date: p.visit_date,
                    status: p.status.toLowerCase(),
                    medicine: p.medicine,
                    dosage: `${p.dosage_per_day} doses per day`,
                    duration: `${p.duration} days`,
                    quantity: p.quantity,
                    created_at: p.created_at,
                    dispensed_at: p.dispensed_at
                }));

                setPrescriptions(transformedData);

            } catch (error) {
                console.error('Error fetching prescriptions:', error);
                setPrescriptions([]); // Set empty array to prevent blank page
                console.warn('Failed to load prescriptions. Please ensure you are logged in.');
            } finally {
                setLoading(false);
            }
        };

        fetchPrescriptions();
    }, []);

    const filteredPrescriptions = prescriptions.filter(prescription => {
        const matchesFilter = filter === 'all' || prescription.status === filter;
        const matchesSearch = prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prescription.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusBadge = (status) => {
        const badges = {
            pending: "bg-amber-100 text-amber-700",
            dispensed: "bg-green-100 text-green-700",
            cancelled: "bg-red-100 text-red-700",
        };
        return badges[status] || "bg-gray-100 text-gray-700";
    };

    const handleDispense = async (prescriptionId) => {
        try {
            // Import API function
            const { prescriptionAPI } = await import('../../services/api');

            // Confirm with user
            if (!window.confirm('Are you sure you want to dispense this prescription?')) {
                return;
            }

            // Call dispense API
            const updatedPrescription = await prescriptionAPI.dispense(prescriptionId, {});

            // Update local state with the response
            setPrescriptions(prev => prev.map(p =>
                p.id === prescriptionId ? {
                    ...p,
                    status: updatedPrescription.status.toLowerCase(),
                    dispensed_at: updatedPrescription.dispensed_at
                } : p
            ));

            setSelectedPrescription(null);
            alert('Prescription dispensed successfully!');

        } catch (error) {
            console.error('Error dispensing prescription:', error);
            const errorMessage = error.response?.data?.error || 'Failed to dispense prescription';
            alert(errorMessage);
        }
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
                                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
                                        <p className="text-sm text-gray-600 mt-1">View and manage all prescriptions</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters and Search */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                            <div className="flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilter('pending')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Pending
                                    </button>
                                    <button
                                        onClick={() => setFilter('dispensed')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'dispensed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Dispensed
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by patient or ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all w-64"
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Prescriptions Table */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Prescription ID</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Patient Name</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Doctor</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Medicines</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPrescriptions.map(prescription => (
                                            <tr key={prescription.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4 font-medium text-gray-900">{prescription.id}</td>
                                                <td className="py-4 px-4 text-gray-600">{prescription.patientName}</td>
                                                <td className="py-4 px-4 text-gray-600">{prescription.doctor}</td>
                                                <td className="py-4 px-4 text-gray-600">{prescription.date}</td>
                                                <td className="py-4 px-4 text-gray-600">{prescription.medicine?.name || 'N/A'}</td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(prescription.status)}`}>
                                                        {prescription.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <button
                                                        onClick={() => setSelectedPrescription(prescription)}
                                                        className="px-4 py-1.5 text-sm bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors mr-2"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredPrescriptions.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="py-8 text-center text-gray-500">No prescriptions found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Prescription Details Modal */}
            {selectedPrescription && (
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedPrescription(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Prescription Details</h2>
                                    <p className="text-emerald-100 mt-1">ID: {selectedPrescription.id}</p>
                                </div>
                                <button onClick={() => setSelectedPrescription(null)} className="w-10 h-10 bg-white rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 hover:scale-110">
                                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="block text-gray-500 text-xs uppercase tracking-wide">Patient</span>
                                        <span className="font-medium text-gray-900">{selectedPrescription.patientName}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="block text-gray-500 text-xs uppercase tracking-wide">Doctor</span>
                                        <span className="font-medium text-gray-900">{selectedPrescription.doctor}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="block text-gray-500 text-xs uppercase tracking-wide">Date</span>
                                        <span className="font-medium text-gray-900">{selectedPrescription.date}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="block text-gray-500 text-xs uppercase tracking-wide">Status</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedPrescription.status)}`}>
                                            {selectedPrescription.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900 mb-3">Medicine Details</h3>
                                    <div className="space-y-3">
                                        {selectedPrescription.medicine ? (
                                            <div className="p-4 border border-gray-200 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-gray-900">{selectedPrescription.medicine.name}</h4>
                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                                        Qty: {selectedPrescription.quantity}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">Dosage: {selectedPrescription.dosage}</p>
                                                <p className="text-sm text-gray-600">Duration: {selectedPrescription.duration}</p>
                                                <p className="text-sm text-gray-600">Unit Price: ${selectedPrescription.medicine.unit_price}</p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm">No medicine information available</p>
                                        )}
                                    </div>
                                </div>

                                {selectedPrescription.status === 'pending' && (
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => handleDispense(selectedPrescription.id)}
                                            className="flex-1 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                        >
                                            Dispense Prescription
                                        </button>
                                        <button
                                            onClick={() => setSelectedPrescription(null)}
                                            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
