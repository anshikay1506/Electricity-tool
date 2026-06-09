import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Zap, ShieldAlert, Award, Clock,
  Search, ArrowRight, Upload, DollarSign, BarChart2, Settings,
  FileText, CheckCircle, ChevronRight, ClipboardList, AlertCircle, X, Eye, Save, Download,
  Building, Phone, MapPin, ArrowLeft
} from 'lucide-react';

import { SupplierDetailContent } from '../consumers/SupplierDetailContent';

interface DraftApplication {
  id: string;
  supplierId: string;
  supplierName: string;
  mw: number;
  duration: number;
  startDate: string;
  price: number;
  timeBlocks: string;
  deliveryState: string;
  notes: string;
  contactMobile: string;
  legalIdentifier: string;
  discomConsumerNo: string;
  savedAt: string;
}

interface ConsumerDashboardProps {
  activeTab: string;
  setTab: (tab: string) => void;
  onNavigateToHome?: () => void;
  onOpenSupplierDetail?: (supplierId: string) => void;
}

interface GeoaDocField {
  key: string;
  label: string;
  required: boolean;
  fileName: string;
  status: 'pending' | 'uploaded';
}

interface GeoaApplication {
  id: string;
  refNo: string;
  applicantName: string;
  entityType: string;
  loadMw: number;
  injectionPoint: string;
  drawalPoint: string;
  scheduleType: string;
  startDate: string;
  durationDays: number;
  voltageLevel: string;
  state: string;
  submittedOn: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'NOC_ISSUED' | 'APPROVED' | 'REJECTED';
  docs: GeoaDocField[];
}

const GEOA_DRAFT_KEY = 'geoa_form_draft';

