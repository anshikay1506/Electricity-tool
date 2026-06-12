import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Zap, ShieldAlert, Award, Clock,
  Search, ArrowRight, Upload, DollarSign, BarChart2, Settings,
  FileText, CheckCircle, ChevronRight, ClipboardList, AlertCircle, X, Eye, Save, Download,Gavel, Plus,RefreshCw,
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


  // Bid Management State
const [bidsList, setBidsList] = useState<any[]>([]);
const [bidTab, setBidTab] = useState<'active' | 'accepted' | 'rejected' | 'history'>('active');
const [isCreateBidModalOpen, setIsCreateBidModalOpen] = useState(false);
const [bidFormData, setBidFormData] = useState({
  title: '',
  mw: 10,
  price: 4.5,
  duration: 12,
  drawalPoint: '',
  scheduleType: 'RTC',
  message: '',
  validityDays: 30,
  renewableType: ''
});


const [showViewOffersModal, setShowViewOffersModal] = useState(false);
const [selectedBidForView, setSelectedBidForView] = useState<any>(null);
const [bidOffers, setBidOffers] = useState<any[]>([]);

// Bid Offers View State
const [showBidOffersView, setShowBidOffersView] = useState(false);
const [selectedBidForOffers, setSelectedBidForOffers] = useState<any>(null);
const [bidOffersList, setBidOffersList] = useState<any[]>([]);




const handleCreateBid = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!token) return;
  
  setIsSubmittingBid(true);
  try {
    const superClean = (str: string) => {
      if (!str) return '';
      return str.replace(/[\x00-\x1F\x7F]/g, '').trim();
    };
    
    const requestBody = {
      drawalPoint: bidFormData.drawalPoint,
      mw: Number(bidFormData.mw),
      price: Number(bidFormData.price),
      duration: Number(bidFormData.duration),
      renewableType: bidFormData.renewableType,
      scheduleType: bidFormData.scheduleType,
      message: superClean(bidFormData.message),
      validityDays: Number(bidFormData.validityDays),
      consumerId: user?.id,
      consumerName: superClean(profile?.name || 'Consumer'),
    };
    
    console.log('Sending cleaned bid request:', requestBody);
    
    const response = await fetch(`${API_BASE}/api/bids`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create bid');
    }
    
    const data = await response.json();
    setBidsList([data.bid || data, ...bidsList]);
    setIsCreateBidModalOpen(false);
    
    // Reset form
    setBidFormData({
      title: '',
      mw: 10,
      price: 4.5,
      duration: 12,
      deliveryState: 'Rajasthan',
      scheduleType: 'RTC',
      message: '',
      validityDays: 30
    });
    
    alert('Bid created successfully!');
  } catch (error) {
    console.error('Error creating bid:', error);
    alert(`Failed to create bid: ${error instanceof Error ? error.message : 'Please try again'}`);
  } finally {
    setIsSubmittingBid(false);
  }
};



const loadBids = async () => {
  if (!token || !user?.id) return;
  try {
    const response = await fetch(`${API_BASE}/api/bids/consumer/${user?.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        console.log('First bid renewableType:', data[0].renewableType);
        console.log('First bid full data:', data[0]);
      }
      setBidsList(data);
    }
  } catch (error) {
    console.error('Error loading bids:', error);
  }
};



const cancelBid = async (bidId: string) => {
  if (!confirm('Are you sure you want to cancel this bid?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/bids/${bidId}/cancel`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      }
    });
    
    if (!response.ok) throw new Error('Failed to cancel bid');
    
    // Call loadBids to refresh the list
    await loadBids();
    alert('Bid cancelled and moved to history');
  } catch (error) {
    console.error('Error cancelling bid:', error);
    alert('Failed to cancel bid');
  }
};



// Proceed to contract from accepted bid
const proceedToContract = (bid: any) => {
  // Navigate to contract creation or contract details
  setTab('contracts');
  // You can pre-fill contract data here
};

  // Other states
  const [selectedSupplierPlants, setSelectedSupplierPlants] = useState<any[]>([]);
  const [showSupplierPlantsModal, setShowSupplierPlantsModal] = useState(false);

const [isLoadingOffersPage, setIsLoadingOffersPage] = useState(false);

  const GEOA_STEPS = [
    { num: 1, label: 'Applicant Details' },
    { num: 2, label: 'Technical Details' },
    { num: 3, label: 'Review & Submit' },
  ];

const [isLoadingOffers, setIsLoadingOffers] = useState(false);
const [offersData, setOffersData] = useState<any[]>([]);


