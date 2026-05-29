import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, FileText, AlertTriangle, ShieldCheck,
  Cpu, Key, BarChart2, Settings, DollarSign
} from 'lucide-react';

interface AdminDashboardProps {
  activeTab: string;
  setTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, setTab }) => {
  const [consumers, setConsumers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const { token } = useAuth();

  // Annexure-D generator form
  const [selectedAppId, setSelectedAppId] = useState('');
  const [transCap, setTransCap] = useState(250);
  const [losses, setLosses] = useState(3.2);
  const [duration, setDuration] = useState(365);
  const [isNocGenerated, setIsNocGenerated] = useState(false);
  const [growthView, setGrowthView] = useState<'monthly' | 'yearly'>('monthly');

  const getGrowthBuckets = (view: 'monthly' | 'yearly') => {
    const now = new Date();
    const buckets: { label: string; value: number }[] = [];
    const source = applications.map((app) => ({
      ...app,
      createdAt: app.createdAt ? new Date(app.createdAt) : undefined
    })).filter(app => app.createdAt);

    if (view === 'monthly') {
      for (let i = 5; i >= 0; i -= 1) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = monthDate.toLocaleString('default', { month: 'short', year: '2-digit' });
        const count = source.filter((app) => app.createdAt?.getFullYear() === monthDate.getFullYear() && app.createdAt?.getMonth() === monthDate.getMonth()).length;
        buckets.push({ label, value: count });
      }
    } else {
      const yearStart = now.getFullYear() - 4;
      for (let year = yearStart; year <= now.getFullYear(); year += 1) {
        const count = source.filter((app) => app.createdAt?.getFullYear() === year).length;
        buckets.push({ label: String(year), value: count });
      }
    }

    return buckets;
  };

  const maxGrowthValue = Math.max(1, ...getGrowthBuckets(growthView).map((item) => item.value));

  useEffect(() => {
    const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';
    const loadAdminData = async () => {
      if (!token) return;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      try {
        const responses = await Promise.all([
          fetch(`${API_BASE}/api/users/consumers`, { headers }),
          fetch(`${API_BASE}/api/users/suppliers`, { headers }),
          fetch(`${API_BASE}/api/applications`, { headers }),
          fetch(`${API_BASE}/api/applications/schedules`, { headers }),
          fetch(`${API_BASE}/api/documents`, { headers }),
          fetch(`${API_BASE}/api/payments/history`, { headers })
        ]);

        const [consumersRes, suppliersRes, applicationsRes, schedulesRes, documentsRes, paymentsRes] = responses;

        if (!consumersRes.ok || !suppliersRes.ok || !applicationsRes.ok || !schedulesRes.ok || !documentsRes.ok || !paymentsRes.ok) {
          const errors = await Promise.all(responses.map((res) => res.ok ? Promise.resolve('') : res.text()));
          setDashboardError(errors.filter(Boolean).join(' | ') || 'Unable to load admin dashboard data');
          return;
        }

        setConsumers(await consumersRes.json());
        setSuppliers(await suppliersRes.json());
        setApplications(await applicationsRes.json());
        setSchedules(await schedulesRes.json());
        setDocuments(await documentsRes.json());
        await paymentsRes.json();
      } catch (error: any) {
        setDashboardError(error?.message || 'Failed to fetch admin dashboard data');
      }
    };

    loadAdminData();
  }, [token]);

  const userStatusBadgeClass = (status: string) => {
    if (status === 'VERIFIED') return 'badge-green';
    if (status === 'REJECTED') return 'badge-red';
    return 'badge-amber';
  };

  const handleVerifyUser = async (id: string, role: 'SUPPLIER' | 'CONSUMER') => {
    if (!token) return;
    const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${API_BASE}/api/users/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(await response.text());
      if (role === 'SUPPLIER') {
        setSuppliers(suppliers.map(s => s.id === id ? { ...s, status: 'VERIFIED', oaStatus: 'APPROVED' } : s));
      } else {
        setConsumers(consumers.map(c => c.id === id ? { ...c, status: 'VERIFIED', oaStatus: 'APPROVED' } : c));
      }
    } catch (error: any) {
      setDashboardError(error?.message || 'Unable to verify user');
    }
  };

  const handleRejectUser = async (id: string, role: 'SUPPLIER' | 'CONSUMER') => {
    if (!token) return;
    const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${API_BASE}/api/users/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'Your rejection reason here' })
      });
      if (!response.ok) throw new Error(await response.text());
      if (role === 'SUPPLIER') {
        setSuppliers(suppliers.map(s => s.id === id ? { ...s, status: 'REJECTED' } : s));
      } else {
        setConsumers(consumers.map(c => c.id === id ? { ...c, status: 'REJECTED' } : c));
      }
    } catch (error: any) {
      setDashboardError(error?.message || 'Unable to reject user');
    }
  };

  const handleAppStatusChange = async (id: string, nextStatus: string) => {
    if (!token) return;
    const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${API_BASE}/api/applications/${id}/admin-approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setApplications(applications.map(app => app.id === id ? { ...app, ...data.application } : app));
      if (nextStatus === 'APPROVED') {
        const approvedApp = applications.find(app => app.id === id);
        if (approvedApp) {
          setSchedules([{
            id: `sch-grid-${Date.now()}`,
            supplierName: approvedApp.supplierName,
            consumerName: approvedApp.consumerName,
            mw: approvedApp.mw,
            timeBlock: '00:00-24:00 (RTC)',
            gridStatus: 'SCHEDULED'
          }, ...schedules]);
        }
      }
    } catch (error: any) {
      setDashboardError(error?.message || 'Unable to update application status');
    }
  };

  const handleGenerateNoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAppId) return;
    const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

    try {
      const response = await fetch(`${API_BASE}/api/applications/${selectedAppId}/annexure-d`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ transferCapability: transCap, lossPercentage: losses, approvalDuration: duration })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setApplications(applications.map(app => app.id === selectedAppId ? {
        ...app,
        annexureDStatus: 'ISSUED',
        approvalStatus: 'NOC_APPROVED',
        lossPercentage: losses,
        durationDays: duration,
        ...data.application
      } : app));
      setIsNocGenerated(true);
      setTimeout(() => {
        setIsNocGenerated(false);
        setSelectedAppId('');
      }, 2000);
    } catch (error: any) {
      setDashboardError(error?.message || 'Unable to generate Annexure-D NOC');
    }
  };

  const handleVerifyDocument = (id: string, action: 'VERIFIED' | 'REJECTED') => {
    setDocuments(documents.map(d => d.id === id ? { ...d, status: action } : d));
  };

  if (activeTab === 'dashboard') {
    const growthBuckets = getGrowthBuckets(growthView);

    return (
      <div className="space-y-8 animate-fadeIn">
        {dashboardError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {dashboardError}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-4 border-b border-[#e0e8e4]">
          <div>
            <h2 className="font-sora text-[22px] font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-500 text-[13px] mt-1">Monitor registered users, open access applications, and growth trends.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setGrowthView('monthly')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${growthView === 'monthly' ? 'bg-green-dark text-white' : 'bg-white text-gray-700 border border-[#e0e8e4]'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setGrowthView('yearly')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${growthView === 'yearly' ? 'bg-green-dark text-white' : 'bg-white text-gray-700 border border-[#e0e8e4]'}`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metric-card border-t-[3px] border-t-green-mid">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Registered Consumers</span>
              <Users className="w-4 h-4 text-green-mid" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">{consumers.length}</p>
              <p className="text-[11px] text-gray-500 mt-1">Verified consumer accounts</p>
            </div>
          </div>

          <div className="metric-card border-t-[3px] border-t-green-mid">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Registered Suppliers</span>
              <ShieldCheck className="w-4 h-4 text-green-mid" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">{suppliers.length}</p>
              <p className="text-[11px] text-gray-500 mt-1">Verified green generators</p>
            </div>
          </div>

          <div className="metric-card border-t-[3px] border-t-amber">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Open Access Requests</span>
              <FileText className="w-4 h-4 text-amber" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">{applications.length}</p>
              <p className="text-[11px] text-gray-500 mt-1">Total applications received</p>
            </div>
          </div>

          <div className="metric-card border-t-[3px] border-t-blue-dark">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Scheduled Dispatches</span>
              <Cpu className="w-4 h-4 text-blue-dark" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">{schedules.length}</p>
              <p className="text-[11px] text-gray-500 mt-1">Approved grid schedules</p>
            </div>
          </div>
        </div>

        <div className="tracker-card p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="font-sora text-[16px] font-bold text-gray-900">Request Growth</h3>
              <p className="text-gray-500 text-[12px] mt-1">Trend of open access applications over the selected period.</p>
            </div>
            <div className="text-[11px] text-gray-500">
              {growthView === 'monthly' ? 'Last 6 months' : 'Last 5 years'}
            </div>
          </div>

          <div className="relative h-56 flex items-end gap-3 px-2 pt-4">
            <div className="absolute inset-y-0 left-0 w-full flex flex-col justify-between pointer-events-none">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="border-t border-dashed border-[#e0e8e4] text-[10px] text-gray-400 flex justify-between">
                  <span>{Math.ceil((maxGrowthValue / 4) * (4 - idx))}</span>
                </div>
              ))}
            </div>
            {growthBuckets.map((point) => (
              <div key={point.label} className="flex-1 flex flex-col items-center justify-end">
                <div className="w-full rounded-t-xl bg-green-dark transition-all" style={{ height: `${(point.value / maxGrowthValue) * 100}%` }}></div>
                <span className="mt-3 text-[11px] text-gray-600">{point.label}</span>
                <span className="text-[10px] text-gray-500 mt-1">{point.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'market-monitoring') {
    return (
      <div className="space-y-8 animate-fadeIn">
        {dashboardError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {dashboardError}
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-4 border-b border-[#e0e8e4]">
          <div>
            <h2 className="font-sora text-[22px] font-bold text-gray-900">Market & Grid Monitoring</h2>
            <p className="text-gray-500 text-[13px] mt-1">Interstate corridor load audits and market clearing volumes</p>
          </div>
          <div className="bg-green-pale px-3 py-1.5 rounded-lg border border-[#9fe1cb] flex items-center space-x-2 text-[12px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-mid animate-pulse"></span>
            <span className="text-green-dark uppercase">Grid Congestion Watch: Normal</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="metric-card border-t-[3px] border-t-green-mid">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL CONSUMERS</span>
              <Users className="w-4 h-4 text-green-mid" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">{consumers.length}</p>
              <p className="text-[11px] text-gray-500 mt-1">Verified commercial centers</p>
            </div>
          </div>

          <div className="metric-card border-t-[3px] border-t-green-mid">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL SUPPLIERS</span>
              <ShieldCheck className="w-4 h-4 text-green-mid" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">{suppliers.length}</p>
              <p className="text-[11px] text-gray-500 mt-1">Active green generators</p>
            </div>
          </div>

          <div className="metric-card border-t-[3px] border-t-amber">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">PENDING OA APPS</span>
              <FileText className="w-4 h-4 text-amber animate-pulse" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">
                {applications.filter(a => a.approvalStatus !== 'APPROVED').length}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Applications to process</p>
            </div>
          </div>

          <div className="metric-card border-t-[3px] border-t-blue-dark">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">ACTIVE DISPATCHES</span>
              <Cpu className="w-4 h-4 text-blue-dark animate-spin-slow" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">{schedules.length}</p>
              <p className="text-[11px] text-gray-500 mt-1">Approved NOAR schedules</p>
            </div>
          </div>

          <div className="metric-card border-t-[3px] border-t-red">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">CONGESTION ALERTS</span>
              <AlertTriangle className="w-4 h-4 text-red" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-green-dark">0</p>
              <p className="text-[11px] text-gray-500 mt-1">All corridors cleared</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="tracker-card lg:col-span-2 !mb-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-sora font-bold text-[16px] text-gray-900">Daily Traded Capacity</h3>
                <p className="text-gray-500 text-[12px] mt-0.5">Aggregated G-DAM trade volume schedules resolved (MW)</p>
              </div>
              <BarChart2 className="w-5 h-5 text-green-dark" />
            </div>

            <div className="relative h-64 flex items-end justify-between px-2 pt-6">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-12 pt-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border-t border-dashed border-[#e0e8e4] w-full flex justify-between text-[10px] text-gray-400">
                    <span>{400 - i * 100} MW</span>
                  </div>
                ))}
              </div>

              {[250, 280, 310, 340, 360, 350, 320, 290, 305, 330, 360, 380].map((val, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 mx-1.5 z-10 group relative">
                  <div className="absolute -top-8 scale-0 group-hover:scale-100 transition-all bg-gray-900 px-2 py-1 rounded-[6px] text-[10px] text-white whitespace-nowrap z-30 shadow-md">
                    {val} MW
                  </div>
                  <div className="w-full bg-green-mid rounded-t-[2px] transition-all opacity-80 group-hover:opacity-100" style={{ height: `${val * 0.5}px` }}></div>
                  <span className="text-[10px] text-gray-500 mt-2">D-{12-idx}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="tracker-card flex flex-col justify-between !mb-0">
            <div>
              <h3 className="font-sora font-bold text-[16px] text-gray-900 mb-1">Grid Corridor Loads</h3>
              <p className="text-gray-500 text-[12px]">Wheeling capacity on main regional interfaces</p>
            </div>

            <div className="space-y-4 my-6 text-[12px]">
              <div className="p-3 bg-gray-50 rounded-lg border border-[#e0e8e4]">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 font-medium uppercase tracking-wider text-[10px]">WR-ER Link:</span>
                  <span className="text-green-dark font-bold">42% Load (Normal)</span>
                </div>
                <div className="w-full h-1.5 bg-[#e0e8e4] rounded-full overflow-hidden">
                  <div className="h-full bg-green-mid rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg border border-[#e0e8e4]">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 font-medium uppercase tracking-wider text-[10px]">NR-WR Link:</span>
                  <span className="text-green-dark font-bold">58% Load (Normal)</span>
                </div>
                <div className="w-full h-1.5 bg-[#e0e8e4] rounded-full overflow-hidden">
                  <div className="h-full bg-green-mid rounded-full" style={{ width: '58%' }}></div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-[#e0e8e4]">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 font-medium uppercase tracking-wider text-[10px]">SR-WR Link:</span>
                  <span className="text-amber font-bold">78% Load (Heavy)</span>
                </div>
                <div className="w-full h-1.5 bg-[#e0e8e4] rounded-full overflow-hidden">
                  <div className="h-full bg-amber rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'consumers') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Registered Consumers</h2>
          <p className="text-gray-500 text-[13px] mt-1">View consumer profiles registered on the Open Access portal</p>
        </div>

        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Company Name</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Email</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Phone</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">State</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Drawal Point</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Open Access Status</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {consumers.map((c, i) => (
                <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-5 text-gray-600">{c.email}</td>
                  <td className="py-3.5 px-5 text-gray-600">{c.phoneNumber || '-'}</td>
                  <td className="py-3.5 px-5 text-gray-600">{c.state}</td>
                  <td className="py-3.5 px-5 text-gray-600 max-w-[200px]">{c.drawalPoint || '—'}</td>
                  <td className="py-3.5 px-5 text-gray-900 font-semibold">{c.oaStatus || 'UNVERIFIED'}</td>
                  <td className="py-3.5 px-5">
                    <span className={`badge ${userStatusBadgeClass(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'suppliers') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Verify Supplier Registrations</h2>
          <p className="text-gray-500 text-[13px] mt-1">Validate plant generation capacities and origin certificates</p>
        </div>

        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Generator Corps</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Email</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Phone</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">State</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Injection Point</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Renewable Type</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Verification</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {suppliers.map((s, i) => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{s.name}</td>
                  <td className="py-3.5 px-5 text-gray-600">{s.email}</td>
                  <td className="py-3.5 px-5 text-gray-600">{s.phoneNumber || '-'}</td>
                  <td className="py-3.5 px-5 text-gray-600">{s.state}</td>
                  <td className="py-3.5 px-5 text-gray-600 max-w-[200px]">{s.injectionPoint || '—'}</td>
                  <td className="py-3.5 px-5 text-gray-900 font-semibold">{s.renewableType || '—'}</td>
                  <td className="py-3.5 px-5">
                    <span className={`badge ${userStatusBadgeClass(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {s.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleVerifyUser(s.id, 'SUPPLIER')}
                          className="btn-green px-3 py-1.5 text-[12px]"
                        >
                          Verify Generator
                        </button>
                        <button 
                          onClick={() => handleRejectUser(s.id, 'SUPPLIER')}
                          className="px-3 py-1.5 rounded-[6px] bg-white border border-[#e0e8e4] text-gray-600 text-[12px] font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'applications') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Open Access Regulatory Workflow</h2>
          <p className="text-gray-500 text-[13px] mt-1">Process trilateral Standing Clearances and dispatch triggers</p>
        </div>

        <div className="space-y-6">
          {applications.map(app => (
            <div key={app.id} className="tracker-card !mb-0 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 pb-6 border-b border-[#f0f4f2]">
                <div>
                  <span className="badge badge-green mb-1.5">
                    {app.type}
                  </span>
                  <h4 className="font-sora text-[16px] font-bold text-gray-900 mt-1">{app.consumerName} → {app.supplierName}</h4>
                  <p className="text-[13px] text-gray-500 mt-1">Capacity: {app.mw} MW | Loss Factor: {app.lossPercentage}%</p>
                </div>
                
                {/* Stepper with action triggers */}
                <div className="flex flex-wrap gap-2 items-center text-[11px] font-bold">
                  <button 
                    onClick={() => handleAppStatusChange(app.id, 'CLEARANCE')}
                    className={`px-3 py-1.5 rounded-[6px] transition-all border ${
                      app.annexureCStatus === 'ISSUED' ? 'bg-green-pale text-green-dark border-green-pale shadow-sm' : 'bg-white text-gray-500 border-[#e0e8e4] hover:bg-gray-50'
                    }`}
                  >
                    Annexure-C (SLDC Clearance)
                  </button>
                  <span className="h-0.5 w-3 bg-[#e0e8e4]"></span>
                  <button 
                    onClick={() => {
                      setSelectedAppId(app.id);
                      setTab('noc-management');
                    }}
                    className={`px-3 py-1.5 rounded-[6px] transition-all border ${
                      app.annexureDStatus === 'ISSUED' ? 'bg-green-pale text-green-dark border-green-pale shadow-sm' : 'bg-white text-gray-500 border-[#e0e8e4] hover:bg-gray-50'
                    }`}
                  >
                    Annexure-D (Generate NOC)
                  </button>
                  <span className="h-0.5 w-3 bg-[#e0e8e4]"></span>
                  <button 
                    onClick={() => handleAppStatusChange(app.id, 'AGREED')}
                    className={`px-3 py-1.5 rounded-[6px] transition-all border ${
                      app.annexureEStatus === 'SIGNED' ? 'bg-green-pale text-green-dark border-green-pale shadow-sm' : 'bg-white text-gray-500 border-[#e0e8e4] hover:bg-gray-50'
                    }`}
                  >
                    Annexure-E (Agreements Signed)
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-6 text-[12px] space-y-4 md:space-y-0">
                <div className="flex flex-wrap gap-8">
                  <div>
                    <p className="text-gray-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">INJECTION NODE</p>
                    <p className="text-gray-900 font-bold">{app.injectionPoint}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">DRAWAL NODE</p>
                    <p className="text-gray-900 font-bold">{app.drawalPoint}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">WORKFLOW STATUS</p>
                    <span className="badge badge-amber mt-1">{app.approvalStatus.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {app.approvalStatus !== 'APPROVED' && (
                    <button 
                      onClick={() => handleAppStatusChange(app.id, 'APPROVED')}
                      className="btn-green px-4 py-2 text-[12px]"
                    >
                      Approve & Schedule Grid Flow
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'noc-management') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="form-card lg:col-span-2">
            <h3 className="font-sora text-[18px] font-bold text-gray-900 mb-1">Annexure-D NOC Generator</h3>
            <p className="text-[13px] text-gray-500 mb-6 pb-6 border-b border-[#f0f4f2]">National Load Despatch Centre Open Access Registry Interface</p>

            <form onSubmit={handleGenerateNoc} className="space-y-5">
              <div className="form-group">
                <label className="required">Select Pending Open Access Contract</label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  required
                  className="form-control"
                >
                  <option value="">Select app record...</option>
                  {applications.filter(a => a.annexureDStatus === 'PENDING').map(a => (
                    <option key={a.id} value={a.id}>{a.consumerName} to {a.supplierName} ({a.mw} MW)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-group">
                  <label className="required">Transfer Capability (MW)</label>
                  <input
                    type="number"
                    value={transCap}
                    onChange={(e) => setTransCap(Number(e.target.value))}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="required">Corridor Transmission Loss (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={losses}
                    onChange={(e) => setLosses(Number(e.target.value))}
                    required
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="required">NOC Validity Duration (Days)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required
                  className="form-control"
                />
              </div>

              <button 
                type="submit"
                className="btn-green w-full flex items-center justify-center space-x-2 h-[42px] mt-2"
              >
                <Key className="w-4 h-4" />
                <span>Digitally Sign & Generate Annexure-D NOC</span>
              </button>
            </form>

            {isNocGenerated && (
              <div className="alert alert-success mt-6 mb-0 animate-fadeIn">
                <span className="alert-icon">✅</span>
                <span>Annexure-D NOC successfully signed and recorded in grid registers!</span>
              </div>
            )}
          </div>

          <div className="tracker-card flex flex-col justify-between !mb-0">
            <div>
              <h3 className="font-sora font-bold text-[16px] text-gray-900 mb-2">Certificate Authority Info</h3>
              <p className="text-[13px] text-gray-500">National Cryptographic Grid Certificates Authority</p>
            </div>
            <div className="bg-amber-light p-4 rounded-lg border border-[#fac775] mt-6">
              <p className="text-[12px] text-amber leading-relaxed">
                * Issued certificates contain NLDC electronic seal and SHA256 checksum tags. Modifying variables will flag transmission corridors as congested.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'scheduling') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">NOAR Schedules Dispatch Logs</h2>
          <p className="text-gray-500 text-[13px] mt-1">National Open Access Registry (NOAR) grid power flow dispatches</p>
        </div>

        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Schedule ID</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Supplier</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Consumer</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Approved MW</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Time Block</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Grid Dispatch Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {schedules.map((s, i) => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 text-gray-600 font-bold uppercase text-[11px]">{s.id}</td>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{s.supplierName}</td>
                  <td className="py-3.5 px-5 text-gray-700 font-semibold">{s.consumerName}</td>
                  <td className="py-3.5 px-5 font-bold text-green-dark">{s.mw} MW</td>
                  <td className="py-3.5 px-5 text-gray-600">{s.timeBlock}</td>
                  <td className="py-3.5 px-5">
                    <span className="badge badge-green">
                      {s.gridStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'documents') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Grid Document Vault</h2>
          <p className="text-gray-500 text-[13px] mt-1">Review and approve company connection purchase credentials</p>
        </div>

        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Document Title</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Category</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Filed By</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Date</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Status</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {documents.map((d, i) => (
                <tr key={d.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">📄</div>
                    {d.name}
                  </td>
                  <td className="py-3.5 px-5 text-gray-600">{d.category}</td>
                  <td className="py-3.5 px-5 text-gray-700 font-semibold">{d.uploader}</td>
                  <td className="py-3.5 px-5 text-gray-500">{d.date}</td>
                  <td className="py-3.5 px-5">
                    <span className={`badge ${
                      d.status === 'VERIFIED' ? 'badge-green' : 'badge-amber'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right space-x-2 flex justify-end">
                    {d.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleVerifyDocument(d.id, 'VERIFIED')}
                          className="px-3 py-1.5 rounded-[6px] bg-green-dark text-white text-[12px] font-bold hover:bg-green-mid transition-colors shadow-sm"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleVerifyDocument(d.id, 'REJECTED')}
                          className="px-3 py-1.5 rounded-[6px] bg-white border border-[#e0e8e4] text-gray-600 text-[12px] font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'payments') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">National Settlement System</h2>
          <p className="text-gray-500 text-[13px] mt-1">Audit all grid wire clearings and inter-state payment ledgers</p>
        </div>

        <div className="tracker-card max-w-2xl">
          <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-[#f0f4f2]">
            <DollarSign className="w-5 h-5 text-green-dark" />
            <h3 className="font-bold text-gray-900 text-[16px]">Grid Escrow Overview</h3>
          </div>
          <p className="text-gray-600 text-[13px] leading-relaxed">
            All bilateral and collective G-DAM transactions are cleared through the Central Clearing Corporation escrow. Settlements are executed T+1 daily based on finalized NOAR schedules.
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === 'settings') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">System Preferences</h2>
          <p className="text-gray-500 text-[13px] mt-1">Configure regulatory constants and NLDC API connections</p>
        </div>

        <div className="form-card max-w-2xl space-y-6">
           <div className="pt-4 space-y-3">
             <div className="flex justify-between items-center text-[13px]">
               <span className="text-gray-500">Default Transmission Loss</span>
               <span className="font-semibold text-gray-900">3.5%</span>
             </div>
             <div className="flex justify-between items-center text-[13px]">
               <span className="text-gray-500">G-DAM Clearing Algorithm</span>
               <span className="font-semibold text-gray-900">Enabled (Double Auction)</span>
             </div>
             <div className="flex justify-between items-center text-[13px]">
               <span className="text-gray-500">Auto-Approve Annexure-C</span>
               <span className="badge badge-amber">DISABLED</span>
             </div>
           </div>

           <button className="btn-outline w-full flex items-center justify-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Modify Parameters</span>
           </button>
        </div>
      </div>
    );
  }

  return null;
};
