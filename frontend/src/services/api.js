import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Optional: redirect to login
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth endpoints
export const authAPI = {
    login: (credentials) => api.post('/token/', credentials),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};

// Patient endpoints
export const patientAPI = {
    getAll: (params) => api.get('/patients/', { params }),
    getById: (id) => api.get(`/patients/${id}/`),
    create: (data) => api.post('/patients/', data),
    update: (id, data) => api.put(`/patients/${id}/`, data),
    delete: (id) => api.delete(`/patients/${id}/`),
};

// Visit endpoints
export const visitAPI = {
    getAll: (params) => api.get('/visits/', { params }),
    getById: (id) => api.get(`/visits/${id}/`),
    create: (data) => api.post('/visits/', data),
    update: (id, data) => api.patch(`/visits/${id}/`, data),
    delete: (id) => api.delete(`/visits/${id}/`),
    getBookedSlots: (doctorId, date) => api.get('/visits/booked_slots/', { params: { doctor_id: doctorId, date } }),
};

// Admission endpoints
export const admissionAPI = {
    getAll: () => api.get('/admissions/'),
    getById: (id) => api.get(`/admissions/${id}/`),
    create: (data) => api.post('/admissions/', data),
    update: (id, data) => api.patch(`/admissions/${id}/`, data),
};

// Bed endpoints
export const bedAPI = {
    getAll: () => api.get('/beds/'),
    getById: (id) => api.get(`/beds/${id}/`),
    create: (data) => api.post('/beds/', data),
    update: (id, data) => api.patch(`/beds/${id}/`, data),
    delete: (id) => api.delete(`/beds/${id}/`),
};

// Vital endpoints
export const vitalAPI = {
    getAll: (params) => api.get('/vitals/', { params }),
    create: (data) => api.post('/vitals/', data),
    update: (id, data) => api.patch(`/vitals/${id}/`, data),
    delete: (id) => api.delete(`/vitals/${id}/`),
};

// Clinical Note endpoints
export const clinicalNoteAPI = {
    create: (data) => api.post('/clinical-notes/', data),
    getAll: (params) => api.get('/clinical-notes/', { params }),
};

// Medicine endpoints
export const medicineAPI = {
    getAll: async () => {
        const response = await api.get('/medicines/');
        return response.data;
    },
    getLowStock: async () => {
        const response = await api.get('/medicines/low_stock/');
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/medicines/stats/');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/medicines/', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`/medicines/${id}/`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/medicines/${id}/`);
        return response.data;
    },
};

// Prescription endpoints
export const prescriptionAPI = {
    getAll: async (params) => {
        const response = await api.get('/prescriptions/', { params });
        return response.data;
    },
    getPending: async () => {
        const response = await api.get('/prescriptions/pending/');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/prescriptions/', data);
        return response.data;
    },
    dispense: async (prescriptionId, data) => {
        console.log('Dispensing prescription:', prescriptionId, 'Data:', data);
        try {
            const response = await api.post(`/prescriptions/${prescriptionId}/dispense/`, data);
            console.log('Dispense response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Dispense API error:', error.response?.status, error.response?.data);
            throw error;
        }
    },
    getDispenseHistory: async (prescriptionId) => {
        const params = new URLSearchParams({ prescription: prescriptionId });
        const response = await api.get(`/prescription-dispenses/?${params.toString()}`);
        return response.data;
    },
};

// Batch endpoints
export const batchAPI = {
    getAll: (params) => api.get('/medicine-batches/', { params }),
    getById: (id) => api.get(`/medicine-batches/${id}/`),
    create: (data) => api.post('/medicine-batches/', data),
    update: (id, data) => api.patch(`/medicine-batches/${id}/`, data),
    getTraceability: (id) => api.get(`/medicine-batches/${id}/traceability/`),
};

// Stock Transaction endpoints
export const stockTransactionAPI = {
    getAll: (params) => api.get('/stock-transactions/', { params }),
};


// Doctor endpoints
export const doctorAPI = {
    getDashboard: () => api.get('/doctor/dashboard'),
    getOrders: (tab, visitId) => api.get(`/orders/?visit=${visitId}`),
    createOrder: (data) => api.post('/orders/', data),
    getPatientProfile: (id) => api.get(`/doctor/patients/${id}`),
    saveConsultation: (id, data) => api.post(`/doctor/patients/${id}/consultation`, data),
    getClinicalNotes: (id) => api.get(`/doctor/patients/${id}/notes`),
    addClinicalNote: (id, note) => api.post(`/doctor/patients/${id}/notes`, note),
    getLabResults: (id) => api.get(`/doctor/patients/${id}/lab-results`),
};



// Staff endpoints
export const staffAPI = {
    getAll: (params) => api.get('/staff/', { params }),
    getById: (id) => api.get(`/staff/${id}/`),
    create: (data) => api.post('/staff/', data),
    update: (id, data) => api.patch(`/staff/${id}/`, data),
    delete: (id) => api.delete(`/staff/${id}/`),
    adminResetPassword: (userId, newPassword) => api.post('/admin-reset-password/', { user_id: userId, new_password: newPassword }),
};

// Lab Tech endpoints
export const labTechAPI = {
    getLabTests: (params) => api.get('/lab-tests/', { params }),
    getRadiologyTests: (params) => api.get('/radiology-tests/', { params }),
    updateLabTest: (id, data) => api.patch(`/lab-tests/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateRadiologyTest: (id, data) => api.patch(`/radiology-tests/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};


// Billing endpoints
export const billingAPI = {
    getPendingItems: (params) => api.get('/bills/pending_items/', { params }),
    getBills: (params) => api.get('/bills/', { params }),
    createBill: (data) => api.post('/bills/', data),
    updateBill: (id, data) => api.patch(`/bills/${id}/`, data),
    getBillItems: (params) => api.get('/bill-items/', { params }),
    createBillItem: (data) => api.post('/bill-items/', data),
};

// Operation endpoints
// Operation endpoints
export const operationAPI = {
    getAll: (params) => api.get('/operations/', { params }),
    getById: (id) => api.get(`/operations/${id}/`),
    create: (data) => api.post('/operations/', data),
    // Standard update (files + data)
    update: (id, data) => api.patch(`/operations/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    // JSON update for lighter interactions (checklist, notes)
    updateJson: (id, data) => api.patch(`/operations/${id}/`, data),
};

// Allergy endpoints
export const allergyAPI = {
    getAll: (params) => api.get('/allergies/', { params }),
    create: (data) => api.post('/allergies/', data),
    delete: (id) => api.delete(`/allergies/${id}/`),
};

// AI endpoints
export const aiAPI = {
    summarizeReport: (type, id) => api.post('/ai/summarize-report/', { report_type: type, report_id: id }),
    summarizeClinicalNotes: (patientId) => api.post('/ai/summarize-clinical-notes/', { patient_id: patientId }),
    checkInteractions: (patientId, medicines) => api.post('/ai/check-interactions/', { patient_id: patientId, medicines }),
};

export default api;
