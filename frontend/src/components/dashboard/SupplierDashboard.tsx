import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Zap, Award, Users, ShieldCheck,
  Plus, BarChart2, Edit2, Building, Save, X, Phone, Mail, MapPin, FileText, CheckCircle, Lock,
  RefreshCw, Upload, AlertCircle, Clock, Download, Eye, DollarSign 
} from 'lucide-react';

interface SupplierDashboardProps {
  activeTab: string;
  setTab?: (tab: string) => void;
}

interface DocumentUpload {
  id: string;
  name: string;
  category: string;
  fileName: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;
}

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ activeTab }) => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [capacityList, setCapacityList] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [revenueLedger, setRevenueLedger] = useState<any[]>([]);
  const [consumerProfile, setConsumerProfile] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedConsumerForModal, setSelectedConsumerForModal] = useState<any>(null);
  const [showConsumerModal, setShowConsumerModal] = useState(false);

  // Document uploads
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState('PPA');
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Capacity edit helpers
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [editingPlantData, setEditingPlantData] = useState<any>({ name: '', type: 'Solar', total: 0, available: 0, price: 0, injectionPoint: 'Bhadla Pool (765kV)', status: 'Active' });
  const [plantName, setPlantName] = useState('');
  const [plantType, setPlantType] = useState('Solar');
  const [totalMw, setTotalMw] = useState(50);
  const [plantPrice, setPlantPrice] = useState(4.2);
  const [plantInjectionPoint, setPlantInjectionPoint] = useState('Bhadla Pool (765kV)');
  
  // Profile states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingGrid, setIsEditingGrid] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [companyName, setCompanyName] = useState('SolarGen Renewables Corp');
  const [registrationNo, setRegistrationNo] = useState('REG-2020-0124567');
  const [registeredState, setRegisteredState] = useState('Rajasthan');
  const [totalCapacity, setTotalCapacity] = useState(120);
  const [email, setEmail] = useState('solar@greengen.com');
  const [phone, setPhone] = useState('+91-9876543210');
  const [address, setAddress] = useState('Plot No. 123, Industrial Area, Jodhpur, Rajasthan 342001');
  const [contactPerson, setContactPerson] = useState('Rajesh Kumar Singh');
  const [contactDesignation, setContactDesignation] = useState('Business Development Manager');
  const [gridNode, setGridNode] = useState('Bhadla Pool (765kV)');
  const [injectionPoint, setInjectionPoint] = useState('765kV Bhadla Pooling Station');
  const [gridLicenseNo, setGridLicenseNo] = useState('NLDC-GRL-2020-9876');
  const [gridStatus, setGridStatus] = useState('ACTIVE');
  const [bankName, setBankName] = useState('State Bank of India');
  const [bankAccount, setBankAccount] = useState('1234567890');
  const [accountHolder, setAccountHolder] = useState('SolarGen Renewables Corp');
  const [ifscCode, setIfscCode] = useState('SBIN0001234');
  const [settlementStatus] = useState('VERIFIED');
  const [isAddingCapacity, setIsAddingCapacity] = useState(false);
  const [bidMw, setBidMw] = useState(10);
  const [bidPrice, setBidPrice] = useState(4.2);
  const [bidBlock, setBidBlock] = useState('10:00-11:00');
  const [bidMarket, setBidMarket] = useState('G-DAM');
  const [bidSubmitted, setBidSubmitted] = useState(false);

  const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';
  const normalizedTab = activeTab === 'consumer-requests' ? 'consumer-requests' : 
                        activeTab === 'contracts' ? 'contracts' : 
                        activeTab === 'documents' ? 'documents' : activeTab;


useEffect(() => {
  
}, [user]);

  // ── Map backend application to supplier view ────────────────────────────
  const mapRequest = (app: any) => ({
    ...app,
    duration: `${app.durationDays || 0} Days`,
    // Normalise status for display
    status: app.approvalStatus || 'ADMIN_PENDING',
    mw: app.mw || 0,
    consumerName: app.consumerName || 'Consumer',
    durationDays: app.durationDays || 0,
    deliveryPoint: app.drawalPoint || '',
    requestDate: app.createdAt?.split('T')[0] || '',
    requestedPrice: app.requestedPrice || 0,
    injectionPoint: app.injectionPoint || '',
    startDate: app.proposedStartDate || app.startDate || '',
    finalPrice: app.finalPrice || app.requestedPrice || 0
  });


