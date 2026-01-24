import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { bedAPI } from '../../services/api';

export default function BedManagement() {
    const [beds, setBeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

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
            showSuccess("Bed status updated successfully");
        } catch (err) {
            console.error("Error updating bed status:", err);
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
            showSuccess("Cleaning status updated successfully");
        } catch (err) {
            console.error("Error updating cleaning status:", err);
            setError("Failed to update cleaning status");
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            <Sidebar role="nurse" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Nurse'} userRole="Nurse" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header Section matching Dashboard */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                        {/* Bed Icon */}
                                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-2 0v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5m14-4V7a1 1 0 00-1-1H6a1 1 0 00-1 1v3" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Bed Management</h1>
                                        <p className="text-sm text-gray-600 mt-1">Manage hospital bed availability and cleaning status</p>
                                    </div>
                                </div>
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
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Hospital Beds</h2>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24">
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
                                                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Patient</th>
                                                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Type</th>
                                                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Availability Status</th>
                                                <th className="p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Cleaning Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {beds.map((bed) => (
                                                <tr key={bed.bed_id} className="hover:bg-gray-50 transition-colors group">
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
                                                                className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500/50 transition-all ${getStatusColor(bed.status)}`}
                                                            >
                                                                <option value="AVAILABLE">Available</option>
                                                                <option value="OCCUPIED">Occupied</option>
                                                                <option value="MAINTENANCE">Maintenance</option>
                                                            </select>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="relative">
                                                            <select
                                                                value={bed.cleaning_status}
                                                                onChange={(e) => handleCleaningStatusChange(bed.bed_id, e.target.value)}
                                                                className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500/50 transition-all ${getCleaningStatusColor(bed.cleaning_status)}`}
                                                            >
                                                                <option value="CLEANED">Cleaned</option>
                                                                <option value="NOT_CLEANED">Not Cleaned</option>
                                                                <option value="UNDER_CLEANING">Cleaning</option>
                                                            </select>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
