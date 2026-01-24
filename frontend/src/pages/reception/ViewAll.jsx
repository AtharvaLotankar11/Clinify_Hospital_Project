import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { patientAPI, visitAPI, admissionAPI } from '../../services/api';

export default function ViewAllRecords() {
    const [activeTab, setActiveTab] = useState('patients'); // patients, visits, admissions
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab, searchTerm]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            let response;
            const params = searchTerm ? { search: searchTerm } : {};

            if (activeTab === 'patients') {
                response = await patientAPI.getAll(params);
            } else if (activeTab === 'visits') {
                response = await visitAPI.getAll(params);
            } else if (activeTab === 'admissions') {
                response = await admissionAPI.getAll(params); // admissionAPI needs getAll support with params
            }

            // Handle potential DRF pagination result { count: ..., results: [...] } or direct array
            const results = response.data.results || response.data;
            setData(Array.isArray(results) ? results : []);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch records');
        } finally {
            setLoading(false);
        }
    };

    const columns = {
        patients: [
            { header: 'ID', accessor: 'id' },
            { header: 'UHID', accessor: (row) => row.uhid || 'N/A' },
            { header: 'Name', accessor: 'name' },
            { header: 'Age/Gender', accessor: (row) => `${row.age} / ${row.gender}` },
            { header: 'Phone', accessor: 'phone' },
            { header: 'Reg. Date', accessor: (row) => row.created_at?.slice(0, 10) },
        ],
        visits: [
            { header: 'ID', accessor: 'id' },
            { header: 'Date', accessor: 'visit_date' },
            { header: 'Patient', accessor: (row) => row.patient?.name || row.patient_name || 'N/A' },
            { header: 'UHID', accessor: (row) => row.patient?.uhid || 'N/A' },
            { header: 'Type', accessor: 'visit_type' },
            { header: 'Doctor', accessor: (row) => row.doctor?.name || row.doctor_name || 'N/A' },
            { header: 'Status', accessor: 'status' },
        ],
        admissions: [
            { header: 'ID', accessor: 'admission_id' },
            { header: 'Patient', accessor: (row) => row.visit?.patient?.name || 'N/A' },
            { header: 'UHID', accessor: (row) => row.visit?.patient?.uhid || 'N/A' },
            { header: 'Bed', accessor: (row) => row.bed_details ? `${row.bed_details.ward}-${row.bed_details.bed_number}` : (row.bed || 'N/A') },
            { header: 'Admitted On', accessor: (row) => row.admission_date?.slice(0, 16).replace('T', ' ') },
            { header: 'Discharged', accessor: (row) => row.discharge_date ? row.discharge_date.slice(0, 16).replace('T', ' ') : 'Active' },
        ]
    };

    const renderCell = (row, col) => {
        if (typeof col.accessor === 'function') return col.accessor(row);
        return row[col.accessor];
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar role="reception" />
            <div className="ml-72 transition-all duration-300">
                <Header userName="Receptionist" userRole="Reception" />
                <main className="p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">All Records</h1>
                                <p className="text-sm text-gray-500 mt-1">View and manage hospital records</p>
                            </div>

                            {/* Search */}
                            <div className="relative w-72">
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-4 border-b border-gray-200 pb-1">
                            {['patients', 'visits', 'admissions'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
                                    className={`px-4 py-2 capitalize font-bold text-sm transition-colors relative ${activeTab === tab ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {loading ? (
                                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                                    <svg className="animate-spin h-8 w-8 text-emerald-500 mb-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Loading records...
                                </div>
                            ) : error ? (
                                <div className="p-12 text-center text-red-500 font-bold">{error}</div>
                            ) : data.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 italic">No {activeTab} found.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-bold text-gray-500">
                                            <tr>
                                                {columns[activeTab].map((col, idx) => (
                                                    <th key={idx} className="px-6 py-4">{col.header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data.map((row) => (
                                                <tr key={row.id || row.admission_id} className="hover:bg-gray-50/50 transition-colors">
                                                    {columns[activeTab].map((col, idx) => (
                                                        <td key={idx} className="px-6 py-4 text-gray-700">
                                                            {renderCell(row, col)}
                                                        </td>
                                                    ))}
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
