import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { billingAPI } from '../../services/api';

export default function PatientBill() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBillModal, setShowBillModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [billDetails, setBillDetails] = useState(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Mappings for UI
    const statusColors = {
        'DRAFT': 'bg-gray-100 text-gray-700',
        'NOT_PAID': 'bg-red-100 text-red-700',
        'PARTIALLY_PAID': 'bg-amber-100 text-amber-700',
        'PAID': 'bg-emerald-100 text-emerald-700',
        'CANCELLED': 'bg-gray-100 text-gray-500 line-through'
    };

    const statusOptions = [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'NOT_PAID', label: 'Not Paid' },
        { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
        { value: 'PAID', label: 'Paid' },
        { value: 'CANCELLED', label: 'Cancelled' }
    ];

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const response = await billingAPI.getBills();
            setBills(response.data);
        } catch (error) {
            console.error('Failed to fetch bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (billId, newStatus) => {
        try {
            await billingAPI.updateBill(billId, { status: newStatus });
            // Optimistic update or refetch
            setBills(prev => prev.map(b => b.id === billId ? { ...b, status: newStatus } : b));
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status.');
        }
    };

    const handleViewBill = async (bill) => {
        setSelectedBill(bill);
        setBillDetails(null); // Clear previous
        setShowBillModal(true);

        try {
            const response = await billingAPI.getBillItems({ bill: bill.id });
            const items = response.data;

            // Calculate derived totals (though backend has total_amount, we might want item details)
            // Assuming backend Bill object has total_amount.
            // Let's rely on Bill object for total, and items for breakdown.

            setBillDetails({
                items: items,
                total: parseFloat(bill.total_amount),
                // Simple tax logic for demo if not in backend yet, or just show flat
                // For now, let's assume total_amount is final inclusive price as per our simple model
            });

        } catch (error) {
            console.error('Failed to fetch bill details:', error);
        }
    };

    const handlePrintBill = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 medical-theme">
            <Sidebar role="billing" />

            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Billing Staff'} userRole="Billing" />

                <main className="p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="card-medical p-8">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Patient Bills</h1>
                                    <p className="text-sm text-gray-600 mt-1">View and manage patient billing information</p>
                                </div>
                            </div>
                        </div>

                        {/* Bills List */}
                        <div className="card-medical p-6">

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                            ) : bills.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No bills found</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bills.map((bill) => (
                                        <div key={bill.id} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-sm">
                                                    {/* Initials */}
                                                    {bill.patient_name ? bill.patient_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PT'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-base font-bold text-gray-900">{bill.patient_name || 'Unknown Patient'}</h3>

                                                        {/* Status Dropdown */}
                                                        <select
                                                            value={bill.status}
                                                            onChange={(e) => handleStatusChange(bill.id, e.target.value)}
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${statusColors[bill.status] || 'bg-gray-100'}`}
                                                        >
                                                            {statusOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                            </svg>
                                                            ID: {bill.patient_id || 'N/A'} (Bill #{bill.id})
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            Visit: {bill.visit_date}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Total: ₹{parseFloat(bill.total_amount).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleViewBill(bill)}
                                                        className="btn-medical-primary text-xs"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Bill Details Modal */}
            {showBillModal && selectedBill && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Bill Details</h2>
                                <p className="text-xs text-gray-500 mt-1 max-w-md">
                                    {selectedBill.patient_name} • Bill #{selectedBill.id} • {selectedBill.visit_date}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBillModal(false)}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        {!billDetails ? (
                            <div className="p-8 text-center text-gray-500">Loading details...</div>
                        ) : (
                            <div className="space-y-4">
                                {/* Items */}
                                <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">Bill Items</h3>
                                    {billDetails.items.length === 0 ? (
                                        <p className="text-sm text-gray-500">No items in this bill.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {billDetails.items.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0 last:pb-0">
                                                    <div>
                                                        <span className="block text-sm text-gray-700 font-medium">{item.service_type}</span>
                                                        <span className="text-xs text-gray-500">Ref ID: {item.service_ref_id}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">₹{parseFloat(item.amount).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Summary */}
                                <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">Summary</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span className="font-semibold text-gray-900">₹{billDetails.total.toLocaleString()}</span>
                                        </div>
                                        <div className="pt-3 mt-1 border-t border-gray-200 flex items-center justify-between">
                                            <span className="text-base font-bold text-gray-900">Total Amount</span>
                                            <span className="text-xl font-bold text-blue-600">
                                                ₹{billDetails.total.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-right mt-2">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${statusColors[selectedBill.status]}`}>
                                                Status: {selectedBill.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowBillModal(false)}
                                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all text-sm"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={handlePrintBill}
                                        className="flex-1 btn-medical-primary text-sm flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Print Bill
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
