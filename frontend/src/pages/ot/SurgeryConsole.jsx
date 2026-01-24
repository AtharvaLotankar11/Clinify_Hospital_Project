import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar'; // Integrated Sidebar
import { operationAPI } from '../../services/api';

export default function SurgeryConsole() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}'); // Get user for Sidebar/Header
    const [operation, setOperation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('checklist');

    // Temp state for form inputs before saving
    const [checklist, setChecklist] = useState({ signIn: false, timeOut: false, signOut: false });
    const [anesthesiaNotes, setAnesthesiaNotes] = useState('');
    const [intraOpNotes, setIntraOpNotes] = useState('');
    const [result, setResult] = useState(''); // New State for Result
    const [consumables, setConsumables] = useState([]);
    const [newItem, setNewItem] = useState({ item: '', price: 0 });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const res = await operationAPI.getById(id);
            const op = res.data;
            setOperation(op);
            // Initialize local state from DB
            setChecklist(op.checklist_data || { signIn: false, timeOut: false, signOut: false });
            setAnesthesiaNotes(op.anesthesia_notes || '');
            setIntraOpNotes(op.intra_op_notes || '');
            setResult(op.result || ''); // Load result

            // Ensure all consumables have an ID for billing purposes
            const safeConsumables = (op.consumables_used || []).map((c, idx) => ({
                ...c,
                id: c.id || (Date.now() + idx) // Backfill ID if missing
            }));
            setConsumables(safeConsumables);
        } catch (error) {
            console.error("Error loading operation", error);
            alert("Failed to load surgery details");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                checklist_data: checklist,
                anesthesia_notes: anesthesiaNotes,
                intra_op_notes: intraOpNotes,
                result: result, // Include result in save
                consumables_used: consumables
            };
            await operationAPI.updateJson(id, payload);
            alert("Saved successfully! ✅");
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async () => {
        if (!window.confirm("Mark surgery as COMPLETED? This will trigger billing.")) return;
        try {
            await operationAPI.updateJson(id, { status: 'COMPLETED' });
            alert("Surgery Completed. Billing updated.");
            navigate('/ot/dashboard');
        } catch (err) {
            console.error(err);
            alert("Error completing surgery.");
        }
    };

    const addConsumable = () => {
        if (!newItem.item || newItem.price <= 0) return;
        // Generate a unique ID to ensure billable tracking
        setConsumables([...consumables, { ...newItem, id: Date.now() }]);
        setNewItem({ item: '', price: 0 });
    };

    const removeConsumable = (idx) => {
        const newC = [...consumables];
        newC.splice(idx, 1);
        setConsumables(newC);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
    );

    if (!operation) return <div className="p-10 text-center text-red-500 font-bold">Operation not found</div>;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Sidebar role={user.role?.toLowerCase() || 'doctor'} />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name} userRole={user.role || 'Doctor'} />

                {/* Custom Surgery Toolbar */}
                <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-200/50 px-8 py-4 shadow-sm">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{operation.operation_name}</h1>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                    <span className="font-medium text-gray-700">{operation.patient_name}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span className="uppercase tracking-wide text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-600">{operation.ot_room}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-medium transition-all shadow-sm active:translate-y-0.5 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                            {operation.status !== 'COMPLETED' && (
                                <button
                                    onClick={handleComplete}
                                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Complete Surgery
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <main className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Sidebar Navigation - Adapted for Layout */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 space-y-1 sticky top-36">
                            {['checklist', 'anesthesia', 'notes', 'billing'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`w-full text-left px-5 py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-between group ${activeTab === tab
                                        ? 'bg-emerald-50 text-black shadow-sm'
                                        : 'text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="capitalize text-lg tracking-wide">{tab}</span>
                                    {activeTab === tab && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>}
                                </button>
                            ))}
                        </div>

                        {/* Team Box - Lightened */}
                        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-800 mb-4 opacity-70 relative z-10">Surgical Team</h4>
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">DR</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 leading-none">{operation.doctor_name || 'Assigned Surgeon'}</p>
                                        <p className="text-xs text-gray-500 mt-1">Lead Surgeon</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area - Expanded to col-span-9 */}
                    <div className="lg:col-span-9">
                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 min-h-[600px] p-8 relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            {activeTab === 'checklist' && (
                                <div className="space-y-8 animate-fadeIn relative z-10">
                                    <div className="border-b border-gray-100 pb-4 mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">WHO Surgical Safety Checklist</h2>
                                        <p className="text-gray-500 mt-1">Mandatory safety protocols for patient safety.</p>
                                    </div>

                                    <div className="grid gap-4">
                                        {[
                                            { id: 'signIn', label: 'Sign In (Before Induction)', desc: 'Patient ID, Site, Procedure confirmed. Anesthesia check.', color: 'emerald' },
                                            { id: 'timeOut', label: 'Time Out (Before Incision)', desc: 'Team intro, Critical steps, Antibiotics prophylaxis.', color: 'indigo' },
                                            { id: 'signOut', label: 'Sign Out (Before Leaving OR)', desc: 'Instrument counts, Specimen labeled, Post-op concerns.', color: 'amber' }
                                        ].map((item) => (
                                            <label key={item.id} className={`group flex items-start gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${checklist[item.id]
                                                ? `border-${item.color}-500 bg-${item.color}-50/30`
                                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                }`}>
                                                <div className="pt-1">
                                                    <input
                                                        type="checkbox"
                                                        className={`w-6 h-6 rounded-md border-gray-300 text-${item.color}-600 focus:ring-${item.color}-500 transition-colors`}
                                                        checked={checklist[item.id]}
                                                        onChange={e => setChecklist({ ...checklist, [item.id]: e.target.checked })}
                                                    />
                                                </div>
                                                <div>
                                                    <span className={`block text-lg font-bold mb-1 transition-colors ${checklist[item.id] ? `text-${item.color}-700` : 'text-gray-700'}`}>
                                                        {item.label}
                                                    </span>
                                                    <span className="text-gray-500 text-sm">{item.desc}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'anesthesia' && (
                                <div className="space-y-6 animate-fadeIn relative z-10">
                                    <div className="border-b border-gray-100 pb-4 mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">Anesthesia Record</h2>
                                        <p className="text-gray-500 mt-1">Detailed log of vitals, drugs, and fluid management.</p>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            value={anesthesiaNotes}
                                            onChange={e => setAnesthesiaNotes(e.target.value)}
                                            className="w-full h-40 p-6 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-white outline-none resize-none font-mono text-sm leading-relaxed transition-all shadow-inner"
                                            placeholder="Begin typing anesthesia notes here..."
                                        />
                                        <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-mono">
                                            Auto-saving enabled
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="space-y-6 animate-fadeIn relative z-10">
                                    <div className="border-b border-gray-100 pb-4 mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">Surgical Procedure Notes</h2>
                                        <p className="text-gray-500 mt-1">Detailed operative findings and procedure description.</p>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            value={intraOpNotes}
                                            onChange={e => setIntraOpNotes(e.target.value)}
                                            className="w-full h-40 p-6 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-white outline-none resize-none font-sans text-base leading-relaxed transition-all shadow-inner"
                                            placeholder="Describe incision, findings, procedure steps, and closure..."
                                        />
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mt-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Surgery Result</label>
                                        <select
                                            value={result}
                                            onChange={(e) => setResult(e.target.value)}
                                            className="w-full sm:w-1/2 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        >
                                            <option value="">Select Result...</option>
                                            <option value="SUCCESSFUL">Successful</option>
                                            <option value="COMPLICATIONS">Complications</option>
                                            <option value="FAILED">Failed</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'billing' && (
                                <div className="space-y-6 animate-fadeIn relative z-10">
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800">Consumables & Implants</h2>
                                            <p className="text-gray-500 mt-1 text-sm">Add billable items used during surgery.</p>
                                        </div>
                                        <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-100">
                                            Total: <span className="text-lg ml-1">₹{consumables.reduce((acc, curr) => acc + curr.price, 0).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 flex gap-4 items-end shadow-sm">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Item Name</label>
                                            <input
                                                type="text"
                                                value={newItem.item}
                                                onChange={e => setNewItem({ ...newItem, item: e.target.value })}
                                                className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                                placeholder="e.g. Prolene Mesh 15x15"
                                            />
                                        </div>
                                        <div className="w-40">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Cost (₹)</label>
                                            <input
                                                type="number"
                                                value={newItem.price}
                                                onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                                                className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <button
                                            onClick={addConsumable}
                                            className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black font-medium transition-all shadow-lg shadow-gray-200"
                                        >
                                            Add Item
                                        </button>
                                    </div>

                                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm mt-4">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                                                <tr>
                                                    <th className="p-4 pl-6">Item Description</th>
                                                    <th className="p-4">Unit Cost</th>
                                                    <th className="p-4 text-right pr-6">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 bg-white">
                                                {consumables.length === 0 ? (
                                                    <tr><td colSpan="3" className="p-8 text-center text-gray-400 italic">No consumables added yet.</td></tr>
                                                ) : (
                                                    consumables.map((c, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                            <td className="p-4 pl-6 font-medium text-gray-800">{c.item}</td>
                                                            <td className="p-4 font-mono text-gray-600">₹{c.price.toFixed(2)}</td>
                                                            <td className="p-4 text-right pr-6">
                                                                <button
                                                                    onClick={() => removeConsumable(idx)}
                                                                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