const loadRequests = useCallback(async () => {
  if (!token) {
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/applications`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) return;
    const data = await res.json();
    
    data.forEach((app: any) => {
      // console.log(`App ID: ${app.id}, Status: ${app.approvalStatus}, SupplierId: ${app.supplierId}, Consumer: ${app.consumerName}`);
    });
    
    // Filter for this supplier only
    const supplierApps = data.filter((app: any) => app.supplierId === user?.id);

    const pendingRequests = supplierApps.filter((app: any) => 
      app.approvalStatus === 'APPROVED'
    );

    const activeContracts = supplierApps.filter((app: any) => 
      app.approvalStatus === 'SUPPLIER_APPROVED'
    );

    setRequests(pendingRequests.map(mapRequest));
    setContracts(activeContracts.map(mapRequest));

  } catch (error) {
    setRequests([]);
    setContracts([]);
  }
}, [token, API_BASE, user?.id]);




  // ── Refresh handler with loading indicator ──────────────────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRequests();
    setIsRefreshing(false);
  };

  
  useEffect(() => {
    if (normalizedTab === 'contracts' || normalizedTab === 'dashboard') {
      loadRequests();
    }
  }, [normalizedTab, loadRequests]);

  useEffect(() => {
  const loadProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      setProfile(await res.json());
    } catch { }
  };

  const loadPlants = async () => {
    if (!token || !user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/plants/supplier/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.length > 0) {
        setCapacityList(data);
      }
    } catch (error) {
      console.error('Error loading plants:', error);
    }
  };

  // setBids([{ id: 'bid-1', mw: 20, price: 4.2, marketType: 'G-DAM', timeBlock: '10:00-11:00', status: 'MATCHED', date: '2026-05-20' }]);
  // setSchedules([{ id: 'sch-1', consumerName: 'Tata Steel Limited', mw: 20, timeBlock: '10:00-11:00', gridStatus: 'SCHEDULED' }]);
  // setRevenueLedger([
  //   { id: 'rev-1', month: 'April 2026', totalMwh: 12000, rate: 4.5, earned: 5400000, status: 'SETTLED' },
  //   { id: 'rev-2', month: 'May 2026 (Provisional)', totalMwh: 8500, rate: 4.2, earned: 3570000, status: 'PENDING' }
  // ]);

  loadProfile();
  loadRequests();
  loadPlants(); // Add this line
}, [token, user?.id]);

  
  const getStatusBadgeClass = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'SUPPLIER_APPROVED') return 'bg-green-100 text-green-800';
    if (s === 'REJECTED') return 'bg-red-100 text-red-800';
    if (s === 'ADMIN_PENDING' || s === 'SUBMITTED') return 'bg-yellow-100 text-yellow-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusLabel = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED') return '✓ Admin Approved';
    if (s === 'SUPPLIER_APPROVED') return '✓ Accepted';
    if (s === 'REJECTED') return '✗ Rejected';
    if (s === 'ADMIN_PENDING') return 'Pending Admin Review';
    if (s === 'SUBMITTED') return 'Pending Admin Review';
    return status || 'Pending';
  };


  const canSupplierAct = (status: string) => {
    const s = (status || '').toUpperCase();
    return s === 'APPROVED'; // Admin approved → now supplier must accept/reject
  };

  const startEditPlant = (plant: any) => { setEditingPlantId(plant.id); setEditingPlantData({ ...plant }); setIsAddingCapacity(false); };

  const saveEditPlant = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingPlantId) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/plants/${editingPlantId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(editingPlantData)
    });
    
    if (!response.ok) throw new Error('Failed to update plant');
    
    const updatedPlant = await response.json();
    setCapacityList(capacityList.map(p => p.id === editingPlantId ? updatedPlant : p));
    setEditingPlantId(null);
    alert('Plant updated successfully!');
  } catch (error) {
    console.error('Error updating plant:', error);
    alert('Failed to update plant');
  }
};

const cancelEditPlant = () => { setEditingPlantId(null); };

const deletePlant = async (plantId: string) => {
  if (!confirm('Are you sure you want to delete this plant?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/plants/${plantId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to delete plant');
    
    setCapacityList(capacityList.filter(p => p.id !== plantId));
    alert('Plant deleted successfully!');
  } catch (error) {
    console.error('Error deleting plant:', error);
    alert('Failed to delete plant');
  }
};

  

  const handleUploadFile = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedFile) return;
    setUploadedDocs([{ id: `doc-${Date.now()}`, name: selectedFile.name, size: selectedFile.size, status: 'VERIFIED', date: new Date().toISOString().split('T')[0] }, ...uploadedDocs]);
    setSelectedFile(null);
    setUploadError(null);
  };

  const calculateOaChargesForPlant = (plant: any, consumerState = 'Rajasthan') => {
    const sameStateFactor = plant.state === consumerState ? 0.9 : 1.2;
    const baseOa = plant.type === 'Solar' ? 0.6 : plant.type === 'Wind' ? 0.7 : 0.85;
    const transmissionCost = plant.injectionPoint?.includes('765kV') ? 0.35 : 0.45;
    return Number((baseOa * sameStateFactor + transmissionCost).toFixed(2));
  };

  const estimateDeliveredPrice = (plant: any, consumerState = 'Rajasthan') => {
    return Number((plant.price + calculateOaChargesForPlant(plant, consumerState)).toFixed(2));
  };

  const handleAddCapacity = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!plantName) return;
  
  setIsAddingCapacity(true);
  try {
    const response = await fetch(`${API_BASE}/api/plants`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        supplierId: user?.id,
        supplierName: user?.name || companyName,
        name: plantName,
        type: plantType,
        total: totalMw,
        available: totalMw,
        price: plantPrice,
        injectionPoint: plantInjectionPoint,
        status: 'Active',
        state: registeredState
      })
    });
    
    if (!response.ok) throw new Error('Failed to add plant');
    
    const newPlant = await response.json();
    setCapacityList([...capacityList, newPlant]);
    setPlantName('');
    setPlantType('Solar');
    setTotalMw(50);
    setPlantPrice(4.2);
    setPlantInjectionPoint('Bhadla Pool (765kV)');
    setIsAddingCapacity(false);
    alert('Plant added successfully!');
  } catch (error) {
    console.error('Error adding plant:', error);
    alert('Failed to add plant');
  } finally {
    setIsAddingCapacity(false);
  }
};

  // ── Supplier accepts or rejects a consumer request ──────────────────────
  const handleRequestAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/applications/${id}/supplier-approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: action === 'APPROVED' ? 'SUPPLIER_APPROVED' : 'REJECTED' })
      });
      if (!res.ok) return;
      const data = await res.json();
      // const updated = data.application || { id, approvalStatus: action === 'APPROVED' ? 'SUPPLIER_APPROVED' : 'REJECTED' };

      // setRequests(prev => prev.map(r =>
      //   r.id === id ? { ...r, status: updated.approvalStatus || action, approvalStatus: updated.approvalStatus || action } : r
      // ));

      if (action === 'APPROVED') {
        // Move from requests to contracts
        const acceptedApp = requests.find(r => r.id === id);
        if (acceptedApp) {
          setContracts(prev => [{
            ...acceptedApp,
            status: 'SUPPLIER_APPROVED',
            approvalStatus: 'SUPPLIER_APPROVED',
            acceptedAt: new Date().toISOString()
          }, ...prev]);
          setRequests(prev => prev.filter(r => r.id !== id));
          
          // Add to schedules
          setSchedules(prev => [{
            id: `sch-${Date.now()}`,
            consumerName: acceptedApp.consumerName,
            mw: acceptedApp.mw,
            timeBlock: '00:00-24:00 (RTC)',
            gridStatus: 'SCHEDULED'
          }, ...prev]);
        }
      } else {
        // Remove rejected request
        setRequests(prev => prev.filter(r => r.id !== id));
      }
      
    } catch (error) {
      console.error('Failed to update request:', error);
    }
  };



  const handleCancelContract = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this contract?')) return;
    
    try {
      if (!token) return;
      
      const res = await fetch(`${API_BASE}/api/applications/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      
      if (!res.ok) return;
      
      setContracts(prev => prev.filter(c => c.id !== id));
      alert('Contract cancelled successfully');
      
    } catch (error) {
      console.error('Failed to cancel contract:', error);
    }
  };


  // Document upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.type)) {
      setUploadError('Unsupported file type. Allowed: PDF, JPG, PNG');
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Max 5 MB');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };



  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !docName) {
      setUploadError('Please provide document name and file');
      return;
    }
    
    // Simulate upload to backend
    const newDoc: DocumentUpload = {
      id: `doc-${Date.now()}`,
      name: docName,
      category: docCategory,
      fileName: selectedFile.name,
      uploadedAt: new Date().toLocaleString(),
      status: 'PENDING'
    };
    
    setDocuments(prev => [newDoc, ...prev]);
    setUploadSuccess(`Document "${docName}" uploaded successfully! Pending admin approval.`);
    setSelectedFile(null);
    setDocName('');
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  // Load documents (simulated - replace with API call)
  const loadDocuments = useCallback(async () => {
    // In production, fetch from backend
    const mockDocs: DocumentUpload[] = [
      {
        id: 'doc-1',
        name: 'Power Purchase Agreement',
        category: 'PPA',
        fileName: 'PPA_SolarGen_2026.pdf',
        uploadedAt: '2026-05-15 10:30:00',
        status: 'APPROVED',
        verifiedBy: 'Admin',
        verifiedAt: '2026-05-16 14:20:00'
      },
      {
        id: 'doc-2',
        name: 'Bank Guarantee',
        category: 'Financial',
        fileName: 'BG_StateBank_2026.pdf',
        uploadedAt: '2026-05-20 09:15:00',
        status: 'PENDING'
      },
      {
        id: 'doc-3',
        name: 'Grid Connectivity Certificate',
        category: 'Technical',
        fileName: 'Grid_Conn_NLDC.pdf',
        uploadedAt: '2026-05-25 11:45:00',
        status: 'APPROVED',
        verifiedBy: 'NLDC Officer',
        verifiedAt: '2026-05-26 09:30:00'
      }
    ];
    setDocuments(mockDocs);
  }, []);


  const fetchConsumerProfile = async (consumerId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/consumers/${consumerId}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      setConsumerProfile(await res.json());
    } catch { setConsumerProfile(null); }
  };

  const handleBiddingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBids([{ id: `bid-${Date.now()}`, mw: bidMw, price: bidPrice, marketType: bidMarket, timeBlock: bidBlock, status: 'PENDING', date: new Date().toISOString().split('T')[0] }, ...bids]);
    setBidSubmitted(true);
    setTimeout(() => setBidSubmitted(false), 2000);
  };

  const viewConsumerProfile = (consumerId: string) => { fetchConsumerProfile(consumerId); };


  const fetchConsumerDetails = async (consumerId: string) => {
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/api/users/consumers/${consumerId}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    setSelectedConsumerForModal(data);
    setShowConsumerModal(true);
  } catch (error) {
    console.error('Error fetching consumer details:', error);
  }
};


  // ══════════════════════════════════════════════════════════════════════════
  // DASHBOARD TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (normalizedTab === 'dashboard') {
    return (
      <div className="space-y-8">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 text-[13px] mt-1">Monitor your renewable energy assets and market performance</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'TOTAL CAPACITY', val: '120 MW', sub: 'Installed capacity', icon: <Zap className="w-4 h-4 text-[#2d6a4f]" />, border: 'border-t-[#2d6a4f]', valClass: 'text-gray-900' },
            { label: 'ALLOCATED', val: '70 MW', sub: 'Contracted capacity', icon: <ShieldCheck className="w-4 h-4 text-[#2d6a4f]" />, border: 'border-t-[#2d6a4f]', valClass: 'text-[#1b4d3e]' },
            { label: 'AVAILABLE', val: '50 MW', sub: 'Ready for trading', icon: <Award className="w-4 h-4 text-[#f4a261]" />, border: 'border-t-[#f4a261]', valClass: 'text-gray-900' },
            { label: 'ACTIVE CLIENTS', val: `${requests.filter(r => ['APPROVED','SUPPLIER_APPROVED'].includes((r.status||'').toUpperCase())).length || 1} Client`, sub: 'Connected consumers', icon: <Users className="w-4 h-4 text-[#1d3557]" />, border: 'border-t-[#1d3557]', valClass: 'text-gray-900' },
          ].map(m => (
            <div key={m.label} className={`bg-white rounded-lg p-5 shadow-sm border border-[#e0e8e4] border-t-[3px] ${m.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{m.label}</span>
                {m.icon}
              </div>
              <p className={`font-sora text-[24px] font-bold ${m.valClass}`}>{m.val}</p>
              <p className="text-[11px] text-gray-500 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4]">
            <div className="flex items-center justify-between mb-6">
              <div><h3 className="font-sora font-bold text-[16px] text-gray-900">Recent Bids</h3><p className="text-gray-500 text-[12px] mt-0.5">Active market participation</p></div>
              <BarChart2 className="w-5 h-5 text-[#1b4d3e]" />
            </div>
            <div className="space-y-3">
              {bids.slice(0, 3).map((bid, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-[#f0f4f2] last:border-0">
                  <div><p className="text-[12px] font-semibold text-gray-900">{bid.mw} MW @ ₹{bid.price}/unit</p><p className="text-[11px] text-gray-500">{bid.marketType} • {bid.timeBlock}</p></div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${bid.status === 'MATCHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{bid.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4]">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="font-sora font-bold text-[16px] text-gray-900">Consumer Requests</h3><p className="text-gray-500 text-[12px] mt-0.5">All open access applications for your supply</p></div>
              <Users className="w-5 h-5 text-[#1b4d3e]" />
            </div>
            {requests.length === 0 ? (
              <p className="text-gray-400 text-[13px] py-4 text-center">No requests yet.</p>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 3).map((req, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-[#f0f4f2] last:border-0">
                    <div><p className="text-[12px] font-semibold text-gray-900">{req.consumerName}</p><p className="text-[11px] text-gray-500">{req.mw} MW • {req.duration}</p></div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(req.status)}`}>{getStatusLabel(req.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-[#e0e8e4]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sora font-bold text-[16px] text-gray-900">Dispatch Schedule</h3>
            <span className="text-[12px] text-gray-500">Today's grid assignments</span>
          </div>
          <div className="space-y-3">
            {schedules.slice(0, 5).map((schedule, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-[#e0e8e4]">
                <div className="flex-1"><p className="text-[12px] font-semibold text-gray-900">{schedule.consumerName}</p><p className="text-[11px] text-gray-500">{schedule.mw} MW • {schedule.timeBlock}</p></div>
                <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">{schedule.gridStatus}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (normalizedTab === 'energy-assets' || normalizedTab === 'capacity') {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-4 border-b border-[#e0e8e4]">
          <div><h2 className="font-sora text-[22px] font-bold text-gray-900">Energy Assets</h2><p className="text-gray-500 text-[13px] mt-1">Grid dispatch capacity and energy plant parameters</p></div>
          <button onClick={() => setIsAddingCapacity(true)} className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] transition-colors flex items-center"><Plus className="w-4 h-4 mr-2" /><span>Add New Plant</span></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[{label:'TOTAL CAPACITY',val:'120 MW',sub:'Solar & Wind Plants Pool',icon:<Zap className="w-4 h-4 text-[#2d6a4f]"/>,border:'border-t-[#2d6a4f]'},{label:'ALLOCATED MW',val:'70 MW',sub:'Contracted via active PPA',icon:<ShieldCheck className="w-4 h-4 text-[#2d6a4f]"/>,border:'border-t-[#2d6a4f]'},{label:'AVAILABLE MW',val:'50 MW',sub:'Ready for trades',icon:<Award className="w-4 h-4 text-[#f4a261]"/>,border:'border-t-[#f4a261]'},{label:'ACTIVE CLIENTS',val:'1 Client',sub:'Industrial Pool Link',icon:<Users className="w-4 h-4 text-[#1d3557]"/>,border:'border-t-[#1d3557]'}].map(m=>(
            <div key={m.label} className={`bg-white rounded-lg p-5 shadow-sm border border-[#e0e8e4] border-t-[3px] ${m.border}`}>
              <div className="flex items-center justify-between mb-2"><span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{m.label}</span>{m.icon}</div>
              <p className="font-sora text-[24px] font-bold text-gray-900">{m.val}</p>
              <p className="text-[11px] text-gray-500 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>
        {isAddingCapacity && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4] max-w-xl">
            <h3 className="font-sora text-[18px] font-bold text-gray-900 mb-6">Add Generation Power Plant</h3>
            <form onSubmit={handleAddCapacity} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Plant Name *</label><input type="text" placeholder="e.g. Jodhpur Solar Park..." value={plantName} onChange={e=>setPlantName(e.target.value)} required className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Renewable Type *</label><select value={plantType} onChange={e=>setPlantType(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"><option value="Solar">Solar Power Pool</option><option value="Wind">Wind Farm Grid</option><option value="Hydro">Hydro Kinetic Energy</option><option value="Biomass">Biomass Thermal Core</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Total Capacity (MW) *</label><input type="number" value={totalMw} onChange={e=>setTotalMw(Number(e.target.value))} min={1} required className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Base Price (₹/unit) *</label><input type="number" value={plantPrice} onChange={e=>setPlantPrice(Number(e.target.value))} min={0} step="0.1" required className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Injection Point *</label><input type="text" value={plantInjectionPoint} onChange={e=>setPlantInjectionPoint(e.target.value)} required className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]" /></div>
                <div className="flex items-end space-x-3"><button type="submit" className="flex-1 bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e]">Save Plant</button><button type="button" onClick={()=>setIsAddingCapacity(false)} className="flex-1 bg-white border border-[#e0e8e4] text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50">Cancel</button></div>
              </div>
            </form>
          </div>
        )}
        {editingPlantId && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4] max-w-xl">
            <h3 className="font-sora text-[18px] font-bold text-gray-900 mb-4">Edit Generation Unit</h3>
            <form onSubmit={saveEditPlant} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Plant Name</label><input value={editingPlantData.name} onChange={e=>setEditingPlantData({...editingPlantData,name:e.target.value})} className="form-control" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Type</label><select value={editingPlantData.type} onChange={e=>setEditingPlantData({...editingPlantData,type:e.target.value})} className="form-control"><option>Solar</option><option>Wind</option><option>Hydro</option><option>Biomass</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Total (MW)</label><input type="number" value={editingPlantData.total} onChange={e=>setEditingPlantData({...editingPlantData,total:Number(e.target.value)})} className="form-control" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Available (MW)</label><input type="number" value={editingPlantData.available} onChange={e=>setEditingPlantData({...editingPlantData,available:Number(e.target.value)})} className="form-control" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Base Price (₹/unit)</label><input type="number" step="0.1" value={editingPlantData.price} onChange={e=>setEditingPlantData({...editingPlantData,price:Number(e.target.value)})} className="form-control" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Injection Point</label><input type="text" value={editingPlantData.injectionPoint} onChange={e=>setEditingPlantData({...editingPlantData,injectionPoint:e.target.value})} className="form-control" /></div>
              </div>
              <div className="flex items-center space-x-3 pt-2"><button type="submit" className="btn-green px-4 py-2">Save</button><button type="button" onClick={cancelEditPlant} className="btn-outline px-4 py-2">Cancel</button></div>
            </form>
          </div>
        )}
        <div className="bg-white rounded-lg border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead><tr>{['Plant Name','Type','Total','Available','Base Price','Injection Point','Delivered Price','Status','Action'].map(h=><th key={h} className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {capacityList.map((c,i)=>(
                <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${i%2!==0?'bg-[#f9fcfa]':''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-5"><span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">{c.type}</span></td>
                  <td className="py-3.5 px-5 text-gray-700">{c.total} MW</td>
                  <td className="py-3.5 px-5 font-bold text-gray-900">{c.available} MW</td>
                  <td className="py-3.5 px-5 text-[#1b4d3e] font-semibold">₹{c.price?.toFixed(2)}</td>
                  <td className="py-3.5 px-5 text-gray-600">{c.injectionPoint}</td>
                  <td className="py-3.5 px-5 text-[#1b4d3e] font-bold">₹{estimateDeliveredPrice(c)}</td>
                  <td className="py-3.5 px-5"><span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">{c.status}</span></td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex gap-2">
                      <button onClick={() => startEditPlant(c)} className="px-3 py-1 rounded-md bg-white border border-[#e0e8e4] text-gray-700 text-[12px] font-semibold hover:bg-gray-50">Edit</button>
                      <button onClick={() => deletePlant(c.id)} className="px-3 py-1 rounded-md bg-red-50 border border-red-200 text-red-600 text-[12px] font-semibold hover:bg-red-100">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }



    if (normalizedTab === 'consumer-requests') {
    return (
      <>
        <div className="space-y-8 animate-fadeIn">
          <div className="pb-4 border-b border-[#e0e8e4] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-sora text-[22px] font-bold text-gray-900">Consumer Requests</h2>
              <p className="text-gray-500 text-[13px] mt-1">
                Admin-approved open access requests waiting for your action.
              </p>
            </div>
            <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2 border border-[#e0e8e4] bg-white text-gray-700 text-[12px] font-bold px-4 py-2 rounded-lg hover:bg-gray-50">
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#e0e8e4] p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-[15px] font-medium">No pending consumer requests</p>
              <p className="text-gray-400 text-[13px] mt-1">Admin-approved requests will appear here for your action.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#e0e8e4] overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr>
                    {['Consumer','Capacity (MW)','Offered Price (₹)','Injection Point','Duration','Submitted','Action'].map(h => (
                      <th key={h} className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                  {requests.map((r, i) => (
                    <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                      <td className="py-3.5 px-5 font-semibold text-gray-900">
                        <button onClick={() => fetchConsumerDetails(r.consumerId)} className="text-blue-dark hover:text-blue-mid hover:underline font-semibold cursor-pointer transition-colors">{r.consumerName}</button>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-gray-900">{r.mw} MW</td>
                      <td className="py-3.5 px-5 font-bold text-[#1b4d3e]">₹{r.requestedPrice?.toFixed(2) || '—'}</td>
                      <td className="py-3.5 px-5 text-gray-600 text-[12px] max-w-[180px] truncate">{r.injectionPoint || '—'}</td>
                      <td className="py-3.5 px-5 text-gray-600">{r.duration}</td>
                      <td className="py-3.5 px-5 text-gray-500 text-[12px]">{r.requestDate || '—'}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRequestAction(r.id, 'APPROVED')}
                            className="px-3 py-1.5 rounded-md bg-[#1b4d3e] text-white text-[12px] font-bold hover:bg-[#2d6a4f] transition-colors shadow-sm"
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => handleRequestAction(r.id, 'REJECTED')}
                            className="px-3 py-1.5 rounded-md bg-white border border-red-200 text-red-600 text-[12px] font-bold hover:bg-red-50 transition-colors"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showConsumerModal && selectedConsumerForModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowConsumerModal(false)}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-[#e0e8e4] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-dark rounded-full flex items-center justify-center text-white font-bold">
                    {selectedConsumerForModal.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h3 className="font-sora text-xl font-bold text-gray-900">{selectedConsumerForModal.name}</h3>
                    <p className="text-[13px] text-gray-500">Consumer Profile</p>
                  </div>
                </div>
                <button onClick={() => setShowConsumerModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-dark" />
                    Company Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-semibold">Entity Type</p>
                      <p className="font-semibold text-gray-900">{selectedConsumerForModal.entityType || 'Industrial'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-semibold">State</p>
                      <p className="font-semibold text-gray-900">{selectedConsumerForModal.state || '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] text-gray-400 uppercase font-semibold">Address</p>
                      <p className="text-gray-700">{selectedConsumerForModal.address || '—'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-dark" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-semibold">Contact Person</p>
                      <p className="font-semibold text-gray-900">{selectedConsumerForModal.contactPerson || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-semibold">Email</p>
                      <p className="text-gray-700">{selectedConsumerForModal.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-semibold">Phone</p>
                      <p className="text-gray-700">{selectedConsumerForModal.mobile || selectedConsumerForModal.phone || '—'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-dark" />
                    Power Requirements
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-semibold">Connected Load</p>
                      <p className="font-bold text-xl text-blue-dark">{selectedConsumerForModal.loadMw || '—'} MW</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-semibold">Voltage Level</p>
                      <p className="font-bold text-xl text-gray-900">{selectedConsumerForModal.voltageLevel || '33kV'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }


  if (normalizedTab === 'contracts') {
  return (
    <>
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Active Contracts</h2>
          <p className="text-gray-500 text-[13px] mt-1">
            Contracts you have accepted. Click Cancel to terminate any contract.
          </p>
        </div>

        {contracts.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#e0e8e4] p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-[15px] font-medium">No active contracts</p>
            <p className="text-gray-400 text-[13px] mt-1">Accepted requests will appear here as active contracts.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#e0e8e4] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr>
                  {['Contract ID','Consumer','Capacity (MW)','Final Price (₹)','Duration','Start Date','Status','Action'].map(h => (
                    <th key={h} className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                {contracts.map((c, i) => (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                    <td className="py-3.5 px-5 font-mono text-[11px] font-bold text-gray-600">#{c.id.slice(-8)}</td>
                    <td className="py-3.5 px-5 font-semibold text-gray-900">
                      <button 
                        onClick={() => fetchConsumerDetails(c.consumerId)} 
                        className="text-blue-dark hover:text-blue-mid hover:underline font-semibold cursor-pointer transition-colors"
                      >
                        {c.consumerName}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-gray-900">{c.mw} MW</td>
                    <td className="py-3.5 px-5 font-bold text-[#1b4d3e]">₹{c.finalPrice?.toFixed(2) || c.requestedPrice?.toFixed(2) || '—'}</td>
                    <td className="py-3.5 px-5 text-gray-600">{c.duration}</td>
                    <td className="py-3.5 px-5 text-gray-600">{c.startDate || c.requestDate || '—'}</td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        Ongoing
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => handleCancelContract(c.id)}
                        className="px-3 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-600 text-[12px] font-bold hover:bg-red-100 transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel Contract
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Consumer Details Modal */}
      {showConsumerModal && selectedConsumerForModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowConsumerModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#e0e8e4] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-dark rounded-full flex items-center justify-center text-white font-bold">
                  {selectedConsumerForModal.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="font-sora text-xl font-bold text-gray-900">{selectedConsumerForModal.name}</h3>
                  <p className="text-[13px] text-gray-500">Consumer Profile</p>
                </div>
              </div>
              <button onClick={() => setShowConsumerModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-dark" />
                  Company Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Entity Type</p>
                    <p className="font-semibold text-gray-900">{selectedConsumerForModal.entityType || 'Industrial'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">State</p>
                    <p className="font-semibold text-gray-900">{selectedConsumerForModal.state || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Address</p>
                    <p className="text-gray-700">{selectedConsumerForModal.address || '—'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-dark" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Contact Person</p>
                    <p className="font-semibold text-gray-900">{selectedConsumerForModal.contactPerson || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Email</p>
                    <p className="text-gray-700">{selectedConsumerForModal.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Phone</p>
                    <p className="text-gray-700">{selectedConsumerForModal.mobile || selectedConsumerForModal.phone || '—'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-dark" />
                  Power Requirements
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Connected Load</p>
                    <p className="font-bold text-xl text-blue-dark">{selectedConsumerForModal.loadMw || selectedConsumerForModal.connectedLoad || '—'} MW</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Voltage Level</p>
                    <p className="font-bold text-xl text-gray-900">{selectedConsumerForModal.voltageLevel || '33kV'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

  if (normalizedTab === 'consumer-marketplace') {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4] lg:col-span-2">
            <h3 className="font-sora text-[18px] font-bold text-gray-900 mb-6">DAM / RTM Market Bid Submission</h3>
            <form onSubmit={handleBiddingSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Available Capacity (MW) *</label><input type="number" value={bidMw} onChange={e=>setBidMw(Number(e.target.value))} min={1} required className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Offer Price (₹/UNIT) *</label><input type="number" step="0.01" value={bidPrice} onChange={e=>setBidPrice(Number(e.target.value))} min={0.1} required className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Time Block *</label><select value={bidBlock} onChange={e=>setBidBlock(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"><option value="10:00-11:00">Block 10:00-11:00</option><option value="11:00-12:00">Block 11:00-12:00</option><option value="12:00-13:00">Block 12:00-13:00</option></select></div>
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Market Type *</label><select value={bidMarket} onChange={e=>setBidMarket(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"><option value="G-DAM">Green Day-Ahead (G-DAM)</option><option value="DAM">Day-Ahead (DAM)</option><option value="RTM">Real-Time (RTM)</option></select></div>
              </div>
              <button type="submit" className="bg-[#2d6a4f] text-white px-5 py-3 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] transition-colors w-full flex items-center justify-center"><Plus className="w-4 h-4 mr-2" /><span>Transmit Bidding Quantity</span></button>
            </form>
            {bidSubmitted && <div className="mt-6 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-[13px] flex items-center"><span className="mr-2">✅</span><span>Bidding request logged successfully!</span></div>}
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4] flex flex-col justify-between">
            <div><h3 className="font-sora font-bold text-[16px] text-gray-900 mb-2">Market Clearing Rules</h3><p className="text-gray-500 text-[13px]">National Green Day-Ahead auction rules</p></div>
            <div className="bg-blue-50 p-4 rounded-lg border border-[#b5d4f4] mt-6 text-[12px] text-[#1d3557]">* Active bids will be dynamically cleared against consumer requirements by the NLDC System Engine.</div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-sora text-[18px] font-bold text-gray-900">Active Orders Registry</h3>
          <div className="bg-white rounded-lg border border-[#e0e8e4] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead><tr>{['Order Reference','Capacity','Bid Price','Market Type','Time Block','Match Status'].map(h=><th key={h} className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                {bids.map((b,i)=>(
                  <tr key={b.id} className={`hover:bg-gray-50 transition-colors ${i%2!==0?'bg-[#f9fcfa]':''}`}>
                    <td className="py-3.5 px-5 text-gray-600 font-bold uppercase text-[11px]">{b.id}</td>
                    <td className="py-3.5 px-5 font-bold text-gray-900">{b.mw} MW</td>
                    <td className="py-3.5 px-5 text-[#1b4d3e] font-bold">₹{b.price}</td>
                    <td className="py-3.5 px-5 text-gray-600">{b.marketType}</td>
                    <td className="py-3.5 px-5 text-gray-600">{b.timeBlock}</td>
                    <td className="py-3.5 px-5"><span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${b.status==='MATCHED'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (normalizedTab === 'schedules') {
    return (
      <div className="space-y-8">
        <div className="pb-4 border-b border-[#e0e8e4]"><h2 className="font-sora text-[22px] font-bold text-gray-900">Schedules Log</h2><p className="text-gray-500 text-[13px] mt-1">NOAR dispatch approvals</p></div>
        <div className="bg-white rounded-lg border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead><tr>{['Schedule ID','Consumer','Capacity','Time Block','Grid Dispatch Status'].map(h=><th key={h} className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {schedules.map((s,i)=>(
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i%2!==0?'bg-[#f9fcfa]':''}`}>
                  <td className="py-3.5 px-5 text-gray-600 font-bold uppercase text-[11px]">{s.id}</td>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{s.consumerName}</td>
                  <td className="py-3.5 px-5 font-bold text-[#1b4d3e]">{s.mw} MW</td>
                  <td className="py-3.5 px-5 text-gray-600">{s.timeBlock}</td>
                  <td className="py-3.5 px-5"><span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">{s.gridStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (normalizedTab === 'revenue') {
  // Sample consumer revenue data (replace with API data later)
  const consumerRevenueData = [
    { id: 'consumer-1', name: 'Tata Steel Limited', state: 'Jharkhand', mw: 50, energy: 36500, rate: 4.45, revenue: 16242500, status: 'PAID', paymentDate: '2026-05-10' },
    { id: 'consumer-2', name: 'JSW Steel Ltd', state: 'Karnataka', mw: 35, energy: 25550, rate: 4.38, revenue: 11190900, status: 'PAID', paymentDate: '2026-05-08' },
    { id: 'consumer-3', name: 'UltraTech Cement', state: 'Rajasthan', mw: 25, energy: 18250, rate: 4.42, revenue: 8066500, status: 'PENDING', paymentDate: '2026-05-25' },
    { id: 'consumer-4', name: 'Hindustan Zinc', state: 'Rajasthan', mw: 20, energy: 14600, rate: 4.35, revenue: 6351000, status: 'PARTIAL', paymentDate: '2026-05-15' },
    { id: 'consumer-5', name: 'Adani Green', state: 'Gujarat', mw: 15, energy: 10950, rate: 4.50, revenue: 4927500, status: 'PAID', paymentDate: '2026-05-05' },
  ];

  // Monthly revenue data for chart
  const monthlyData = [
    { month: 'Apr', revenue: 850000 },
    { month: 'May', revenue: 920000 },
    { month: 'Jun', revenue: 1100000 },
    { month: 'Jul', revenue: 1250000 },
    { month: 'Aug', revenue: 1180000 },
    { month: 'Sep', revenue: 1350000 },
    { month: 'Oct', revenue: 1420000 },
    { month: 'Nov', revenue: 1280000 },
    { month: 'Dec', revenue: 1510000 },
    { month: 'Jan', revenue: 1650000 },
    { month: 'Feb', revenue: 1580000 },
    { month: 'Mar', revenue: 1720000 },
  ];

  const maxRevenue = 2000000;

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Header with Year Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#e0e8e4]">
          <div>
            <h2 className="font-sora text-[22px] font-bold text-gray-900">Revenue & Settlement Ledger</h2>
            <p className="text-gray-500 text-[13px] mt-1">Track consumer-wise revenue, payments, and settlements</p>
          </div>
          
          {/* Year Filter */}
          <div className="flex items-center gap-3">
            <select className="border border-[#e0e8e4] rounded-lg px-4 py-2 text-[13px] font-semibold bg-white">
              <option value="2026">Financial Year 2025-26</option>
              <option value="2025">Financial Year 2024-25</option>
              <option value="2024">Financial Year 2023-24</option>
            </select>
            <button className="bg-[#2d6a4f] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#1b4d3e] transition-colors flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-[#e0e8e4] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-green-dark" />
            </div>
            <p className="font-sora text-[28px] font-bold text-gray-900">₹1,28,45,000</p>
            <p className="text-[11px] text-green-600 mt-1">↑ 12.5% from last year</p>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-[#e0e8e4] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active Consumers</span>
              <Users className="w-4 h-4 text-blue-dark" />
            </div>
            <p className="font-sora text-[28px] font-bold text-gray-900">{consumerRevenueData.length}</p>
            <p className="text-[11px] text-gray-500 mt-1">Across 4 states</p>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-[#e0e8e4] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Energy Delivered</span>
              <Zap className="w-4 h-4 text-amber" />
            </div>
            <p className="font-sora text-[28px] font-bold text-gray-900">42,850 MWh</p>
            <p className="text-[11px] text-gray-500 mt-1">YTD volume</p>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-[#e0e8e4] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Avg. Realized Price</span>
              <BarChart2 className="w-4 h-4 text-green-dark" />
            </div>
            <p className="font-sora text-[28px] font-bold text-gray-900">₹4.35</p>
            <p className="text-[11px] text-gray-500 mt-1">per unit</p>
          </div>
        </div>

        {/* Consumer-wise Revenue Table */}
        <div className="bg-white rounded-xl border border-[#e0e8e4] overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-gray-50 border-b border-[#e0e8e4]">
            <h3 className="font-sora font-bold text-[16px] text-gray-900">Consumer-wise Revenue Breakdown</h3>
            <p className="text-gray-500 text-[12px] mt-0.5">Monthly and cumulative revenue by consumer</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1b4d3e]">
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Consumer Name</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">State</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Contract MW</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Energy (MWh)</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Rate (₹)</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Revenue (₹)</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Status</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f2]">
                {consumerRevenueData.map((consumer, idx) => (
                  <tr key={consumer.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                    <td className="py-3.5 px-5 font-semibold text-gray-900">
                      <button 
                        onClick={() => fetchConsumerDetails(consumer.id)}
                        className="text-blue-dark hover:text-blue-mid hover:underline font-semibold cursor-pointer"
                      >
                        {consumer.name}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-gray-600">{consumer.state}</td>
                    <td className="py-3.5 px-5 font-semibold text-gray-900">{consumer.mw} MW</td>
                    <td className="py-3.5 px-5 text-gray-700">{consumer.energy.toLocaleString()} MWh</td>
                    <td className="py-3.5 px-5 font-semibold text-gray-900">₹{consumer.rate}</td>
                    <td className="py-3.5 px-5 font-bold text-green-dark">₹{consumer.revenue.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                        consumer.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        consumer.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {consumer.status === 'PAID' ? '✓ Paid' : consumer.status === 'PARTIAL' ? '⚠ Partial' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <button className="text-gray-500 hover:text-green-dark transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Chart Card */}
          <div className="bg-white rounded-xl border border-[#e0e8e4] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-sora font-bold text-[16px] text-gray-900">Monthly Revenue Trend</h3>
                <p className="text-gray-500 text-[11px] mt-0.5">April 2025 - March 2026</p>
              </div>
              <select className="border border-[#e0e8e4] rounded-lg px-3 py-1.5 text-[12px] bg-white">
                <option>2025-26</option>
                <option>2024-25</option>
              </select>
            </div>
            
            {/* Bar Chart Visualization */}
            <div className="relative h-64 mt-4">
              <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between h-full pt-6">
                {monthlyData.map((item, idx) => {
                  const height = (item.revenue / maxRevenue) * 180;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 mx-1 group">
                      <div 
                        className="w-full bg-gradient-to-t from-green-dark to-green-mid rounded-t-md transition-all duration-300 group-hover:opacity-80"
                        style={{ height: `${height}px` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-8 bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                          ₹{(item.revenue / 100000).toFixed(1)}L
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-2">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl border border-[#e0e8e4] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-sora font-bold text-[16px] text-gray-900">Recent Transactions</h3>
                <p className="text-gray-500 text-[11px] mt-0.5">Last 5 settlement records</p>
              </div>
              <button className="text-green-dark text-[11px] font-semibold hover:underline">View All →</button>
            </div>
            
            <div className="space-y-3">
              {[
                { ref: 'TRX-202605001', consumer: 'Tata Steel', amount: 16242500, date: '2026-05-10', status: 'settled' },
                { ref: 'TRX-202605002', consumer: 'JSW Steel', amount: 11190900, date: '2026-05-08', status: 'settled' },
                { ref: 'TRX-202605003', consumer: 'UltraTech', amount: 8066500, date: '2026-05-25', status: 'pending' },
                { ref: 'TRX-202605004', consumer: 'Hindustan Zinc', amount: 6351000, date: '2026-05-15', status: 'processing' },
                { ref: 'TRX-202605005', consumer: 'Adani Green', amount: 4927500, date: '2026-05-05', status: 'settled' },
              ].map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-[#e0e8e4]">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      tx.status === 'settled' ? 'bg-green-500' :
                      tx.status === 'processing' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-[12px] font-semibold text-gray-900">{tx.ref}</p>
                      <p className="text-[10px] text-gray-500">{tx.consumer} • {tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-gray-900">₹{(tx.amount / 100000).toFixed(1)}L</p>
                    <span className={`text-[10px] font-semibold ${
                      tx.status === 'settled' ? 'text-green-600' :
                      tx.status === 'processing' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {tx.status === 'settled' ? 'Settled' : tx.status === 'processing' ? 'Processing' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Yearly Summary Table */}
        <div className="bg-white rounded-xl border border-[#e0e8e4] overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-gray-50 border-b border-[#e0e8e4]">
            <h3 className="font-sora font-bold text-[16px] text-gray-900">Yearly Performance Summary</h3>
            <p className="text-gray-500 text-[12px] mt-0.5">Annual comparison across financial years</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1b4d3e]">
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Financial Year</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Total Energy (MWh)</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Avg Rate (₹)</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Total Revenue (₹)</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Growth (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f2]">
                {[
                  { year: '2025-26', energy: 128450, avgRate: 4.35, revenue: 55875750, growth: '+12.5%' },
                  { year: '2024-25', energy: 114200, avgRate: 4.28, revenue: 48877600, growth: '+8.2%' },
                  { year: '2023-24', energy: 105600, avgRate: 4.19, revenue: 44246400, growth: '+5.4%' },
                ].map((year, idx) => (
                  <tr key={idx} className={`hover:bg-gray-50 transition-colors ${idx % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                    <td className="py-3.5 px-5 font-semibold text-gray-900">{year.year}</td>
                    <td className="py-3.5 px-5 text-gray-700">{year.energy.toLocaleString()} MWh</td>
                    <td className="py-3.5 px-5 font-semibold text-gray-900">₹{year.avgRate}</td>
                    <td className="py-3.5 px-5 font-bold text-green-dark">₹{year.revenue.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-5">
                      <span className="text-green-600 font-semibold text-[12px]">{year.growth}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Consumer Details Modal */}
      {showConsumerModal && selectedConsumerForModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowConsumerModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#e0e8e4] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-dark rounded-full flex items-center justify-center text-white font-bold">
                  {selectedConsumerForModal.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="font-sora text-xl font-bold text-gray-900">{selectedConsumerForModal.name}</h3>
                  <p className="text-[13px] text-gray-500">Consumer Profile</p>
                </div>
              </div>
              <button onClick={() => setShowConsumerModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-dark" />
                  Company Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Entity Type</p>
                    <p className="font-semibold text-gray-900">{selectedConsumerForModal.entityType || 'Industrial'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">State</p>
                    <p className="font-semibold text-gray-900">{selectedConsumerForModal.state || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Address</p>
                    <p className="text-gray-700">{selectedConsumerForModal.address || '—'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-dark" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Contact Person</p>
                    <p className="font-semibold text-gray-900">{selectedConsumerForModal.contactPerson || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Email</p>
                    <p className="text-gray-700">{selectedConsumerForModal.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Phone</p>
                    <p className="text-gray-700">{selectedConsumerForModal.mobile || selectedConsumerForModal.phone || '—'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-dark" />
                  Power Requirements
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Connected Load</p>
                    <p className="font-bold text-xl text-blue-dark">{selectedConsumerForModal.loadMw || selectedConsumerForModal.connectedLoad || '—'} MW</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Voltage Level</p>
                    <p className="font-bold text-xl text-gray-900">{selectedConsumerForModal.voltageLevel || '33kV'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

  if (normalizedTab === 'documents') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Document Management</h2>
          <p className="text-gray-500 text-[13px] mt-1">
            Upload regulatory documents and track approval status from admin.
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg border border-[#e0e8e4] p-6">
          <h3 className="font-sora text-[18px] font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-dark" />
            Upload New Document
          </h3>
          
          <form onSubmit={handleUploadDocument} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="text-[12px] font-semibold text-gray-700">Document Name *</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g., Power Purchase Agreement"
                  className="form-control mt-1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="text-[12px] font-semibold text-gray-700">Category *</label>
                <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="form-control mt-1">
                  <option value="PPA">Power Purchase Agreement (PPA)</option>
                  <option value="Financial">Bank Guarantee / Financial</option>
                  <option value="Technical">Technical / Grid Connectivity</option>
                  <option value="Legal">Legal / Regulatory</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="text-[12px] font-semibold text-gray-700">Select File (PDF, JPG, PNG - Max 5MB) *</label>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={handleFileSelect}
                className="mt-1 block w-full text-[13px] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-green-dark file:text-white hover:file:bg-[#2d6a4f] cursor-pointer"
                required
              />
              {selectedFile && (
                <p className="text-[12px] text-green-dark mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
            
            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-[13px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {uploadError}
              </div>
            )}
            
            {uploadSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-[13px] flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {uploadSuccess}
              </div>
            )}
            
            <button type="submit" className="btn-green flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </form>
        </div>

        {/* Documents Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sora text-[18px] font-bold text-gray-900">Document Registry</h3>
            <button onClick={handleRefresh} className="text-[12px] text-green-dark hover:text-green-mid flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
          
          <div className="bg-white rounded-lg border border-[#e0e8e4] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr>
                  {['Document Name','Category','File Name','Uploaded On','Status','Verified By','Verified On'].map(h => (
                    <th key={h} className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      No documents uploaded yet
                    </td>
                  </tr>
                ) : (
                  documents.map((doc, i) => (
                    <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                      <td className="py-3.5 px-5 font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {doc.name}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-gray-600 text-[12px]">{doc.fileName}</td>
                      <td className="py-3.5 px-5 text-gray-500 text-[12px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {doc.uploadedAt}
                      </td>
                      <td className="py-3.5 px-5">
                        {doc.status === 'APPROVED' ? (
                          <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Approved
                          </span>
                        ) : doc.status === 'REJECTED' ? (
                          <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                            <X className="w-3 h-3" />
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" />
                            Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-gray-600 text-[12px]">{doc.verifiedBy || '—'}</td>
                      <td className="py-3.5 px-5 text-gray-500 text-[12px]">{doc.verifiedAt || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (normalizedTab === 'profile') {
    return (
      <div className="space-y-8">
        <div className="pb-4 border-b border-[#e0e8e4]"><h2 className="font-sora text-[22px] font-bold text-gray-900">Supplier Profile</h2><p className="text-gray-500 text-[13px] mt-1">Manage company details, grid licenses, and preferences</p></div>
        <div className="bg-white rounded-lg border border-[#e0e8e4] p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#1b4d3e] rounded-full flex items-center justify-center text-white text-2xl font-bold">{(profile?.name||user?.name||companyName)?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)}</div>
              <div><h3 className="font-sora text-[18px] font-bold text-gray-900">{profile?.name||user?.name||companyName}</h3><p className="text-[13px] text-gray-500">{profile?.email||user?.email||'company@example.com'}</p></div>
            </div>
            <button onClick={()=>setIsEditingProfile(true)} className="bg-white border border-[#e0e8e4] text-gray-700 px-3 py-2 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition-colors flex items-center space-x-1.5"><Edit2 className="w-4 h-4"/><span>Edit</span></button>
          </div>
          {!isEditingProfile?(
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]"><span className="text-gray-500">Registered State</span><span className="font-semibold text-gray-900">{profile?.state||user?.state||registeredState}</span></div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]"><span className="text-gray-500">Injection Point</span><span className="font-semibold text-gray-900">{profile?.injectionPoint||gridNode}</span></div>
              <div className="flex justify-between py-2"><span className="text-gray-500">Account Status</span><span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${user?.status==='VERIFIED'?'bg-green-100 text-green-800':'bg-amber-100 text-amber-800'}`}>{user?.status||'PENDING'}</span></div>
            </div>
          ):(
            <form onSubmit={e=>{e.preventDefault();setIsEditingProfile(false);}} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Company Name</label><input type="text" value={companyName} onChange={e=>setCompanyName(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Registration Number</label><input type="text" value={registrationNo} onChange={e=>setRegistrationNo(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"/></div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] flex-1 flex items-center justify-center space-x-2"><Save className="w-4 h-4"/><span>Save</span></button>
                <button type="button" onClick={()=>setIsEditingProfile(false)} className="bg-white border border-[#e0e8e4] text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 flex-1 flex items-center justify-center space-x-2"><X className="w-4 h-4"/><span>Cancel</span></button>
              </div>
            </form>
          )}
        </div>
        <div className="bg-white rounded-lg border border-[#e0e8e4] p-6">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center space-x-3"><Mail className="w-5 h-5 text-[#1b4d3e]"/><h3 className="font-sora text-[18px] font-bold text-gray-900">Contact Information</h3></div><button onClick={()=>setIsEditingContact(true)} className="bg-white border border-[#e0e8e4] text-gray-700 px-3 py-2 rounded-lg text-[12px] font-bold hover:bg-gray-50 flex items-center space-x-1.5"><Edit2 className="w-4 h-4"/><span>Edit</span></button></div>
          {!isEditingContact?(
            <div className="space-y-3 text-[13px]">
              <div className="flex items-start space-x-3 py-2 border-b border-[#f0f4f2]"><Phone className="w-4 h-4 text-gray-400 mt-0.5"/><div className="flex-1"><p className="text-gray-500 text-[12px]">Phone</p><p className="font-semibold text-gray-900">{phone}</p></div></div>
              <div className="flex items-start space-x-3 py-2 border-b border-[#f0f4f2]"><Mail className="w-4 h-4 text-gray-400 mt-0.5"/><div className="flex-1"><p className="text-gray-500 text-[12px]">Email</p><p className="font-semibold text-gray-900">{email}</p></div></div>
              <div className="flex items-start space-x-3 py-2"><MapPin className="w-4 h-4 text-gray-400 mt-0.5"/><div className="flex-1"><p className="text-gray-500 text-[12px]">Address</p><p className="font-semibold text-gray-900">{address}</p></div></div>
            </div>
          ):(
            <form onSubmit={e=>{e.preventDefault();setIsEditingContact(false);}} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Phone Number</label><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Email Address</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"/></div>
              </div>
              <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Address</label><textarea value={address} onChange={e=>setAddress(e.target.value)} rows={2} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"/></div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] flex-1 flex items-center justify-center space-x-2"><Save className="w-4 h-4"/><span>Save</span></button>
                <button type="button" onClick={()=>setIsEditingContact(false)} className="bg-white border border-[#e0e8e4] text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 flex-1 flex items-center justify-center space-x-2"><X className="w-4 h-4"/><span>Cancel</span></button>
              </div>
            </form>
          )}
        </div>
        <div className="bg-white rounded-lg border border-[#e0e8e4] p-6">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center space-x-3"><Zap className="w-5 h-5 text-[#1b4d3e]"/><h3 className="font-sora text-[18px] font-bold text-gray-900">Grid Connectivity</h3></div><button onClick={()=>setIsEditingGrid(true)} className="bg-white border border-[#e0e8e4] text-gray-700 px-3 py-2 rounded-lg text-[12px] font-bold hover:bg-gray-50 flex items-center space-x-1.5"><Edit2 className="w-4 h-4"/><span>Edit</span></button></div>
          {!isEditingGrid?(
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]"><span className="text-gray-500">Grid Connection Node</span><span className="font-semibold text-gray-900">{gridNode}</span></div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]"><span className="text-gray-500">Injection Point</span><span className="font-semibold text-gray-900">{injectionPoint}</span></div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]"><span className="text-gray-500">Grid License Number</span><span className="font-semibold text-gray-900">{gridLicenseNo}</span></div>
              <div className="flex justify-between py-2"><span className="text-gray-500">Connection Status</span><span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">{gridStatus}</span></div>
            </div>
          ):(
            <form onSubmit={e=>{e.preventDefault();setIsEditingGrid(false);}} className="space-y-4">
              <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Grid Connection Node</label><input type="text" value={gridNode} onChange={e=>setGridNode(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"/></div>
              <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Injection Point</label><input type="text" value={injectionPoint} onChange={e=>setInjectionPoint(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"/></div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] flex-1 flex items-center justify-center space-x-2"><Save className="w-4 h-4"/><span>Save</span></button>
                <button type="button" onClick={()=>setIsEditingGrid(false)} className="bg-white border border-[#e0e8e4] text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 flex-1 flex items-center justify-center space-x-2"><X className="w-4 h-4"/><span>Cancel</span></button>
              </div>
            </form>
          )}
        </div>
        <div className="bg-white rounded-lg border border-[#e0e8e4] p-6">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center space-x-3"><FileText className="w-5 h-5 text-[#1b4d3e]"/><h3 className="font-sora text-[18px] font-bold text-gray-900">Bank Settlement Details</h3></div><button onClick={()=>setIsEditingBank(true)} className="bg-white border border-[#e0e8e4] text-gray-700 px-3 py-2 rounded-lg text-[12px] font-bold hover:bg-gray-50 flex items-center space-x-1.5"><Edit2 className="w-4 h-4"/><span>Edit</span></button></div>
          {!isEditingBank?(
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]"><span className="text-gray-500">Bank Name</span><span className="font-semibold text-gray-900">{bankName}</span></div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]"><span className="text-gray-500">Account Holder</span><span className="font-semibold text-gray-900">{accountHolder}</span></div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]"><span className="text-gray-500">Account Number</span><span className="font-semibold text-gray-900">••••••••{bankAccount.slice(-4)}</span></div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]"><span className="text-gray-500">IFSC Code</span><span className="font-semibold text-gray-900">{ifscCode}</span></div>
              <div className="flex justify-between py-2"><span className="text-gray-500">Settlement Status</span><span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">{settlementStatus}</span></div>
            </div>
          ):(
            <form onSubmit={e=>{e.preventDefault();setIsEditingBank(false);}} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Bank Name</label><input type="text" value={bankName} onChange={e=>setBankName(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Account Holder Name</label><input type="text" value={accountHolder} onChange={e=>setAccountHolder(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"/></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">Account Number</label><input type="text" value={bankAccount} onChange={e=>setBankAccount(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold text-gray-700">IFSC Code</label><input type="text" value={ifscCode} onChange={e=>setIfscCode(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f]"/></div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] flex-1 flex items-center justify-center space-x-2"><Save className="w-4 h-4"/><span>Save</span></button>
                <button type="button" onClick={()=>setIsEditingBank(false)} className="bg-white border border-[#e0e8e4] text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 flex-1 flex items-center justify-center space-x-2"><X className="w-4 h-4"/><span>Cancel</span></button>
              </div>
            </form>
          )}
        </div>
        <div className="bg-white rounded-lg border border-[#e0e8e4] p-6">
          <div className="flex items-center space-x-3 mb-6"><Lock className="w-5 h-5 text-[#1b4d3e]"/><h3 className="font-sora text-[18px] font-bold text-gray-900">Account Security</h3></div>
          <div className="space-y-3">
            {[{label:'Two-Factor Authentication',status:'ENABLED'},{label:'Email Verification',status:'VERIFIED'}].map(item=>(
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-[#e0e8e4]">
                <div className="flex items-center space-x-3"><CheckCircle className="w-5 h-5 text-[#1b4d3e]"/><span className="text-[13px] text-gray-900 font-medium">{item.label}</span></div>
                <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">{item.status}</span>
              </div>
            ))}
            <button className="w-full bg-white border border-[#e0e8e4] text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 flex items-center justify-center space-x-2 mt-4"><Lock className="w-4 h-4"/><span>Change Password</span></button>
          </div>
        </div>
      </div>
    );
  }

  const ConsumerDetailsModal = () => {
  if (!showConsumerModal || !selectedConsumerForModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowConsumerModal(false)}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-[#e0e8e4] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-dark rounded-full flex items-center justify-center text-white font-bold">
              {selectedConsumerForModal.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h3 className="font-sora text-xl font-bold text-gray-900">{selectedConsumerForModal.name}</h3>
              <p className="text-[13px] text-gray-500">Consumer Profile</p>
            </div>
          </div>
          <button onClick={() => setShowConsumerModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Company Information */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-dark" />
              Company Information
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Entity Type</p>
                <p className="font-semibold text-gray-900">{selectedConsumerForModal.entityType || 'Industrial'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-semibold">State</p>
                <p className="font-semibold text-gray-900">{selectedConsumerForModal.state || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Address</p>
                <p className="text-gray-700">{selectedConsumerForModal.address || '—'}</p>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-dark" />
              Contact Information
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Contact Person</p>
                <p className="font-semibold text-gray-900">{selectedConsumerForModal.contactPerson || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Email</p>
                <p className="text-gray-700">{selectedConsumerForModal.email || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Phone</p>
                <p className="text-gray-700">{selectedConsumerForModal.mobile || selectedConsumerForModal.phone || '—'}</p>
              </div>
            </div>
          </div>
          
          {/* Power Requirements */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-dark" />
              Power Requirements
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Connected Load</p>
                <p className="font-bold text-xl text-blue-dark">{selectedConsumerForModal.loadMw || '—'} MW</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Voltage Level</p>
                <p className="font-bold text-xl text-gray-900">{selectedConsumerForModal.voltageLevel || '33kV'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
};

export default SupplierDashboard;
