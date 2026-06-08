import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users, FileText, AlertTriangle, ShieldCheck,
  Cpu, Key, BarChart2, Settings, DollarSign,
  CheckCircle, XCircle, Eye, ChevronDown, ChevronUp,
  MapPin, Zap, Building2, Clock, AlertCircle, X
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

  // Application detail view state
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<{ id: string; action: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);

  const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

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
        const count = source.filter((app) =>
          app.createdAt?.getFullYear() === monthDate.getFullYear() &&
          app.createdAt?.getMonth() === monthDate.getMonth()
        ).length;
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

  const loadAdminData = async () => {
    if (!token) return;
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
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

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const userStatusBadgeClass = (status: string) => {
    if (status === 'VERIFIED') return 'badge-green';
    if (status === 'REJECTED') return 'badge-red';
    return 'badge-amber';
  };

  const appStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'SUPPLIER_APPROVED') return 'badge-green';
    if (s === 'REJECTED') return 'badge-red';
    if (s === 'ADMIN_PENDING' || s === 'SUBMITTED') return 'badge-amber';
    if (s === 'NOC_APPROVED') return 'badge-blue';
    return 'badge-amber';
  };

  const appStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      ADMIN_PENDING: 'Pending Review',
      SUBMITTED: 'Pending Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      SUPPLIER_APPROVED: 'Supplier Approved',
      NOC_APPROVED: 'NOC Approved',
      CLEARANCE: 'SLDC Clearance',
      AGREED: 'Agreements Signed',
    };
    return map[status?.toUpperCase()] || status || 'Pending';
  };

  // ── Admin approve ──────────────────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    console.log('Approving application:', id);
    if (!token) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/applications/${id}/admin-approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'APPROVED' })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setApplications(prev => prev.map(app =>
        app.id === id ? { ...app, approvalStatus: 'APPROVED', ...data.application } : app
      ));
      setActionSuccess({ id, action: 'APPROVED' });
      setTimeout(() => setActionSuccess(null), 3000);
      const approvedApp = applications.find(a => a.id === id);
      if (approvedApp) {
        setSchedules(prev => [{
          id: `sch-grid-${Date.now()}`,
          supplierName: approvedApp.supplierName || 'Supplier',
          consumerName: approvedApp.consumerName || 'Consumer',
          mw: approvedApp.mw,
          timeBlock: approvedApp.timeBlocks || '00:00-24:00 (RTC)',
          gridStatus: 'SCHEDULED'
        }, ...prev]);
      }
    } catch (err: any) {
      setDashboardError(err?.message || 'Failed to approve application');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Admin reject ───────────────────────────────────────────────────────────
  const handleReject = async (id: string) => {
    if (!token) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/applications/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectReason || 'Application rejected by admin' })
      });
      if (!res.ok) throw new Error(await res.text());
      setApplications(prev => prev.map(app =>
        app.id === id ? { ...app, approvalStatus: 'REJECTED', rejectionReason: rejectReason } : app
      ));
      setActionSuccess({ id, action: 'REJECTED' });
      setRejectingAppId(null);
      setRejectReason('');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setDashboardError(err?.message || 'Failed to reject application');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleVerifyUser = async (id: string, role: 'SUPPLIER' | 'CONSUMER', action: 'approve' | 'reject') => {
  // Only allow supplier verification (consumers are auto-approved)
  if (role !== 'SUPPLIER') {
    console.log('Consumer verification not required');
    return;
  }
  
  if (!token) return;
  try {
    const endpoint = action === 'approve' ? 'approve' : 'reject';
    const response = await fetch(`${API_BASE}/api/users/${id}/${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: action === 'reject' ? 'Rejected by admin' : undefined })
    });
    
    if (!response.ok) throw new Error(await response.text());
    
    const newStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED';
    
    // Only update suppliers state
    if (role === 'SUPPLIER') {
      setSuppliers(suppliers.map(s => s.id === id ? { ...s, status: newStatus } : s));
    }
    
    console.log(`Supplier ${action}ed successfully`);
    
  } catch (error: any) {
    console.error(`Error ${action}ing supplier:`, error);
    setDashboardError(error?.message || `Unable to ${action} supplier`);
  }
};

  const handleGenerateNoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAppId) return;
    try {
      const response = await fetch(`${API_BASE}/api/applications/${selectedAppId}/annexure-d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transferCapability: transCap, lossPercentage: losses, approvalDuration: duration })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setApplications(applications.map(app => app.id === selectedAppId ? {
        ...app, annexureDStatus: 'ISSUED', approvalStatus: 'NOC_APPROVED',
        lossPercentage: losses, durationDays: duration, ...data.application
      } : app));
      setIsNocGenerated(true);
      setTimeout(() => { setIsNocGenerated(false); setSelectedAppId(''); }, 2000);
    } catch (error: any) {
      setDashboardError(error?.message || 'Unable to generate Annexure-D NOC');
    }
  };

  const handleVerifyDocument = (id: string, action: 'VERIFIED' | 'REJECTED') => {
    setDocuments(documents.map(d => d.id === id ? { ...d, status: action } : d));
  };

  // ══════════════════════════════════════════════════════════════════════════
  // DASHBOARD TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'dashboard') {
    const growthBuckets = getGrowthBuckets(growthView);
    return (
      <div className="space-y-8 animate-fadeIn">
        {dashboardError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{dashboardError}</div>
        )}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-4 border-b border-[#e0e8e4]">
          <div>
            <h2 className="font-sora text-[22px] font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-500 text-[13px] mt-1">Monitor registered users, open access applications, and growth trends.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setGrowthView('monthly')} className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${growthView === 'monthly' ? 'bg-green-dark text-white' : 'bg-white text-gray-700 border border-[#e0e8e4]'}`}>Monthly</button>
            <button onClick={() => setGrowthView('yearly')} className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${growthView === 'yearly' ? 'bg-green-dark text-white' : 'bg-white text-gray-700 border border-[#e0e8e4]'}`}>Yearly</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Registered Consumers', val: consumers.length, sub: 'Total consumer accounts', icon: <Users className="w-4 h-4 text-green-mid" />, border: 'border-t-green-mid' },
            { label: 'Registered Suppliers', val: suppliers.length, sub: 'Total generator accounts', icon: <ShieldCheck className="w-4 h-4 text-green-mid" />, border: 'border-t-green-mid' },
            { label: 'OA Applications', val: applications.length, sub: 'Total applications received', icon: <FileText className="w-4 h-4 text-amber" />, border: 'border-t-amber' },
            { label: 'Scheduled Dispatches', val: schedules.length, sub: 'Approved grid schedules', icon: <Cpu className="w-4 h-4 text-blue-dark" />, border: 'border-t-blue-dark' },
          ].map(m => (
            <div key={m.label} className={`metric-card border-t-[3px] ${m.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{m.label}</span>
                {m.icon}
              </div>
              <p className="font-sora text-[24px] font-bold text-gray-900">{m.val}</p>
              <p className="text-[11px] text-gray-500 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>
        <div className="tracker-card p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="font-sora text-[16px] font-bold text-gray-900">Request Growth</h3>
              <p className="text-gray-500 text-[12px] mt-1">Trend of open access applications over selected period.</p>
            </div>
            <div className="text-[11px] text-gray-500">{growthView === 'monthly' ? 'Last 6 months' : 'Last 5 years'}</div>
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

  // ══════════════════════════════════════════════════════════════════════════
  // MARKET MONITORING TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'market-monitoring') {
    return (
      <div className="space-y-8 animate-fadeIn">
        {dashboardError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{dashboardError}</div>}
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
          {[
            { label: 'TOTAL CONSUMERS', val: consumers.length, sub: 'Registered consumers', icon: <Users className="w-4 h-4 text-green-mid" />, border: 'border-t-green-mid' },
            { label: 'TOTAL SUPPLIERS', val: suppliers.length, sub: 'Registered suppliers', icon: <ShieldCheck className="w-4 h-4 text-green-mid" />, border: 'border-t-green-mid' },
            { label: 'PENDING OA APPS', val: applications.filter(a => !['APPROVED','SUPPLIER_APPROVED'].includes(a.approvalStatus)).length, sub: 'Applications to process', icon: <FileText className="w-4 h-4 text-amber animate-pulse" />, border: 'border-t-amber' },
            { label: 'ACTIVE DISPATCHES', val: schedules.length, sub: 'Approved NOAR schedules', icon: <Cpu className="w-4 h-4 text-blue-dark" />, border: 'border-t-blue-dark' },
            { label: 'CONGESTION ALERTS', val: 0, sub: 'All corridors cleared', icon: <AlertTriangle className="w-4 h-4 text-red" />, border: 'border-t-red', valColor: 'text-green-dark' },
          ].map(m => (
            <div key={m.label} className={`metric-card border-t-[3px] ${m.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{m.label}</span>
                {m.icon}
              </div>
              <p className={`font-sora text-[24px] font-bold ${(m as any).valColor || 'text-gray-900'}`}>{m.val}</p>
              <p className="text-[11px] text-gray-500 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="tracker-card lg:col-span-2 !mb-0">
            <div className="flex items-center justify-between mb-6">
              <div><h3 className="font-sora font-bold text-[16px] text-gray-900">Daily Traded Capacity</h3><p className="text-gray-500 text-[12px] mt-0.5">G-DAM trade volume resolved (MW)</p></div>
              <BarChart2 className="w-5 h-5 text-green-dark" />
            </div>
            <div className="relative h-48 flex items-end justify-between px-2 pt-6">
              {[250,280,310,340,360,350,320,290,305,330,360,380].map((val,idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 mx-1 z-10 group relative">
                  <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-gray-900 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap z-30">{val} MW</div>
                  <div className="w-full bg-green-mid rounded-t-[2px] opacity-80 group-hover:opacity-100" style={{ height: `${val * 0.4}px` }}></div>
                  <span className="text-[10px] text-gray-500 mt-1">D-{12-idx}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="tracker-card flex flex-col justify-between !mb-0">
            <div>
              <h3 className="font-sora font-bold text-[16px] text-gray-900 mb-1">Grid Corridor Loads</h3>
              <p className="text-gray-500 text-[12px]">Wheeling capacity on main interfaces</p>
            </div>
            <div className="space-y-3 my-4 text-[12px]">
              {[{label:'WR-ER Link',pct:42,color:'bg-green-mid',text:'text-green-dark',status:'Normal'},{label:'NR-WR Link',pct:58,color:'bg-green-mid',text:'text-green-dark',status:'Normal'},{label:'SR-WR Link',pct:78,color:'bg-amber',text:'text-amber',status:'Heavy'}].map(c => (
                <div key={c.label} className="p-3 bg-gray-50 rounded-lg border border-[#e0e8e4]">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 font-medium text-[10px] uppercase">{c.label}:</span>
                    <span className={`${c.text} font-bold`}>{c.pct}% ({c.status})</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#e0e8e4] rounded-full overflow-hidden">
                    <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONSUMERS TAB - Updated
  // ══════════════════════════════════════════════════════════════════════════
  // CONSUMERS TAB - Updated with status and approve/reject buttons
if (activeTab === 'consumers') {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="pb-4 border-b border-[#e0e8e4]">
        <h2 className="font-sora text-[22px] font-bold text-gray-900">Registered Consumers</h2>
        <p className="text-gray-500 text-[13px] mt-1">View consumer profiles registered on the Open Access portal</p>
      </div>
      <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              {['K Number', 'Name', 'Email', 'Phone', 'Drawal Point'].map(h => (
                <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
            {consumers.map((c, i) => (
              <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                <td className="py-3.5 px-5 font-mono text-gray-700">{c.k_number || '—'}</td>
                <td className="py-3.5 px-5 font-semibold text-gray-900">{c.name}</td>
                <td className="py-3.5 px-5 text-gray-600">{c.email}</td>
                <td className="py-3.5 px-5 text-gray-600">{c.phoneNumber || '-'}</td>
                <td className="py-3.5 px-5 text-gray-600 max-w-[200px] truncate">{c.drawalPoint || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

  // ══════════════════════════════════════════════════════════════════════════
  // SUPPLIERS TAB - Updated with Approve/Reject buttons
  // ══════════════════════════════════════════════════════════════════════════
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
              {['K Number', 'Company Name', 'Email', 'Phone', 'Injection Point', 'Renewable Type', 'Status'].map(h => (
                <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
            {suppliers.map((s, i) => (
              <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                <td className="py-3.5 px-5 font-mono text-gray-700">{s.k_number || '—'}</td>
                <td className="py-3.5 px-5 font-semibold text-gray-900">{s.name}</td>
                <td className="py-3.5 px-5 text-gray-600">{s.email}</td>
                <td className="py-3.5 px-5 text-gray-600">{s.phoneNumber || '-'}</td>
                <td className="py-3.5 px-5 text-gray-600 max-w-[180px] truncate">{s.injectionPoint || '—'}</td>
                <td className="py-3.5 px-5 font-semibold text-gray-900">{s.renewableType || '—'}</td>
                <td className="py-3.5 px-5">
                  {s.status === 'VERIFIED' ? (
                    <span className="badge badge-green">Approved</span>
                  ) : s.status === 'REJECTED' ? (
                    <span className="badge badge-red">Rejected</span>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleVerifyUser(s.id, 'SUPPLIER', 'approve')} 
                        className="px-3 py-1 rounded-[6px] bg-green-dark text-white text-[11px] font-semibold hover:bg-green-mid transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleVerifyUser(s.id, 'SUPPLIER', 'reject')} 
                        className="px-3 py-1 rounded-[6px] bg-white border border-red-300 text-red-600 text-[11px] font-semibold hover:bg-red-50 transition-colors"
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

  // ══════════════════════════════════════════════════════════════════════════
  // APPLICATIONS TAB — FULL GEOA DETAIL VIEW (unchanged)
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'applications') {
    const pending = applications.filter(a => !['APPROVED','SUPPLIER_APPROVED','REJECTED'].includes(a.approvalStatus || ''));
    const approved = applications.filter(a => ['APPROVED','SUPPLIER_APPROVED'].includes(a.approvalStatus || ''));
    const rejected = applications.filter(a => a.approvalStatus === 'REJECTED');

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="font-sora text-[22px] font-bold text-gray-900">GEOA Open Access Applications</h2>
            <p className="text-gray-500 text-[13px] mt-1">Review all submitted Green Energy Open Access requests — approve to dispatch to supplier, reject with reason.</p>
          </div>
          <button onClick={loadAdminData} className="btn-outline flex items-center gap-2 text-[12px] px-4 py-2 shrink-0">
            <Cpu className="w-3.5 h-3.5" /><span>Refresh</span>
          </button>
        </div>

        {dashboardError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{dashboardError}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-amber-600" /></div>
            <div><p className="font-sora font-bold text-[22px] text-amber-700">{pending.length}</p><p className="text-[12px] text-amber-600 font-medium">Pending Review</p></div>
          </div>
          <div className="bg-green-pale border border-[#9fe1cb] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-mid/20 rounded-xl flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5 text-green-dark" /></div>
            <div><p className="font-sora font-bold text-[22px] text-green-dark">{approved.length}</p><p className="text-[12px] text-green-dark font-medium">Approved</p></div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0"><XCircle className="w-5 h-5 text-red-600" /></div>
            <div><p className="font-sora font-bold text-[22px] text-red-700">{rejected.length}</p><p className="text-[12px] text-red-600 font-medium">Rejected</p></div>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] p-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold text-[15px]">No GEOA applications submitted yet</p>
            <p className="text-gray-400 text-[13px] mt-1">Applications submitted by consumers will appear here for review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const isExpanded = expandedAppId === app.id;
              const isLoading = actionLoadingId === app.id;
              const wasActioned = actionSuccess?.id === app.id;
              const status = app.approvalStatus || 'ADMIN_PENDING';
              const isPending = !['APPROVED','SUPPLIER_APPROVED','REJECTED'].includes(status);

              return (
                <div key={app.id} className={`bg-white rounded-[var(--radius-md)] border transition-all ${isExpanded ? 'border-green-mid shadow-md' : 'border-[#e0e8e4] shadow-sm'}`}>
                  {/* Application row header */}
                  <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        status === 'APPROVED' || status === 'SUPPLIER_APPROVED' ? 'bg-green-pale' :
                        status === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'
                      }`}>
                        {status === 'APPROVED' || status === 'SUPPLIER_APPROVED'
                          ? <CheckCircle className="w-5 h-5 text-green-dark" />
                          : status === 'REJECTED'
                          ? <XCircle className="w-5 h-5 text-red-500" />
                          : <Clock className="w-5 h-5 text-amber-500" />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-sora font-bold text-[15px] text-gray-900">{app.consumerName || app.applicantName || 'Consumer'}</h4>
                          <span className="text-gray-400 text-[13px]">→</span>
                          <h4 className="font-sora font-bold text-[15px] text-gray-900">{app.supplierName || 'Supplier'}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-500">
                          <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{app.mw} MW</span>
                          {app.entityType && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{app.entityType}</span>}
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{app.createdAt?.split('T')[0] || '—'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      <span className={`badge ${appStatusBadge(status)} text-[12px] px-3 py-1`}>
                        {appStatusLabel(status)}
                      </span>
                      {wasActioned && (
                        <span className={`text-[12px] font-semibold px-3 py-1 rounded-lg ${actionSuccess?.action === 'APPROVED' ? 'bg-green-pale text-green-dark' : 'bg-red-50 text-red-600'}`}>
                          {actionSuccess?.action === 'APPROVED' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      )}
                      {isPending && (
                        <>
                          <button onClick={() => handleApprove(app.id)} disabled={isLoading} className="flex items-center gap-1.5 bg-[#1b4d3e] text-white text-[12px] font-bold px-4 py-2 rounded-lg hover:bg-[#2d6a4f] transition-colors shadow-sm disabled:opacity-50">
                            {isLoading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                          <button onClick={() => setRejectingAppId(app.id)} disabled={isLoading} className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      )}
                      <button onClick={() => setExpandedAppId(isExpanded ? null : app.id)} className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600 border border-[#e0e8e4] px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        {isExpanded ? 'Hide' : 'View Details'}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Reject reason input */}
                  {rejectingAppId === app.id && (
                    <div className="px-5 pb-5 border-t border-[#f0f4f2] pt-4">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <p className="text-[13px] font-semibold text-red-700">Provide a rejection reason (will be visible to consumer)</p>
                        </div>
                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} placeholder="e.g. Incomplete documentation — Bank Guarantee not submitted correctly." className="w-full border border-red-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-red-400 bg-white" />
                        <div className="flex gap-3">
                          <button onClick={() => handleReject(app.id)} disabled={isLoading} className="flex items-center gap-1.5 bg-red-600 text-white text-[12px] font-bold px-5 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                            {isLoading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            Confirm Rejection
                          </button>
                          <button onClick={() => { setRejectingAppId(null); setRejectReason(''); }} className="text-[12px] font-semibold text-gray-600 border border-[#e0e8e4] px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded detail view */}
                  {isExpanded && (
                    <div className="border-t border-[#f0f4f2] p-5 space-y-6 bg-gray-50/50">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-[#1b4d3e] text-white text-[11px] font-bold flex items-center justify-center">1</div>
                          <h5 className="font-sora font-bold text-[14px] text-gray-900">Applicant Details</h5>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { l: 'Company / Applicant', v: app.applicantName || app.consumerName || '—' },
                            { l: 'Entity Type', v: app.entityType || '—' },
                            { l: 'DISCOM / Utility', v: app.discom || '—' },
                            { l: 'CIN / GSTIN', v: app.legalIdentifier || '—' },
                            { l: 'Contact Person', v: app.contactPerson || '—' },
                            { l: 'Contact Email', v: app.contactEmail || '—' },
                            { l: 'Mobile', v: app.contactMobile || '—' },
                          ].map(item => (
                            <div key={item.l} className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">{item.l}</p>
                              <p className="text-[13px] font-semibold text-gray-900 mt-0.5 break-words">{item.v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-[#1b4d3e] text-white text-[11px] font-bold flex items-center justify-center">2</div>
                          <h5 className="font-sora font-bold text-[14px] text-gray-900">Technical Details</h5>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { l: 'Supplier', v: app.supplierName || '—' },
                            { l: 'Connected Load', v: app.mw ? `${app.mw} MW` : '—' },
                            { l: 'Renewable Source', v: app.renewableType || '—' },
                            { l: 'Schedule Type', v: app.scheduleType || '—' },
                            { l: 'Duration', v: app.durationDays ? `${app.durationDays} Days` : '—' },
                            { l: 'Injection Point', v: app.injectionPoint || '—' },
                            { l: 'Drawal Point', v: app.drawalPoint || '—' },
                          ].map(item => (
                            <div key={item.l} className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">{item.l}</p>
                              <p className="text-[13px] font-semibold text-gray-900 mt-0.5 break-words">{item.v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {status === 'REJECTED' && app.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[12px] font-bold text-red-700 mb-1">Rejection Reason</p>
                            <p className="text-[13px] text-red-600">{app.rejectionReason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NOC MANAGEMENT TAB (unchanged)
  // ══════════════════════════════════════════════════════════════════════════
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
                <select value={selectedAppId} onChange={(e) => setSelectedAppId(e.target.value)} required className="form-control">
                  <option value="">Select app record...</option>
                  {applications.filter(a => a.annexureDStatus === 'PENDING').map(a => (
                    <option key={a.id} value={a.id}>{a.consumerName} to {a.supplierName} ({a.mw} MW)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-group">
                  <label className="required">Transfer Capability (MW)</label>
                  <input type="number" value={transCap} onChange={(e) => setTransCap(Number(e.target.value))} required className="form-control" />
                </div>
                <div className="form-group">
                  <label className="required">Corridor Transmission Loss (%)</label>
                  <input type="number" step="0.1" value={losses} onChange={(e) => setLosses(Number(e.target.value))} required className="form-control" />
                </div>
              </div>
              <div className="form-group">
                <label className="required">NOC Validity Duration (Days)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} required className="form-control" />
              </div>
              <button type="submit" className="btn-green w-full flex items-center justify-center space-x-2 h-[42px] mt-2">
                <Key className="w-4 h-4" /><span>Digitally Sign & Generate Annexure-D NOC</span>
              </button>
            </form>
            {isNocGenerated && (
              <div className="alert alert-success mt-6 mb-0 animate-fadeIn">
                <span>✅</span><span>Annexure-D NOC successfully signed and recorded!</span>
              </div>
            )}
          </div>
          <div className="tracker-card flex flex-col justify-between !mb-0">
            <div>
              <h3 className="font-sora font-bold text-[16px] text-gray-900 mb-2">Certificate Authority Info</h3>
              <p className="text-[13px] text-gray-500">National Cryptographic Grid Certificates Authority</p>
            </div>
            <div className="bg-amber-light p-4 rounded-lg border border-[#fac775] mt-6">
              <p className="text-[12px] text-amber leading-relaxed">* Issued certificates contain NLDC electronic seal and SHA256 checksum tags.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCHEDULING TAB (unchanged)
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'scheduling') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">NOAR Schedules Dispatch Logs</h2>
          <p className="text-gray-500 text-[13px] mt-1">National Open Access Registry grid power flow dispatches</p>
        </div>
        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
              {['Schedule ID','Supplier','Consumer','Approved MW','Time Block','Grid Dispatch Status'].map(h => (
                <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>
              ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {schedules.map((s, i) => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 text-gray-600 font-bold uppercase text-[11px]">{s.id}</td>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{s.supplierName}</td>
                  <td className="py-3.5 px-5 font-semibold text-gray-700">{s.consumerName}</td>
                  <td className="py-3.5 px-5 font-bold text-green-dark">{s.mw} MW</td>
                  <td className="py-3.5 px-5 text-gray-600">{s.timeBlock}</td>
                  <td className="py-3.5 px-5"><span className="badge badge-green">{s.gridStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DOCUMENTS TAB (unchanged)
  // ══════════════════════════════════════════════════════════════════════════
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
              {['Document Title','Category','Filed By','Date','Status','Action'].map(h => (
                <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>
              ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {documents.map((d, i) => (
                <tr key={d.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">📄</div>{d.title || d.name}
                  </td>
                  <td className="py-3.5 px-5 text-gray-600">{d.category}</td>
                  <td className="py-3.5 px-5 font-semibold text-gray-700">{d.uploaderName || d.uploader || 'User'}</td>
                  <td className="py-3.5 px-5 text-gray-500">{d.createdAt?.split('T')[0] || d.date || '—'}</td>
                  <td className="py-3.5 px-5"><span className={`badge ${d.status === 'VERIFIED' ? 'badge-green' : 'badge-amber'}`}>{d.status || 'PENDING'}</span></td>
                  <td className="py-3.5 px-5 text-right space-x-2 flex justify-end">
                    {d.status !== 'VERIFIED' && (
                      <>
                        <button onClick={() => handleVerifyDocument(d.id, 'VERIFIED')} className="px-3 py-1.5 rounded-[6px] bg-green-dark text-white text-[12px] font-bold hover:bg-green-mid transition-colors shadow-sm">Approve</button>
                        <button onClick={() => handleVerifyDocument(d.id, 'REJECTED')} className="px-3 py-1.5 rounded-[6px] bg-white border border-[#e0e8e4] text-gray-600 text-[12px] font-bold hover:bg-gray-50">Reject</button>
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

  // ══════════════════════════════════════════════════════════════════════════
  // PAYMENTS TAB (unchanged)
  // ══════════════════════════════════════════════════════════════════════════
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
          <p className="text-gray-600 text-[13px] leading-relaxed">All bilateral and collective G-DAM transactions are cleared through the Central Clearing Corporation escrow. Settlements are executed T+1 daily based on finalized NOAR schedules.</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SETTINGS TAB (unchanged)
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'settings') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">System Preferences</h2>
          <p className="text-gray-500 text-[13px] mt-1">Configure regulatory constants and NLDC API connections</p>
        </div>
        <div className="form-card max-w-2xl space-y-6">
          <div className="pt-4 space-y-3">
            <div className="flex justify-between items-center text-[13px]"><span className="text-gray-500">Default Transmission Loss</span><span className="font-semibold text-gray-900">3.5%</span></div>
            <div className="flex justify-between items-center text-[13px]"><span className="text-gray-500">G-DAM Clearing Algorithm</span><span className="font-semibold text-gray-900">Enabled (Double Auction)</span></div>
            <div className="flex justify-between items-center text-[13px]"><span className="text-gray-500">Auto-Approve Annexure-C</span><span className="badge badge-amber">DISABLED</span></div>
          </div>
          <button className="btn-outline w-full flex items-center justify-center space-x-2"><Settings className="w-4 h-4" /><span>Modify Parameters</span></button>
        </div>
      </div>
    );
  }

  return null;
};