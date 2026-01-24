import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Inventory() {
    const [medicines, setMedicines] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [medicineData, setMedicineData] = useState({
        name: '',
        generic_name: '',
        category: 'Antibiotic',
        manufacturer: '',
        reorder_level: '10'
    });

    const [batchData, setBatchData] = useState({
        batch_number: '',
        expiry_date: '',
        stock_qty: '',
        purchase_price: '',
        unit_price: ''
    });

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const { medicineAPI } = await import('../../services/api');
            const data = await medicineAPI.getAll();
            setMedicines(data);
        } catch (error) {
            console.error('Error fetching medicines:', error);
            setMedicines([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedicine = async (e) => {
        e.preventDefault();
        try {
            const { medicineAPI } = await import('../../services/api');
            const newMed = await medicineAPI.create(medicineData);
            setMedicines([...medicines, newMed]);
            setShowAddModal(false);
            setMedicineData({ name: '', generic_name: '', category: 'Antibiotic', manufacturer: '', reorder_level: '10' });
            alert('Medicine Master created!');
        } catch (error) {
            alert('Failed to add medicine');
        }
    };

    const handleAddBatch = async (e) => {
        e.preventDefault();
        try {
            const { batchAPI } = await import('../../services/api');
            await batchAPI.create({
                ...batchData,
                medicine: selectedMedicine.medicine_id
            });
            setShowBatchModal(false);
            // Reset batch form
            setBatchData({
                batch_number: '',
                expiry_date: '',
                stock_qty: '',
                purchase_price: '',
                unit_price: ''
            });

            fetchMedicines(); // Refresh to show new batch
            alert('Batch added successfully!');
        } catch (error) {
            alert('Failed to add batch');
        }
    };


    const filteredMedicines = medicines.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getHealthColor = (score) => {
        if (score > 70) return 'text-emerald-500 bg-emerald-50';
        if (score > 30) return 'text-amber-500 bg-amber-50';
        return 'text-rose-500 bg-rose-50';
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Inventory...</div>;

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Sidebar role="pharmacy" />
            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Pharmacist'} userRole="Pharmacy" />

                <main className="p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Batch Intelligence Dashboard</h1>
                                <p className="text-slate-500 mt-1 font-medium">Advanced inventory tracking & FEFO management</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 group"
                            >
                                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Add New Medicine
                            </button>
                        </div>

                        {/* Search & Actions */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search medicine master database..."
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <svg className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Medicine Master Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredMedicines.map(med => (
                                <div key={med.medicine_id} className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group overflow-hidden relative">
                                    {/* Highlighting FEFO Risk */}
                                    {med.batches?.some(b => b.days_to_expiry < 30) && (
                                        <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest animate-pulse">
                                            Expiry Risk
                                        </div>
                                    )}

                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                                <svg className="w-7 h-7 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800">{med.name}</h3>
                                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{med.generic_name || 'No Generic Name'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-slate-900">{med.total_stock}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Current Stock</div>
                                        </div>
                                    </div>

                                    {/* Batch Timeline View */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase px-1">
                                            <span>Active Batches</span>
                                            <button
                                                onClick={() => {
                                                    setSelectedMedicine(med);
                                                    setBatchData({
                                                        batch_number: '',
                                                        expiry_date: '',
                                                        stock_qty: '',
                                                        purchase_price: '',
                                                        unit_price: ''
                                                    });
                                                    setShowBatchModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                            >
                                                Add Batch +
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {(med.batches || []).slice(0, 3).map((batch, idx) => (
                                                <div key={batch.batch_id} className={`flex items-center justify-between p-3 rounded-xl border ${idx === 0 ? 'bg-indigo-50/30 border-indigo-100 ring-1 ring-indigo-200' : 'bg-slate-50 border-slate-100'} transition-all`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${batch.days_to_expiry < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-700">Batch {batch.batch_number}</div>
                                                            <div className="text-[10px] font-medium text-slate-500 tracking-tight">Exp: {batch.expiry_date} ({batch.days_to_expiry} days)</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${getHealthColor(batch.health_score)}`}>
                                                            Health: {batch.health_score}%
                                                        </div>
                                                        <div className="text-sm font-black text-slate-700">{batch.stock_qty}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {med.batches?.length > 3 && (
                                                <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                                                    + {med.batches.length - 3} more batches
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Footers */}
                                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase">{med.category}</span>
                                            {med.total_stock < med.reorder_level && (
                                                <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase ring-1 ring-rose-100">Low Stock</span>
                                            )}
                                        </div>
                                        <button className="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                            Full Traceability Audit →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Medicine Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-xl w-full p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900">New Medicine Master</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddMedicine} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Medicine Name</label>
                                    <input required value={medicineData.name} onChange={e => setMedicineData({ ...medicineData, name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="e.g. Paracetamol 500mg" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Generic Composition</label>
                                    <input value={medicineData.generic_name} onChange={e => setMedicineData({ ...medicineData, generic_name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="e.g. Acetaminophen" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Category</label>
                                    <select value={medicineData.category} onChange={e => setMedicineData({ ...medicineData, category: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none">
                                        <option>Antibiotic</option>
                                        <option>Analgesic</option>
                                        <option>Antipyretic</option>
                                        <option>Antifungal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Reorder Level</label>
                                    <input required type="number" value={medicineData.reorder_level} onChange={e => setMedicineData({ ...medicineData, reorder_level: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest mt-4">
                                Initialize Master Entry
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Batch Modal */}
            {showBatchModal && selectedMedicine && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-xl w-full p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900">Inventory Entry</h2>
                                <p className="text-indigo-600 font-bold text-sm tracking-tight inline-flex items-center gap-1 mt-1 uppercase">
                                    Adding Batch to: {selectedMedicine.name}
                                </p>
                            </div>
                            <button onClick={() => setShowBatchModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddBatch} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Batch Number</label>
                                    <input required value={batchData.batch_number} onChange={e => setBatchData({ ...batchData, batch_number: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold placeholder:font-normal" placeholder="BP-1029" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Expiry Date</label>
                                    <input required type="date" value={batchData.expiry_date} onChange={e => setBatchData({ ...batchData, expiry_date: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Quantity Received</label>
                                    <input required type="number" value={batchData.stock_qty} onChange={e => setBatchData({ ...batchData, stock_qty: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-black text-xl" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Purchase Cost (Unit)</label>
                                    <input required type="number" step="0.01" value={batchData.purchase_price} onChange={e => setBatchData({ ...batchData, purchase_price: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Selling Price (Unit)</label>
                                    <input required type="number" step="0.01" value={batchData.unit_price} onChange={e => setBatchData({ ...batchData, unit_price: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="0.00" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all uppercase tracking-widest mt-4">
                                Confirm & Update Stock
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
