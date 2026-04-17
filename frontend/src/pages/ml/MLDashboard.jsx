import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, AlertTriangle, TrendingUp, Search, Bell, Menu, X, BrainCircuit, HeartPulse, ChevronRight, Stethoscope
} from 'lucide-react';
import { 
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, Tooltip 
} from 'recharts';

// --- Theme Colors ---
const COLORS = {
  high: '#EF4444',
  moderate: '#F59E0B',
  low: '#10B981',
  teal: '#0D9488',
  blue: '#2563EB',
  purple: '#8B5CF6'
};

// --- Mock Data for UI Prototyping ---
const MOCK_RISK_DATA = [
  { name: 'Low Risk', value: 65, color: COLORS.low },
  { name: 'Moderate Risk', value: 25, color: COLORS.moderate },
  { name: 'High Risk', value: 10, color: COLORS.high },
];

const MOCK_UTILIZATION = [
  { name: 'ICU', Beds: 85, Staff: 90 },
  { name: 'ER', Beds: 95, Staff: 98 },
  { name: 'General', Beds: 60, Staff: 75 },
  { name: 'Pediatrics', Beds: 45, Staff: 60 },
];

const MOCK_SHAP = [
  { feature: 'Age', importance: 0.85 },
  { feature: 'Systolic_BP', importance: 0.72 },
  { feature: 'Diagnosis_COPD', importance: 0.65 },
  { feature: 'Heart_Rate', importance: 0.45 },
  { feature: 'Glucose_Level', importance: 0.38 },
];

const MOCK_PATIENTS = [
  { id: '1024', name: 'John Doe', risk: 'High', prob: '89%', target: 'ICU Triage' },
  { id: '1025', name: 'Sarah Smith', risk: 'Moderate', prob: '65%', target: 'Monitor' },
  { id: '1026', name: 'Mike Johnson', risk: 'Low', prob: '12%', target: 'Discharge Prep' },
  { id: '1027', name: 'Emma Davis', risk: 'High', prob: '94%', target: 'Ventilator Watch' },
];

// --- Components ---

