import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Zap, Award, Users, ShieldCheck,
  Plus, BarChart2, Edit2, Save, X, Phone, Mail, MapPin, FileText, CheckCircle, Lock
} from 'lucide-react';

interface SupplierDashboardProps {
  activeTab: string;
  setTab?: (tab: string) => void;
}

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ activeTab }) => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [capacityList, setCapacityList] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [revenueLedger, setRevenueLedger] = useState<any[]>([]);
  const [consumerProfile, setConsumerProfile] = useState<any>(null);

  // Document uploads
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

  // Profile form states
  const [companyName, setCompanyName] = useState('SolarGen Renewables Corp');
  const [registrationNo, setRegistrationNo] = useState('REG-2020-0124567');
  const [registeredState, setRegisteredState] = useState('Rajasthan');
  const [totalCapacity, setTotalCapacity] = useState(120);

  // Contact form states
  const [email, setEmail] = useState('solar@greengen.com');
  const [phone, setPhone] = useState('+91-9876543210');
  const [address, setAddress] = useState('Plot No. 123, Industrial Area, Jodhpur, Rajasthan 342001');
  const [contactPerson, setContactPerson] = useState('Rajesh Kumar Singh');
  const [contactDesignation, setContactDesignation] = useState('Business Development Manager');

  // Grid connectivity form states
  const [gridNode, setGridNode] = useState('Bhadla Pool (765kV)');
  const [injectionPoint, setInjectionPoint] = useState('765kV Bhadla Pooling Station');
  const [gridLicenseNo, setGridLicenseNo] = useState('NLDC-GRL-2020-9876');
  const [gridStatus, setGridStatus] = useState('ACTIVE');

  // Bank details form states
  const [bankName, setBankName] = useState('State Bank of India');
  const [bankAccount, setBankAccount] = useState('1234567890');
  const [accountHolder, setAccountHolder] = useState('SolarGen Renewables Corp');
  const [ifscCode, setIfscCode] = useState('SBIN0001234');
  const [settlementStatus] = useState('VERIFIED');

  // Form states for adding plant capacity
  const [isAddingCapacity, setIsAddingCapacity] = useState(false);

  // Form states for bidding
  const [bidMw, setBidMw] = useState(10);
  const [bidPrice, setBidPrice] = useState(4.2);
  const [bidBlock, setBidBlock] = useState('10:00-11:00');
  const [bidMarket, setBidMarket] = useState('G-DAM');
  const [bidSubmitted, setBidSubmitted] = useState(false);

  const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

  
  const normalizedTab = activeTab === 'consumer-requests' ? 'contracts' : activeTab;

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        setProfile(data);
      } catch {
        // ignore profile load failures for now
      }
    };

    const mapRequest = (app: any) => ({
      ...app,
      duration: `${app.durationDays || 0} Days`,
      status: app.approvalStatus || 'PENDING',
      mw: app.mw || 0,
      consumerName: app.consumerName || 'Consumer',
      durationDays: app.durationDays || 0,
      deliveryPoint: app.drawalPoint || '',
      requestDate: app.createdAt?.split('T')[0] || ''
    });

    const loadRequests = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/applications`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setRequests(data.map(mapRequest));
      } catch {
        setRequests([]);
      }
    };

    const seeded = [
      { id: 'plant-1', name: 'Bhadla Solar Park Phase IV', type: 'Solar', total: 100, available: 40, price: 4.2, injectionPoint: 'Bhadla Pool (765kV)', status: 'Active' },
      { id: 'plant-2', name: 'Jaisalmer Wind Grid Pool', type: 'Wind', total: 20, available: 10, price: 4.5, injectionPoint: 'Jaisalmer Wind Node', status: 'Active' }
    ];
    setCapacityList(seeded);
    setBids([
      { id: 'bid-1', mw: 20, price: 4.2, marketType: 'G-DAM', timeBlock: '10:00-11:00', status: 'MATCHED', date: '2026-05-20' }
    ]);
    setSchedules([
      { id: 'sch-1', consumerName: 'Tata Steel Limited', mw: 20, timeBlock: '10:00-11:00', gridStatus: 'SCHEDULED' }
    ]);
    setRevenueLedger([
      { id: 'rev-1', month: 'April 2026', totalMwh: 12000, rate: 4.5, earned: 5400000, status: 'SETTLED' },
      { id: 'rev-2', month: 'May 2026 (Provisional)', totalMwh: 8500, rate: 4.2, earned: 3570000, status: 'PENDING' }
    ]);

    loadProfile();
    loadRequests();
  }, [token]);

  const startEditPlant = (plant: any) => {
    setEditingPlantId(plant.id);
    setEditingPlantData({ ...plant });
    setIsAddingCapacity(false);
  };

  const saveEditPlant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlantId) return;
    setCapacityList(capacityList.map(p => p.id === editingPlantId ? { ...p, ...editingPlantData } : p));
    setEditingPlantId(null);
  };

  const cancelEditPlant = () => {
    setEditingPlantId(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.includes(f.type)) {
      setUploadError('Unsupported file type. Allowed: PDF, JPG, PNG');
      setSelectedFile(null);
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Max 5 MB');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(f);
  };

  const handleUploadFile = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedFile) return;
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: selectedFile.name,
      size: selectedFile.size,
      status: 'VERIFIED',
      date: new Date().toISOString().split('T')[0]
    };
    setUploadedDocs([newDoc, ...uploadedDocs]);
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

  const handleAddCapacity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantName) return;
    const newPlant = {
      id: `plant-${Date.now()}`,
      name: plantName,
      type: plantType,
      total: totalMw,
      available: totalMw,
      price: plantPrice,
      injectionPoint: plantInjectionPoint,
      state: registeredState,
      status: 'Active'
    };
    setCapacityList([...capacityList, newPlant]);
    setPlantName('');
    setPlantPrice(4.2);
    setPlantInjectionPoint('Bhadla Pool (765kV)');
    setIsAddingCapacity(false);
  };

  const handleRequestAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
  try {
    if (!token) return;
    const res = await fetch(`${API_BASE}/api/applications/${id}/supplier-approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: action })
    });
    if (!res.ok) return;
    const data = await res.json();
    const updated = data.application || { id, approvalStatus: action };
    
    // Update local state - change 'status' to match what consumer expects
    setRequests(prev => prev.map(r => 
      r.id === id ? { 
        ...r, 
        status: action,           // For supplier table display
        approvalStatus: updated.approvalStatus || action,
        requestStatus: action     // Add this so consumer sees the update
      } : r
    ));
    
    // If approved, add to schedules
    if (action === 'APPROVED') {
      const req = requests.find(r => r.id === id);
      if (req) {
        setSchedules(prev => [{
          id: `sch-${Date.now()}`,
          consumerName: req.consumerName || 'Consumer',
          mw: req.mw || 20,
          timeBlock: '00:00-24:00 (RTC)',
          gridStatus: 'SCHEDULED'
        }, ...prev]);
      }
    }
    
    // Optional: Show feedback to supplier
    alert(`Request ${action === 'APPROVED' ? 'accepted' : 'rejected'} successfully`);
    
  } catch (error) {
    console.error("Failed to update request:", error);
    alert("Failed to process request. Please try again.");
  }
};

  const fetchConsumerProfile = async (consumerId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/consumers/${consumerId}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setConsumerProfile(data);
    } catch {
      setConsumerProfile(null);
    }
  };

  const handleBiddingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBid = {
      id: `bid-${Date.now()}`,
      mw: bidMw,
      price: bidPrice,
      marketType: bidMarket,
      timeBlock: bidBlock,
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0]
    };
    setBids([newBid, ...bids]);
    setBidSubmitted(true);
    setTimeout(() => {
      setBidSubmitted(false);
    }, 2000);
  };

  const viewConsumerProfile = (consumerId: string) => {
    fetchConsumerProfile(consumerId);
  };

  if (normalizedTab === 'dashboard') {
    return (
      <div className="space-y-8">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 text-[13px] mt-1">Monitor your renewable energy assets and market performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e0e8e4] border-t-[3px] border-t-[#2d6a4f]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL CAPACITY</span>
              <Zap className="w-4 h-4 text-[#2d6a4f]" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">120 <span className="text-[14px]">MW</span></p>
              <p className="text-[11px] text-gray-500 mt-1">Installed capacity</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e0e8e4] border-t-[3px] border-t-[#2d6a4f]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">ALLOCATED</span>
              <ShieldCheck className="w-4 h-4 text-[#2d6a4f]" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-[#1b4d3e]">70 <span className="text-[14px]">MW</span></p>
              <p className="text-[11px] text-gray-500 mt-1">Contracted capacity</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e0e8e4] border-t-[3px] border-t-[#f4a261]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">AVAILABLE</span>
              <Award className="w-4 h-4 text-[#f4a261]" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">50 <span className="text-[14px]">MW</span></p>
              <p className="text-[11px] text-gray-500 mt-1">Ready for trading</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e0e8e4] border-t-[3px] border-t-[#1d3557]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">ACTIVE CLIENTS</span>
              <Users className="w-4 h-4 text-[#1d3557]" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">1 <span className="text-[14px]">Client</span></p>
              <p className="text-[11px] text-gray-500 mt-1">Connected consumers</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-sora font-bold text-[16px] text-gray-900">Recent Bids</h3>
                <p className="text-gray-500 text-[12px] mt-0.5">Active market participation</p>
              </div>
              <BarChart2 className="w-5 h-5 text-[#1b4d3e]" />
            </div>
            <div className="space-y-3">
              {bids.slice(0, 3).map((bid, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-[#f0f4f2] last:border-0">
                  <div>
                    <p className="text-[12px] font-semibold text-gray-900">{bid.mw} MW @ ₹{bid.price}/unit</p>
                    <p className="text-[11px] text-gray-500">{bid.marketType} • {bid.timeBlock}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                    bid.status === 'MATCHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>{bid.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-sora font-bold text-[16px] text-gray-900">Connection Requests</h3>
                <p className="text-gray-500 text-[12px] mt-0.5">Pending consumer applications</p>
              </div>
              <Users className="w-5 h-5 text-[#1b4d3e]" />
            </div>
            <div className="space-y-3">
              {requests.slice(0, 3).map((req, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-[#f0f4f2] last:border-0">
                  <div>
                    <p className="text-[12px] font-semibold text-gray-900">{req.consumerName}</p>
                    <p className="text-[11px] text-gray-500">{req.mw} MW • {req.duration}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                    req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                    req.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>{req.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg p-6 border border-[#e0e8e4]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sora font-bold text-[16px] text-gray-900">Dispatch Schedule</h3>
            <span className="text-[12px] text-gray-500">Today's grid assignments</span>
          </div>
          <div className="space-y-3">
            {schedules.slice(0, 5).map((schedule, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-[#e0e8e4] hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-gray-900">{schedule.consumerName}</p>
                  <p className="text-[11px] text-gray-500">{schedule.mw} MW • {schedule.timeBlock}</p>
                </div>
                <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">{schedule.gridStatus}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (normalizedTab === 'capacity-management' || normalizedTab === 'capacity') {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-4 border-b border-[#e0e8e4]">
          <div>
            <h2 className="font-sora text-[22px] font-bold text-gray-900">Capacity Management</h2>
            <p className="text-gray-500 text-[13px] mt-1">Grid dispatch capacity and energy plant parameters</p>
          </div>
          <button 
            onClick={() => setIsAddingCapacity(true)}
            className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>Add New Unit</span>
          </button>
        </div>

        {/* Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e0e8e4] border-t-[3px] border-t-[#2d6a4f]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL CAPACITY</span>
              <Zap className="w-4 h-4 text-[#2d6a4f]" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">120 <span className="text-[14px]">MW</span></p>
              <p className="text-[11px] text-gray-500 mt-1">Solar & Wind Plants Pool</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e0e8e4] border-t-[3px] border-t-[#2d6a4f]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">ALLOCATED MW</span>
              <ShieldCheck className="w-4 h-4 text-[#2d6a4f]" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-[#1b4d3e]">70 <span className="text-[14px]">MW</span></p>
              <p className="text-[11px] text-gray-500 mt-1">Contracted via active PPA</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e0e8e4] border-t-[3px] border-t-[#f4a261]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">AVAILABLE MW</span>
              <Award className="w-4 h-4 text-[#f4a261]" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">50 <span className="text-[14px]">MW</span></p>
              <p className="text-[11px] text-gray-500 mt-1">Ready for trades</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e0e8e4] border-t-[3px] border-t-[#1d3557]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">ACTIVE CLIENTS</span>
              <Users className="w-4 h-4 text-[#1d3557]" />
            </div>
            <div>
              <p className="font-sora text-[24px] font-bold text-gray-900">1 <span className="text-[14px]">Client</span></p>
              <p className="text-[11px] text-gray-500 mt-1">Industrial Pool Link</p>
            </div>
          </div>
        </div>

        {isAddingCapacity && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4] max-w-xl">
            <h3 className="font-sora text-[18px] font-bold text-gray-900 mb-6">Add Generation Power Plant</h3>
            <form onSubmit={handleAddCapacity} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Plant Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jodhpur Solar Park..."
                    value={plantName}
                    onChange={(e) => setPlantName(e.target.value)}
                    required
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Renewable Type</label>
                  <select
                    value={plantType}
                    onChange={(e) => setPlantType(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  >
                    <option value="Solar">Solar Power Pool</option>
                    <option value="Wind">Wind Farm Grid</option>
                    <option value="Hydro">Hydro Kinetic Energy</option>
                    <option value="Biomass">Biomass Thermal Core</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Total Capacity (MW)</label>
                  <input
                    type="number"
                    value={totalMw}
                    onChange={(e) => setTotalMw(Number(e.target.value))}
                    min={1}
                    required
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Base Price (₹/unit)</label>
                  <input
                    type="number"
                    value={plantPrice}
                    onChange={(e) => setPlantPrice(Number(e.target.value))}
                    min={0}
                    step="0.1"
                    required
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Injection Point</label>
                  <input
                    type="text"
                    value={plantInjectionPoint}
                    onChange={(e) => setPlantInjectionPoint(e.target.value)}
                    required
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div className="flex items-end space-x-3">
                  <button type="submit" className="flex-1 bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] transition-colors">
                    Save Plant
                  </button>
                  <button type="button" onClick={() => setIsAddingCapacity(false)} className="flex-1 bg-white border border-[#e0e8e4] text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Inline edit form for an existing plant */}
        {editingPlantId && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4] max-w-xl">
            <h3 className="font-sora text-[18px] font-bold text-gray-900 mb-4">Edit Generation Unit</h3>
            <form onSubmit={saveEditPlant} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700">Plant Name</label>
                  <input value={editingPlantData.name} onChange={(e) => setEditingPlantData({ ...editingPlantData, name: e.target.value })} className="form-control" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700">Type</label>
                  <select value={editingPlantData.type} onChange={(e) => setEditingPlantData({ ...editingPlantData, type: e.target.value })} className="form-control">
                    <option>Solar</option>
                    <option>Wind</option>
                    <option>Hydro</option>
                    <option>Biomass</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700">Total Capacity (MW)</label>
                  <input type="number" value={editingPlantData.total} onChange={(e) => setEditingPlantData({ ...editingPlantData, total: Number(e.target.value) })} className="form-control" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700">Available Capacity (MW)</label>
                  <input type="number" value={editingPlantData.available} onChange={(e) => setEditingPlantData({ ...editingPlantData, available: Number(e.target.value) })} className="form-control" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700">Base Price (₹/unit)</label>
                  <input type="number" step="0.1" value={editingPlantData.price} onChange={(e) => setEditingPlantData({ ...editingPlantData, price: Number(e.target.value) })} className="form-control" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700">Injection Point</label>
                  <input type="text" value={editingPlantData.injectionPoint} onChange={(e) => setEditingPlantData({ ...editingPlantData, injectionPoint: e.target.value })} className="form-control" />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button type="submit" className="btn-green px-4 py-2">Save</button>
                <button type="button" onClick={cancelEditPlant} className="btn-outline px-4 py-2">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Plant Name</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Type</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Total Capacity</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Available Capacity</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Base Price</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Injection Point</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Delivered Price</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Grid Node Status</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {capacityList.map((c, i) => (
                <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">{c.type}</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-700">{c.total} MW</td>
                  <td className="py-3.5 px-5 font-bold text-gray-900">{c.available} MW</td>
                  <td className="py-3.5 px-5 text-[#1b4d3e] font-semibold">₹{c.price?.toFixed(2)}</td>
                  <td className="py-3.5 px-5 text-gray-600">{c.injectionPoint}</td>
                  <td className="py-3.5 px-5 text-[#1b4d3e] font-bold">₹{estimateDeliveredPrice(c)}</td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">{c.status}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button onClick={() => startEditPlant(c)} className="px-3 py-1 rounded-md bg-white border border-[#e0e8e4] text-gray-700 text-[12px] font-semibold hover:bg-gray-50">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (normalizedTab === 'contracts') {
    return (
      <div className="space-y-8">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Connection Requests & Contracts</h2>
          <p className="text-gray-500 text-[13px] mt-1">Audit consumer open access registration applications</p>
        </div>

        <div className="bg-white rounded-lg border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Consumer</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Capacity (MW)</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Offered Price</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Injection Point</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Duration</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Submitted</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Status</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {requests.map((r, i) => (
                <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{r.consumerName}</td>
                  <td className="py-3.5 px-5 text-gray-700 font-bold">{r.mw} MW</td>
                  <td className="py-3.5 px-5 font-bold text-[#1b4d3e]">
                    {r.requestedPrice ? `₹${Number(r.requestedPrice).toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3.5 px-5 text-gray-600">{r.duration}</td>
                  <td className="py-3.5 px-5 text-gray-600 text-[12px]">{r.injectionPoint || r.deliveryPoint || '—'}</td>
                  <td className="py-3.5 px-5 text-gray-500 text-[12px]">{r.requestDate || r.createdAt?.split('T')[0] || '—'}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                      r.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                      r.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right space-x-2 flex justify-end">
                    <button
                      onClick={() => viewConsumerProfile(r.consumerId)}
                      className="px-4 py-1.5 rounded-md bg-white border border-[#e0e8e4] text-gray-600 text-[12px] font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      View Profile
                    </button>
                    {r.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleRequestAction(r.id, 'APPROVED')}
                          className="px-4 py-1.5 rounded-md bg-[#1b4d3e] text-white text-[12px] font-bold hover:bg-[#2d6a4f] transition-colors shadow-sm"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleRequestAction(r.id, 'REJECTED')}
                          className="px-4 py-1.5 rounded-md bg-white border border-[#e0e8e4] text-gray-600 text-[12px] font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
        {consumerProfile && (
          <div className="bg-white rounded-lg border border-[#e0e8e4] p-6 mt-6">
            <h3 className="font-sora text-[18px] font-bold text-gray-900 mb-4">Consumer Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">Name</p>
                <p>{consumerProfile.name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Email</p>
                <p>{consumerProfile.email || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">State</p>
                <p>{consumerProfile.state || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Drawal Point</p>
                <p>{consumerProfile.drawalPoint || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">OA Status</p>
                <p>{consumerProfile.oaStatus || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (normalizedTab === 'consumer-marketplace') {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4] lg:col-span-2">
            <h3 className="font-sora text-[18px] font-bold text-gray-900 mb-6">DAM / RTM Market Bid Submission</h3>
            <form onSubmit={handleBiddingSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Available Capacity (MW)</label>
                  <input
                    type="number"
                    value={bidMw}
                    onChange={(e) => setBidMw(Number(e.target.value))}
                    min={1}
                    required
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Offer Price (₹/UNIT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bidPrice}
                    onChange={(e) => setBidPrice(Number(e.target.value))}
                    min={0.1}
                    required
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Time Block</label>
                  <select
                    value={bidBlock}
                    onChange={(e) => setBidBlock(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  >
                    <option value="10:00-11:00">Block 10:00-11:00</option>
                    <option value="11:00-12:00">Block 11:00-12:00</option>
                    <option value="12:00-13:00">Block 12:00-13:00</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Market Type</label>
                  <select
                    value={bidMarket}
                    onChange={(e) => setBidMarket(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  >
                    <option value="G-DAM">Green Day-Ahead (G-DAM)</option>
                    <option value="DAM">Day-Ahead (DAM)</option>
                    <option value="RTM">Real-Time (RTM)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="bg-[#2d6a4f] text-white px-5 py-3 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] transition-colors w-full flex items-center justify-center">
                <Plus className="w-4 h-4 mr-2" />
                <span>Transmit Bidding Quantity</span>
              </button>
            </form>

            {bidSubmitted && (
              <div className="mt-6 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-[13px] flex items-center">
                <span className="mr-2">✅</span>
                <span>Bidding request logged successfully!</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4] flex flex-col justify-between">
            <div>
              <h3 className="font-sora font-bold text-[16px] text-gray-900 mb-2">Market Clearing Rules</h3>
              <p className="text-gray-500 text-[13px]">National Green Day-Ahead auction rules</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-[#b5d4f4] mt-6 text-[12px] text-[#1d3557] leading-relaxed">
              * Active bids will be dynamically cleared against consumer requirements by the NLDC System Engine.
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-sora text-[18px] font-bold text-gray-900">Active Orders Registry</h3>
          <div className="bg-white rounded-lg border border-[#e0e8e4] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Order Reference</th>
                  <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Capacity</th>
                  <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Bid Price</th>
                  <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Market Type</th>
                  <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Time Block</th>
                  <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Match Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                {bids.map((b, i) => (
                  <tr key={b.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                    <td className="py-3.5 px-5 text-gray-600 font-bold uppercase text-[11px]">{b.id}</td>
                    <td className="py-3.5 px-5 font-bold text-gray-900">{b.mw} MW</td>
                    <td className="py-3.5 px-5 text-[#1b4d3e] font-bold">₹{b.price}</td>
                    <td className="py-3.5 px-5 text-gray-600">{b.marketType}</td>
                    <td className="py-3.5 px-5 text-gray-600">{b.timeBlock}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                        b.status === 'MATCHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
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
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Schedules Log</h2>
          <p className="text-gray-500 text-[13px] mt-1">National Open Access Registry (NOAR) dispatch approvals</p>
        </div>

        <div className="bg-white rounded-lg border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Schedule ID</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Consumer</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Capacity</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Time Block</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Grid Dispatch Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {schedules.map((s, i) => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 text-gray-600 font-bold uppercase text-[11px]">{s.id}</td>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{s.consumerName}</td>
                  <td className="py-3.5 px-5 font-bold text-[#1b4d3e]">{s.mw} MW</td>
                  <td className="py-3.5 px-5 text-gray-600">{s.timeBlock}</td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">
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

  if (normalizedTab === 'revenue') {
    return (
      <div className="space-y-8">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Revenue & Settlement Ledger</h2>
          <p className="text-gray-500 text-[13px] mt-1">Audit grid production wire clearings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4] lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-sora font-bold text-[16px] text-gray-900">Grid Production ledger</h3>
                <p className="text-gray-500 text-[12px] mt-0.5">Energy generated (MWh) by solar park vs wind farms daily</p>
              </div>
              <BarChart2 className="w-5 h-5 text-[#1b4d3e]" />
            </div>

            <div className="relative h-64 flex items-end justify-between px-2 pt-6">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-12 pt-6">
                <div className="border-t border-dashed border-[#e0e8e4] w-full flex justify-between text-[10px] text-gray-400">
                  <span>120 MWh</span>
                </div>
                <div className="border-t border-dashed border-[#e0e8e4] w-full flex justify-between text-[10px] text-gray-400">
                  <span>90 MWh</span>
                </div>
                <div className="border-t border-dashed border-[#e0e8e4] w-full flex justify-between text-[10px] text-gray-400">
                  <span>60 MWh</span>
                </div>
                <div className="border-t border-dashed border-[#e0e8e4] w-full flex justify-between text-[10px] text-gray-400">
                  <span>30 MWh</span>
                </div>
              </div>

              {[60, 75, 92, 105, 115, 110, 95, 80, 85, 90, 100, 105].map((val, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 mx-1.5 z-10 group relative">
                  <div className="absolute -top-8 scale-0 group-hover:scale-100 transition-all bg-gray-900 px-2 py-1 rounded-md text-[10px] text-white whitespace-nowrap z-30 shadow-md">
                    {val} MWh
                  </div>
                  <div className="w-full bg-[#2d6a4f] rounded-t-sm transition-all opacity-80 group-hover:opacity-100" style={{ height: `${val * 1.5}px` }}></div>
                  <span className="text-[10px] text-gray-500 mt-2">D-{12-idx}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Billing Month</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Total Matched Energy</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Avg Rate</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Total Earned</th>
                <th className="bg-[#1b4d3e] text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {revenueLedger.map((rev, i) => (
                <tr key={rev.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{rev.month}</td>
                  <td className="py-3.5 px-5 text-gray-700">{rev.totalMwh.toLocaleString()} MWh</td>
                  <td className="py-3.5 px-5 font-bold text-gray-900">₹{rev.rate}</td>
                  <td className="py-3.5 px-5 font-bold text-[#1b4d3e] text-[14px]">₹{rev.earned.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                      rev.status === 'SETTLED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rev.status}
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

  if (normalizedTab === 'documents') {
    return (
      <div className="space-y-8">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Regulatory Documents</h2>
          <p className="text-gray-500 text-[13px] mt-1">Upload PPA, Bank Guarantees or certification PDFs/images for verification</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-[#e0e8e4] max-w-2xl">
          <h3 className="font-bold text-gray-900 text-[16px] mb-3">Upload Document</h3>
          <form onSubmit={handleUploadFile} className="space-y-3">
            <div>
              <label className="text-[12px] font-semibold text-gray-700">Choose file</label>
              <input type="file" accept=".pdf,image/png,image/jpeg" onChange={handleFileSelect} className="mt-2" />
              <p className="text-[12px] text-gray-500 mt-1">Max size: 5 MB. Allowed: PDF, JPG, PNG</p>
              {uploadError && <div className="text-sm text-red-600 mt-2">{uploadError}</div>}
              {selectedFile && (
                <div className="mt-3 flex items-center space-x-3">
                  <div className="text-[13px] font-medium">{selectedFile.name}</div>
                  <div className="text-[12px] text-gray-500">{(selectedFile.size / 1024).toFixed(0)} KB</div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button disabled={!selectedFile} type="submit" className="btn-green px-4 py-2">Upload</button>
              <button type="button" onClick={() => { setSelectedFile(null); setUploadError(null); }} className="btn-outline px-4 py-2">Clear</button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg border border-[#e0e8e4] overflow-hidden">
          <div className="p-5 border-b border-[#f0f4f2]">
            <h3 className="font-sora text-[16px] font-bold text-gray-900">Uploaded Documents</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Document Name</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Size</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Uploaded On</th>
                <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {uploadedDocs.length === 0 && (
                <tr><td colSpan={4} className="py-6 px-5 text-center text-gray-500">No documents uploaded yet</td></tr>
              )}
              {uploadedDocs.map((doc, i) => (
                <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">📄</div>
                    {doc.name}
                  </td>
                  <td className="py-3.5 px-5 text-gray-600">{(doc.size / 1024).toFixed(0)} KB</td>
                  <td className="py-3.5 px-5 text-gray-500">{doc.date}</td>
                  <td className="py-3.5 px-5">
                    {doc.status === 'VERIFIED' ? (
                      <div className="flex items-center text-green-700 space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold">Verified</span>
                      </div>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-amber text-amber-800">{doc.status}</span>
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

  if (normalizedTab === 'profile') {
    return (
      <div className="space-y-8">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Supplier Profile</h2>
          <p className="text-gray-500 text-[13px] mt-1">Manage company details, grid licenses, and preferences</p>
        </div>

        {/* Company Info Card */}
        <div className="bg-white rounded-lg border border-[#e0e8e4] p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#1b4d3e] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {(profile?.name || user?.name || companyName)?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h3 className="font-sora text-[18px] font-bold text-gray-900">{profile?.name || user?.name || companyName}</h3>
                <p className="text-[13px] text-gray-500">{profile?.email || user?.email || 'company@example.com'}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="bg-white border border-[#e0e8e4] text-gray-700 px-3 py-2 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition-colors flex items-center space-x-1.5"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>

          {!isEditingProfile ? (
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-500">Registered State</span>
                <span className="font-semibold text-gray-900">{profile?.state || user?.state || registeredState}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-500">Renewable Mix</span>
                <span className="font-semibold text-gray-900">{profile?.renewableType || plantType || 'Solar'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-500">Injection Point</span>
                <span className="font-semibold text-gray-900">{profile?.injectionPoint || gridNode}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Account Status</span>
                <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${user?.status === 'VERIFIED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{user?.status || 'PENDING'}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setIsEditingProfile(false); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Registration Number</label>
                  <input
                    type="text"
                    value={registrationNo}
                    onChange={(e) => setRegistrationNo(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Registered State</label>
                  <select value={registeredState} onChange={(e) => setRegisteredState(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]">
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Total Capacity (MW)</label>
                  <input
                    type="number"
                    value={totalCapacity}
                    onChange={(e) => setTotalCapacity(Number(e.target.value))}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] transition-colors flex-1 flex items-center justify-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="bg-white border border-[#e0e8e4] text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors flex-1 flex items-center justify-center space-x-2">
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Contact Information Card */}
        <div className="bg-white rounded-lg border border-[#e0e8e4] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-[#1b4d3e]" />
              <h3 className="font-sora text-[18px] font-bold text-gray-900">Contact Information</h3>
            </div>
            <button 
              onClick={() => setIsEditingContact(true)}
              className="bg-white border border-[#e0e8e4] text-gray-700 px-3 py-2 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition-colors flex items-center space-x-1.5"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>

          {!isEditingContact ? (
            <div className="space-y-3 text-[13px]">
              <div className="flex items-start space-x-3 py-2 border-b border-[#f0f4f2]">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-500 text-[12px]">Phone</p>
                  <p className="font-semibold text-gray-900">{phone}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 py-2 border-b border-[#f0f4f2]">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-500 text-[12px]">Email</p>
                  <p className="font-semibold text-gray-900">{email}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 py-2 border-b border-[#f0f4f2]">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-500 text-[12px]">Address</p>
                  <p className="font-semibold text-gray-900">{address}</p>
                </div>
              </div>
              <div className="space-y-2 py-2">
                <p className="text-gray-500 text-[12px]">Contact Person</p>
                <p className="font-semibold text-gray-900">{contactPerson}</p>
                <p className="text-gray-600 text-[12px]">{contactDesignation}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setIsEditingContact(false); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Contact Person Name</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Designation</label>
                  <input
                    type="text"
                    value={contactDesignation}
                    onChange={(e) => setContactDesignation(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] transition-colors flex-1 flex items-center justify-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button type="button" onClick={() => setIsEditingContact(false)} className="bg-white border border-[#e0e8e4] text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors flex-1 flex items-center justify-center space-x-2">
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Grid Connectivity Card */}
        <div className="bg-white rounded-lg border border-[#e0e8e4] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-[#1b4d3e]" />
              <h3 className="font-sora text-[18px] font-bold text-gray-900">Grid Connectivity</h3>
            </div>
            <button 
              onClick={() => setIsEditingGrid(true)}
              className="bg-white border border-[#e0e8e4] text-gray-700 px-3 py-2 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition-colors flex items-center space-x-1.5"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>

          {!isEditingGrid ? (
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-500">Grid Connection Node</span>
                <span className="font-semibold text-gray-900">{gridNode}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-500">Injection Point</span>
                <span className="font-semibold text-gray-900">{injectionPoint}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-500">Grid License Number</span>
                <span className="font-semibold text-gray-900">{gridLicenseNo}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Connection Status</span>
                <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">{gridStatus}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setIsEditingGrid(false); }} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Grid Connection Node</label>
                <input
                  type="text"
                  value={gridNode}
                  onChange={(e) => setGridNode(e.target.value)}
                  className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Injection Point</label>
                <input
                  type="text"
                  value={injectionPoint}
                  onChange={(e) => setInjectionPoint(e.target.value)}
                  className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Grid License Number</label>
                  <input
                    type="text"
                    value={gridLicenseNo}
                    onChange={(e) => setGridLicenseNo(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Connection Status</label>
                  <select value={gridStatus} onChange={(e) => setGridStatus(e.target.value)} className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] transition-colors flex-1 flex items-center justify-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button type="button" onClick={() => setIsEditingGrid(false)} className="bg-white border border-[#e0e8e4] text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors flex-1 flex items-center justify-center space-x-2">
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bank Details Card */}
        <div className="bg-white rounded-lg border border-[#e0e8e4] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-[#1b4d3e]" />
              <h3 className="font-sora text-[18px] font-bold text-gray-900">Bank Settlement Details</h3>
            </div>
            <button 
              onClick={() => setIsEditingBank(true)}
              className="bg-white border border-[#e0e8e4] text-gray-700 px-3 py-2 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition-colors flex items-center space-x-1.5"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>

          {!isEditingBank ? (
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-500">Bank Name</span>
                <span className="font-semibold text-gray-900">{bankName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-500">Account Holder</span>
                <span className="font-semibold text-gray-900">{accountHolder}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-500">Account Number</span>
                <span className="font-semibold text-gray-900">••••••••{bankAccount.slice(-4)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-500">IFSC Code</span>
                <span className="font-semibold text-gray-900">{ifscCode}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Settlement Status</span>
                <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">{settlementStatus}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setIsEditingBank(false); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Account Holder Name</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">Account Number</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="border border-[#e0e8e4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#1b4d3e] transition-colors flex-1 flex items-center justify-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button type="button" onClick={() => setIsEditingBank(false)} className="bg-white border border-[#e0e8e4] text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors flex-1 flex items-center justify-center space-x-2">
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Settings Card */}
        <div className="bg-white rounded-lg border border-[#e0e8e4] p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Lock className="w-5 h-5 text-[#1b4d3e]" />
            <h3 className="font-sora text-[18px] font-bold text-gray-900">Account Security</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-[#e0e8e4]">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-[#1b4d3e]" />
                <span className="text-[13px] text-gray-900 font-medium">Two-Factor Authentication</span>
              </div>
              <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">ENABLED</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-[#e0e8e4]">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-[#1b4d3e]" />
                <span className="text-[13px] text-gray-900 font-medium">Email Verification</span>
              </div>
              <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">VERIFIED</span>
            </div>
            <button className="w-full bg-white border border-[#e0e8e4] text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 mt-4">
              <Lock className="w-4 h-4" />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SupplierDashboard;
