import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { billingAPI } from "../../services/api";

export default function BillingDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingBills: 0,
    collectedToday: 0,
    totalRevenue: 0,
    insuranceClaims: 0,
  });
  const [pendingBills, setPendingBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data for now
      setStats({
        pendingBills: 12,
        collectedToday: 45000,
        totalRevenue: 125000,
        insuranceClaims: 8,
      });
      try {
        const response = await billingAPI.getPendingItems();
        setPendingBills(response.data);
        setStats((prev) => ({ ...prev, pendingBills: response.data.length }));
      } catch (err) {
        console.error("Error fetching pending items", err);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
      <Sidebar role="billing" />

      <div className="ml-72 transition-all duration-300">
        <Header userName={user.name || "Billing Staff"} userRole="Billing" />

        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <img
                      src="/icons/billing.png"
                      alt="Billing"
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Billing Dashboard
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage patient bills and revenue
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">

                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                      Today
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-amber-100 p-6 transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Pending Bills
                    </p>
                    <p className="text-4xl font-bold text-gray-900">
                      {stats.pendingBills}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-green-100 p-6 transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Collected Today
                    </p>
                    <p className="text-4xl font-bold text-gray-900">
                      ₹{(stats.collectedToday / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-emerald-100 p-6 transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Total Revenue
                    </p>
                    <p className="text-4xl font-bold text-gray-900">
                      ₹{(stats.totalRevenue / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-blue-100 p-6 transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Insurance Claims
                    </p>
                    <p className="text-4xl font-bold text-gray-900">
                      {stats.insuranceClaims}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div> */}

            {/* High Priority Bills */}
            {/* <div className="bg-white rounded-xl shadow-md border-l-4 border-amber-500 p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 bg-amber-50 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-amber-900">High Priority Bills</h2>
                            </div>
                            <div className="space-y-3">
                                <div className="p-4 bg-amber-50 rounded-lg flex items-center justify-between border border-amber-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 bg-amber-600 rounded-full animate-pulse"></div>
                                        <p className="text-base font-bold text-amber-900">Outstanding: Sarah Wilson - ₹12,000 (Surgery)</p>
                                    </div>
                                    <span className="text-sm font-bold text-amber-600 font-mono">4 HOURS AGO</span>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-lg flex items-center justify-between border border-amber-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 bg-amber-600 rounded-full animate-pulse"></div>
                                        <p className="text-base font-bold text-amber-900">Outstanding: John Doe - ₹5,500 (Consultation & Tests)</p>
                                    </div>
                                    <span className="text-sm font-bold text-amber-600 font-mono">2 HOURS AGO</span>
                                </div>
                            </div>
                        </div> */}

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">
                  Pending Bills
                </h2>
                <button
                  onClick={() => navigate("/billing/bills")}
                  className="px-6 py-2 bg-emerald-50 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  View All
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <svg
                    className="animate-spin h-8 w-8 text-emerald-600"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              ) : pendingBills.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No pending bills</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingBills.map((patientBill) => (
                    <div
                      key={patientBill.patientId}
                      className="border border-gray-200 rounded-lg p-5 hover:border-emerald-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {patientBill.patientName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-base font-semibold text-gray-800">
                                {patientBill.patientName}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                                Pending
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {patientBill.items.length} Items • Total: ₹
                              {patientBill.totalAmount.toLocaleString()}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {patientBill.items
                                .slice(0, 3)
                                .map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                  >
                                    {item.name}
                                  </span>
                                ))}
                              {patientBill.items.length > 3 && (
                                <span className="text-xs text-gray-500 px-1">
                                  +{patientBill.items.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            navigate(
                              `/billing/create?patientId=${patientBill.patientId}`,
                            )
                          }
                          className="px-5 py-2 bg-emerald-50 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          Create Bill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
