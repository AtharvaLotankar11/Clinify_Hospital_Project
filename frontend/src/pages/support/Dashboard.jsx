import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import { bedAPI } from '../../services/api';

export default function SupportDashboard() {
    const [beds, setBeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Add Bed Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newBedData, setNewBedData] = useState({
        ward: '',
        bed_number: '',
        bed_type: 'GENERAL',
        status: 'AVAILABLE',
        cleaning_status: 'CLEANED'
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchBeds();
    }, []);

    const fetchBeds = async () => {
        try {
            setLoading(true);
            const response = await bedAPI.getAll();
            // Sort beds by ward then bed number
            const sortedBeds = response.data.sort((a, b) => {
                if (a.ward === b.ward) {
                    return a.bed_number - b.bed_number;
                }
                return a.ward - b.ward;
            });
            setBeds(sortedBeds);
            setError(null);
        } catch (err) {
            console.error("Error fetching beds:", err);
            setError("Failed to load beds. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (bedId, newStatus) => {
        try {
            await bedAPI.update(bedId, { status: newStatus });
            setBeds(prevBeds =>
                prevBeds.map(bed =>
                    bed.bed_id === bedId ? { ...bed, status: newStatus } : bed
                )
            );
            showSuccess("Bed status updated");
        } catch (err) {
            setError("Failed to update bed status");
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleCleaningStatusChange = async (bedId, newCleaningStatus) => {
        try {
            await bedAPI.update(bedId, { cleaning_status: newCleaningStatus });
            setBeds(prevBeds =>
                prevBeds.map(bed =>
                    bed.bed_id === bedId ? { ...bed, cleaning_status: newCleaningStatus } : bed
                )
            );
            showSuccess("Cleaning status updated");
        } catch (err) {
            setError("Failed to update cleaning status");
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleDeleteBed = async (bedId) => {
        if (!window.confirm("Are you sure you want to delete this bed?")) return;

        try {
            await bedAPI.delete(bedId);
            setBeds(prevBeds => prevBeds.filter(bed => bed.bed_id !== bedId));
            showSuccess("Bed deleted successfully");
        } catch (err) {
            setError("Failed to delete bed. It might be occupied or linked to records.");
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleAddBed = async (e) => {
        e.preventDefault();
        try {
            await bedAPI.create(newBedData);
            setIsAddModalOpen(false);
            setNewBedData({ ward: '', bed_number: '', bed_type: 'GENERAL', status: 'AVAILABLE', cleaning_status: 'CLEANED' });
            showSuccess("Bed added successfully");
            fetchBeds(); // Refresh list to get new bed
        } catch (err) {
            setError("Failed to add bed");
            setTimeout(() => setError(null), 3000);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-green-100 text-green-800';
            case 'OCCUPIED': return 'bg-red-100 text-red-800';
            case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getCleaningStatusColor = (status) => {
        switch (status) {
            case 'CLEANED': return 'bg-blue-100 text-blue-800';
            case 'NOT_CLEANED': return 'bg-orange-100 text-orange-800';
            case 'UNDER_CLEANING': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 medical-theme">
            <Sidebar role="support" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Support Staff'} userRole="Support" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header Section */}
                        <div className="card-medical p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-2 0v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5m14-4V7a1 1 0 00-1-1H6a1 1 0 00-1 1v3" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Bed Management</h1>
                                        <p className="text-sm text-gray-600 mt-1">Add, remove, and manage hospital beds</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="px-6 py-2.5 btn-medical-primary rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add New Bed
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                <strong className="font-bold">Error! </strong>
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                                <strong className="font-bold">Success! </strong>
                                <span className="block sm:inline">{successMessage}</span>
                            </div>
                        )}

                        {/* Bed List */}
                        <div className="card-medical p-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Bed Info</th>
                                                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Current Patient</th>
                                                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Type</th>
                                                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Availability</th>
                                                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Cleaning Status</th>
                                                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {beds.map((bed) => (
                                                <tr key={bed.bed_id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-bold text-gray-900">Bed {bed.bed_number}</div>
                                                        <div className="text-xs text-gray-500 font-medium">Ward {bed.ward}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        {bed.current_admission ? (
                                                            <div>
                                                                <div className="font-medium text-gray-900">{bed.current_admission.patient_name}</div>
                                                                <div className="text-xs text-gray-500 font-mono">{bed.current_admission.uhid}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm italic">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 uppercase tracking-wide">
                                                            {bed.bed_type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="relative">
                                                            <select
                                                                value={bed.status}
                                                                onChange={(e) => handleStatusChange(bed.bed_id, e.target.value)}
                                                                className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-blue-500/50 transition-all ${getStatusColor(bed.status)}`}
                                                            >
                                                                <option value="AVAILABLE">Available</option>
                                                                <option value="OCCUPIED">Occupied</option>
                                                                <option value="MAINTENANCE">Maintenance</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="relative">
                                                            <select
                                                                value={bed.cleaning_status}
                                                                onChange={(e) => handleCleaningStatusChange(bed.bed_id, e.target.value)}
                                                                className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-blue-500/50 transition-all ${getCleaningStatusColor(bed.cleaning_status)}`}
                                                            >
                                                                <option value="CLEANED">Cleaned</option>
                                                                <option value="NOT_CLEANED">Not Cleaned</option>
                                                                <option value="UNDER_CLEANING">Cleaning</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteBed(bed.bed_id)}
                                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Bed"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {beds.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                                        No beds found. Add a new bed to get started.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Add Bed Modal */}
                <Modal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    title="Add New Bed"
                    maxWidth="max-w-lg"
                >
                    <form onSubmit={handleAddBed} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Ward Number</label>
                                <input
                                    type="number"
                                    required
                                    value={newBedData.ward}
                                    onChange={(e) => setNewBedData({ ...newBedData, ward: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    placeholder="e.g. 1"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Bed Number</label>
                                <input
                                    type="number"
                                    required
                                    value={newBedData.bed_number}
                                    onChange={(e) => setNewBedData({ ...newBedData, bed_number: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    placeholder="e.g. 101"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Bed Type</label>
                            <select
                                value={newBedData.bed_type}
                                onChange={(e) => setNewBedData({ ...newBedData, bed_type: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            >
                                <option value="GENERAL">General Ward</option>
                                <option value="ICU">ICU</option>
                                <option value="OT">Operation Theater</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 btn-medical-primary rounded-lg hover:shadow-lg transition-all font-medium"
                            >
                                Add Bed
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}