const [showOpenAccessForm, setShowOpenAccessForm] = useState(false);
const [selectedBidForOA, setSelectedBidForOA] = useState<any>(null);
const [selectedOfferForOA, setSelectedOfferForOA] = useState<any>(null);
const [isSubmittingOA, setIsSubmittingOA] = useState(false);


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
    try{
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
          plantId: selectedPlantId,  
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


const getFinalDeliveredPriceForPlant = (plant: any) => {
  if (!plant) return 0;
  const consumerState = profile?.state || 'Rajasthan';
  const sameStateFactor = plant.state === consumerState ? 0.9 : 1.2;
  const baseOa = plant.type === 'Solar' ? 0.6 : plant.type === 'Wind' ? 0.7 : 0.85;
  const transmissionCost = plant.injectionPoint?.includes('765kV') ? 0.35 : 0.45;
  const distanceFactor = plant.state === 'Rajasthan' && consumerState === 'Maharashtra' ? 1.15 : 1.0;
  const oaCharges = Number((baseOa * sameStateFactor * distanceFactor + transmissionCost).toFixed(2));
  return Number((plant.price + oaCharges).toFixed(2));
};



const viewBidOffers = async (bid: any) => {
  console.log('Viewing offers for bid:', bid);
  setIsLoadingOffersPage(true); 
  setSelectedBidForOffers(bid);
  setShowBidOffersView(true); 
  
  try {
    await loadBidOffersForView(bid.id);
  } catch (error) {
    console.error('Error loading offers:', error);
    alert('Failed to load offers. Please try again.');
  } finally {
    setIsLoadingOffersPage(false);
  }
};



const loadBidOffersForView = async (bidId: string) => {
  if (!token) return;
  try {
    const response = await fetch(`${API_BASE}/api/bids/offers/bid/${bidId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      console.log('Loaded offers for new view:', data.length);
      setBidOffersList(data);
    } else {
      console.error('Failed to load offers:', response.status);
      setBidOffersList([]);
    }
  } catch (error) {
    console.error('Error loading bid offers:', error);
    setBidOffersList([]);
  }
};


const backToBids = () => {
  setShowBidOffersView(false);
  setSelectedBidForOffers(null);
  setBidOffersList([]);
};

// Get best offer from list
const getBestOfferFromList = (offers: any[]) => {
  if (offers.length === 0) return null;
  return offers.reduce((best, current) => 
    current.offeredPrice < best.offeredPrice ? current : best
  );
};


const acceptBidOffer = (offer: any, bid: any) => {
  console.log('Opening Open Access form for bid:', { offer, bid });
  setSelectedOfferForOA(offer);
  setSelectedBidForOA(bid);
  setShowOpenAccessForm(true);
};

  


const rejectBidOffer = async (offerId: string) => {
  if (!confirm('Reject this offer?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/bids/offers/${offerId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to reject offer');
    
    alert('Offer rejected');
    await loadBidOffersForView(selectedBidForOffers.id); // Refresh offers list
  } catch (error) {
    console.error('Error rejecting offer:', error);
    alert('Failed to reject offer');
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



// Open Access Application Form Component for Raise Bid Section
const OpenAccessApplicationForm = () => {
  if (!showOpenAccessForm || !selectedBidForOA || !selectedOfferForOA) {
    return null;
  }

  // Add state for editable consumer details
  const [editableMobile, setEditableMobile] = useState(profile?.mobile || '');
  const [editableEntityType, setEditableEntityType] = useState(profile?.entityType || 'Industrial');
  const [editableDiscom, setEditableDiscom] = useState(profile?.discom || 'JVVNL');
  const [editableContactPerson, setEditableContactPerson] = useState(profile?.contactPerson || '');
  
  // Add state for terms acceptance
  const [termsAccepted, setTermsAccepted] = useState({
    accuracy: false,
    agreement: false,
    approval: false
  });

  const handleTermsChange = (field: keyof typeof termsAccepted) => {
    setTermsAccepted(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const allTermsAccepted = termsAccepted.accuracy && termsAccepted.agreement && termsAccepted.approval;

  const handleSubmitOA = async () => {
    // Validate mandatory fields
    if (!editableMobile || editableMobile.trim() === '') {
      alert('Please enter your mobile number.');
      return;
    }
    if (!editableEntityType || editableEntityType.trim() === '') {
      alert('Please select Entity Type.');
      return;
    }
    if (!editableDiscom || editableDiscom.trim() === '') {
      alert('Please select DISCOM.');
      return;
    }
    if (!editableContactPerson || editableContactPerson.trim() === '') {
      alert('Please enter Contact Person name.');
      return;
    }
    
    if (!allTermsAccepted) {
      alert('Please accept all terms and conditions to proceed.');
      return;
    }
    
    setIsSubmittingOA(true);
    
    try {
      // 1. Accept the offer
      const acceptResponse = await fetch(`${API_BASE}/api/bids/offers/${selectedOfferForOA.id}/accept`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (!acceptResponse.ok) {
        throw new Error('Failed to accept offer');
      }
      
      // 2. Create Open Access Application with editable fields
      const applicationData = {
        supplierId: selectedOfferForOA.supplierId,
        supplierName: selectedOfferForOA.supplierName,
        mw: selectedOfferForOA.offeredMw,
        durationMonths: selectedBidForOA.duration,
        durationDays: selectedBidForOA.duration * 30,
        requestedPrice: selectedOfferForOA.offeredPrice,
        finalPrice: selectedOfferForOA.offeredPrice,
        drawalPoint: selectedBidForOA.drawalPoint,
        injectionPoint: selectedBidForOA.injectionPoint || 'Bhadla Pool (765kV)',
        proposedStartDate: new Date().toISOString().split('T')[0],
        scheduleType: selectedBidForOA.scheduleType || 'RTC',
        timeBlocks: selectedBidForOA.timeBlocks || '00:00-24:00',
        consumerName: profile?.name || user?.name || 'Consumer',
        consumerId: user?.id,
        state: profile?.state || 'Rajasthan',
        entityType: editableEntityType,
        discom: editableDiscom,
        contactPerson: editableContactPerson,
        mobile: editableMobile,
        bidId: selectedBidForOA.id,
        offerId: selectedOfferForOA.id,
        status: 'PENDING_ADMIN_APPROVAL'
      };
      
      const applicationResponse = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(applicationData)
      });
      
      if (!applicationResponse.ok) {
        throw new Error('Failed to create Open Access application');
      }
      
      alert('Open Access application submitted successfully!');
      setShowOpenAccessForm(false);
      setSelectedBidForOA(null);
      setSelectedOfferForOA(null);
      
      // Refresh data
      await loadBids();
      await loadApplications();
      
      // Navigate to applications
      setTab('my-applications');
      
    } catch (error) {
      console.error('Error submitting Open Access application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmittingOA(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowOpenAccessForm(false)}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e0e8e4] px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-sora text-xl font-bold text-gray-900">Open Access Application</h3>
            <p className="text-[13px] text-gray-500">Review and submit your Open Access application</p>
          </div>
          <button onClick={() => setShowOpenAccessForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-blue-800">Application from Accepted Bid</p>
                <p className="text-[12px] text-blue-700 mt-1">
                  This application has been pre-filled with details from the accepted bid from <strong>{selectedOfferForOA.supplierName}</strong>. 
                  Please fill in all mandatory fields marked with <span className="text-red-500">*</span>
                </p>
              </div>
            </div>
          </div>

          {/* Open Access Application Form */}
          <div className="space-y-5">
            {/* Section 1: Consumer Details with Mandatory Fields */}
            <div className="bg-gray-50 rounded-xl p-5 border border-[#e0e8e4]">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                Consumer Details 
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">Consumer Name</p>
                  <p className="text-[14px] font-semibold text-gray-900">{profile?.name || user?.name || 'Consumer'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">State</p>
                  <p className="text-[14px] text-gray-700">{profile?.state || 'Rajasthan'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">Email</p>
                  <p className="text-[13px] text-gray-600">{profile?.email || user?.email || '—'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">
                    Mobile <span className="text-red-500">*</span>
                  </p>
                  <input 
                    type="tel" 
                    value={editableMobile} 
                    onChange={(e) => setEditableMobile(e.target.value)}
                    className="text-[13px] font-semibold text-gray-900 w-full border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-green-400"
                    placeholder="Enter mobile number (required)"
                    required
                  />
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">
                    Entity Type <span className="text-red-500">*</span>
                  </p>
                  <select 
                    value={editableEntityType} 
                    onChange={(e) => setEditableEntityType(e.target.value)}
                    className="text-[13px] font-semibold text-gray-900 w-full border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-green-400"
                    required
                  >
                    <option value="Industrial">Industrial Consumer</option>
                    <option value="Commercial">Commercial Consumer</option>
                    <option value="Municipal">Municipal / Government</option>
                    <option value="SEZ">SEZ Unit</option>
                  </select>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">
                    DISCOM <span className="text-red-500">*</span>
                  </p>
                  <select 
                    value={editableDiscom} 
                    onChange={(e) => setEditableDiscom(e.target.value)}
                    className="text-[13px] font-semibold text-gray-900 w-full border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-green-400"
                    required
                  >
                    <option value="JVVNL">JVVNL</option>
                    <option value="AVVNL">AVVNL</option>
                    <option value="DVVNL">DVVNL</option>
                    <option value="MSEDCL">MSEDCL</option>
                    <option value="PGVCL">PGVCL</option>
                    <option value="TNEB">TNEB</option>
                    <option value="BESCOM">BESCOM</option>
                  </select>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">
                    Contact Person <span className="text-red-500">*</span>
                  </p>
                  <input 
                    type="text" 
                    value={editableContactPerson} 
                    onChange={(e) => setEditableContactPerson(e.target.value)}
                    className="text-[13px] font-semibold text-gray-900 w-full border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-green-400"
                    placeholder="Enter contact person name (required)"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Technical Details */}
            <div className="bg-gray-50 rounded-xl p-5 border border-[#e0e8e4]">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                Technical Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">Supplier Name</p>
                  <p className="text-[13px] font-semibold text-gray-900">{selectedOfferForOA.supplierName}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">Contract Capacity</p>
                  <p className="text-[13px] font-bold text-gray-900">{selectedOfferForOA.offeredMw} MW</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">Agreed Price</p>
                  <p className="text-[13px] font-bold text-green-600">₹{selectedOfferForOA.offeredPrice}/unit</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">Duration</p>
                  <p className="text-[13px] font-semibold text-gray-900">{selectedBidForOA.duration} months</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">Drawal Point</p>
                  <p className="text-[13px] font-semibold text-gray-900">{selectedBidForOA.drawalPoint || 'Not specified'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">Injection Point</p>
                  <p className="text-[13px] font-semibold text-gray-900">Bhadla Pool (765kV)</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">Schedule Type</p>
                  <p className="text-[13px] font-semibold text-gray-900">{selectedBidForOA.scheduleType || 'RTC'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#e0e8e4]">
                  <p className="text-[10px] text-gray-400 uppercase">Start Date</p>
                  <p className="text-[13px] font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Section 3: Terms & Conditions */}
            <div className="bg-gray-50 rounded-xl p-5 border border-[#e0e8e4]">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Terms & Conditions
              </h4>
              <div className="space-y-2 text-[12px] text-gray-600">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mt-0.5" 
                    checked={termsAccepted.accuracy}
                    onChange={() => handleTermsChange('accuracy')}
                  />
                  <span>I confirm that all information provided is accurate and complete.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mt-0.5" 
                    checked={termsAccepted.agreement}
                    onChange={() => handleTermsChange('agreement')}
                  />
                  <span>I agree to the terms of the Open Access agreement and applicable regulations.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mt-0.5" 
                    checked={termsAccepted.approval}
                    onChange={() => handleTermsChange('approval')}
                  />
                  <span>I understand that this application requires admin approval before contract activation.</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#e0e8e4]">
            <button
              type="button"
              onClick={handleSubmitOA}
              disabled={isSubmittingOA}
              className="flex-1 bg-green-dark text-white py-3 rounded-lg text-[14px] font-bold hover:bg-green-mid transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingOA ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit Open Access Application
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowOpenAccessForm(false)}
              className="flex-1 btn-outline py-3"
              disabled={isSubmittingOA}
            >
              Cancel
            </button>
          </div>

          {/* Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-[11px] text-amber-800">
              ⓘ Once submitted, the application will be reviewed by the admin. You will be notified once approved.
            </p>
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
  


  const loadSuppliers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/suppliers`, { 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } 
      });
      if (!res.ok) return;
      const suppliersData = await res.json();
      
      // Fetch plants for each supplier
      const suppliersWithPlants = await Promise.all(
        suppliersData.map(async (supplier: any) => {
          try {
            const plantsRes = await fetch(`${API_BASE}/api/plants/supplier/${supplier.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (plantsRes.ok) {
              const plants = await plantsRes.json();
              return { ...supplier, plants: plants };
            }
            return { ...supplier, plants: [] };
          } catch (error) {
            console.error(`Error fetching plants for supplier ${supplier.id}:`, error);
            return { ...supplier, plants: [] };
          }
        })
      );
      
      setSuppliers(suppliersWithPlants);
    } catch { 
      setSuppliers([]); 
    }
  };
  
  loadProfile(); 
  loadSuppliers(); 
  loadApplications();
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
    setGeoaSubmitSuccess(false);
    setGeoaAddress('');
    setGeoaConsumerNo('');
    setGeoaMobile('');
    setGeoaSelectedSupplierId('');
  setStep1Errors({});
  setStep2Errors({});
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



  // Load bids from database when component mounts
useEffect(() => {
  const fetchBids = async () => {
    if (!token || !user?.id) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/bids/consumer/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBidsList(data);
        console.log('Bids loaded from database:', data.length);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };
  
  fetchBids();
}, [token, user?.id, API_BASE]); 



useEffect(() => {
  if (activeTab === 'bids') {
    const fetchBids = async () => {
      if (!token || !user?.id) return;
      
      try {
        const response = await fetch(`${API_BASE}/api/bids/consumer/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setBidsList(data);
        }
      } catch (error) {
        console.error('Error refreshing bids:', error);
      }
    };
    
    fetchBids();
  }
}, [activeTab, token, user?.id, API_BASE]);



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
          <p className="text-gray-500 text-[13px] mt-1">Browse renewable energy plants and their generation details</p>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-[var(--radius-md)] border border-[#e0e8e4] shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-[13px] text-gray-400 w-[18px] h-[18px]" />
            <input 
              type="text" 
              placeholder="Search by supplier or plant name..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="form-control pl-10" 
            />
          </div>
          <select value={renewableTypeFilter} onChange={(e) => setRenewableTypeFilter(e.target.value)} className="form-control">
            <option value="All">All Renewable Types</option>
            <option value="Solar">Solar</option>
            <option value="Wind">Wind</option>
            <option value="Hydro">Hydro</option>
            <option value="Biomass">Biomass</option>
          </select>
        </div>

        {/* Plants Table - Read Only, No Actions */}
        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-green-dark">
                <th className="text-white text-[12px] font-semibold px-4 py-3 uppercase whitespace-nowrap">Supplier Name</th>
                <th className="text-white text-[12px] font-semibold px-4 py-3 uppercase whitespace-nowrap">Plant Name</th>
                <th className="text-white text-[12px] font-semibold px-4 py-3 uppercase whitespace-nowrap">Type</th>
                <th className="text-white text-[12px] font-semibold px-4 py-3 uppercase whitespace-nowrap">DISCOM</th>
                {/* <th className="text-white text-[12px] font-semibold px-4 py-3 uppercase whitespace-nowrap">Total MW</th> */}
                <th className="text-white text-[12px] font-semibold px-4 py-3 uppercase whitespace-nowrap">Available MW</th>
                <th className="text-white text-[12px] font-semibold px-4 py-3 uppercase whitespace-nowrap">Base Price (₹)</th>
                <th className="text-white text-[12px] font-semibold px-4 py-3 uppercase whitespace-nowrap">Delivered Price (₹)</th>
                <th className="text-white text-[12px] font-semibold px-4 py-3 uppercase whitespace-nowrap">Injection Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {(() => {
                // Flatten all plants from all suppliers
                const allPlants: any[] = [];
                suppliers.forEach((supplier: any) => {
                  const isApproved = supplier.status === 'VERIFIED' || supplier.oaStatus === 'APPROVED';
                  if (!isApproved) return;
                  
                  // Check if supplier has plants array or create a default plant
                  const plants = supplier.plants && supplier.plants.length > 0 
                    ? supplier.plants 
                    : [{
                        id: supplier.id,
                        name: `${supplier.name} - Main Plant`,
                        type: supplier.renewableType || 'Solar',
                        // total: supplier.totalCapacity || supplier.generationCapacity || 0,
                        available: supplier.availableCapacity || supplier.available || supplier.totalCapacity || 0,
                        price: supplier.price || 4.2,
                        injectionPoint: supplier.injectionPoint || 'Bhadla Pool (765kV)'
                      }];
                  
                  plants.forEach((plant: any) => {
                    allPlants.push({
                      ...plant,
                      supplierId: supplier.id,
                      supplierName: supplier.name,
                      discom: supplier.discom || supplier.profile?.discom || 'Not Specified',
                      state: supplier.state,
                      status: supplier.status,
                      renewableType: plant.type || supplier.renewableType || 'Solar'
                    });
                  });
                });

                // Apply filters
                let filteredPlants = allPlants;
                
                // Search filter
                if (searchQuery) {
                  filteredPlants = filteredPlants.filter(plant => 
                    plant.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    plant.name?.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                }
                
                // Type filter
                if (renewableTypeFilter !== 'All') {
                  filteredPlants = filteredPlants.filter(plant => 
                    plant.renewableType === renewableTypeFilter || plant.type === renewableTypeFilter
                  );
                }

                return filteredPlants.length > 0 ? (
                  filteredPlants.map((plant, idx) => (
                    <tr key={`${plant.supplierId}-${plant.id}`} className={`hover:bg-gray-50 transition-colors ${idx % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{plant.supplierName}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-800">{plant.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">
                          {plant.type || plant.renewableType || 'Solar'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{plant.discom || '—'}</td>
                      {/* <td className="py-3.5 px-4 font-bold text-gray-900">{plant.total || 0} MW</td> */}
                      <td className="py-3.5 px-4 font-bold text-green-dark">{plant.available || 0} MW</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">₹{Number(plant.price || 4.2).toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-bold text-[#1b4d3e]">
                        ₹{(() => {
                          const plantWithState = { ...plant, state: plant.state || 'Rajasthan', price: plant.price || 4.2, type: plant.type || 'Solar' };
                          return getFinalDeliveredPriceForPlant(plantWithState).toFixed(2);
                        })()}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 text-[12px] max-w-[180px] truncate">{plant.injectionPoint || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Zap className="w-12 h-12 text-gray-300" />
                        <p className="text-[15px] font-medium">No plants found</p>
                        <p className="text-[13px]">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      // Supplier Detail View - You can keep or remove this section
      // Since you want all data on main page, you might want to remove this completely
      // For now, keeping it but you can delete if not needed
      <>
        <button onClick={goBackToMarketplace} className="flex items-center gap-2 text-gray-600 hover:text-green-dark transition-colors mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Marketplace</span>
        </button>
        <div className="text-center py-12 bg-white rounded-lg border border-[#e0e8e4]">
          <p className="text-gray-500">Supplier detail view is disabled. All plant information is available in the main marketplace table.</p>
        </div>
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
                <h2 className="font-sora text-[22px] font-bold text-gray-900">
                  
                </h2>
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
                          {app.requestStatus === 'APPROVED' || app.requestStatus === 'SUPPLIER_APPROVED' ? 'Approved' :
                            app.requestStatus === 'REJECTED' ? 'Rejected' :
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




{/* BID SECTION - Conditional rendering (Either show Bids OR Show Offers, never both) */}
{activeTab === 'bids' && (
  <>
    {showBidOffersView && selectedBidForOffers ? (
      /* ========== BID OFFERS VIEW - Show when viewing offers ========== */
      <div className="space-y-6 animate-fadeIn">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 pb-4 border-b border-[#e0e8e4]">
          <button
            onClick={backToBids}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="font-sora text-[22px] font-bold text-gray-900">Bid Offers</h2>
            <p className="text-gray-500 text-[13px] mt-0.5">
              Review supplier offers for your bid
            </p>
          </div>
        </div>

        {isLoadingOffersPage ? (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin border-t-green-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-6 h-6 text-green-600 animate-pulse" />
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-gray-700 font-semibold text-[15px]">Loading supplier offers...</p>
          <p className="text-gray-400 text-[12px] mt-1">Fetching responses from suppliers</p>
        </div>
      </div>
    ) : (
      /* Content - Shows only after data is loaded */
      <>
        {/* Original Bid Summary Card */}
        <div className="bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-100 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Original Bid Requirements</p>
              <h3 className="font-sora text-[18px] font-bold text-gray-900 mt-1">
                {selectedBidForOffers.drawalPoint || 'Bid Request'}
              </h3>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="text-[13px] text-gray-600">📦 {selectedBidForOffers.mw} MW</span>
                <span className="text-[13px] text-gray-600">💰 ₹{selectedBidForOffers.price}/unit (Target)</span>
                <span className="text-[13px] text-gray-600">⏱️ {selectedBidForOffers.duration} months</span>
                <span className="text-[13px] text-gray-600">
                  📅 Valid till: {new Date(new Date(selectedBidForOffers.createdAt).setDate(new Date(selectedBidForOffers.createdAt).getDate() + (selectedBidForOffers.validityDays || 30))).toLocaleDateString()}
                </span>
              </div>
            </div>
            {selectedBidForOffers.message && (
              <div className="max-w-md bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-[10px] text-blue-600 uppercase">Your Message</p>
                <p className="text-[12px] text-gray-700 italic">"{selectedBidForOffers.message}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Best Offer Highlight */}
        {bidOffersList.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-[11px] text-amber-700 font-semibold uppercase">Best Offer</p>
                  <p className="text-[20px] font-bold text-gray-900">
                    {getBestOfferFromList(bidOffersList)?.supplierName}
                  </p>
                  <p className="text-[13px] text-gray-600">
                    ₹{getBestOfferFromList(bidOffersList)?.offeredPrice}/unit 
                    <span className="text-green-600 ml-2">
                      ↓ Saving ₹{(selectedBidForOffers.price - getBestOfferFromList(bidOffersList)?.offeredPrice).toFixed(2)}/unit
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-500">Total Offers Received</p>
                <p className="text-[28px] font-bold text-gray-900">{bidOffersList.length}</p>
              </div>
            </div>
          </div>
        )}

        
          <div className="bg-white rounded-xl border border-[#e0e8e4] overflow-hidden">
          {bidOffersList.length === 0 ? (
            /* No Offers State */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-[14px] font-medium">No offers received yet</p>
              <p className="text-gray-400 text-[11px] mt-1">Suppliers will submit offers here when they respond to your bid</p>
            </div>
          ) : (
            /* Offers Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">SUPPLIER</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">OFFERED MW</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">OFFERED PRICE</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">VS TARGET</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">ANNUAL VALUE</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">MESSAGE</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">SUBMITTED</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">STATUS</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4f2]">
                  {bidOffersList.map((offer) => {
                    const isBetter = offer.offeredPrice <= selectedBidForOffers.price;
                    const annualValue = (offer.offeredMw * 1000 * 24 * 365 * offer.offeredPrice) / 10000000;
                    
                    return (
                      <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <Building className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-[13px]">{offer.supplierName}</p>
                              <p className="text-[10px] text-gray-400">ID: {offer.supplierId?.slice(-8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-bold text-[15px] text-gray-900">{offer.offeredMw} <span className="text-[11px]">MW</span></p>
                        </td>
                        <td className="px-5 py-3">
                          <p className={`font-bold text-[16px] ${isBetter ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{offer.offeredPrice}
                          </p>
                          <p className="text-[10px] text-gray-400">/unit</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${
                            isBetter ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {isBetter ? 'Better' : 'Higher'}
                            <span className="text-[9px]">
                              (₹{Math.abs(offer.offeredPrice - selectedBidForOffers.price).toFixed(2)})
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-gray-600">₹{annualValue.toFixed(2)} Cr</p>
                          <p className="text-[9px] text-gray-400">per year</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-[12px] text-gray-500 max-w-[200px] truncate">
                            {offer.message || '—'}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-[12px]">
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-semibold ${
                            offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                            offer.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {offer.status === 'ACCEPTED' ? 'Accepted' :
                             offer.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {offer.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => acceptBidOffer(offer, selectedBidForOffers)}
                                className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-[11px] font-semibold hover:bg-green-700 transition-colors"
                              >
                                Accept & Apply
                              </button>
                              <button
                                onClick={() => rejectBidOffer(offer.id)}
                                className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 text-[11px] font-semibold hover:bg-red-50 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {offer.status === 'ACCEPTED' && (
                            <button
                              onClick={() => proceedToContract(offer)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 transition-colors"
                            >
                              Create Contract
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    )}
  </div>
) : (
      /* ========== BID MANAGEMENT TAB - Show when not viewing offers ========== */
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#e0e8e4]">
          <div>
            <h2 className="font-sora text-[22px] font-bold text-gray-900">Bid Management</h2>
            <p className="text-gray-500 text-[13px] mt-1">
              Create and manage your energy procurement bids
            </p>
          </div>
          <button
            onClick={() => setIsCreateBidModalOpen(true)}
            className="bg-green-dark text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-green-mid transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Bid
          </button>
        </div>

        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => setBidTab('active')}
            className={`px-6 py-3 text-[14px] font-semibold transition-all ${
              bidTab === 'active'
                ? 'text-green-dark border-b-2 border-green-dark bg-green-pale/20'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Bids
            {bidsList.filter(b => b.status === 'ACTIVE' || b.status === 'PENDING').length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {bidsList.filter(b => b.status === 'ACTIVE' || b.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setBidTab('accepted')}
            className={`px-6 py-3 text-[14px] font-semibold transition-all ${
              bidTab === 'accepted'
                ? 'text-green-dark border-b-2 border-green-dark bg-green-pale/20'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Accepted
            {bidsList.filter(b => b.status === 'ACCEPTED').length > 0 && (
              <span className="ml-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {bidsList.filter(b => b.status === 'ACCEPTED').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setBidTab('history')}
            className={`px-6 py-3 text-[14px] font-semibold transition-all ${
              bidTab === 'history'
                ? 'text-green-dark border-b-2 border-green-dark bg-green-pale/20'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            History
          </button>
        </div>

        {/* Active Bids Table */}
        {bidTab === 'active' && (
          <>
            {bidsList.filter(b => b.status === 'ACTIVE' || b.status === 'PENDING').length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e0e8e4] p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gavel className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-[16px] font-medium">No Active Bids</p>
                <p className="text-gray-400 text-[13px] mt-1">Create a new bid to start procurement</p>
                <button
                  onClick={() => setIsCreateBidModalOpen(true)}
                  className="mt-4 bg-green-dark text-white px-5 py-2 rounded-lg text-[13px] font-bold hover:bg-green-mid"
                >
                  + Create New Bid
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#e0e8e4] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">DRAWAL POINT</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">TYPE</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">MW</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">PRICE (₹)</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">DURATION</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">SCHEDULE</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">STATUS</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">VALID TILL</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f4f2]">
                      {bidsList.filter(b => b.status === 'ACTIVE' || b.status === 'PENDING').map((bid) => {
                        const createdAt = new Date(bid.createdAt);
                        const expiryDate = new Date(createdAt);
                        expiryDate.setDate(expiryDate.getDate() + (bid.validityDays || 30));
                        const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                        
                        return (
                          <tr key={bid.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5 text-[13px] text-gray-900">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                {bid.drawalPoint || 'Not specified'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-[14px] text-gray-900">{bid.renewableType}</td>
                            <td className="px-4 py-3 font-semibold text-[14px] text-gray-900">{bid.mw} MW</td>
                            <td className="px-4 py-3 font-semibold text-[14px] text-green-600">₹{bid.price}</td>
                            <td className="px-4 py-3 text-[13px] text-gray-600">{bid.duration} months</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                bid.scheduleType === 'RTC' ? 'bg-purple-100 text-purple-700' :
                                bid.scheduleType === 'Peak' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {bid.scheduleType === 'RTC' ? 'RTC' : 
                                 bid.scheduleType === 'Peak' ? 'Peak' : 'Off-Peak'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                bid.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {bid.status === 'ACTIVE' ? 'Active' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[12px] font-medium ${daysLeft < 7 ? 'text-red-500' : daysLeft < 15 ? 'text-amber-500' : 'text-green-600'}`}>
                                {daysLeft} days
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => cancelBid(bid.id)}
                                  className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-600 text-[11px] font-semibold hover:bg-red-100 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button 
  onClick={() => viewBidOffers(bid)} 
  className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-semibold hover:bg-blue-100 transition-colors"
>
  View Offers
</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Accepted Bids Table */}
        {bidTab === 'accepted' && (
          <>
            {bidsList.filter(b => b.status === 'ACCEPTED').length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e0e8e4] p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-[16px] font-medium">No Accepted Bids</p>
                <p className="text-gray-400 text-[13px] mt-1">When suppliers accept your bids, they will appear here</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#e0e8e4] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">DRAWAL POINT</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">MW</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">PRICE (₹)</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">DURATION</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">SUPPLIER</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">ACCEPTED ON</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f4f2]">
                      {bidsList.filter(b => b.status === 'ACCEPTED').map((bid) => (
                        <tr key={bid.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-[13px] text-gray-900">{bid.drawalPoint || 'Not specified'}</td>
                          <td className="px-4 py-3 font-semibold text-[14px] text-gray-900">{bid.mw} MW</td>
                          <td className="px-4 py-3 font-semibold text-[14px] text-green-600">₹{bid.price}</td>
                          <td className="px-4 py-3 text-[13px] text-gray-600">{bid.duration} months</td>
                          <td className="px-4 py-3 text-[13px] font-medium text-gray-900">{bid.supplierName || 'Supplier'}</td>
                          <td className="px-4 py-3 text-[13px] text-gray-500">
                            {bid.acceptedAt ? new Date(bid.acceptedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => proceedToContract(bid)}
                              className="px-3 py-1.5 rounded-lg bg-green-dark text-white text-[11px] font-semibold hover:bg-green-mid transition-colors"
                            >
                              Create Contract
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* History Table */}
        {bidTab === 'history' && (
          <>
            {bidsList.filter(b => ['CANCELLED', 'EXPIRED', 'COMPLETED', 'WITHDRAWN'].includes(b.status)).length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e0e8e4] p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-[16px] font-medium">No History Found</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#e0e8e4] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">DRAWAL POINT</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">MW</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">PRICE (₹)</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">DURATION</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">STATUS</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">CLOSED ON</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f4f2]">
                      {bidsList.filter(b => ['CANCELLED', 'EXPIRED', 'COMPLETED', 'WITHDRAWN'].includes(b.status)).map((bid) => (
                        <tr key={bid.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-[13px] text-gray-900">{bid.drawalPoint || 'Not specified'}</td>
                          <td className="px-4 py-3 font-semibold text-[14px] text-gray-900">{bid.mw} MW</td>
                          <td className="px-4 py-3 font-semibold text-[14px] text-green-600">₹{bid.price}</td>
                          <td className="px-4 py-3 text-[13px] text-gray-600">{bid.duration} months</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              bid.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              bid.status === 'EXPIRED' ? 'bg-gray-100 text-gray-600' :
                              bid.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {bid.status === 'CANCELLED' ? 'Cancelled' :
                               bid.status === 'EXPIRED' ? 'Expired' :
                               bid.status === 'COMPLETED' ? 'Completed' : 'Withdrawn'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-gray-500">
                            {bid.updatedAt ? new Date(bid.updatedAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )}
  </>
)}

{/* CREATE BID MODAL */}
{isCreateBidModalOpen && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsCreateBidModalOpen(false)}>
    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="sticky top-0 bg-white border-b border-[#e0e8e4] px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="font-sora text-xl font-bold text-gray-900">Create New Bid</h3>
          <p className="text-[13px] text-gray-500">Submit a bid request to renewable energy suppliers</p>
        </div>
        <button onClick={() => setIsCreateBidModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleCreateBid} className="p-6 space-y-5">
        {/* Drawal Point - Where consumer needs power */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Drawal Point <span className="text-red-500">*</span>
          </label>
          <select
            value={bidFormData.drawalPoint}
            onChange={(e) => setBidFormData({...bidFormData, drawalPoint: e.target.value})}
            className="form-control"
            required
          >
            <option value="Bhadla Pooling Station">Bhadla Pooling Station (765kV)</option>
            <option value="Jaipur Substation">Jaipur Substation (400kV)</option>
            <option value="Jodhpur Substation">Jodhpur Substation (400kV)</option>
            <option value="Kota Substation">Kota Substation (400kV)</option>
            <option value="Ajmer Substation">Ajmer Substation (220kV)</option>
            <option value="Udaipur Substation">Udaipur Substation (220kV)</option>
            <option value="Bikaner Substation">Bikaner Substation (220kV)</option>
            <option value="Alwar Substation">Alwar Substation (132kV)</option>
            <option value="Bharatpur Substation">Bharatpur Substation (132kV)</option>
            <option value="Sikar Substation">Sikar Substation (132kV)</option>
            <option value="Other">Other (Please specify)</option>
          </select>
          {bidFormData.drawalPoint === 'Other' && (
            <input
              type="text"
              placeholder="Enter drawal point name"
              className="form-control mt-2"
              onChange={(e) => setBidFormData({...bidFormData, drawalPoint: e.target.value})}
            />
          )}
          <p className="text-[11px] text-gray-400 mt-1">Grid substation where your facility is connected</p>
        </div>


        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Renewable Energy Type <span className="text-red-500">*</span>
          </label>
          <select
            value={bidFormData.renewableType}
            onChange={(e) => setBidFormData({...bidFormData, renewableType: e.target.value})}
            className="form-control"
            required
          >
            <option value="Solar">Solar</option>
            <option value="Wind">Wind</option>
            <option value="Solar-Wind Hybrid">Solar-Wind Hybrid</option>
            <option value="Hydro">Hydro</option>
            <option value="Biomass">Biomass</option>
          </select>
          <p className="text-[11px] text-gray-400 mt-1">Select the type of renewable energy you want to procure</p>
        </div>

        {/* Quantity Required */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Quantity Required (MW) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={bidFormData.mw}
            onChange={(e) => setBidFormData({...bidFormData, mw: Number(e.target.value)})}
            min={1}
            max={500}
            step={1}
            className="form-control"
            required
          />
          <p className="text-[11px] text-gray-400 mt-1">Minimum 1 MW, Maximum 500 MW</p>
        </div>

        {/* Offered Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Offered Price (₹/unit) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={bidFormData.price}
            onChange={(e) => setBidFormData({...bidFormData, price: Number(e.target.value)})}
            min={0.01}
            step={0.01}
            className="form-control"
            required
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Contract Duration (months) <span className="text-red-500">*</span>
          </label>
          <select
            value={bidFormData.duration}
            onChange={(e) => setBidFormData({...bidFormData, duration: Number(e.target.value)})}
            className="form-control"
            required
          >
            <option value={12}>12 months (1 year)</option>
            <option value={24}>24 months (2 years)</option>
            <option value={36}>36 months (3 years)</option>
            <option value={48}>48 months (4 years)</option>
            <option value={60}>60 months (5 years)</option>
            <option value={120}>120 months (10 years)</option>
          </select>
        </div>

        {/* Schedule Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Schedule Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setBidFormData({...bidFormData, scheduleType: 'RTC'})}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                bidFormData.scheduleType === 'RTC'
                  ? 'bg-green-dark text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Round The Clock
            </button>
            <button
              type="button"
              onClick={() => setBidFormData({...bidFormData, scheduleType: 'Peak'})}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                bidFormData.scheduleType === 'Peak'
                  ? 'bg-green-dark text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Peak Hours
            </button>
            <button
              type="button"
              onClick={() => setBidFormData({...bidFormData, scheduleType: 'Off-Peak'})}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                bidFormData.scheduleType === 'Off-Peak'
                  ? 'bg-green-dark text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Off-Peak Hours
            </button>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Additional Message (Optional)
          </label>
          <textarea
            value={bidFormData.message}
            onChange={(e) => setBidFormData({...bidFormData, message: e.target.value})}
            rows={3}
            placeholder="Add any specific requirements or notes for suppliers..."
            className="form-control"
          />
        </div>

        {/* Bid Validity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Bid Validity (days) <span className="text-red-500">*</span>
          </label>
          <select
            value={bidFormData.validityDays}
            onChange={(e) => setBidFormData({...bidFormData, validityDays: Number(e.target.value)})}
            className="form-control"
            required
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={45}>45 days</option>
            <option value={60}>60 days</option>
          </select>
          <p className="text-[11px] text-gray-400 mt-1">Bid will expire after selected days if no response</p>
        </div>

        {/* Summary Card */}
        <div className="bg-green-pale rounded-xl p-4 border border-[#9fe1cb]">
          <p className="text-[12px] font-semibold text-gray-700 mb-2">Bid Summary</p>
          <div className="space-y-1 text-[13px]">
            <div className="flex justify-between">
              <span className="text-gray-600">Drawal Point:</span>
              <span className="font-semibold">{bidFormData.drawalPoint}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Volume:</span>
              <span className="font-semibold">{bidFormData.mw} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Offered Price:</span>
              <span className="font-semibold text-green-dark">₹{bidFormData.price}/unit</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Contract Duration:</span>
              <span className="font-semibold">{bidFormData.duration} months</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#9fe1cb]">
              <span className="font-bold text-gray-900">Estimated Annual Value:</span>
              <span className="font-bold text-green-dark">
                ₹{(bidFormData.mw * 1000 * 24 * 365 * bidFormData.price / 10000000).toFixed(2)} Cr
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmittingBid}
            className="flex-1 bg-green-dark text-white py-2.5 rounded-lg text-[13px] font-bold hover:bg-green-mid transition-colors flex items-center justify-center gap-2"
          >
            {isSubmittingBid ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Gavel className="w-4 h-4" />
                Submit Bid
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsCreateBidModalOpen(false)}
            className="flex-1 btn-outline py-2.5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}


{/* VIEW OFFERS MODAL - Shows all supplier offers for a specific bid */}
{/* {showViewOffersModal && selectedBidForView && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowViewOffersModal(false)}>
    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
      <div className="sticky top-0 bg-white border-b border-[#e0e8e4] px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="font-sora text-xl font-bold text-gray-900">Supplier Offers</h3>
          <p className="text-[13px] text-gray-500">
            {selectedBidForView.drawalPoint || 'Bid'} - {selectedBidForView.mw} MW @ ₹{selectedBidForView.price}/unit
          </p>
        </div>
        <button onClick={() => setShowViewOffersModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-6">
        {bidOffers.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-[11px] font-semibold text-green-700 uppercase">Best Offer</p>
                  <p className="text-[18px] font-bold text-gray-900">
                    {getBestOffer(bidOffers)?.supplierName} - ₹{getBestOffer(bidOffers)?.offeredPrice}/unit
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-500">Savings vs Target</p>
                <p className="text-[16px] font-bold text-green-600">
                  ₹{(selectedBidForView.price - getBestOffer(bidOffers)?.offeredPrice).toFixed(2)}/unit
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Supplier</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Offered MW</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Offered Price</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">vs Target</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Message</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Submitted</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2]">
              {bidOffers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      {offer.supplierName}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{offer.offeredMw} MW</td>
                  <td className="px-4 py-3 font-bold text-green-600">₹{offer.offeredPrice}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      offer.offeredPrice <= selectedBidForView.price 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {offer.offeredPrice <= selectedBidForView.price ? '↓ Better' : '↑ Higher'}
                      <span className="text-[9px]">
                        (₹{Math.abs(offer.offeredPrice - selectedBidForView.price).toFixed(2)})
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                    {offer.message || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-[12px]">
                    {new Date(offer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                      offer.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {offer.status === 'ACCEPTED' ? 'Accepted' :
                       offer.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {offer.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptOffer(offer.id, selectedBidForView.id)}
                          className="px-3 py-1.5 rounded-lg bg-green-dark text-white text-[11px] font-semibold hover:bg-green-mid"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => rejectOffer(offer.id)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 text-[11px] font-semibold hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {offer.status === 'ACCEPTED' && (
                      <button
                        onClick={() => proceedToContract(offer)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700"
                      >
                        Create Contract
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
)} */}



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

          

{/* GEOA FORM - Full Application Form */}
{docView === 'geoa-form' && (
  <div className="space-y-8 animate-fadeIn">
    {/* Header */}
    <div className="pb-4 border-b border-[#e0e8e4] flex items-center justify-between">
      <div>
        <h2 className="font-sora text-[22px] font-bold text-gray-900">Apply for Green Energy Open Access</h2>
        <p className="text-gray-500 text-[13px] mt-1">RERC GEOA Regulation 2022 — Fields marked <span className="text-red font-semibold">*</span> are mandatory.</p>
      </div>
      <div className="flex items-center gap-3">
        {geoaDraftSaved && <span className="text-[12px] text-green-dark font-semibold bg-green-pale px-3 py-1.5 rounded-lg border border-[#9fe1cb]">✓ Draft Saved</span>}
        <button onClick={() => setDocView('landing')} className="btn-outline flex items-center gap-2"><X className="w-4 h-4" /><span>Cancel</span></button>
      </div>
    </div>

    {/* Step indicator */}
    <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] p-5">
      <div className="flex items-center gap-0">
        {GEOA_STEPS.map((step, idx) => (
          <React.Fragment key={step.num}>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-all ${geoaStep > step.num ? 'bg-green-dark border-green-dark text-white' : geoaStep === step.num ? 'bg-white border-green-dark text-green-dark' : 'bg-white border-[#dde5e1] text-gray-400'}`}>
                {geoaStep > step.num ? <CheckCircle className="w-5 h-5" /> : step.num}
              </div>
              <span className={`text-[11px] font-semibold text-center leading-tight ${geoaStep >= step.num ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
            </div>
            {idx < GEOA_STEPS.length - 1 && <div className={`h-[2px] flex-1 mb-5 transition-all ${geoaStep > step.num ? 'bg-green-dark' : 'bg-[#e0e8e4]'}`} />}
          </React.Fragment>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">

        {/* STEP 1: Applicant Details */}
        {geoaStep === 1 && (
          <div className="form-card space-y-5">
            <div className="pb-4 border-b border-[#f0f4f2]">
              <h3 className="font-sora text-[16px] font-bold text-gray-900">Step 1: Applicant Details</h3>
              <p className="text-gray-500 text-[13px] mt-1">All fields are mandatory unless noted otherwise.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group">
                <label className="required">Applicant / Company Name</label>
                <input type="text" value={geoaApplicantName} onChange={e => setGeoaApplicantName(e.target.value)} placeholder="e.g. Bharat Industries Pvt Ltd" className={`form-control ${step1Errors.applicantName ? 'border-red-500' : ''}`} />
                {step1Errors.applicantName && <p className="text-red-500 text-[11px] mt-1">{step1Errors.applicantName}</p>}
              </div>
              <div className="form-group">
                <label className="required">Entity Type</label>
                <select value={geoaEntityType} onChange={e => setGeoaEntityType(e.target.value)} className="form-control">
                  <option value="Industrial">Industrial Consumer</option>
                  <option value="Commercial">Commercial Consumer</option>
                  <option value="Municipal">Municipal / Government</option>
                  <option value="SEZ">SEZ Unit</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group">
                <label className="required">CIN / GSTIN / Registration No.</label>
                <input type="text" value={geoaCin} onChange={e => setGeoaCin(e.target.value.toUpperCase())} placeholder="e.g. U40100RJ2020PTC012345" className={`form-control ${step1Errors.cin ? 'border-red-500' : ''}`} />
                {step1Errors.cin ? <p className="text-red-500 text-[11px] mt-1">{step1Errors.cin}</p> : <p className="text-[11px] text-gray-400 mt-1">CIN (21 chars) or GSTIN (15 chars) or Reg No. (min 10 chars)</p>}
              </div>
              <div className="form-group">
                <label className="required">DISCOM Consumer No.</label>
                <input type="text" value={geoaConsumerNo} onChange={e => setGeoaConsumerNo(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="1234567890" maxLength={10} className={`form-control ${step1Errors.consumerNo ? 'border-red-500' : ''}`} />
                {step1Errors.consumerNo ? <p className="text-red-500 text-[11px] mt-1">{step1Errors.consumerNo}</p> : <p className="text-[11px] text-gray-400 mt-1">Exactly 10 digits (numbers only)</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="required">Registered Address</label>
              <textarea value={geoaAddress} onChange={e => setGeoaAddress(e.target.value)} rows={2} placeholder="Plot No., Industrial Area, City, State, PIN" className={`form-control ${step1Errors.address ? 'border-red-500' : ''}`} />
              {step1Errors.address && <p className="text-red-500 text-[11px] mt-1">{step1Errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group">
                <label className="required">State</label>
                <select value={geoaState} onChange={e => setGeoaState(e.target.value)} className="form-control">
                  {['Rajasthan','Gujarat','Maharashtra','Madhya Pradesh','Uttar Pradesh','Tamil Nadu','Karnataka','Haryana','Punjab','Telangana'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="required">DISCOM / Utility</label>
                <select value={geoaDiscom} onChange={e => setGeoaDiscom(e.target.value)} className="form-control">
                  {['JVVNL','AVVNL','DVVNL','MSEDCL','PGVCL','TNEB','BESCOM'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="form-group">
                <label className="required">Contact Person</label>
                <input type="text" value={geoaContactPerson} onChange={e => setGeoaContactPerson(e.target.value)} placeholder="Full name" className={`form-control ${step1Errors.contactPerson ? 'border-red-500' : ''}`} />
                {step1Errors.contactPerson && <p className="text-red-500 text-[11px] mt-1">{step1Errors.contactPerson}</p>}
              </div>
              <div className="form-group">
                <label className="required">Email Address</label>
                <input type="email" value={geoaEmail} onChange={e => setGeoaEmail(e.target.value)} placeholder="company@example.com" className={`form-control ${step1Errors.email ? 'border-red-500' : ''}`} />
                {step1Errors.email && <p className="text-red-500 text-[11px] mt-1">{step1Errors.email}</p>}
              </div>
              <div className="form-group">
                <label className="required">Mobile No. <span className="text-gray-400 font-normal">(digits only)</span></label>
                <input type="text" value={geoaMobile} onChange={e => setGeoaMobile(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="9876543210" maxLength={10} className={`form-control ${step1Errors.mobile ? 'border-red-500' : ''}`} />
                {step1Errors.mobile ? <p className="text-red-500 text-[11px] mt-1">{step1Errors.mobile}</p> : <p className="text-[11px] text-gray-400 mt-1">10 digits, no +91 or spaces</p>}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={saveGeoaDraft} className="btn-outline flex items-center gap-2 text-[13px] px-5">
                <Save className="w-4 h-4" /><span>Save Draft</span>
              </button>
              <button type="button" onClick={() => { if (validateStep1()) setGeoaStep(2); }} className="btn-green flex items-center gap-2 px-8">
                <span>Next: Technical Details</span><ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Technical & Supply Details */}
        {geoaStep === 2 && (
          <div className="form-card space-y-5">
            <div className="pb-4 border-b border-[#f0f4f2]">
              <h3 className="font-sora text-[16px] font-bold text-gray-900">Step 2: Technical & Supply Details</h3>
              <p className="text-gray-500 text-[13px] mt-1">Select a registered supplier and specify grid parameters.</p>
            </div>

            {/* Supplier dropdown */}
            <div className="form-group">
              <label className="required">Select Renewable Supplier</label>
              <select value={geoaSelectedSupplierId} onChange={e => setGeoaSelectedSupplierId(e.target.value)} className={`form-control ${step2Errors.supplier ? 'border-red-500' : ''}`}>
                <option value="">— Choose a verified supplier —</option>
                {suppliers.filter(s => s.status === 'VERIFIED').map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.renewableType || 'Renewable'}) — {s.state}</option>
                ))}
              </select>
              {step2Errors.supplier && <p className="text-red-500 text-[11px] mt-1">{step2Errors.supplier}</p>}
              {geoaSelectedSupplierId && (() => {
                const sup = suppliers.find(s => s.id === geoaSelectedSupplierId);
                return sup ? (
                  <div className="mt-2 bg-green-pale border border-[#9fe1cb] rounded-lg p-3 text-[12px] text-green-dark">
                    <span className="font-semibold">{sup.name}</span> · {sup.state} · Capacity: {sup.generationCapacity || '—'} MW · Base Price: ₹{Number(sup.price || 4.2).toFixed(2)}/unit
                  </div>
                ) : null;
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="form-group">
                <label className="required">Connected Load (MW)</label>
                <input type="number" value={geoaLoadMw} onChange={e => setGeoaLoadMw(Number(e.target.value))} min={1} max={500} className={`form-control ${step2Errors.loadMw ? 'border-red-500' : ''}`} />
                {step2Errors.loadMw && <p className="text-red-500 text-[11px] mt-1">{step2Errors.loadMw}</p>}
              </div>
              <div className="form-group">
                <label className="required">Voltage Level</label>
                <select value={geoaVoltageLevel} onChange={e => setGeoaVoltageLevel(e.target.value)} className="form-control">
                  {['11kV','33kV','66kV','110kV','220kV','400kV','765kV'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="required">Renewable Source</label>
                <select value={geoaRenewableType} onChange={e => setGeoaRenewableType(e.target.value)} className="form-control">
                  {['Solar','Wind','Solar-Wind Hybrid','Small Hydro','Biomass'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group">
                <label className="required">Injection Point</label>
                <input type="text" value={geoaInjectionPoint} onChange={e => setGeoaInjectionPoint(e.target.value)} placeholder="Select a supplier above to auto-fill" className="form-control" />
              </div>
              <div className="form-group">
                <label className="required">Drawal Point</label>
                <input type="text" value={geoaDrawalPoint} onChange={e => setGeoaDrawalPoint(e.target.value)} placeholder="e.g. 400kV Jajpur Substation" className={`form-control ${step2Errors.drawalPoint ? 'border-red-500' : ''}`} />
                {step2Errors.drawalPoint && <p className="text-red-500 text-[11px] mt-1">{step2Errors.drawalPoint}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="form-group">
                <label className="required">Schedule Type</label>
                <select value={geoaScheduleType} onChange={e => setGeoaScheduleType(e.target.value)} className="form-control">
                  <option value="RTC">Round The Clock (RTC)</option>
                  <option value="Peak">Peak Hours</option>
                  <option value="Off-Peak">Off-Peak Hours</option>
                  <option value="Custom">Custom Time Block</option>
                </select>
              </div>
              <div className="form-group">
                <label className="required">Duration (Days)</label>
                <input type="number" value={geoaDurationDays} onChange={e => setGeoaDurationDays(Number(e.target.value))} min={30} className={`form-control ${step2Errors.duration ? 'border-red-500' : ''}`} />
                {step2Errors.duration && <p className="text-red-500 text-[11px] mt-1">{step2Errors.duration}</p>}
              </div>
              <div className="form-group">
                <label className="required">Proposed Start Date</label>
                <input type="date" value={geoaStartDate} onChange={e => setGeoaStartDate(e.target.value)} className={`form-control ${step2Errors.startDate ? 'border-red-500' : ''}`} />
                {step2Errors.startDate && <p className="text-red-500 text-[11px] mt-1">{step2Errors.startDate}</p>}
              </div>
            </div>

            {geoaScheduleType === 'Custom' && (
              <div className="form-group">
                <label className="required">Custom Time Blocks</label>
                <input type="text" value={geoaTimeBlocks} onChange={e => setGeoaTimeBlocks(e.target.value)} placeholder="e.g. 06:00-10:00, 18:00-22:00" className="form-control" />
                <p className="text-[11px] text-gray-400 mt-1">Format: HH:MM-HH:MM, comma-separated</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setGeoaStep(1)} className="btn-outline flex items-center gap-2"><ArrowRight className="w-4 h-4 rotate-180" /><span>Back</span></button>
                <button type="button" onClick={saveGeoaDraft} className="btn-outline flex items-center gap-2 text-[13px]"><Save className="w-4 h-4" /><span>Save Draft</span></button>
              </div>
              <button type="button" onClick={() => { if (validateStep2()) setGeoaStep(3); }} className="btn-green flex items-center gap-2 px-8">
                <span>Next: Review & Submit</span><ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Submit */}
        {geoaStep === 3 && (
          <div className="form-card space-y-6">
            <div className="pb-4 border-b border-[#f0f4f2]">
              <h3 className="font-sora text-[16px] font-bold text-gray-900">Step 3: Review & Submit Application</h3>
              <p className="text-gray-500 text-[13px] mt-1">Verify all details before final submission to RERC / Nodal Agency.</p>
            </div>

            {/* Review – Applicant */}
            <div>
              <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-pale text-green-dark text-[10px] font-bold flex items-center justify-center">1</span>Applicant Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { l: 'Company Name', v: geoaApplicantName },
                  { l: 'Entity Type', v: geoaEntityType },
                  { l: 'State', v: geoaState },
                  { l: 'DISCOM', v: geoaDiscom },
                  { l: 'Contact Person', v: geoaContactPerson },
                  { l: 'Email', v: geoaEmail },
                  { l: 'Mobile', v: geoaMobile },
                  { l: 'CIN/GSTIN', v: geoaCin },
                  { l: 'Address', v: geoaAddress },
                  { l: 'DISCOM No.', v: geoaConsumerNo },
                ].map(item => (
                  <div key={item.l} className="bg-gray-50 rounded-lg p-3 border border-[#e0e8e4]">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">{item.l}</p>
                    <p className="text-[13px] font-semibold text-gray-900 mt-0.5 truncate">{item.v || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Review – Technical */}
            <div>
              <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-pale text-green-dark text-[10px] font-bold flex items-center justify-center">2</span>Technical Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { l: 'Supplier', v: suppliers.find(s => s.id === geoaSelectedSupplierId)?.name || '—' },
                  { l: 'Load (MW)', v: `${geoaLoadMw} MW` },
                  { l: 'Voltage Level', v: geoaVoltageLevel },
                  { l: 'Renewable Source', v: geoaRenewableType },
                  { l: 'Schedule Type', v: geoaScheduleType },
                  { l: 'Duration', v: `${geoaDurationDays} Days` },
                  { l: 'Start Date', v: geoaStartDate },
                  { l: 'Injection Point', v: geoaInjectionPoint },
                  { l: 'Drawal Point', v: geoaDrawalPoint },
                ].map(item => (
                  <div key={item.l} className="bg-gray-50 rounded-lg p-3 border border-[#e0e8e4]">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">{item.l}</p>
                    <p className="text-[13px] font-semibold text-gray-900 mt-0.5 truncate">{item.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Declaration */}
            <div className="bg-green-pale border border-[#9fe1cb] rounded-lg p-4">
              <p className="text-[12px] text-green-dark leading-relaxed">
                <span className="font-bold">Declaration:</span> I hereby declare that the information provided is true and correct. 
                I understand that any false information may result in rejection or cancellation of Open Access permission.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setGeoaStep(2)} className="btn-outline flex items-center gap-2">
                <ArrowRight className="w-4 h-4 rotate-180" /><span>Back</span>
              </button>
              <button type="button" onClick={submitGeoaApplication} className="btn-green flex items-center gap-2 px-10 py-3 text-[15px]">
                <CheckCircle className="w-5 h-5" /><span>Submit GEOA Application</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar - Checklist */}
      <div className="space-y-4">
        <div className="tracker-card p-5 !mb-0">
          <h4 className="font-sora font-bold text-[14px] text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-dark" />Application Checklist
          </h4>
          <div className="space-y-2.5">
            {[
              { label: 'Applicant Details', done: step1Valid, step: 1 },
              { label: 'Technical Parameters', done: step2Valid, step: 2 },
              { label: 'Review Complete', done: geoaStep === 3, step: 3 },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-green-dark' : 'bg-gray-100 border border-[#dde5e1]'}`}>
                    {item.done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={item.done ? 'text-gray-900 font-medium' : 'text-gray-400'}>{item.label}</span>
                </div>
                {!item.done && geoaStep !== item.step && (
                  <button onClick={() => setGeoaStep(item.step)} className="text-[11px] text-green-dark font-semibold hover:underline">Edit</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-light border border-[#b5d4f4] rounded-[var(--radius-md)] p-4">
          <p className="text-[12px] text-blue-dark font-semibold mb-1">RERC Helpdesk</p>
          <p className="text-[12px] text-blue-dark">Contact: <span className="font-semibold">geoa@rerc.rajasthan.gov.in</span> or <span className="font-semibold">0141-2740011</span></p>
        </div>
      </div>
    </div>
  </div>
)}

{/* DOCUMENT UPLOAD CONTENT */}
{docView === 'doc-upload' && (
  <div className="space-y-8 animate-fadeIn">
    <div className="pb-4 border-b border-[#e0e8e4] flex items-center justify-between">
      <div>
        <h2 className="font-sora text-[22px] font-bold text-gray-900">Upload Regulatory Documents</h2>
        <p className="text-gray-500 text-[13px] mt-1">Submit compliance files to the Nodal Agency verification vault.</p>
      </div>
      <button onClick={() => setDocView('landing')} className="btn-outline flex items-center gap-2">
        <X className="w-4 h-4" /><span>Back</span>
      </button>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="form-card lg:col-span-2">
        <form onSubmit={handleDocUpload} className="space-y-5">
          <div className="form-group">
            <label className="required">Document Title</label>
            <input type="text" placeholder="e.g. Trilateral Connection Agreement..." value={docName} onChange={(e) => setDocName(e.target.value)} required className="form-control" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-group">
              <label className="required">Category</label>
              <select value={docCat} onChange={(e) => setDocCat(e.target.value)} className="form-control">
                <option value="PPA">Power Purchase Agreement (PPA)</option>
                <option value="OA_APP">Open Access Registration Request</option>
                <option value="BG">Bank Guarantee Security Record</option>
                <option value="AUTH_LETTER">Board Authorization Clearance</option>
                <option value="REC">Renewable Energy Certificate</option>
                <option value="ANNEXURE">Annexure Documents</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-outline w-full flex items-center justify-center space-x-2 h-[42px]">
                <Upload className="w-4 h-4" /><span>Upload & File Metadata</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      <div className="tracker-card flex flex-col justify-between !mb-0">
        <div>
          <h3 className="font-sora font-bold text-[16px] text-gray-900 mb-2">Grid Compliance Vault</h3>
          <div className="mt-4 space-y-2">
            {[
              { label: 'RLDC NOC', status: 'VERIFIED' },
              { label: 'SLDC Approval', status: 'PENDING' },
              { label: 'DISCOM Consent', status: 'VERIFIED' }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#f0f4f2]">
                <span className="text-[13px] text-gray-600">{item.label}</span>
                <span className={`badge ${item.status === 'VERIFIED' ? 'badge-green' : 'badge-amber'}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-blue-light p-4 rounded-lg border border-[#b5d4f4] mt-6">
          <p className="text-[12px] text-blue-dark">★ Uploaded files visible to NLDC administrators immediately. PENDING → VERIFIED after audit.</p>
        </div>
      </div>
    </div>
    <div className="space-y-4">
      <h3 className="font-sora text-[16px] font-bold text-gray-900">Document Registry</h3>
      <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>{['Document Name', 'Category', 'Uploaded On', 'Status'].map(h => <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
            {uploadedDocs.map((doc, i) => (
              <tr key={doc.id} className={`hover:bg-gray-50 ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                <td className="py-3.5 px-5 font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-gray-500" /></div>{doc.name}
                </td>
                <td className="py-3.5 px-5 text-gray-600">{doc.category}</td>
                <td className="py-3.5 px-5 text-gray-500">{doc.date}</td>
                <td className="py-3.5 px-5"><span className={`badge ${doc.status === 'VERIFIED' ? 'badge-green' : 'badge-amber'}`}>{doc.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
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

      <OpenAccessApplicationForm />

    </>
  );
};