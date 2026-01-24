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
        <div className="min-h-screen bg-[#f8fafc]">
            <Sidebar role="pharmacy" />
            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Pharmacist'} userRole="Pharmacy" />

                <main className="p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Status Header */}
                        <div className="flex items-center gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                            <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Smart Dispensing Terminal</h1>
                                <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">Real-time Batch Matching & Expiry Prevention</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-8">
                            {/* Prescription Queue */}
                            <div className="col-span-12 lg:col-span-5 space-y-4">
                                <div className="bg-slate-900 p-6 rounded-3xl shadow-xl">
                                    <h2 className="text-white font-black text-xl mb-4">Pending Queue</h2>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search by UHID or Name..."
                                            className="w-full bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <svg className="w-6 h-6 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredPrescriptions.map(p => (
                                        <div
                                            key={p.prescription_id}
                                            onClick={() => handleSelectPrescription(p)}
                                            className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer group ${selectedPrescription?.prescription_id === p.prescription_id ? 'bg-emerald-600 border-emerald-600 shadow-xl shadow-emerald-100' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'}`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className={`text-lg font-black ${selectedPrescription?.prescription_id === p.prescription_id ? 'text-white' : 'text-slate-800'}`}>{p.patient_name}</h3>
                                                    <p className={`text-xs font-bold uppercase tracking-widest ${selectedPrescription?.prescription_id === p.prescription_id ? 'text-emerald-100' : 'text-slate-400'}`}>Presc #{p.prescription_id}</p>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${selectedPrescription?.prescription_id === p.prescription_id ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                                    {p.medicine.name}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={`flex flex-col ${selectedPrescription?.prescription_id === p.prescription_id ? 'text-emerald-50' : 'text-slate-500'}`}>
                                                    <span className="text-[10px] font-bold uppercase opacity-60">Dosage</span>
                                                    <span className="text-sm font-black">{p.dosage_per_day}x a day</span>
                                                </div>
                                                <div className={`flex flex-col ${selectedPrescription?.prescription_id === p.prescription_id ? 'text-emerald-50' : 'text-slate-500'}`}>
                                                    <span className="text-[10px] font-bold uppercase opacity-60">Qty</span>
                                                    <span className="text-sm font-black">{p.quantity} Units</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Batch Intel Panel */}
                            <div className="col-span-12 lg:col-span-7">
                                {selectedPrescription ? (
                                    <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-2xl relative overflow-hidden animate-in slide-in-from-right-8 duration-300">
                                        <div className="absolute top-0 right-0 p-8">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">FEFO SUGGESTED</div>
                                            <div className="text-3xl font-black text-slate-900 tracking-tighter">B-{selectedBatch?.batch_number || 'N/A'}</div>
                                        </div>

                                        <div className="mb-12">
                                            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">{selectedPrescription.medicine.name}</h2>
                                            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Action required: Dispense {selectedPrescription.quantity} units</p>
                                        </div>

                                        <div className="space-y-8">
                                            <div>
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Batch Selection Intelligence</h4>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {selectedPrescription.medicine.batches?.map(batch => (
                                                        <div
                                                            key={batch.batch_id}
                                                            onClick={() => setSelectedBatch(batch)}
                                                            className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center justify-between ${selectedBatch?.batch_id === batch.batch_id ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
                                                        >
                                                            <div className="flex items-center gap-5">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${batch.days_to_expiry < 30 ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" /></svg>
                                                                </div>
                                                                <div>
                                                                    <div className="text-lg font-black text-slate-800">Batch {batch.batch_number}</div>
                                                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expires in {batch.days_to_expiry} days</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-2xl font-black text-slate-900">{batch.stock_qty}</div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Available</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Quantity to Dispense</label>
                                                    <span className="text-sm font-black text-slate-900">{dispensedQty} / {selectedPrescription.quantity}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max={Math.min(selectedPrescription.quantity, selectedBatch?.stock_qty || 0)}
                                                    value={dispensedQty}
                                                    onChange={(e) => setDispensedQty(parseInt(e.target.value))}
                                                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Selling Price</span>
                                                        <span className="text-xl font-black text-slate-900">₹{selectedBatch?.unit_price}</span>
                                                    </div>
                                                    <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Total Billable</span>
                                                        <span className="text-xl font-black text-emerald-600">₹{(selectedBatch?.unit_price * dispensedQty).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleDispense}
                                                className="w-full py-6 bg-slate-900 hover:bg-black text-white font-black rounded-[2.5rem] shadow-2xl transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95"
                                            >
                                                Finalize & Dispense
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-20 text-center border-4 border-dashed border-slate-100 rounded-[4rem]">
                                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                            <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-300 tracking-tight">Select Queue Item</h3>
                                        <p className="text-slate-400 font-medium">Validation requires a selection to initiate scan</p>
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