export const ConsumerDashboard: React.FC<ConsumerDashboardProps> = ({ activeTab, setTab, onNavigateToHome, onOpenSupplierDetail }) => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [schedules] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<DraftApplication[]>([]);

  // Consumer workflow state
  const [consumerName, setConsumerName] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierDetails, setSupplierDetails] = useState<any | null>(null);
  const [requestMw, setRequestMw] = useState(10);
  const [requestDuration, setRequestDuration] = useState(365);
  const [requestStartDate, setRequestStartDate] = useState('2026-06-01');
  const [requestScheduleType, setRequestScheduleType] = useState('RTC');
  const [requestTimeBlocks, setRequestTimeBlocks] = useState('10:00-18:00');
  const [requestDeliveryState, setRequestDeliveryState] = useState('Rajasthan');
  const [requestNotes, setRequestNotes] = useState('');
  const [openContractWarning, setOpenContractWarning] = useState('');
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [requestedPrice, setRequestedPrice] = useState(4.5);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [contactMobile, setContactMobile] = useState('');
  const [legalIdentifier, setLegalIdentifier] = useState('');
  const [discomConsumerNo, setDiscomConsumerNo] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    mobile?: string; legalIdentifier?: string; discomConsumerNo?: string;
  }>({});

  const [selectedSupplierForModal, setSelectedSupplierForModal] = useState<any>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const [consumerView, setConsumerView] = useState<'marketplace' | 'supplier-detail'>('marketplace');
  const [viewingSupplierId, setViewingSupplierId] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [renewableTypeFilter, setRenewableTypeFilter] = useState('All');

  // Payment flow
  const [isPaying, setIsPaying] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payRef, setPayRef] = useState('');
  const [billingList] = useState([
    { id: 'bill-1', supplier: 'SolarGen Corp', month: 'April 2026', amount: 450000, status: 'PAID' },
    { id: 'bill-2', supplier: 'SolarGen Corp', month: 'May 2026', amount: 380000, status: 'UNPAID' }
  ]);

  // Documents
  const [uploadedDocs, setUploadedDocs] = useState([
    { id: 'doc-1', name: 'PPA Agreement', category: 'PPA', status: 'VERIFIED', date: '2026-05-10' },
    { id: 'doc-2', name: 'Open Access application.pdf', category: 'OA_APP', status: 'VERIFIED', date: '2026-05-11' },
    { id: 'doc-3', name: 'Bank Guarantee Security.pdf', category: 'BG', status: 'PENDING', date: '2026-05-18' }
  ]);
  const [docName, setDocName] = useState('');
  const [docCat, setDocCat] = useState('PPA');

  // GEOA state
  const [docView, setDocView] = useState<'landing' | 'geoa-form' | 'doc-upload'>('landing');
  const [geoaStep, setGeoaStep] = useState(1);
  const [geoaDraftSaved, setGeoaDraftSaved] = useState(false);
  const [geoaApplications, setGeoaApplications] = useState<GeoaApplication[]>([]);
  const [geoaSubmitSuccess, setGeoaSubmitSuccess] = useState(false);

  // GEOA form fields
  const [geoaApplicantName, setGeoaApplicantName] = useState('');
  const [geoaEntityType, setGeoaEntityType] = useState('Industrial');
  const [geoaCin, setGeoaCin] = useState('');
  const [geoaAddress, setGeoaAddress] = useState('');
  const [geoaState, setGeoaState] = useState('Rajasthan');
  const [geoaDiscom, setGeoaDiscom] = useState('JVVNL');
  const [geoaConsumerNo, setGeoaConsumerNo] = useState('');
  const [geoaContactPerson, setGeoaContactPerson] = useState('');
  const [geoaEmail, setGeoaEmail] = useState('');
  const [geoaMobile, setGeoaMobile] = useState('');
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [geoaLoadMw, setGeoaLoadMw] = useState(10);
  const [geoaSelectedSupplierId, setGeoaSelectedSupplierId] = useState('');
  const [geoaInjectionPoint, setGeoaInjectionPoint] = useState('');
  const [geoaDrawalPoint, setGeoaDrawalPoint] = useState('400kV Jajpur Substation');
  const [geoaScheduleType, setGeoaScheduleType] = useState('RTC');
  const [geoaDurationDays, setGeoaDurationDays] = useState(365);
  const [geoaStartDate, setGeoaStartDate] = useState('2026-06-01');
  const [geoaTimeBlocks, setGeoaTimeBlocks] = useState('10:00-18:00');
  const [geoaVoltageLevel, setGeoaVoltageLevel] = useState('33kV');
  const [geoaRenewableType, setGeoaRenewableType] = useState('Solar');
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});
  const [geoaDocs, setGeoaDocs] = useState<GeoaDocField[]>([]);

  // Bid states
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedBidSupplier, setSelectedBidSupplier] = useState<any>(null);
  const [bidMw, setBidMw] = useState(10);
  const [bidPrice, setBidPrice] = useState(4.5);
  const [bidDuration, setBidDuration] = useState(12);
  const [bidMessage, setBidMessage] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [consumerBids, setConsumerBids] = useState<any[]>([]);

  // Other states
  const [selectedSupplierPlants, setSelectedSupplierPlants] = useState<any[]>([]);
  const [showSupplierPlantsModal, setShowSupplierPlantsModal] = useState(false);

  const GEOA_STEPS = [
    { num: 1, label: 'Applicant Details' },
    { num: 2, label: 'Technical Details' },
    { num: 3, label: 'Review & Submit' },
  ];

  const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';
  const currentSupplier = suppliers.find((item) => item.id === selectedSupplierId) || null;

  // Helper functions
  const goBackToMarketplace = () => {
    setConsumerView('marketplace');
    setViewingSupplierId(null);
  };

  const calculateOaCharges = (supplier: any) => {
    const consumerState = profile?.state || 'Rajasthan';
    const sameStateFactor = supplier.state === consumerState ? 0.9 : 1.2;
    const distanceFactor = supplier.state === 'Rajasthan' && consumerState === 'Maharashtra' ? 1.15 : 1.0;
    const statusFactor = supplier.status !== 'VERIFIED' ? 1.25 : 1.0;
    const baseOa = supplier.state === consumerState ? 0.6 : 0.85;
    return Number((baseOa * sameStateFactor * distanceFactor * statusFactor).toFixed(2));
  };

  const getFinalDeliveredPrice = (supplier: any) => {
    if (!supplier) return 0;
    return Number((supplier.price + calculateOaCharges(supplier)).toFixed(2));
  };

  const mapBackendApplication = (app: any) => {
    const statusLabel = app.approvalStatus || 'SUBMITTED';
    const contractStatus = statusLabel === 'APPROVED' ? 'Active Contract'
      : statusLabel === 'REJECTED' ? 'Rejected'
      : statusLabel === 'SUBMITTED' ? 'Supplier Review' : statusLabel;
    return {
      ...app,
      requestedMw: app.mw || 0,
      duration: `${app.durationDays || 0} Days`,
      basePrice: app.basePrice ?? 4.2,
      oaCharges: app.oaCharges ?? 1.1,
      finalPrice: app.finalPrice ?? 5.3,
      requestedPrice: app.requestedPrice || 0,
      requestStatus: app.approvalStatus || statusLabel,
      contractStatus: app.contractStatus || contractStatus,
      requestDate: app.requestDate || app.createdAt?.split('T')[0] || '',
      supplierName: app.supplierName || 'Supplier',
      supplierState: app.supplierState || app.state || '',
      deliveryState: app.deliveryState || app.drawalPoint || '',
      approvalTimeline: app.approvalTimeline || [{ stage: 'Consumer Request Submitted', status: 'Completed', date: app.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0] }],
      digitalAgreement: app.digitalAgreement || 'Pending'
    };
  };

  const loadApplications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/applications`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setApplications(data.map(mapBackendApplication));
    } catch { }
  };

  const refreshApplications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/applications`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setApplications(data.map(mapBackendApplication));
    } catch { }
  };

  const openSupplierProfile = (supplierId: string) => { setSelectedSupplierId(supplierId); setTab('supplier-profile'); };

  const submitContractRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    const errors: { mobile?: string; legalIdentifier?: string; discomConsumerNo?: string } = {};
    if (contactMobile && !/^\d{10}$/.test(contactMobile)) errors.mobile = 'Mobile must be exactly 10 digits (numbers only)';
    if (legalIdentifier && !/^[A-Za-z0-9]{10}$/.test(legalIdentifier)) errors.legalIdentifier = 'Must be exactly 10 alphanumeric characters';
    if (discomConsumerNo && !/^\d{10}$/.test(discomConsumerNo)) errors.discomConsumerNo = 'Must be exactly 10 digits (numbers only)';
    if (Object.keys(errors).length > 0) { setValidationErrors(errors); return; }
    if (!currentSupplier) { setOpenContractWarning('Select a supplier to proceed.'); return; }
    (async () => {
      try {
        const body = {
          supplierId: currentSupplier.id, mw: requestMw,
          injectionPoint: currentSupplier.injectionPoint || requestDeliveryState,
          drawalPoint: requestDeliveryState || '400kV Jajpur Substation',
          durationDays: requestDuration, requestedPrice, consumerName: consumerName || profile?.name || 'Consumer',
          contactMobile: contactMobile || undefined, legalIdentifier: legalIdentifier || undefined,
          discomConsumerNo: discomConsumerNo || undefined, state: profile?.state || 'Rajasthan', discom: 'JVVNL',
          scheduleType: requestScheduleType, proposedStartDate: requestStartDate, timeBlocks: requestTimeBlocks
        };
        const res = await fetch(`${API_BASE}/api/applications`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        });
        if (!res.ok) { const err = await res.json(); setOpenContractWarning(err.error || 'Unable to send request.'); return; }
        const data = await res.json();
        const newApp = mapBackendApplication({ ...data.application, supplierName: currentSupplier.name, supplierState: currentSupplier.state, basePrice: currentSupplier.price, oaCharges: calculateOaCharges(currentSupplier), finalPrice: getFinalDeliveredPrice(currentSupplier), duration: `${requestDuration} Days` });
        setApplications([newApp, ...applications]);
        setIsRequestFormOpen(false); setTab('my-applications'); loadApplications();
        setContactMobile(''); setLegalIdentifier(''); setDiscomConsumerNo(''); setValidationErrors({});
      } catch { setOpenContractWarning('Unable to send request to supplier.'); }
    })();
  };

  const handleDocUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;
    setUploadedDocs(prev => [{ id: `doc-${Date.now()}`, name: docName, category: docCat, status: 'PENDING', date: new Date().toISOString().split('T')[0] }, ...prev]);
    setDocName(''); setDocCat('PPA');
  };

  const handlePayBill = (bill: any) => { setPayAmount(bill.amount); setPayRef(`TRX${Date.now()}`); setIsPaying(true); };
  const submitPayment = () => {
    setPayments(prev => [{ id: `pay-${Date.now()}`, reference: payRef, createdAt: new Date().toISOString().split('T')[0], amount: payAmount, status: 'COMPLETED' }, ...prev]);
    setIsPaying(false); setPayAmount(0); setPayRef('');
  };

  const loadConsumerBids = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/bids/consumer/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setConsumerBids(data);
    } catch (error) {
      console.error('Error loading bids:', error);
    }
  };

  const submitBidRequest = async () => {
    if (!token || !selectedBidSupplier) return;
    
    setIsSubmittingBid(true);
    try {
      const response = await fetch(`${API_BASE}/api/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          supplierId: selectedBidSupplier.id,
          supplierName: selectedBidSupplier.name,
          mw: bidMw,
          price: bidPrice,
          duration: bidDuration,
          message: bidMessage,
          consumerName: profile?.name || 'Consumer',
          consumerId: user?.id,
          status: 'PENDING'
        })
      });
      
      if (!response.ok) throw new Error('Failed to submit bid');
      
      const data = await response.json();
      setConsumerBids([data.bid, ...consumerBids]);
      setShowBidModal(false);
      setSelectedBidSupplier(null);
      setBidMw(10);
      setBidPrice(4.5);
      setBidDuration(12);
      setBidMessage('');
      alert('Bid request sent directly to supplier successfully!');
      loadConsumerBids();
    } catch (error) {
      console.error('Error submitting bid:', error);
      alert('Failed to submit bid. Please try again.');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const fetchSupplierDetails = async (supplierId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/suppliers/${supplierId}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setSelectedSupplierForModal(data);
      setShowSupplierModal(true);
    } catch (error) {
      console.error('Error fetching supplier details:', error);
    }
  };

  const SupplierDetailsModal = () => {
    if (!showSupplierModal || !selectedSupplierForModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSupplierModal(false)}>
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-dark rounded-full flex items-center justify-center text-white font-bold">
                {selectedSupplierForModal.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h3 className="font-sora text-xl font-bold text-gray-900">{selectedSupplierForModal.name}</h3>
                <p className="text-[13px] text-gray-500">Supplier Profile</p>
              </div>
            </div>
            <button onClick={() => setShowSupplierModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-green-dark" />
                Company Information
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-[11px] text-gray-400">Registered State</p>
                  <p className="font-semibold">{selectedSupplierForModal.state || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Registration No.</p>
                  <p className="font-semibold">{selectedSupplierForModal.registrationNo || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400">Address</p>
                  <p className="text-gray-700">{selectedSupplierForModal.address || '—'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-dark" />
                Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-[11px] text-gray-400">Contact Person</p>
                  <p className="font-semibold">{selectedSupplierForModal.contactPerson || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Email</p>
                  <p className="text-gray-700">{selectedSupplierForModal.email || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Phone</p>
                  <p className="text-gray-700">{selectedSupplierForModal.phone || '—'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-dark" />
                Capacity & Pricing
              </h4>
              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-[11px] text-gray-400">Total Capacity</p>
                  <p className="font-bold text-xl text-green-dark">{selectedSupplierForModal.totalCapacity || selectedSupplierForModal.generationCapacity || '—'} MW</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Base Price</p>
                  <p className="font-bold text-xl">₹{Number(selectedSupplierForModal.price || 4.2).toFixed(2)}/unit</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Injection Point</p>
                  <p className="text-gray-700 text-sm">{selectedSupplierForModal.injectionPoint || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredSuppliers = suppliers.filter((s: any) => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.state?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = renewableTypeFilter === 'All' || s.renewableType === renewableTypeFilter;
    const isApproved = s.status === 'VERIFIED' || s.oaStatus === 'APPROVED';
    return matchesSearch && matchesType && isApproved;
  }).map((s: any) => ({
    ...s,
    discom: s.discom || s.profile?.discom || 'Not Specified',
    totalCapacity: s.totalCapacity || s.generationCapacity || s.capacity || 0,
    availableCapacity: s.availableCapacity || s.available || s.totalCapacity || 0
  }));

  // Load data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        setProfile(await res.json());
      } catch { }
    };
    const loadSuppliers = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/suppliers`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setSuppliers(data || []);
      } catch { setSuppliers([]); }
    };
    loadProfile(); loadSuppliers(); loadApplications();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'my-applications') refreshApplications();
  }, [activeTab]);

  const step1Valid = !!(geoaApplicantName && geoaContactPerson && geoaEmail && /^\d{10}$/.test(geoaMobile) && geoaCin && geoaConsumerNo && geoaAddress);
  const step2Valid = !!(geoaSelectedSupplierId && geoaLoadMw >= 1 && geoaDrawalPoint && geoaDurationDays >= 30 && geoaStartDate);

  const geoaStatusBadge = (status: GeoaApplication['status']) => {
    const map: Record<string, string> = {
      SUBMITTED: 'badge-blue', UNDER_REVIEW: 'badge-amber',
      NOC_ISSUED: 'badge-amber', APPROVED: 'badge-green', REJECTED: 'badge-red'
    };
    return map[status] || 'badge-amber';
  };

  const resetGeoaForm = () => {
    setGeoaStep(1); setGeoaSubmitSuccess(false);
    setGeoaDocs(prev => prev.map(d => ({ ...d, fileName: '', status: 'pending' })));
    setGeoaCin(''); setGeoaAddress(''); setGeoaConsumerNo('');
    setGeoaContactPerson(''); setGeoaMobile(''); setGeoaSelectedSupplierId('');
    setGeoaInjectionPoint(''); setStep1Errors({}); setStep2Errors({});
    localStorage.removeItem(GEOA_DRAFT_KEY);
  };

  const saveGeoaDraft = () => {
    const draft = {
      geoaApplicantName, geoaEntityType, geoaCin, geoaAddress, geoaState,
      geoaDiscom, geoaConsumerNo, geoaContactPerson, geoaEmail, geoaMobile,
      geoaLoadMw, geoaSelectedSupplierId, geoaInjectionPoint, geoaDrawalPoint,
      geoaScheduleType, geoaDurationDays, geoaStartDate, geoaTimeBlocks,
      geoaVoltageLevel, geoaRenewableType, savedAt: new Date().toISOString()
    };
    localStorage.setItem(GEOA_DRAFT_KEY, JSON.stringify(draft));
    setGeoaDraftSaved(true);
    setTimeout(() => setGeoaDraftSaved(false), 2500);
  };

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!geoaApplicantName.trim()) errs.applicantName = 'Company name is required';
    if (!geoaContactPerson.trim()) errs.contactPerson = 'Contact person is required';
    if (!geoaEmail.trim()) errs.email = 'Email is required';
    if (!geoaMobile.trim()) {
      errs.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(geoaMobile.trim())) {
      errs.mobile = 'Mobile must be exactly 10 digits (numbers only)';
    }
    if (!geoaCin.trim()) {
      errs.cin = 'CIN / GSTIN / Registration No. is required';
    } else if (!/^[A-Za-z0-9]{10,21}$/.test(geoaCin.trim())) {
      errs.cin = 'Must be 10–21 alphanumeric characters (CIN: 21, GSTIN: 15)';
    }
    if (!geoaConsumerNo.trim()) {
      errs.consumerNo = 'DISCOM Consumer No. is required';
    } else if (!/^\d{10}$/.test(geoaConsumerNo.trim())) {
      errs.consumerNo = 'Must be exactly 10 digits (numbers only)';
    }
    if (!geoaAddress.trim()) errs.address = 'Registered address is required';
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!geoaSelectedSupplierId) errs.supplier = 'Please select a supplier';
    if (!geoaLoadMw || geoaLoadMw < 1) errs.loadMw = 'Load must be at least 1 MW';
    if (!geoaDrawalPoint.trim()) errs.drawalPoint = 'Drawal point is required';
    if (!geoaDurationDays || geoaDurationDays < 30) errs.duration = 'Duration must be at least 30 days';
    if (!geoaStartDate) errs.startDate = 'Start date is required';
    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitGeoaApplication = async () => {
    const selectedSupplier = suppliers.find(s => s.id === geoaSelectedSupplierId);
    try {
      const body = {
        supplierId: geoaSelectedSupplierId,
        supplierName: selectedSupplier?.name,
        supplierState: selectedSupplier?.state,
        mw: geoaLoadMw,
        injectionPoint: geoaInjectionPoint,
        drawalPoint: geoaDrawalPoint,
        durationDays: geoaDurationDays,
        requestedPrice: 0,
        consumerName: geoaApplicantName,
        applicantName: geoaApplicantName,
        entityType: geoaEntityType,
        legalIdentifier: geoaCin,
        discomConsumerNo: geoaConsumerNo,
        registeredAddress: geoaAddress,
        state: geoaState,
        discom: geoaDiscom,
        contactPerson: geoaContactPerson,
        contactEmail: geoaEmail,
        contactMobile: geoaMobile,
        voltageLevel: geoaVoltageLevel,
        renewableType: geoaRenewableType,
        scheduleType: geoaScheduleType,
        proposedStartDate: geoaStartDate,
        timeBlocks: geoaTimeBlocks,
        documentChecklist: geoaDocs.map(d => ({ key: d.key, label: d.label, uploaded: d.status === 'uploaded', fileName: d.fileName }))
      };
      const res = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to submit application');
        return;
      }
      const data = await res.json();
      const refNo = `RERC/GEOA/2026/${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const newGeoaApp: GeoaApplication = {
        id: data.application.id,
        refNo,
        applicantName: geoaApplicantName,
        entityType: geoaEntityType,
        loadMw: geoaLoadMw,
        injectionPoint: geoaInjectionPoint,
        drawalPoint: geoaDrawalPoint,
        scheduleType: geoaScheduleType,
        startDate: geoaStartDate,
        durationDays: geoaDurationDays,
        voltageLevel: geoaVoltageLevel,
        state: geoaState,
        submittedOn: new Date().toISOString().split('T')[0],
        status: 'SUBMITTED',
        docs: geoaDocs.map(d => ({ ...d }))
      };
      setGeoaApplications(prev => [newGeoaApp, ...prev]);
      const newApp = mapBackendApplication({
        ...data.application,
        supplierName: selectedSupplier?.name || 'Supplier',
        supplierState: selectedSupplier?.state || '',
        basePrice: selectedSupplier?.price || 4.2,
        duration: `${geoaDurationDays} Days`,
      });
      setApplications(prev => [newApp, ...prev]);
      localStorage.removeItem(GEOA_DRAFT_KEY);
      setGeoaSubmitSuccess(true);
    } catch {
      alert('Failed to submit application. Please try again.');
    }
  };

  const handleGeoaDocSimulate = (key: string, fileName: string) => {
    setGeoaDocs(prev => prev.map(d => d.key === key ? { ...d, fileName, status: 'uploaded' } : d));
  };

  // ==================== MAIN RENDER ====================
  return (
    <>
      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-4 border-b border-[#e0e8e4]">
            <div>
              <h2 className="font-sora text-[22px] font-bold text-gray-900">Consumer Dashboard</h2>
              <p className="text-gray-500 text-[13px] mt-1">Real-time green energy routing and PPA audit panels</p>
            </div>
            <div className="bg-green-pale px-3 py-1.5 rounded-lg border border-[#9fe1cb] flex items-center space-x-2 text-[12px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-mid animate-pulse"></span>
              <span className="text-green-dark">PPA OA STATUS: ACTIVE</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'CURRENT LOAD', val: '20 MW', sub: 'RTC Grid Drawal Contracted', icon: <Zap className="w-4 h-4 text-amber" />, border: 'border-t-amber' },
              { label: 'RENEWABLE MIX', val: '85 %', sub: 'Target Carbon Mitigation Match', icon: <Award className="w-4 h-4 text-green-mid" />, border: 'border-t-green-mid' },
              { label: 'SAVINGS TO DATE', val: '₹4.8L', sub: 'Compared to Local Utility Tariff', icon: <DollarSign className="w-4 h-4 text-green-mid" />, border: 'border-t-green-mid' },
              { label: 'ACTIVE SUPPLIER', val: '12', sub: 'Industry-grade procurement pool', icon: <ShieldAlert className="w-4 h-4 text-blue-dark" />, border: 'border-t-blue-dark' },
              { label: 'PENDING DOCS', val: '1 Doc', sub: 'Requires Bank Security approval', icon: <Clock className="w-4 h-4 text-red animate-pulse" />, border: 'border-t-red' },
            ].map(m => (
              <div key={m.label} className={`metric-card border-t-[3px] ${m.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{m.label}</span>
                  {m.icon}
                </div>
                <p className="font-sora text-[22px] font-bold text-gray-900">{m.val}</p>
                <p className="text-[11px] text-gray-500 mt-1">{m.sub}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="tracker-card lg:col-span-2 flex flex-col justify-between !mb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-sora font-bold text-[16px] text-gray-900">Intraday Energy Exchange Profiles</h3>
                  <p className="text-gray-500 text-[12px] mt-0.5">Real-time scheduling dispatch vs industrial demand limits (MWh)</p>
                </div>
                <BarChart2 className="w-5 h-5 text-green-dark" />
              </div>
              <div className="relative h-56 flex items-end justify-between px-2 pt-6">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-10 pt-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="border-t border-dashed border-[#e0e8e4] w-full text-[10px] text-gray-400"><span>{80 - i * 20} MW</span></div>
                  ))}
                </div>
                {[40,50,62,75,80,72,58,64,70,75,68,55].map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 mx-1 z-10 group relative">
                    <div className="w-full flex flex-col justify-end space-y-[1px]" style={{ height: `${val * 1.8}px` }}>
                      <div className="w-full bg-green-mid rounded-t-[2px] opacity-90 group-hover:opacity-100" style={{ height: '85%' }}></div>
                      <div className="w-full bg-amber rounded-b-[2px] opacity-90 group-hover:opacity-100" style={{ height: '15%' }}></div>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">{idx * 2}:00</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center space-x-6 text-[11px] mt-4 pt-4 border-t border-[#e0e8e4]">
                <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-sm bg-green-mid"></span><span className="text-gray-600 font-medium">Green OA Match (85%)</span></div>
                <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-sm bg-amber"></span><span className="text-gray-600 font-medium">Grid Fallback (15%)</span></div>
              </div>
            </div>
            <div className="tracker-card flex flex-col justify-between !mb-0">
              <div>
                <h3 className="font-sora font-bold text-[16px] text-gray-900 mb-1">Transmission Path Visualizer</h3>
                <p className="text-gray-500 text-[12px]">Real-time corridor feasibility and grid routing</p>
              </div>
              <div className="my-4 bg-gray-50 rounded-xl p-4 border border-[#e0e8e4] flex flex-col space-y-4 text-[12px] relative overflow-hidden">
                <div className="flex items-center justify-between z-10">
                  <div className="bg-white border border-[#e0e8e4] p-3 rounded-lg text-center w-[90px] shadow-sm">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase">Injection</p>
                    <p className="font-bold text-gray-900 mt-1 text-[12px]">Bhadla Pool</p>
                    <p className="text-[10px] text-green-dark font-medium mt-1">765kV Node</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-mid animate-bounce" />
                  <div className="bg-white border border-[#e0e8e4] p-3 rounded-lg text-center w-[90px] shadow-sm">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase">Drawal</p>
                    <p className="font-bold text-gray-900 mt-1 text-[12px]">Jajpur Sub</p>
                    <p className="text-[10px] text-green-dark font-medium mt-1">400kV Node</p>
                  </div>
                </div>
                <div className="border-t border-[#e0e8e4] pt-3 flex flex-col space-y-2 text-[12px] text-gray-600">
                  <div className="flex justify-between"><span className="font-medium">Corridor Loss:</span><span className="text-amber font-bold">3.2%</span></div>
                  <div className="flex justify-between"><span className="font-medium">Transfer Cap:</span><span className="text-green-dark font-bold">450 MW</span></div>
                  <div className="flex justify-between"><span className="font-medium">Congestion:</span><span className="text-green-dark font-bold">Normal</span></div>
                </div>
              </div>
              <button onClick={() => setTab('my-applications')} className="btn-outline w-full flex items-center justify-center space-x-2">
                <span>My Applications</span><ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPEN-ACCESS TAB */}
      {activeTab === 'open-access' && (
        <>
          {consumerView === 'marketplace' ? (
            <div className="space-y-8 animate-fadeIn">
              <div className="pb-4 border-b border-[#e0e8e4]">
                <h2 className="font-sora text-[22px] font-bold text-gray-900">Suppliers Marketplace</h2>
                <p className="text-gray-500 text-[13px] mt-1">Browse renewable energy suppliers and their generation plants</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-[var(--radius-md)] border border-[#e0e8e4] shadow-sm">
                <div className="relative">
                  <Search className="absolute left-3.5 top-[13px] text-gray-400 w-[18px] h-[18px]" />
                  <input type="text" placeholder="Search supplier..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="form-control pl-10" />
                </div>
                <select value={renewableTypeFilter} onChange={(e) => setRenewableTypeFilter(e.target.value)} className="form-control">
                  <option value="All">All Renewable Types</option>
                  <option value="Solar">Solar</option>
                  <option value="Wind">Wind</option>
                  <option value="Hydro">Hydro</option>
                  <option value="Biomass">Biomass</option>
                </select>
              </div>

              <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      {['Supplier Name', 'DISCOM', 'Total Capacity (MW)', 'Available Capacity (MW)', 'Actions'].map(h => (
                        <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map((s, i) => (
                        <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                          <td className="py-3.5 px-5 font-semibold text-gray-900">{s.name}</td>
                          <td className="py-3.5 px-5 text-gray-700">{s.discom || '—'}</td>
                          <td className="py-3.5 px-5 font-bold text-gray-900">{s.totalCapacity || '—'} MW</td>
                          <td className="py-3.5 px-5 font-bold text-green-dark">{s.availableCapacity || '—'} MW</td>
                          <td className="py-3.5 px-5">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingSupplierId(s.id);
                                setConsumerView('supplier-detail');
                                setSelectedSupplierForModal(s);
                              }}
                              className="px-4 py-1.5 rounded-md bg-green-dark text-white text-[12px] font-semibold hover:bg-green-mid"
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-500">No approved suppliers available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <button onClick={goBackToMarketplace} className="flex items-center gap-2 text-gray-600 hover:text-green-dark transition-colors mb-4">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Marketplace</span>
              </button>
              <SupplierDetailContent
                supplierId={viewingSupplierId!}
                onBack={goBackToMarketplace}
                onRaiseBid={(plant) => {
                  setSelectedBidSupplier({
                    id: plant.supplierId,
                    name: selectedSupplierForModal?.name || plant.supplierName,
                    price: plant.price
                  });
                  setBidMw(plant.available || 10);
                  setBidPrice(plant.price);
                  setShowBidModal(true);
                }}
                onApplyOA={(plant) => {
                  setSelectedSupplierId(plant.supplierId);
                  setRequestMw(plant.available || 10);
                  setRequestedPrice(plant.price);
                  setIsRequestFormOpen(true);
                }}
              />
            </>
          )}
        </>
      )}

      {/* MY-APPLICATIONS TAB */}
      {activeTab === 'my-applications' && (
        <>
          <div className="space-y-8 animate-fadeIn">
            <div className="pb-4 border-b border-[#e0e8e4] flex items-center justify-between">
              <div>
                <h2 className="font-sora text-[22px] font-bold text-gray-900">My Applications</h2>
                <p className="text-gray-500 text-[13px] mt-1">Track Open Access and GEOA requests status updates automatically.</p>
              </div>
              <button onClick={refreshApplications} className="btn-outline flex items-center gap-2 text-[12px] px-4 py-2">
                <ArrowRight className="w-3.5 h-3.5 rotate-[-90deg]" /><span>Refresh</span>
              </button>
            </div>
            <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr>
                    {['Supplier Name', 'Requested MW', 'Duration', 'Base Price', 'OA Charges', 'Final Price', 'Status', 'Submitted'].map(h => (
                      <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                  {applications.length > 0 ? applications.map((app, i) => (
                    <tr key={app.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                      <td className="py-3.5 px-5 font-semibold text-gray-900">
                        <button onClick={() => fetchSupplierDetails(app.supplierId)} className="text-green-dark hover:text-green-mid hover:underline font-semibold cursor-pointer transition-colors">{app.supplierName}</button>
                      </td>
                      <td className="py-3.5 px-5 text-gray-700">{app.requestedMw} MW</td>
                      <td className="py-3.5 px-5 text-gray-700">{app.duration}</td>
                      <td className="py-3.5 px-5 text-gray-900">₹{app.basePrice?.toFixed(2) || '—'}</td>
                      <td className="py-3.5 px-5 text-gray-700">₹{app.oaCharges?.toFixed(2) || '—'}</td>
                      <td className="py-3.5 px-5 font-bold text-gray-900">₹{app.finalPrice?.toFixed(2) || '—'}</td>
                      <td className="py-3.5 px-5">
                        <span className={`badge ${app.requestStatus === 'APPROVED' || app.requestStatus === 'SUPPLIER_APPROVED' ? 'badge-green' :
                          app.requestStatus === 'REJECTED' ? 'badge-red' :
                            app.requestStatus === 'ADMIN_PENDING' ? 'badge-amber' : 'badge-blue'
                        }`}>
                          {app.requestStatus === 'APPROVED' || app.requestStatus === 'SUPPLIER_APPROVED' ? '✓ Approved' :
                            app.requestStatus === 'REJECTED' ? '✗ Rejected' :
                              app.requestStatus === 'ADMIN_PENDING' ? 'Under Review' :
                                app.requestStatus || 'Submitted'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-gray-500">{app.requestDate || '—'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-500">No applications yet. Go to Open Access Marketplace or Documents → Apply GEOA to submit one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {showSupplierModal && selectedSupplierForModal && <SupplierDetailsModal />}
        </>
      )}

      {/* SUPPLIER PROFILE TAB */}
      {activeTab === 'supplier-profile' && (supplierDetails || currentSupplier) && (
        <div className="space-y-8 animate-fadeIn">
          <div className="pb-4 border-b border-[#e0e8e4] flex items-center justify-between">
            <div>
              <h2 className="font-sora text-[22px] font-bold text-gray-900">Supplier Profile</h2>
              <p className="text-gray-500 text-[13px] mt-1">Review supplier capabilities, compliance, and delivery risk.</p>
            </div>
            <button type="button" onClick={() => setTab('open-access')} className="btn-outline">Back to Marketplace</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="tracker-card p-6">
              <h3 className="font-sora text-[16px] font-bold text-gray-900 mb-4">Company Information</h3>
              <p className="text-gray-700 font-semibold mb-1">{supplierDetails?.name || currentSupplier?.name}</p>
              <p className="text-gray-500 text-[13px]">State: {supplierDetails?.state || currentSupplier?.state}</p>
              <p className="text-gray-500 text-[13px]">Source: {supplierDetails?.profile?.renewableType || currentSupplier?.renewableType}</p>
              <p className="text-gray-500 text-[13px]">Capacity: {supplierDetails?.profile?.generationCapacity || currentSupplier?.generationCapacity} MW</p>
              <p className="text-gray-500 text-[13px]">Injection Point: {supplierDetails?.profile?.injectionPoint || currentSupplier?.injectionPoint || 'Bhadla Pooling Station'}</p>
            </div>
            <div className="tracker-card p-6">
              <h3 className="font-sora text-[16px] font-bold text-gray-900 mb-4">Pricing & Performance</h3>
              <div className="space-y-3 text-[13px] text-gray-600">
                <div className="flex justify-between"><span>Base Price</span><span className="font-semibold text-gray-900">₹{Number(supplierDetails?.profile?.basePrice || currentSupplier?.price || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Est. OA Charges</span><span className="font-semibold text-gray-900">₹{calculateOaCharges(currentSupplier || {}).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Final Delivered</span><span className="font-semibold text-gray-900">₹{getFinalDeliveredPrice(currentSupplier || {}).toFixed(2)}</span></div>
                <div className="pt-3 border-t border-[#e0e8e4]"><p className="font-semibold text-gray-900">Reliability</p><p className="text-[13px] text-gray-500">4.5 / 5 • 96% delivery compliance</p></div>
              </div>
            </div>
            <div className="tracker-card p-6">
              <h3 className="font-sora text-[16px] font-bold text-gray-900 mb-4">Compliance & Documents</h3>
              <div className="space-y-2 text-[13px] text-gray-600">
                <p>Certificates: {supplierDetails?.documents?.length ? supplierDetails.documents.map((d: any) => d.title).join(', ') : 'RECs pending'}</p>
                <p>Performance: {currentSupplier?.performance || '88% on-time delivery'}</p>
                <p>Time Slots: {currentSupplier?.timeSlots || '10:00-18:00 daily'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATION DETAILS TAB */}
      {activeTab === 'application-details' && selectedApplication && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header with back button */}
          <div className="pb-4 border-b border-[#e0e8e4] flex items-center justify-between">
            <div>
              <h2 className="font-sora text-[22px] font-bold text-gray-900">
                Contract Details: {selectedApplication.supplierName}
              </h2>
              <p className="text-gray-500 text-[13px] mt-1">
                Reference: {selectedApplication.id || selectedApplication.applicationId || 'N/A'}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedApplication(null);
                setTab('contracts');
              }}
              className="btn-outline flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Contracts</span>
            </button>
          </div>

          <div className={`rounded-lg p-4 border ${selectedApplication.requestStatus === 'APPROVED'
            ? 'bg-green-pale border-green-mid'
            : 'bg-amber-light border-amber'
          }`}>
            <div className="flex items-center gap-3">
              {selectedApplication.requestStatus === 'APPROVED' ? (
                <CheckCircle className="w-6 h-6 text-green-dark" />
              ) : (
                <Clock className="w-6 h-6 text-amber" />
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  Contract Status: {selectedApplication.contractStatus || selectedApplication.requestStatus}
                </p>
                <p className="text-[13px] text-gray-600">
                  {selectedApplication.requestStatus === 'APPROVED'
                    ? 'This contract is active and all parties have approved.'
                    : 'This contract is pending approval from the supplier or administrator.'}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Contract Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="form-card">
                <h3 className="font-sora text-[18px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-dark" />
                  Contract Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Total Volume</p>
                    <p className="text-[24px] font-bold text-gray-900">{selectedApplication.requestedMw || selectedApplication.mw} MW</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Final Price</p>
                    <p className="text-[24px] font-bold text-green-dark">₹{selectedApplication.finalPrice?.toFixed(2) || '—'}/unit</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Contract Value</p>
                    <p className="text-[24px] font-bold text-gray-900">
                      ₹{((selectedApplication.requestedMw || 0) * 1000 * (selectedApplication.finalPrice || 0)).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">Estimated annual value</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Duration</p>
                    <p className="text-[24px] font-bold text-gray-900">{selectedApplication.duration}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTRACTS TAB */}
      {activeTab === 'contracts' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="pb-4 border-b border-[#e0e8e4]">
            <h2 className="font-sora text-[22px] font-bold text-gray-900">Contracts</h2>
            <p className="text-gray-500 text-[13px] mt-1">Active and approved contract arrangements.</p>
          </div>
          <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr>
                  {['Supplier', 'MW', 'Price', 'Status', 'Actions'].map(h => (
                    <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                {applications.filter(app => ['APPROVED', 'SUPPLIER_APPROVED', 'Active Contract'].includes(app.requestStatus || app.contractStatus)).length > 0
                  ? applications.filter(app => ['APPROVED', 'SUPPLIER_APPROVED', 'Active Contract'].includes(app.requestStatus || app.contractStatus)).map((app, i) => (
                    <tr key={app.id} className={`hover:bg-gray-50 ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                      <td className="py-3.5 px-5 font-semibold text-gray-900">{app.supplierName}</td>
                      <td className="py-3.5 px-5 text-gray-700">{app.requestedMw} MW</td>
                      <td className="py-3.5 px-5 font-bold text-gray-900">₹{app.finalPrice?.toFixed(2)}</td>
                      <td className="py-3.5 px-5"><span className="badge badge-green">Active</span></td>
                      <td className="py-3.5 px-5"><button onClick={() => { setSelectedApplication(app); setTab('application-details'); }} className="px-3 py-1.5 rounded-md bg-[#2d6a4f] text-white text-[12px] font-semibold hover:bg-[#1b4d3e]">View Details</button></td>
                    </tr>
                  ))
                  : (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-500">No active contracts yet.</td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCHEDULES TAB */}
      {activeTab === 'schedules' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="pb-4 border-b border-[#e0e8e4]">
            <h2 className="font-sora text-[22px] font-bold text-gray-900">Active Grid Schedules</h2>
            <p className="text-gray-500 text-[13px] mt-1">NOAR dispatch approvals</p>
          </div>
          <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {['Schedule ID', 'Supplier', 'Approved MW', 'Time Block', 'Status'].map(h => (
                    <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                {schedules.length > 0 ? schedules.map((s: any, i) => (
                  <tr key={s.id} className={`hover:bg-gray-50 ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                    <td className="py-3.5 px-5 text-gray-600 font-semibold uppercase">{s.id}</td>
                    <td className="py-3.5 px-5 font-semibold text-gray-900">{s.supplierName}</td>
                    <td className="py-3.5 px-5 font-bold text-green-dark">{s.mw} MW</td>
                    <td className="py-3.5 px-5 text-gray-700">{s.timeBlock}</td>
                    <td className="py-3.5 px-5"><span className={`badge ${s.gridStatus === 'RUNNING' ? 'badge-green' : 'badge-blue'}`}>{s.gridStatus}</span></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">No active schedules yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="space-y-8 animate-fadeIn">
          {/* LANDING */}
          {docView === 'landing' && (
            <>
              <div className="pb-4 border-b border-[#e0e8e4]">
                <h2 className="font-sora text-[22px] font-bold text-gray-900">Documents & GEOA Portal</h2>
                <p className="text-gray-500 text-[13px] mt-1">Apply for Green Energy Open Access or manage compliance documents.</p>
              </div>
              <div className="alert alert-info">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-[13px]"><span className="font-semibold">RERC GEOA Regulation 2022 —</span> All industrial consumers above 1 MW load must file a GEOA application through the Nodal Agency before commencing Open Access transactions.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => { resetGeoaForm(); setDocView('geoa-form'); }} className="group bg-white border-2 border-[#e0e8e4] hover:border-green-mid rounded-[var(--radius-md)] p-7 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md">
                  <div className="w-12 h-12 bg-green-pale rounded-xl flex items-center justify-center mb-5"><ClipboardList className="w-6 h-6 text-green-dark" /></div>
                  <h3 className="font-sora text-[17px] font-bold text-gray-900 mb-2">Apply GEOA</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed mb-5">File a formal Green Energy Open Access application to RERC / RLDC with all regulatory documents.</p>
                  <div className="flex items-center text-green-dark text-[13px] font-semibold gap-1"><span>Apply for Green Energy Open Access</span><ChevronRight className="w-4 h-4" /></div>
                </div>
                <div onClick={() => setDocView('doc-upload')} className="group bg-white border-2 border-[#e0e8e4] hover:border-blue-dark rounded-[var(--radius-md)] p-7 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md">
                  <div className="w-12 h-12 bg-blue-light rounded-xl flex items-center justify-center mb-5"><Upload className="w-6 h-6 text-blue-dark" /></div>
                  <h3 className="font-sora text-[17px] font-bold text-gray-900 mb-2">Upload Regulatory Documents</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed mb-5">Submit PPAs, bank guarantees, board authorizations to the Nodal Agency vault for admin verification.</p>
                  <div className="flex items-center text-blue-dark text-[13px] font-semibold gap-1"><span>Open Compliance Vault</span><ChevronRight className="w-4 h-4" /></div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-sora text-[18px] font-bold text-gray-900">Regulatory Document Registry</h3>
                <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>{['Document Name', 'Category', 'Uploaded On', 'Status'].map(h => <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                      {uploadedDocs.map((doc, i) => (
                        <tr key={doc.id} className={`hover:bg-gray-50 ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                          <td className="py-3.5 px-5 font-semibold text-gray-900 flex items-center gap-2"><div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-gray-500" /></div>{doc.name}</td>
                          <td className="py-3.5 px-5 text-gray-600">{doc.category}</td>
                          <td className="py-3.5 px-5 text-gray-500">{doc.date}</td>
                          <td className="py-3.5 px-5"><span className={`badge ${doc.status === 'VERIFIED' ? 'badge-green' : 'badge-amber'}`}>{doc.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* DOCUMENT UPLOAD */}
          {docView === 'doc-upload' && (
            // Add your doc-upload content here
            <div>Document Upload Content</div>
          )}

          {/* GEOA FORM */}
          {docView === 'geoa-form' && (
            // Add your GEOA form content here
            <div>GEOA Form Content</div>
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="pb-4 border-b border-[#e0e8e4]">
            <h2 className="font-sora text-[22px] font-bold text-gray-900">Consumer Profile & Billing</h2>
            <p className="text-gray-500 text-[13px] mt-1">Manage company details, preferences, and ledger statements</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="form-card lg:col-span-1 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-green-dark rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {(profile?.name || user?.name || 'Consumer').split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-sora text-[18px] font-bold text-gray-900">{profile?.name || user?.name || 'Consumer Enterprise'}</h3>
                  <p className="text-[13px] text-gray-500">{profile?.email || user?.email || 'company@example.com'}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-[#f0f4f2] space-y-3">
                <div className="flex justify-between items-center text-[13px]"><span className="text-gray-500">Registered State</span><span className="font-semibold text-gray-900">{profile?.state || 'Rajasthan'}</span></div>
              </div>
              <button className="btn-outline w-full flex items-center justify-center space-x-2"><Settings className="w-4 h-4" /><span>Account Settings</span></button>
            </div>
            <div className="form-card lg:col-span-2 space-y-6">
              <h3 className="font-sora text-[18px] font-bold text-gray-900 mb-1">Active Electricity Statements</h3>
              <div className="space-y-4">
                {billingList.map(bill => (
                  <div key={bill.id} className="bg-gray-50 p-5 rounded-xl border border-[#e0e8e4] flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                      <h4 className="font-bold text-gray-900 text-[15px]">{bill.supplier}</h4>
                      <p className="text-[12px] text-gray-500 mt-1">Billing Period: {bill.month}</p>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-[18px] font-bold text-gray-900">₹{bill.amount.toLocaleString()}</p>
                        <span className={`badge mt-1 ${bill.status === 'PAID' ? 'badge-green' : 'badge-amber'}`}>{bill.status}</span>
                      </div>
                      {bill.status === 'UNPAID' && <button onClick={() => handlePayBill(bill)} className="btn-green px-4 py-2 text-[12px]">Pay Invoice</button>}
                    </div>
                  </div>
                ))}
              </div>
              {isPaying && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
                  <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl">
                    <h3 className="font-sora text-xl font-bold text-gray-900 mb-2">Simulated Gateway</h3>
                    <p className="text-gray-500 text-[13px] mb-6">Processing ₹{payAmount.toLocaleString()}</p>
                    <div className="space-y-4">
                      <div><label className="text-[12px] font-semibold text-gray-700">Transaction Reference</label><input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} className="form-control mt-2" /></div>
                      <button onClick={submitPayment} className="btn-green w-full mt-4">Confirm Payment Transfer</button>
                      <button onClick={() => setIsPaying(false)} className="btn-outline w-full">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-sora text-[18px] font-bold text-gray-900">Settlement Ledger</h3>
            <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>{['Transaction Ref', 'Date', 'Amount', 'Status'].map(h => <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                  {payments.length > 0 ? payments.map((p, i) => (
                    <tr key={p.id} className={`hover:bg-gray-50 ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                      <td className="py-3.5 px-5 text-gray-600 font-medium">{p.reference}</td>
                      <td className="py-3.5 px-5 text-gray-500">{p.createdAt}</td>
                      <td className="py-3.5 px-5 font-bold text-gray-900">₹{p.amount.toLocaleString()}</td>
                      <td className="py-3.5 px-5"><span className="badge badge-green">{p.status}</span></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">No transactions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODALS (Always rendered, outside tab conditions) ========== */}

      {/* Bid Modal */}
      {showBidModal && selectedBidSupplier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBidModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-sora text-xl font-bold text-gray-900">Raise Bid to {selectedBidSupplier.name}</h3>
                <p className="text-[13px] text-gray-500">Submit a direct bid request to supplier</p>
              </div>
              <button onClick={() => setShowBidModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity Required (MW) <span className="text-red-500">*</span></label>
                <input type="number" value={bidMw} onChange={(e) => setBidMw(Number(e.target.value))} min={1} max={100} className="form-control" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Offered Price (₹/unit) <span className="text-red-500">*</span></label>
                <input type="number" step="0.1" value={bidPrice} onChange={(e) => setBidPrice(Number(e.target.value))} min={0.1} className="form-control" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (months) <span className="text-red-500">*</span></label>
                <input type="number" value={bidDuration} onChange={(e) => setBidDuration(Number(e.target.value))} min={1} max={60} className="form-control" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message (Optional)</label>
                <textarea value={bidMessage} onChange={(e) => setBidMessage(e.target.value)} rows={3} placeholder="Add any special requirements or notes..." className="form-control" />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={submitBidRequest} disabled={isSubmittingBid} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg transition-colors">
                  {isSubmittingBid ? 'Submitting...' : 'Submit Bid Request'}
                </button>
                <button onClick={() => setShowBidModal(false)} className="flex-1 btn-outline py-2.5">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open Access Request Modal */}
      {isRequestFormOpen && currentSupplier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsRequestFormOpen(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-sora text-xl font-bold text-gray-900">Open Access Application</h3>
                <p className="text-[13px] text-gray-500">Submit request to {currentSupplier.name}</p>
              </div>
              <button onClick={() => setIsRequestFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={submitContractRequest} className="p-6 space-y-5">
              {/* Consumer Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Consumer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={consumerName || profile?.name || ''}
                  onChange={(e) => setConsumerName(e.target.value)}
                  placeholder="Your Company Name"
                  className="form-control"
                  required
                />
              </div>

              {/* Requested MW */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Requested Capacity (MW) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={requestMw}
                  onChange={(e) => setRequestMw(Number(e.target.value))}
                  min={1}
                  max={500}
                  className="form-control"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Duration (Days) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={requestDuration}
                  onChange={(e) => setRequestDuration(Number(e.target.value))}
                  min={30}
                  max={3650}
                  className="form-control"
                  required
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Proposed Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={requestStartDate}
                  onChange={(e) => setRequestStartDate(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              {/* Schedule Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Schedule Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={requestScheduleType}
                  onChange={(e) => setRequestScheduleType(e.target.value)}
                  className="form-control"
                >
                  <option value="RTC">Round The Clock (RTC)</option>
                  <option value="Peak">Peak Hours</option>
                  <option value="Off-Peak">Off-Peak Hours</option>
                </select>
              </div>

              {/* Delivery State */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Delivery State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={requestDeliveryState}
                  onChange={(e) => setRequestDeliveryState(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              {/* Offered Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Offered Price (₹/unit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={requestedPrice}
                  onChange={(e) => setRequestedPrice(Number(e.target.value))}
                  min={0.01}
                  className="form-control"
                  required
                />
              </div>

              {/* Pricing Summary */}
              <div className="bg-green-pale rounded-xl p-4 border border-[#9fe1cb]">
                <p className="text-[12px] font-semibold text-gray-700 mb-2">Estimated Pricing Summary</p>
                <div className="space-y-1 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price (Supplier):</span>
                    <span className="font-semibold">₹{currentSupplier.price?.toFixed(2)}/unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. OA Charges:</span>
                    <span className="font-semibold">₹{calculateOaCharges(currentSupplier).toFixed(2)}/unit</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#9fe1cb]">
                    <span className="font-bold text-gray-900">Final Delivered Price:</span>
                    <span className="font-bold text-green-dark text-[16px]">₹{getFinalDeliveredPrice(currentSupplier).toFixed(2)}/unit</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-green py-2.5">
                  Submit Open Access Request
                </button>
                <button type="button" onClick={() => setIsRequestFormOpen(false)} className="flex-1 btn-outline py-2.5">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Details Modal */}
      {showSupplierModal && selectedSupplierForModal && <SupplierDetailsModal />}
    </>
  );
};