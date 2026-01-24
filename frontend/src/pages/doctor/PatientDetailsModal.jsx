import { useState, useEffect } from 'react';
import { doctorAPI, clinicalNoteAPI, prescriptionAPI, medicineAPI, vitalAPI, aiAPI, operationAPI } from '../../services/api';

export default function PatientDetailsModal({ patient: selectedPatient, onClose, initialTab }) {
    const [activeTab, setActiveTab] = useState(initialTab || 'details');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Helper to check for critical vitals
    const isCritical = (type, val, val2 = null) => {
        if (!val) return false;
        const num = parseFloat(val);
        const num2 = val2 ? parseFloat(val2) : null;

        switch (type) {
            case 'BP': // val=systolic, val2=diastolic
                if (!num2) return false;
                // Low: Sys < 90 OR Dia < 60
                // High: Sys >= 180 OR Dia >= 120
                return (num < 90 || num2 < 60 || num >= 180 || num2 >= 120);
            case 'HR':
                // Low < 40, High > 130
                return (num < 40 || num > 130);
            case 'TEMP':
                // Assuming stored in F per display label. 
                // Critical Low < 35C (95F), Critical High >= 40C (104F)
                return (num < 95 || num >= 104);
            case 'SPO2':
                // Low < 90
                return (num < 90);
            default:
                return false;
        }
    };

    // Clinical Notes State
    const [notesFormData, setNotesFormData] = useState({
        symptoms: '',
        diagnosis: '',
        notes: ''
    });
    const [patientNotes, setPatientNotes] = useState([]);

    // Progress Notes State
    const [progressNotes, setProgressNotes] = useState([]);
    const [progressNoteForm, setProgressNoteForm] = useState('');

    // Orders State
    const [orders, setOrders] = useState([]);
    const [operations, setOperations] = useState([]); // New independent state for operations
    const [orderFormInfo, setOrderFormInfo] = useState({
        order_type: 'LAB',
        test_name: '',
        scan_type: '',
        operation_name: '',
        price: 0
    });

    // Prescriptions State
    const [medicines, setMedicines] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [prescriptionForm, setPrescriptionForm] = useState({
        medicine_id: '',
        dosage_per_day: 1,
        duration: 5
    });

    // Vitals State
    const [vitals, setVitals] = useState([]);

    // AI Summary State
    const [generatingId, setGeneratingId] = useState(null);
    const [clinicalSummary, setClinicalSummary] = useState(null);
    const [editingOperation, setEditingOperation] = useState(null);

    const handleGenerateClinicalSummary = async (patientId) => {
        try {
            setGeneratingId('notes');
            const response = await aiAPI.summarizeClinicalNotes(patientId);
            setClinicalSummary(response.data.summary);
        } catch (err) {
            console.error("Failed to generate clinical summary", err);
            alert("Failed to generate summary: " + (err.response?.data?.error || err.message));
        } finally {
            setGeneratingId(null);
        }
    };

    const handleOperationUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('status', editingOperation.status);
        if (editingOperation.result) formData.append('result', editingOperation.result);
        if (editingOperation.operation_notes) formData.append('operation_notes', editingOperation.operation_notes);
        if (editingOperation.performed_at) formData.append('performed_at', editingOperation.performed_at);
        if (editingOperation.newFile) formData.append('post_op_file', editingOperation.newFile);

        try {
            await operationAPI.update(editingOperation.operation_id, formData);
            alert('Operation updated successfully');
            setEditingOperation(null);
            fetchOrders(); // Refresh
        } catch (err) {
            console.error("Failed to update operation", err);
            alert('Failed to update operation');
        }
    };

    useEffect(() => {
        if (selectedPatient) {
            if (activeTab === 'notes') fetchNotes();
            if (activeTab === 'progress_notes') fetchProgressNotes();
            if (activeTab === 'orders' || activeTab === 'reports') fetchOrders();
            if (activeTab === 'operations') fetchOperations();
            if (activeTab === 'prescriptions') {
                fetchPrescriptions();
                fetchMedicines();
            }
            if (activeTab === 'vitals') fetchVitals();
        }
    }, [selectedPatient, activeTab]);

    const fetchVitals = async () => {
        try {
            const response = await vitalAPI.getAll({ visit: selectedPatient.id });
            setVitals(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Failed to fetch vitals", err);
        }
    };

    const fetchMedicines = async () => {
        try {
            const data = await medicineAPI.getAll();
            setMedicines(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch medicines", err);
        }
    };

    const fetchPrescriptions = async () => {
        try {
            const data = await prescriptionAPI.getAll({ visit: selectedPatient.id });
            setPrescriptions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch prescriptions", err);
        }
    };

    const handlePrescriptionSubmit = async (e) => {
        e.preventDefault();
        try {
            await prescriptionAPI.create({
                visit: selectedPatient.id,
                medicine_id: prescriptionForm.medicine_id,
                dosage_per_day: prescriptionForm.dosage_per_day,
                duration: prescriptionForm.duration
            });
            alert('Prescription added successfully');
            setPrescriptionForm({ medicine_id: '', dosage_per_day: 1, duration: 5 });
            fetchPrescriptions();
        } catch (err) {
            console.error("Failed to add prescription", err);
            alert('Failed to add prescription');
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await doctorAPI.getOrders(null, selectedPatient.id);
            setOrders(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        }
    };

    const fetchOperations = async () => {
        try {
            const response = await operationAPI.getAll({ patient: selectedPatient.id });
            setOperations(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Failed to fetch operations", err);
        }
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();

        const orderData = {
            visit: selectedPatient.id,
            order_type: orderFormInfo.order_type,
            details: {}
        };

        if (orderFormInfo.order_type === 'LAB') {
            orderData.details = { test_name: orderFormInfo.test_name, price: orderFormInfo.price };
        } else if (orderFormInfo.order_type === 'RADIOLOGY') {
            orderData.details = { scan_type: orderFormInfo.scan_type, price: orderFormInfo.price };
        } else if (orderFormInfo.order_type === 'OPERATION') {
            orderData.details = { operation_name: orderFormInfo.operation_name, price: orderFormInfo.price };
        }

        try {
            await doctorAPI.createOrder(orderData);
            alert('Order created successfully');
            setOrderFormInfo(prev => ({ ...prev, test_name: '', scan_type: '', operation_name: '', price: 0 }));
            fetchOrders();
        } catch (err) {
            console.error("Failed to create order", err);
            alert('Failed to create order');
        }
    };

    const fetchNotes = async () => {
        try {
            const response = await clinicalNoteAPI.getAll({ visit: selectedPatient.id, note_type: 'CLINICAL' });
            setPatientNotes(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Failed to fetch notes", err);
        }
    };

    const fetchProgressNotes = async () => {
        try {
            const response = await clinicalNoteAPI.getAll({ visit: selectedPatient.id, note_type: 'PROGRESS' });
            setProgressNotes(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Failed to fetch progress notes", err);
        }
    };

    const handleNoteSubmit = async (e) => {
        e.preventDefault();

        if (!user.staff_id) {
            alert("Doctor identification missing. Please logout and login again to refresh your session.");
            return;
        }

        try {
            await clinicalNoteAPI.create({
                visit: selectedPatient.id,
                doctor: user.staff_id, // Still sending doctor for compatibility/CLINICAL types
                symptoms: notesFormData.symptoms,
                diagnosis: notesFormData.diagnosis,
                notes: notesFormData.notes,
                note_type: 'CLINICAL'
            });

            setNotesFormData({ symptoms: '', diagnosis: '', notes: '' });
            fetchNotes();
            alert('Clinical note saved successfully');
        } catch (err) {
            console.error("Error saving note:", err);
            alert('Failed to save clinical note. Please try again.');
        }
    };

    const handleProgressNoteSubmit = async (e) => {
        e.preventDefault();

        if (!user.staff_id) {
            alert("Staff identification missing. Please logout and login again.");
            return;
        }

        try {
            await clinicalNoteAPI.create({
                visit: selectedPatient.id,
                created_by: user.staff_id,
                notes: progressNoteForm,
                note_type: 'PROGRESS'
            });

            setProgressNoteForm('');
            fetchProgressNotes();
            alert('Progress note added successfully');
        } catch (err) {
            console.error("Error saving progress note:", err);
            alert('Failed to save progress note.');
        }
    };

    const handleGenerateSummary = async (type, id) => {
        try {
            setGeneratingId(id);
            const response = await aiAPI.summarizeReport(type, id);
            const summary = response.data.summary;

            // Update the orders state to reflect the new summary
            setOrders(prevOrders => prevOrders.map(order => {
                if (order.order_type === type) {
                    if (type === 'LAB') {
                        return {
                            ...order,
                            lab_tests: order.lab_tests.map(t => t.id === id ? { ...t, ai_summary: summary } : t)
                        };
                    } else if (type === 'RADIOLOGY') {
                        return {
                            ...order,
                            radiology_tests: order.radiology_tests.map(t => t.id === id ? { ...t, ai_summary: summary } : t)
                        };
                    } else if (type === 'OPERATION') {
                        return {
                            ...order,
                            operations: order.operations.map(t => t.operation_id === id ? { ...t, ai_summary: summary } : t)
                        };
                    }
                }
                return order;
            }));

        } catch (err) {
            console.error("Failed to generate summary", err);
            alert("Failed to generate summary: " + (err.response?.data?.error || err.message));
        } finally {
            setGeneratingId(null);
        }
    };

    if (!selectedPatient) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div className='flex gap-4 items-center'>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                                {selectedPatient.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                                <p className="text-emerald-100 mt-1">
                                    UHID: {selectedPatient.patientData?.uhid || selectedPatient.patient_uhid || 'N/A'}
                                    {selectedPatient.bed && ` • Bed: ${selectedPatient.bed}`}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-white rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 hover:scale-110">
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 px-6">
                    <div className="flex gap-2 overflow-x-auto">
                        {(() => {
                            // Define all possible tabs
                            const allTabs = ['details', 'reports', 'notes', 'progress_notes', 'orders', 'operations', 'prescriptions', 'vitals'];
                            // Determine available tabs based on role
                            // Assuming role is stored in user object as 'role' (e.g. 'DOCTOR', 'NURSE')
                            // Role from backend typically uppercase, but checking safely
                            const role = user.role?.toUpperCase() || '';

                            let availableTabs = allTabs;
                            if (role === 'NURSE') {
                                availableTabs = ['progress_notes'];
                            }

                            return availableTabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-3 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab
                                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {tab === 'progress_notes' ? 'Progress Notes' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ));
                        })()}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {activeTab === 'details' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-gray-900">Patient Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className='p-3 bg-gray-50 rounded-lg'>
                                    <span className='block text-gray-500 text-xs uppercase tracking-wide'>UHID</span>
                                    <span className='font-medium text-gray-900'>{selectedPatient.patientData?.uhid || selectedPatient.patient_uhid || 'N/A'}</span>
                                </div>
                                <div className='p-3 bg-gray-50 rounded-lg'>
                                    <span className='block text-gray-500 text-xs uppercase tracking-wide'>Date of Birth</span>
                                    <span className='font-medium text-gray-900'>{selectedPatient.patientData?.date_of_birth || 'N/A'}</span>
                                </div>
                                <div className='p-3 bg-gray-50 rounded-lg'>
                                    <span className='block text-gray-500 text-xs uppercase tracking-wide'>Age</span>
                                    <span className='font-medium text-gray-900'>{selectedPatient.patientData?.age || 'N/A'}</span>
                                </div>
                                <div className='p-3 bg-gray-50 rounded-lg'>
                                    <span className='block text-gray-500 text-xs uppercase tracking-wide'>Gender</span>
                                    <span className='font-medium text-gray-900'>{selectedPatient.patientData?.gender || 'N/A'}</span>
                                </div>
                                <div className='p-3 bg-gray-50 rounded-lg'>
                                    <span className='block text-gray-500 text-xs uppercase tracking-wide'>Blood Group</span>
                                    <span className='font-medium text-gray-900'>{selectedPatient.patientData?.blood_group || 'N/A'}</span>
                                </div>
                                <div className='p-3 bg-gray-50 rounded-lg'>
                                    <span className='block text-gray-500 text-xs uppercase tracking-wide'>Contact</span>
                                    <span className='font-medium text-gray-900'>{selectedPatient.patientData?.phone || 'N/A'}</span>
                                </div>
                                <div className='col-span-2 p-3 bg-gray-50 rounded-lg'>
                                    <span className='block text-gray-500 text-xs uppercase tracking-wide'>Address</span>
                                    <span className='font-medium text-gray-900'>{selectedPatient.patientData?.address || 'N/A'}</span>
                                </div>
                                <div className='p-3 bg-gray-50 rounded-lg'>
                                    <span className='block text-gray-500 text-xs uppercase tracking-wide'>Emergency Contact</span>
                                    <span className='font-medium text-gray-900'>{selectedPatient.patientData?.emergency_contact_name || 'N/A'}</span>
                                </div>
                                <div className='p-3 bg-gray-50 rounded-lg'>
                                    <span className='block text-gray-500 text-xs uppercase tracking-wide'>Emergency Phone</span>
                                    <span className='font-medium text-gray-900'>{selectedPatient.patientData?.emergency_contact_phone || 'N/A'}</span>
                                </div>
                                <div className='col-span-2 p-3 bg-gray-50 rounded-lg'>
                                    <span className='block text-gray-500 text-xs uppercase tracking-wide'>Medical History</span>
                                    <span className='font-medium text-gray-900 whitespace-pre-wrap'>{selectedPatient.patientData?.medical_history || 'None'}</span>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 'reports' && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg text-gray-900">Lab & Radiology Reports</h3>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {orders.filter(o => ['LAB', 'RADIOLOGY'].includes(o.order_type)).length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-700 uppercase">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Test Name</th>
                                                    <th className="px-4 py-3">Type</th>
                                                    <th className="px-4 py-3">Report Status</th>
                                                    <th className="px-4 py-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {orders.filter(o => ['LAB', 'RADIOLOGY'].includes(o.order_type)).map(order => {
                                                    const tests = order.order_type === 'LAB' ? order.lab_tests : order.radiology_tests;
                                                    return tests?.map((test, idx) => (
                                                        <>
                                                            <tr key={`${order.id}-${idx}`} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 text-gray-500">{new Date(order.ordered_at).toLocaleDateString()}</td>
                                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                                    {order.order_type === 'LAB' ? test.test_name : test.scan_type}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${order.order_type === 'LAB' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                                        {order.order_type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {test.report_file ? (
                                                                        <span className="text-emerald-600 font-medium text-xs flex items-center gap-1">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                                            Available
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-amber-600 font-medium text-xs">Pending</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {test.report_file ? (
                                                                        <div className="flex gap-2">
                                                                            <a
                                                                                href={test.report_file}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center px-3 py-1.5 border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
                                                                            >
                                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                                                Download
                                                                            </a>
                                                                            {!test.ai_summary && (
                                                                                <button
                                                                                    onClick={() => handleGenerateSummary(order.order_type, test.id)}
                                                                                    disabled={generatingId === test.id}
                                                                                    className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors 
                                                                                ${generatingId === test.id
                                                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                                            : 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100'}`}
                                                                                >
                                                                                    {generatingId === test.id ? (
                                                                                        <>
                                                                                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                            </svg>
                                                                                            Generating...
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                                                            AI Summary
                                                                                        </>
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-xs italic">No file</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                            {test.ai_summary && (
                                                                <tr className="bg-purple-50/50">
                                                                    <td colSpan="5" className="px-4 py-3">
                                                                        <div className="flex gap-3">
                                                                            <div className="flex-shrink-0 mt-1">
                                                                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-1">AI Generated Summary</h4>
                                                                                <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                                                                    {test.ai_summary}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </>
                                                    ));
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        <p className="italic">No lab or radiology orders found for this patient.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'vitals' && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg text-gray-900">Recorded Vitals</h3>
                            <div className="space-y-4">
                                {vitals.length > 0 ? (
                                    vitals.map((vital) => (
                                        <div key={vital.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                                <span className="text-sm font-medium text-gray-500">Recorded at {new Date(vital.recorded_at).toLocaleString()}</span>
                                                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">Recorded by {vital.recorded_by_name || 'Nurse'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className={`bg-gray-50 p-4 rounded-lg ${isCritical('BP', vital.bp_systolic, vital.bp_diastolic) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}>
                                                    <div className="text-sm text-gray-500 mb-1">Blood Pressure</div>
                                                    <div className={`text-xl font-bold ${isCritical('BP', vital.bp_systolic, vital.bp_diastolic) ? 'text-red-700' : 'text-gray-900'}`}>
                                                        {vital.bp_systolic}/{vital.bp_diastolic} <span className="text-sm font-normal text-gray-500">mmHg</span>
                                                    </div>
                                                </div>
                                                <div className={`bg-gray-50 p-4 rounded-lg ${isCritical('HR', vital.pulse) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}>
                                                    <div className="text-sm text-gray-500 mb-1">Pulse Rate</div>
                                                    <div className={`text-xl font-bold ${isCritical('HR', vital.pulse) ? 'text-red-700' : 'text-gray-900'}`}>
                                                        {vital.pulse} <span className="text-sm font-normal text-gray-500">bpm</span>
                                                    </div>
                                                </div>
                                                <div className={`bg-gray-50 p-4 rounded-lg ${isCritical('TEMP', vital.temperature) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}>
                                                    <div className="text-sm text-gray-500 mb-1">Temperature</div>
                                                    <div className={`text-xl font-bold ${isCritical('TEMP', vital.temperature) ? 'text-red-700' : 'text-gray-900'}`}>
                                                        {vital.temperature} <span className="text-sm font-normal text-gray-500">°F</span>
                                                    </div>
                                                </div>
                                                <div className={`bg-gray-50 p-4 rounded-lg ${isCritical('SPO2', vital.spo2) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}>
                                                    <div className="text-sm text-gray-500 mb-1">SpO2</div>
                                                    <div className={`text-xl font-bold ${isCritical('SPO2', vital.spo2) ? 'text-red-700' : 'text-gray-900'}`}>
                                                        {vital.spo2} <span className="text-sm font-normal text-gray-500">%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <p className="italic">No vitals recorded for this visit yet.</p>
                                        <p className="text-xs mt-2 text-gray-400">Vitals are recorded by nursing staff.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'progress_notes' && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-gray-900">Progress Notes</h3>

                            {/* Progress Notes List */}
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {progressNotes.length > 0 ? (
                                    progressNotes.map((note) => (
                                        <div key={note.note_id} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs text-gray-500">{new Date(note.created_at).toLocaleString()}</span>
                                                <span className="text-xs font-medium text-blue-700">
                                                    {note.created_by_name || (note.doctor_name ? `Dr. ${note.doctor_name}` : 'Staff')}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                                {note.notes}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 italic py-8">No progress notes yet.</p>
                                )}
                            </div>

                            <hr className="border-gray-200" />

                            {/* Add Progress Note Form */}
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-3">Add Progress Note</h4>
                                <form onSubmit={handleProgressNoteSubmit}>
                                    <textarea
                                        required
                                        value={progressNoteForm}
                                        onChange={(e) => setProgressNoteForm(e.target.value)}
                                        className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mb-3"
                                        placeholder="Enter progress note details..."
                                    ></textarea>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
                                        >
                                            Add Note
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Clinical Notes History</h3>
                                <button
                                    onClick={() => handleGenerateClinicalSummary(selectedPatient.patientData.id || selectedPatient.patient)}
                                    disabled={generatingId === 'notes'}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2
                                        ${generatingId === 'notes'
                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'}`}
                                >
                                    {generatingId === 'notes' ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating History...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            Generate History Summary
                                        </>
                                    )}
                                </button>
                            </div>

                            {clinicalSummary && (
                                <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 mb-4 animate-fadeIn">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wide mb-2">AI Summary of Clinical History</h4>
                                            <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed prose prose-sm prose-purple">
                                                {clinicalSummary}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setClinicalSummary(null)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Notes History */}
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {patientNotes.length > 0 ? (
                                    patientNotes.map((note) => (
                                        <div key={note.note_id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs text-gray-500">{new Date(note.created_at).toLocaleString()}</span>
                                                <span className="text-xs font-medium text-emerald-600">Dr. {user.name}</span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2 text-sm">
                                                <div><span className="font-semibold">Symptoms:</span> {note.symptoms}</div>
                                                <div><span className="font-semibold">Diagnosis:</span> {note.diagnosis}</div>
                                                <div><span className="font-semibold">Note:</span> {note.notes}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No previous notes found for this visit.</p>
                                )}
                            </div>

                            <hr className="border-gray-200" />

                            {/* New Note Form */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-4">Add New Clinical Note</h3>
                                <form onSubmit={handleNoteSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                                        <textarea
                                            required
                                            value={notesFormData.symptoms}
                                            onChange={(e) => setNotesFormData({ ...notesFormData, symptoms: e.target.value })}
                                            className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                            placeholder="List observed symptoms..."
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                                        <textarea
                                            required
                                            value={notesFormData.diagnosis}
                                            onChange={(e) => setNotesFormData({ ...notesFormData, diagnosis: e.target.value })}
                                            className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                            placeholder="Enter medical diagnosis..."
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                                        <textarea
                                            required
                                            value={notesFormData.notes}
                                            onChange={(e) => setNotesFormData({ ...notesFormData, notes: e.target.value })}
                                            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                            placeholder="Detailed clinical findings and remarks..."
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
                                    >
                                        Save Clinical Note
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="space-y-6">
                            {/* Order Form */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4">Create New Order</h3>
                                <form onSubmit={handleOrderSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                                            <select
                                                value={orderFormInfo.order_type}
                                                onChange={(e) => setOrderFormInfo({ ...orderFormInfo, order_type: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                                            >
                                                <option value="LAB">Lab Test</option>
                                                <option value="RADIOLOGY">Radiology</option>
                                                <option value="OPERATION">Operation/Surgery</option>
                                            </select>
                                        </div>

                                        {/* Dynamic Fields */}
                                        {orderFormInfo.order_type === 'LAB' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. CBC, Liver Function Test"
                                                    value={orderFormInfo.test_name}
                                                    onChange={(e) => setOrderFormInfo({ ...orderFormInfo, test_name: e.target.value })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                        )}

                                        {orderFormInfo.order_type === 'RADIOLOGY' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Scan Type</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. X-Ray Chest, MRI Brain"
                                                    value={orderFormInfo.scan_type}
                                                    onChange={(e) => setOrderFormInfo({ ...orderFormInfo, scan_type: e.target.value })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                        )}

                                        {orderFormInfo.order_type === 'OPERATION' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Operation Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Appendectomy"
                                                    value={orderFormInfo.operation_name}
                                                    onChange={(e) => setOrderFormInfo({ ...orderFormInfo, operation_name: e.target.value })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
                                        >
                                            Create Order
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <hr className="border-gray-200" />

                            {/* Orders History */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-4">Orders History</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-700 uppercase">
                                            <tr>
                                                <th className="px-4 py-3">Order ID</th>
                                                <th className="px-4 py-3">Type</th>
                                                <th className="px-4 py-3">Test/Procedure</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Report</th>
                                                <th className="px-4 py-3">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id} className="border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium">#{order.id}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold 
                                                            ${order.order_type === 'LAB' ? 'bg-blue-100 text-blue-800' :
                                                                order.order_type === 'RADIOLOGY' ? 'bg-purple-100 text-purple-800' :
                                                                    'bg-red-100 text-red-800'}`}>
                                                            {order.order_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700">
                                                        {order.order_type === 'LAB' && order.lab_tests?.map(t => t.test_name).join(', ')}
                                                        {order.order_type === 'RADIOLOGY' && order.radiology_tests?.map(t => t.scan_type).join(', ')}
                                                        {order.order_type === 'OPERATION' && order.operations?.map(t => t.operation_name).join(', ')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {order.order_type === 'LAB' && order.lab_tests?.map((t, i) => (
                                                            <span key={i} className={`px-2 py-1 rounded-full text-xs block w-fit mb-1
                                                                ${t.status === 'ORDERED' ? 'bg-blue-100 text-blue-800' :
                                                                    t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                        'bg-gray-100 text-gray-800'}`}>
                                                                {t.status}
                                                            </span>
                                                        ))}
                                                        {order.order_type === 'RADIOLOGY' && order.radiology_tests?.map((t, i) => (
                                                            <span key={i} className={`px-2 py-1 rounded-full text-xs block w-fit mb-1
                                                                ${t.status === 'ORDERED' ? 'bg-blue-100 text-blue-800' :
                                                                    t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                        'bg-gray-100 text-gray-800'}`}>
                                                                {t.status}
                                                            </span>
                                                        ))}
                                                        {order.order_type === 'OPERATION' && order.operations?.map((t, i) => (
                                                            <span key={i} className={`px-2 py-1 rounded-full text-xs block w-fit mb-1
                                                                ${t.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-800' :
                                                                    t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                        'bg-gray-100 text-gray-800'}`}>
                                                                {t.status}
                                                            </span>
                                                        ))}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {order.order_type === 'LAB' && order.lab_tests?.map((t, i) => (
                                                            t.report_file ? <a key={i} href={t.report_file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs block">View Report</a> : <span key={i} className="text-xs text-gray-400 block">Pending</span>
                                                        ))}
                                                        {order.order_type === 'RADIOLOGY' && order.radiology_tests?.map((t, i) => (
                                                            t.report_file ? <a key={i} href={t.report_file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs block">View Image</a> : <span key={i} className="text-xs text-gray-400 block">Pending</span>
                                                        ))}
                                                        {order.order_type === 'OPERATION' && "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        {new Date(order.ordered_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {orders.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                                                        No orders found for this visit.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'operations' && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg text-gray-900">Patient Operations</h3>

                            <div className="grid grid-cols-1 gap-4">
                                {operations.map(op => (
                                    <div key={op.operation_id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900">{op.operation_name}</h4>
                                                <p className="text-sm text-gray-500">
                                                    Dr. {op.surgeon_name || 'Unknown'} • {new Date(op.ordered_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                                                    ${op.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                        op.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                                                            op.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-gray-100 text-gray-600'}`}>
                                                    {op.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <div>
                                                <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Result</span>
                                                <p className="font-medium text-gray-900">{op.result || 'Pending'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Notes</span>
                                                <p className="text-gray-700 whitespace-pre-wrap">{op.operation_notes || 'No notes added.'}</p>
                                            </div>
                                            {op.post_op_file && (
                                                <div className="col-span-2 mt-2 flex gap-2 items-center flex-wrap">
                                                    <a
                                                        href={op.post_op_file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                        View Operation Scan/File
                                                    </a>

                                                    {!op.ai_summary && (
                                                        <button
                                                            onClick={() => handleGenerateSummary('OPERATION', op.operation_id)}
                                                            disabled={generatingId === op.operation_id}
                                                            className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors 
                                                            ${generatingId === op.operation_id
                                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                    : 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100'}`}
                                                        >
                                                            {generatingId === op.operation_id ? (
                                                                <>
                                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Generating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                                    AI Summary
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {op.ai_summary && (
                                                <div className="col-span-2 mt-3 bg-purple-50 rounded-lg p-4 border border-purple-100">
                                                    <div className="flex gap-3">
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-1">AI Generated Follow-up Summary</h4>
                                                            <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                                                                {op.ai_summary}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {operations.length === 0 && (
                                    <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <p className="italic">No operations scheduled.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}



                    {activeTab === 'prescriptions' && (
                        <div className="space-y-6">
                            {/* Prescription Form */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4">Add Prescription</h3>
                                <form onSubmit={handlePrescriptionSubmit} className="grid grid-cols-4 gap-4 items-end">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Medicine</label>
                                        <select
                                            required
                                            value={prescriptionForm.medicine_id}
                                            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicine_id: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                                        >
                                            <option value="">Select Medicine</option>
                                            {medicines.map(med => (
                                                <option key={med.medicine_id} value={med.medicine_id}>{med.name} (Stock: {med.stock_qty})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage (per day)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={prescriptionForm.dosage_per_day}
                                            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage_per_day: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={prescriptionForm.duration}
                                            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="col-span-4 flex justify-end">
                                        <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm">
                                            Add Prescription
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <hr className="border-gray-200" />

                            {/* Prescription History */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-4">Prescription History</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-700 uppercase">
                                            <tr>
                                                <th className="px-4 py-3">Medicine</th>
                                                <th className="px-4 py-3">Dosage/Day</th>
                                                <th className="px-4 py-3">Duration</th>
                                                <th className="px-4 py-3">Total Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {prescriptions.map((p) => (
                                                <tr key={p.prescription_id} className="border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-gray-900">{p.medicine?.name || `Med #${p.medicine}`}</td>
                                                    <td className="px-4 py-3">{p.dosage_per_day}</td>
                                                    <td className="px-4 py-3">{p.duration} days</td>
                                                    <td className="px-4 py-3 font-semibold">{p.quantity}</td>
                                                </tr>
                                            ))}
                                            {prescriptions.length === 0 && (
                                                <tr><td colSpan="4" className="px-4 py-4 text-center text-gray-500">No prescriptions added.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
