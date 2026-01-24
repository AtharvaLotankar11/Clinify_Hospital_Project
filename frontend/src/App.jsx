import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
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
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/register-user"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <RegisterUser />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <UserManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users/:userId"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <EditUser />
              </PrivateRoute>
            }
          />

          {/* Reception Routes */}
          <Route
            path="/reception/dashboard"
            element={
              <PrivateRoute allowedRoles={['reception']}>
                <ReceptionDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/reception/register-patient"
            element={
              <PrivateRoute allowedRoles={['reception']}>
                <RegisterPatient />
              </PrivateRoute>
            }
          />
          <Route
            path="/reception/create-visit"
            element={
              <PrivateRoute allowedRoles={['reception']}>
                <CreateVisit />
              </PrivateRoute>
            }
          />
          <Route
            path="/reception/admissions"
            element={
              <PrivateRoute allowedRoles={['reception']}>
                <AdmissionManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/reception/view-all"
            element={
              <PrivateRoute allowedRoles={['reception']}>
                <ViewAllRecords />
              </PrivateRoute>
            }
          />

          {/* OT Routes */}
          <Route
            path="/ot/dashboard"
            element={
              <PrivateRoute allowedRoles={['ot']}>
                <OTDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/ot/surgery/:id"
            element={
              <PrivateRoute allowedRoles={['ot']}>
                <SurgeryConsole />
              </PrivateRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor/dashboard"
            element={
              <PrivateRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/orders"
            element={
              <PrivateRoute allowedRoles={['doctor']}>
                <Orders />
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <PrivateRoute allowedRoles={['doctor']}>
                <PatientProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/patients/:patientId"
            element={
              <PrivateRoute allowedRoles={['doctor']}>
                <PatientProfile />
              </PrivateRoute>
            }
          />

          {/* Nurse Routes */}
          <Route
            path="/nurse/dashboard"
            element={
              <PrivateRoute allowedRoles={['nurse']}>
                <NurseDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/nurse/vitals"
            element={
              <PrivateRoute allowedRoles={['nurse']}>
                <Vitals />
              </PrivateRoute>
            }
          />
          <Route
            path="/nurse/beds"
            element={
              <PrivateRoute allowedRoles={['nurse']}>
                <BedManagement />
              </PrivateRoute>
            }
          />

          {/* Lab Routes */}
          <Route
            path="/lab_tech/dashboard"
            element={
              <PrivateRoute allowedRoles={['lab_tech', 'lab']}>
                <LabDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/lab_tech/upload"
            element={
              <PrivateRoute allowedRoles={['lab_tech', 'lab']}>
                <UploadReport />
              </PrivateRoute>
            }
          />

          {/* Billing Routes */}
          <Route
            path="/billing/dashboard"
            element={
              <PrivateRoute allowedRoles={['billing']}>
                <BillingDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/billing/create"
            element={
              <PrivateRoute allowedRoles={['billing']}>
                <CreateBill />
              </PrivateRoute>
            }
          />
          <Route
            path="/billing/bills"
            element={
              <PrivateRoute allowedRoles={['billing']}>
                <PatientBill />
              </PrivateRoute>
            }
          />

          {/* Pharmacy Routes */}
          <Route
            path="/pharmacy/dashboard"
            element={
              <PrivateRoute allowedRoles={['pharmacy', 'pharmacist']}>
                <PharmacyDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/pharmacy/prescriptions"
            element={
              <PrivateRoute allowedRoles={['pharmacy', 'pharmacist']}>
                <Prescriptions />
              </PrivateRoute>
            }
          />
          <Route
            path="/pharmacy/inventory"
            element={
              <PrivateRoute allowedRoles={['pharmacy', 'pharmacist']}>
                <Inventory />
              </PrivateRoute>
            }
          />
          <Route
            path="/pharmacy/dispense"
            element={
              <PrivateRoute allowedRoles={['pharmacy', 'pharmacist']}>
                <DispenseMedicine />
              </PrivateRoute>
            }
          />
          <Route
            path="/pharmacy/alerts"
            element={
              <PrivateRoute allowedRoles={['pharmacy', 'pharmacist']}>
                <InteractionAlerts />
              </PrivateRoute>
            }
          />

          {/* Support Staff Routes */}
          <Route
            path="/support/dashboard"
            element={
              <PrivateRoute allowedRoles={['support']}>
                <SupportDashboard />
              </PrivateRoute>
            }
          />

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
    </AuthProvider>
  );
}

export default App;