function KPICard({ title, value, detail, icon: Icon, trend, isPositive }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 tabular-nums tracking-tight">{value}</h3>
          
          <div className="flex items-center mt-3 gap-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {trend}
            </span>
            <span className="text-gray-400 text-xs">{detail}</span>
          </div>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
          <Icon size={24} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

export default function MLDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Simulate AI Loading
  useEffect(() => {
    setTimeout(() => setLoading(false), 1200);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-gray-800">
      
      {/* 1. Left Sidebar Navigation */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col relative z-20`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
          {sidebarOpen && (
            <div className="flex items-center gap-2 font-bold text-xl text-gray-900 tracking-tight">
              <BrainCircuit className="text-blue-600" />
              Clinify AI<span className="text-blue-600">.</span>
            </div>
          )}
          {!sidebarOpen && <BrainCircuit className="text-blue-600 mx-auto" />}
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { icon: Activity, label: 'Analytics Hub', active: true },
            { icon: Users, label: 'Patient Triage' },
            { icon: HeartPulse, label: 'Model Metrics' },
            { icon: AlertTriangle, label: 'Risk Alerts' },
          ].map((item, idx) => (
            <div key={idx} className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${
              item.active 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}>
              <item.icon size={20} strokeWidth={item.active ? 2.5 : 2} />
              {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* 2. Top Header Navigation */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search patient by ID, Diagnosis..." 
                className="pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 outline-none rounded-xl w-80 transition-all text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-sm font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 animate-pulse">
              <AlertTriangle size={16} />
              ER Volume Spike Predicted (98%)
            </div>
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              Dr
            </div>
          </div>
        </header>

        {/* 3. 12-Column Grid Main Canvas */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header Titles */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Predictive Intelligence</h1>
              <p className="text-gray-500 mt-1">Real-time XGBoost Analysis & Healthcare Resource Allocation</p>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard title="Total Analyzed" value="1,204" detail="Patients today" icon={Users} trend="↑ 12%" isPositive={true} />
              <KPICard title="High Risk Alerts" value="42" detail="Require attention" icon={AlertTriangle} trend="↑ 5.2%" isPositive={false} />
              <KPICard title="ICU Utilization" value="85%" detail="Predicted capacity" icon={Activity} trend="Critical" isPositive={false} />
              <KPICard title="Model Accuracy" value="98.2%" detail="XGBoost Pipeline" icon={TrendingUp} trend="+0.4%" isPositive={true} />
            </div>

            {/* AI Insight Banner */}
            <div className="w-full bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BrainCircuit className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">AI Recommendation Engine</h3>
                  <p className="text-blue-100 text-sm mt-1 max-w-2xl">
                    Our model predicts a surge in pulmonary admissions over the next 48 hours. Recommending proactive reallocation of 4 ventilators to the General Ward.
                  </p>
                </div>
              </div>
              <button className="px-6 py-2.5 bg-white text-blue-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                Apply Action
              </button>
            </div>

            {/* Charts Row 1: 12-Col Grid */}
            <div className="grid grid-cols-12 gap-6">
              {/* Doughnut Chart */}
              <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                <h3 className="font-bold text-gray-900">Readmission Risk Spread</h3>
                <p className="text-xs text-gray-400 mb-6">Real-time XGBoost Prediction</p>
                
                {loading ? (
                  <div className="h-64 flex items-center justify-center animate-pulse bg-gray-50 rounded-xl">Loading Model...</div>
                ) : (
                  <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={MOCK_RISK_DATA} innerRadius={65} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                          {MOCK_RISK_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">10%</span>
                      <span className="text-xs font-bold text-red-500">High Risk</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Resource Bar Chart */}
              <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900">Resource Utilization</h3>
                    <p className="text-xs text-gray-400">Current Capacity vs Recommended</p>
                  </div>
                  <button className="text-blue-600 text-sm font-semibold hover:underline">View Details</button>
                </div>
                
                {loading ? (
                  <div className="h-64 flex gap-4 items-end animate-pulse">
                    <div className="w-16 h-32 bg-gray-100 rounded mx-auto border-b-2"></div>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_UTILIZATION} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                        <RechartsTooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}/>
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                        <Bar dataKey="Beds" fill={COLORS.teal} radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="Staff" fill={COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: SHAP + Table */}
            <div className="grid grid-cols-12 gap-6 pb-12">
              
              {/* Patient DataTable */}
              <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10 sticky top-0">
                  <h3 className="font-bold text-gray-900">Live Patient Risk Queue</h3>
                  <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium text-gray-500">
                    <button className="px-3 py-1.5 bg-white text-gray-900 rounded-md shadow-sm">Critical</button>
                    <button className="px-3 py-1.5 hover:text-gray-900">All</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-medium">Patient ID</th>
                        <th className="px-6 py-4 font-medium">Risk Status</th>
                        <th className="px-6 py-4 font-medium">AI Confidence</th>
                        <th className="px-6 py-4 font-medium">Predicted Target</th>
                        <th className="px-6 py-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {MOCK_PATIENTS.map((p, idx) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900">#{p.id}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              p.risk === 'High' ? 'bg-red-100 text-red-700' :
                              p.risk === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {p.risk}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-600 tabular-nums">{p.prob}</td>
                          <td className="px-6 py-4 text-gray-500">{p.target}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <ChevronRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SHAP Feature Importance */}
              <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-1">SHAP Factor Influence</h3>
                <p className="text-xs text-gray-400 mb-6">Top drivers for model decisions</p>
                <div className="space-y-5 mt-4">
                  {MOCK_SHAP.map((f, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-gray-700">{f.feature}</span>
                        <span className="text-blue-600 tabular-nums">{(f.importance * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: loading ? '0%' : `${f.importance * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
