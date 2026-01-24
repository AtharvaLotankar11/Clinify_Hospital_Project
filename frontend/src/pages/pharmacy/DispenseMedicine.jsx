import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function DispenseMedicine() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [dispensedQty, setDispensedQty] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchPendingPrescriptions();
    }, []);

    const fetchPendingPrescriptions = async () => {
        try {
            setLoading(true);
            const { prescriptionAPI } = await import('../../services/api');
            const data = await prescriptionAPI.getPending();
            setPrescriptions(data);
        } catch (error) {
            console.error('Error:', error);
            setPrescriptions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPrescription = (p) => {
        setSelectedPrescription(p);
        setDispensedQty(p.quantity);
        // Auto-select FEFO batch (first in list as backend orders by expiry_date)
        const fefoBatch = p.medicine.batches?.find(b => b.stock_qty > 0);
        setSelectedBatch(fefoBatch || null);
    };

    const handleDispense = async () => {
        if (!selectedBatch) return alert('Please select a valid batch');

        try {
            const { prescriptionAPI } = await import('../../services/api');
            await prescriptionAPI.dispense(selectedPrescription.prescription_id, {
                quantity_dispensed: dispensedQty,
                batch_id: selectedBatch.batch_id
            });

            alert('Dispensed successfully from Batch ' + selectedBatch.batch_number);
            setSelectedPrescription(null);
            fetchPendingPrescriptions();
        } catch (error) {
            alert(error.response?.data?.error || 'Dispense failed');
        }
    };

    const filteredPrescriptions = prescriptions.filter(p =>
        p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.prescription_id).includes(searchTerm)
    );

    if (loading) return <div className="min-h-screen flex items-center justify-center">Initializing Dispenser...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            <Sidebar role="pharmacy" />
            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Pharmacist'} userRole="Pharmacy" />

                <main className="p-4 sm:p-6">
                    <div className="max-w-7xl mx-auto space-y-4">
                        {/* Status Header */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 text-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 leading-tight">Medicine Dispensing</h1>
                                    <p className="text-xs text-gray-500 mt-0.5">Process pending prescriptions and manage batches</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4">
                            {/* Prescription Queue */}
                            <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-4">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Pending Queue</h2>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search by name or ID..."
                                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1 select-none custom-scrollbar">
                                    {filteredPrescriptions.map(p => (
                                        <div
                                            key={p.prescription_id}
                                            onClick={() => handleSelectPrescription(p)}
                                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer group ${selectedPrescription?.prescription_id === p.prescription_id ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-gray-50 hover:border-emerald-100 shadow-sm'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-sm">{p.patient_name}</h3>
                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest leading-none">PRESC #{p.prescription_id}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedPrescription?.prescription_id === p.prescription_id ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                                                    {p.medicine.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-tight">Dosage</span>
                                                    <span className="text-xs font-semibold text-gray-700">{p.dosage_per_day}x / day</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-tight">Qty</span>
                                                    <span className="text-xs font-semibold text-gray-700">{p.quantity} Units</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredPrescriptions.length === 0 && (
                                        <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-gray-200">
                                            <p className="text-gray-400 text-xs">No pending prescriptions</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Batch Selection Detail */}
                            <div className="col-span-12 lg:col-span-7 xl:col-span-8">
                                {selectedPrescription ? (
                                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in slide-in-from-right-4 duration-300">
                                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white flex justify-between items-center">
                                            <div>
                                                <h2 className="text-xl font-bold">{selectedPrescription.medicine.name}</h2>
                                                <p className="text-emerald-50 text-xs font-medium opacity-90">Dispensing for {selectedPrescription.patient_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Required</div>
                                                <div className="text-xl font-bold">{selectedPrescription.quantity} Units</div>
                                            </div>
                                        </div>

                                        <div className="p-5 space-y-6">
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                    </svg>
                                                    Select Batch
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {selectedPrescription.medicine.batches?.map(batch => (
                                                        <div
                                                            key={batch.batch_id}
                                                            onClick={() => setSelectedBatch(batch)}
                                                            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${selectedBatch?.batch_id === batch.batch_id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-8 h-8 rounded flex items-center justify-center ${batch.days_to_expiry < 30 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                    <span className="font-bold text-[10px]">B</span>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-bold text-gray-900">#{batch.batch_number}</div>
                                                                    <div className="text-[9px] font-semibold text-gray-500 uppercase">Exp: {batch.expiry_date}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-bold text-gray-900">{batch.stock_qty}</div>
                                                                <div className="text-[9px] font-bold text-gray-400 uppercase">Stock</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-5 space-y-4 border border-gray-200/50">
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <label className="text-gray-700">Dispense Amount</label>
                                                    <span className="px-2 py-0.5 bg-white rounded border border-gray-200 text-emerald-600">{dispensedQty} / {selectedPrescription.quantity}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max={Math.min(selectedPrescription.quantity, selectedBatch?.stock_qty || 0)}
                                                    value={dispensedQty}
                                                    onChange={(e) => setDispensedQty(parseInt(e.target.value))}
                                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Unit Price</span>
                                                        <span className="text-lg font-bold text-gray-900">₹{selectedBatch?.unit_price || 0}</span>
                                                    </div>
                                                    <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Total Bill</span>
                                                        <span className="text-lg font-bold text-emerald-600">₹{((selectedBatch?.unit_price || 0) * dispensedQty).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleDispense}
                                                disabled={!selectedBatch}
                                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-lg shadow-lg shadow-emerald-100 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                                            >
                                                FINALIZE & DISPENSE
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white/50 border-2 border-dashed border-gray-200 rounded-xl">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-400">No Patient Selected</h3>
                                        <p className="text-gray-400 text-xs mt-1">Select a prescription from the queue to start</p>
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
