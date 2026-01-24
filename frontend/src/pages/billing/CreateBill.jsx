import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { billingAPI } from '../../services/api';

export default function CreateBill() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const patientIdParam = searchParams.get('patientId');

    // State
    const [patientInfo, setPatientInfo] = useState(null);
    const [pendingItems, setPendingItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Track active draft bills for visits to avoid creating duplicates
    // Map: visitId -> billId
    const [activeBills, setActiveBills] = useState({});

    // Track added items to disable button
    const [addedItems, setAddedItems] = useState({});

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (patientIdParam) {
            fetchPendingItems(patientIdParam);
        }
    }, [patientIdParam]);

    const fetchPendingItems = async (patientId) => {
        setLoading(true);
        try {
            const response = await billingAPI.getPendingItems({ patient_id: patientId });
            const data = response.data;

            if (data && data.length > 0) {
                // Try to find exact match
                let patientData = data.find(p => p.patientId.toString() === patientId.toString());
                if (!patientData && data.length === 1) patientData = data[0];

                if (patientData) {
                    setPatientInfo({
                        id: patientData.patientId,
                        name: patientData.patientName
                    });

                    // Transform items
                    setPendingItems(patientData.items.map(item => ({
                        ...item,
                        // Ensure consistent naming
                        refId: item.id
                    })));
                }
            } else {
                setPendingItems([]);
            }
        } catch (error) {
            console.error("Failed to fetch pending items:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (item) => {
        try {
            const visitId = item.visitId;
            let billId = activeBills[visitId];

            // 1. Ensure Bill Exists for this Visit
            if (!billId) {
                // Check if we can find an existing DRAFT bill for this visit (optional optimization, skipping for now, assuming new session = check or create)
                // For simplicity in this logic: Create a new Bill if we haven't tracked one locally.
                // ideally backend ensures 1 draft bill per visit? 
                // Let's just create one.
                const billData = {
                    visit: parseInt(visitId),
                    total_amount: 0
                    // status: 'DRAFT' // Let backend handle default to avoid validation issues
                };
                try {
                    const billResponse = await billingAPI.createBill(billData);
                    billId = billResponse.data.id;
                    setActiveBills(prev => ({ ...prev, [visitId]: billId }));
                } catch (billError) {
                    console.error("Error creating bill:", billError);
                    if (billError.response && billError.response.data) {
                        console.error("Bill creation validation details:", billError.response.data);
                        // Forward error so outer catch handles it if needed, or handle here
                        const msg = typeof billError.response.data === 'string'
                            ? billError.response.data
                            : JSON.stringify(billError.response.data);
                        alert(`Failed to create bill: ${msg}`);
                        return; // Stop execution
                    } else {
                        throw billError;
                    }
                }
            }

            // 2. Create Bill Item
            // Ensure types match backend expectations
            const itemData = {
                bill: parseInt(billId),
                visit: parseInt(visitId),
                service_type: item.type,
                service_ref_id: parseInt(item.refId),
                amount: parseFloat(item.price)
            };

            console.log("Creating Bill Item with payload:", itemData);

            await billingAPI.createBillItem(itemData);

            // 3. Update UI
            setAddedItems(prev => ({ ...prev, [`${item.type}_${item.refId}`]: true }));

        } catch (error) {
            console.error("Error adding item to bill:", error);
            if (error.response && error.response.data) {
                console.error("Validation details:", error.response.data);
                const msg = typeof error.response.data === 'string'
                    ? error.response.data
                    : JSON.stringify(error.response.data);
                alert(`Failed to add item: ${msg}`);
            } else {
                alert("Failed to add item. Please try again.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            <Sidebar role="billing" />
            <div className="ml-72 transition-all duration-300">
                <Header userName={user.name || 'Billing Staff'} userRole="Billing" />
                <main className="p-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Process Billing</h1>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {patientInfo ? `Managing bills for ${patientInfo.name} (ID: ${patientInfo.id})` : 'Select a patient to proceed'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/billing/dashboard')}
                                    className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    ← Back to Dashboard
                                </button>
                            </div>
                        </div>

                        {/* Pending Items List */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900">Pending Services</h2>
                                <p className="text-sm text-gray-500">Services performed but not yet billed</p>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Loading pending items...</div>
                            ) : pendingItems.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No pending items found for this patient.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {pendingItems.map((item, index) => {
                                                const isAdded = addedItems[`${item.type}_${item.refId}`];
                                                return (
                                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(item.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                                {item.type.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                            {item.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                                                            ₹{item.price.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            {isAdded ? (
                                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    Added
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleAddItem(item)}
                                                                    className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-200"
                                                                >
                                                                    + Add to Bill
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => navigate('/billing/dashboard')}
                                className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all"
                            >
                                Finish & Return to Dashboard
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
