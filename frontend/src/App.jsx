import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import DoctorDashboard from './pages/doctor/Dashboard';
import Orders from './pages/doctor/Orders';
import PatientProfile from './pages/doctor/PatientProfile';
import NurseDashboard from './pages/nurse/Dashboard';
import Vitals from './pages/nurse/Vitals';
import BedManagement from './pages/nurse/BedManagement';
import LabDashboard from './pages/lab/Dashboard';
import UploadReport from './pages/lab/UploadReport';
import BillingDashboard from './pages/billing/Dashboard';
import PatientBill from './pages/billing/PatientBill';
import CreateBill from './pages/billing/CreateBill';
import PharmacyDashboard from './pages/pharmacy/Dashboard';
import Prescriptions from './pages/pharmacy/Prescriptions';
import Inventory from './pages/pharmacy/Inventory';
import DispenseMedicine from './pages/pharmacy/DispenseMedicine';
import InteractionAlerts from './pages/pharmacy/InteractionAlerts';
import AdminDashboard from './pages/admin/Dashboard';
import RegisterUser from './pages/admin/RegisterUser';
import UserManagement from './pages/admin/UserManagement';
import EditUser from './pages/admin/EditUser';
import ReceptionDashboard from './pages/reception/Dashboard';
import RegisterPatient from './pages/reception/RegisterPatient';
import CreateVisit from './pages/reception/CreateVisit';
import AdmissionManagement from './pages/reception/AdmissionManagement';
import ViewAllRecords from './pages/reception/ViewAll';
import OTDashboard from './pages/ot/OTDashboard';
import SurgeryConsole from './pages/ot/SurgeryConsole';
import SupportDashboard from './pages/support/Dashboard';
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/register-user" element={<RegisterUser />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/users/:userId" element={<EditUser />} />

        {/* Reception Routes */}
        <Route path="/reception/dashboard" element={<ReceptionDashboard />} />
        <Route path="/reception/register-patient" element={<RegisterPatient />} />
        <Route path="/reception/create-visit" element={<CreateVisit />} />
        <Route path="/reception/admissions" element={<AdmissionManagement />} />
        <Route path="/reception/view-all" element={<ViewAllRecords />} />
        <Route path="/ot/dashboard" element={<OTDashboard />} />
        <Route path="/ot/surgery/:id" element={<SurgeryConsole />} />

        {/* Doctor Routes - Bypassing auth for development */}
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/orders" element={<Orders />} />
        <Route path="/doctor/patients" element={<PatientProfile />} />
        <Route path="/doctor/patients/:patientId" element={<PatientProfile />} />

        {/* Nurse Routes */}
        <Route path="/nurse/dashboard" element={<NurseDashboard />} />
        <Route path="/nurse/vitals" element={<Vitals />} />
        <Route path="/nurse/beds" element={<BedManagement />} />

        {/* Lab Routes */}
        <Route path="/lab_tech/dashboard" element={<LabDashboard />} />
        <Route path="/lab_tech/upload" element={<UploadReport />} />

        {/* Billing Routes */}
        <Route path="/billing/dashboard" element={<BillingDashboard />} />
        <Route path="/billing/create" element={<CreateBill />} />
        <Route path="/billing/bills" element={<PatientBill />} />

        {/* Pharmacy Routes */}
        <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
        <Route path="/pharmacy/prescriptions" element={<Prescriptions />} />
        <Route path="/pharmacy/inventory" element={<Inventory />} />
        <Route path="/pharmacy/dispense" element={<DispenseMedicine />} />
        <Route path="/pharmacy/alerts" element={<InteractionAlerts />} />

        {/* Support Staff Routes */}
        <Route path="/support/dashboard" element={<SupportDashboard />} />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/reception" element={<Navigate to="/reception/dashboard" replace />} />
        <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="/nurse" element={<Navigate to="/nurse/dashboard" replace />} />
        <Route path="/lab_tech" element={<Navigate to="/lab_tech/dashboard" replace />} />
        <Route path="/billing" element={<Navigate to="/billing/dashboard" replace />} />
        <Route path="/pharmacy" element={<Navigate to="/pharmacy/dashboard" replace />} />
        <Route path="/support" element={<Navigate to="/support/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;



