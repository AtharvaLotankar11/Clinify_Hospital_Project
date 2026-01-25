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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 medical-theme">
            <Sidebar role="pharmacy" />
            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Pharmacist'} userRole="Pharmacy" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header Card */}
                        <div className="card-medical p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 17v-6.666L12 14v10" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                                        <p className="text-sm text-gray-600 mt-1">Track and manage medicine stocks and batches</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-sm flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add New Medicine
                                </button>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="card-medical p-6">
                            <div className="flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex gap-2">
                                    {['all', 'Antibiotic', 'Analgesic', 'Antipyretic'].map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setFilter(cat)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === cat ? 'btn-medical-primary' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search medicines..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all w-64"
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Table Card */}
                        <div className="card-medical p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Medicine Name</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Generic Name</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Stock</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMedicines.map(med => (
                                            <tr key={med.medicine_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className="font-medium text-gray-900">{med.name}</div>
                                                    {med.batches?.some(b => b.days_to_expiry < 30) && (
                                                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Expiry Risk</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-gray-600">{med.generic_name || 'N/A'}</td>
                                                <td className="py-4 px-4">
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                                        {med.category}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 font-bold text-gray-900">{med.total_stock}</td>
                                                <td className="py-4 px-4">
                                                    {med.total_stock < med.reorder_level ? (
                                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                                            LOW STOCK
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                            IN STOCK
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMedicine(med);
                                                            setShowBatchModal(true);
                                                        }}
                                                        className="px-4 py-1.5 text-sm bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                                                    >
                                                        Add Batch
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredMedicines.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="py-8 text-center text-gray-500">No medicines found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Medicine Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">New Medicine Master</h2>
                                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center transition-all hover:bg-white/30">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleAddMedicine} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Medicine Name</label>
                                    <input required value={medicineData.name} onChange={e => setMedicineData({ ...medicineData, name: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" placeholder="e.g. Paracetamol 500mg" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Generic Composition</label>
                                    <input value={medicineData.generic_name} onChange={e => setMedicineData({ ...medicineData, generic_name: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" placeholder="e.g. Acetaminophen" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                                    <select value={medicineData.category} onChange={e => setMedicineData({ ...medicineData, category: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all">
                                        <option>Antibiotic</option>
                                        <option>Analgesic</option>
                                        <option>Antipyretic</option>
                                        <option>Antifungal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Reorder Level</label>
                                    <input required type="number" value={medicineData.reorder_level} onChange={e => setMedicineData({ ...medicineData, reorder_level: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 btn-medical-primary mt-4">
                                CREATE MEDICINE MASTER
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Batch Modal */}
            {showBatchModal && selectedMedicine && (
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBatchModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Add Inventory Batch</h2>
                                    <p className="text-emerald-100 text-sm">{selectedMedicine.name}</p>
                                </div>
                                <button onClick={() => setShowBatchModal(false)} className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center transition-all hover:bg-white/30">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleAddBatch} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Batch Number</label>
                                    <input required value={batchData.batch_number} onChange={e => setBatchData({ ...batchData, batch_number: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" placeholder="BP-1029" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
                                    <input required type="date" value={batchData.expiry_date} onChange={e => setBatchData({ ...batchData, expiry_date: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity Received</label>
                                    <input required type="number" value={batchData.stock_qty} onChange={e => setBatchData({ ...batchData, stock_qty: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-xl font-bold" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Purchase Cost (Unit)</label>
                                    <input required type="number" step="0.01" value={batchData.purchase_price} onChange={e => setBatchData({ ...batchData, purchase_price: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Selling Price (Unit)</label>
                                    <input required type="number" step="0.01" value={batchData.unit_price} onChange={e => setBatchData({ ...batchData, unit_price: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" placeholder="0.00" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 btn-medical-primary mt-4">
                                CONFIRM & UPDATE STOCK
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
