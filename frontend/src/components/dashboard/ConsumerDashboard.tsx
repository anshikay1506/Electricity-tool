import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Zap, ShieldAlert, Award, Clock,
  Search, ArrowRight, Upload, DollarSign, BarChart2, Settings,
  FileText, CheckCircle, ChevronRight, ClipboardList, AlertCircle, X, Eye
} from 'lucide-react';


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
}

// ─── GEOA types ──────────────────────────────────────────────────────────────
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

export const ConsumerDashboard: React.FC<ConsumerDashboardProps> = ({ activeTab, setTab }) => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [schedules] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<DraftApplication[]>([]);

  // Consumer workflow state
  const [consumerName, setConsumerName] = useState(profile?.name || user?.name || '');
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

  // Add these with your other state declarations (around line 30)
const [validationErrors, setValidationErrors] = useState<{
  mobile?: string;
  legalIdentifier?: string;
  discomConsumerNo?: string;
}>({});

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

  // Regulatory document upload state
  const [uploadedDocs, setUploadedDocs] = useState([
    { id: 'doc-1', name: 'PPA Agreement', category: 'PPA', status: 'VERIFIED', date: '2026-05-10' },
    { id: 'doc-2', name: 'Open Access application.pdf', category: 'OA_APP', status: 'VERIFIED', date: '2026-05-11' },
    { id: 'doc-3', name: 'Bank Guarantee Security.pdf', category: 'BG', status: 'PENDING', date: '2026-05-18' }
  ]);
  const [docName, setDocName] = useState('');
  const [docCat, setDocCat] = useState('PPA');


  useEffect(() => {
    const savedDrafts = localStorage.getItem('openAccessDrafts');
    if (savedDrafts) {
      setDrafts(JSON.parse(savedDrafts));
    }
  }, []);

  // Save drafts to localStorage
  const saveDraftsToStorage = (updatedDrafts: DraftApplication[]) => {
    localStorage.setItem('openAccessDrafts', JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
  };

  const validateMobileNumber = (mobile: string): boolean => {
  if (!mobile) return true; 
  const mobileRegex = /^\+91[0-9]{10}$/;
  return mobileRegex.test(mobile);
};

const validateLegalIdentifier = (identifier: string): boolean => {
  if (!identifier) return true; 
  const cinRegex = /^[A-Za-z0-9]{10}$/;
  return cinRegex.test(identifier);
};

const validateDiscomConsumerNo = (consumerNo: string): boolean => {
  const consumerNoRegex = /^\d{10}$/;
  return consumerNoRegex.test(consumerNo);
};


const validateAllFields = (): boolean => {
    const errors: { mobile?: string; legalIdentifier?: string; discomConsumerNo?: string } = {};
    
    if (!contactMobile) {
      errors.mobile = 'Mobile number is required';
    } else if (!validateMobileNumber(contactMobile)) {
      errors.mobile = 'Mobile number must be exactly 10 digits (numbers only, no +91 or spaces)';
    }
    
    if (!legalIdentifier) {
      errors.legalIdentifier = 'CIN / GSTIN / Registration No. is required';
    } else if (!validateLegalIdentifier(legalIdentifier)) {
      errors.legalIdentifier = 'CIN must be 21 characters or GSTIN must be 15 characters (alphanumeric)';
    }


    if (!legalIdentifier) {
      errors.legalIdentifier = 'CIN / GSTIN / Registration No. is required';
    } else if (!validateLegalIdentifier(legalIdentifier)) {
      errors.legalIdentifier = 'CIN must be 21 characters or GSTIN must be 15 characters (alphanumeric)';
    }
    
    // DISCOM Consumer No validation - MANDATORY
    if (!discomConsumerNo) {
      errors.discomConsumerNo = 'DISCOM Consumer No. is required';
    } else if (!validateDiscomConsumerNo(discomConsumerNo)) {
      errors.discomConsumerNo = 'DISCOM Consumer No. must be exactly 10 digits (numbers only)';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveAsDraft = () => {
    if (!currentSupplier) {
      setOpenContractWarning('Select a supplier first');
      return;
    }
    
    const newDraft: DraftApplication = {
      id: `draft-${Date.now()}`,
      supplierId: currentSupplier.id,
      supplierName: currentSupplier.name,
      mw: requestMw,
      duration: requestDuration,
      startDate: requestStartDate,
      price: requestedPrice,
      timeBlocks: requestTimeBlocks,
      deliveryState: requestDeliveryState,
      notes: requestNotes,
      contactMobile: contactMobile,
      legalIdentifier: legalIdentifier,
      discomConsumerNo: discomConsumerNo,
      savedAt: new Date().toLocaleString()
    };

    const updatedDrafts = [newDraft, ...drafts];
    saveDraftsToStorage(updatedDrafts);
    alert('Application saved as draft!');
    setIsRequestFormOpen(false);
  };

  const loadDraft = (draft: DraftApplication) => {
    setSelectedSupplierId(draft.supplierId);
    setRequestMw(draft.mw);
    setRequestDuration(draft.duration);
    setRequestStartDate(draft.startDate);
    setRequestedPrice(draft.price);
    setRequestTimeBlocks(draft.timeBlocks);
    setRequestDeliveryState(draft.deliveryState);
    setRequestNotes(draft.notes);
    setContactMobile(draft.contactMobile);
    setLegalIdentifier(draft.legalIdentifier);
    setDiscomConsumerNo(draft.discomConsumerNo);
    setIsRequestFormOpen(true);
    setTab('open-access');
  };

  const deleteDraft = (draftId: string) => {
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    saveDraftsToStorage(updatedDrafts);
  };

  const submitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    if (!validateAllFields()) {
      return;
    }
    
    if (!currentSupplier) { 
      setOpenContractWarning('Select a supplier to proceed.'); 
      return; 
    }

    (async () => {
      try {
        const body = {
          supplierId: currentSupplier.id,
          mw: requestMw,
          injectionPoint: currentSupplier.injectionPoint || requestDeliveryState,
          drawalPoint: requestDeliveryState || profile?.drawalPoint || '400kV Jajpur Substation',
          durationDays: requestDuration,
          requestedPrice: requestedPrice,
          consumerName: consumerName || profile?.name || user?.name || 'Consumer',
          applicantName: consumerName || profile?.name,
          entityType: 'Industrial',
          legalIdentifier: legalIdentifier,
          discomConsumerNo: discomConsumerNo,
          registeredAddress: profile?.address || '',
          state: profile?.state || 'Rajasthan',
          discom: 'JVVNL',
          contactPerson: consumerName || profile?.name,
          contactEmail: profile?.email || user?.email,
          contactMobile: contactMobile,
          voltageLevel: '33kV',
          renewableType: currentSupplier.renewableType || 'Solar',
          scheduleType: requestScheduleType,
          proposedStartDate: requestStartDate,
          timeBlocks: requestTimeBlocks,
          documentChecklist: []
        };
        
        const res = await fetch(`${API_BASE}/api/applications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        });
        
        if (!res.ok) { 
          const error = await res.json();
          setOpenContractWarning(error.error || 'Unable to send request to supplier.');
          return; 
        }
        
        const data = await res.json();
        const newApp = mapBackendApplication({
          ...data.application,
          consumerName: consumerName || profile?.name || user?.name || 'Consumer',
          supplierName: currentSupplier.name,
          supplierState: currentSupplier.state,
          basePrice: currentSupplier.price,
          oaCharges: calculateOaCharges(currentSupplier),
          finalPrice: getFinalDeliveredPrice(currentSupplier),
          duration: `${requestDuration} Days`,
          requestStatus: 'Pending',
        });
        
        setApplications([newApp, ...applications]);
        setIsRequestFormOpen(false);
        setTab('my-applications');
        loadApplications();
        setContactMobile('');
        setLegalIdentifier('');
        setDiscomConsumerNo('');
        setValidationErrors({});
        
        alert('Application submitted successfully!');
        
      } catch (error) {
        setOpenContractWarning('Unable to send request to supplier.');
      }
    })();
  };


  // ─── GEOA Application state ───────────────────────────────────────────────
  const [docView, setDocView] = useState<'landing' | 'geoa-form' | 'doc-upload'>('landing');
  const [geoaStep, setGeoaStep] = useState(1);
  const [geoaApplications, setGeoaApplications] = useState<GeoaApplication[]>([
    {
      id: 'geoa-1',
      refNo: 'RERC/GEOA/2026/0041',
      applicantName: 'Consumer Enterprise Pvt Ltd',
      entityType: 'Industrial',
      loadMw: 20,
      injectionPoint: 'Bhadla Pooling Station, 765kV',
      drawalPoint: '400kV Jajpur Substation',
      scheduleType: 'RTC',
      startDate: '2026-06-01',
      durationDays: 365,
      voltageLevel: '33kV',
      state: 'Rajasthan',
      submittedOn: '2026-05-15',
      status: 'UNDER_REVIEW',
      docs: [
        { key: 'ppa', label: 'Power Purchase Agreement (PPA)', required: true, fileName: 'PPA_Agreement_2026.pdf', status: 'uploaded' },
        { key: 'bg', label: 'Bank Guarantee / Security Deposit', required: true, fileName: 'BG_Record.pdf', status: 'uploaded' },
        { key: 'auth', label: 'Board Authorization Letter', required: true, fileName: '', status: 'pending' },
        { key: 'oa_app', label: 'Open Access Application Form', required: true, fileName: 'OA_Application.pdf', status: 'uploaded' },
        { key: 'rec', label: 'Renewable Energy Certificate (REC)', required: false, fileName: '', status: 'pending' },
      ]
    }
  ]);

  // GEOA form fields – Step 1: Applicant Details
  const [geoaApplicantName, setGeoaApplicantName] = useState(profile?.name || '');
  const [geoaEntityType, setGeoaEntityType] = useState('Industrial');
  const [geoaCin, setGeoaCin] = useState('');
  const [geoaAddress, setGeoaAddress] = useState('');
  const [geoaState, setGeoaState] = useState('Rajasthan');
  const [geoaDiscom, setGeoaDiscom] = useState('JVVNL');
  const [geoaConsumerNo, setGeoaConsumerNo] = useState('');
  const [geoaContactPerson, setGeoaContactPerson] = useState('');
  const [geoaEmail, setGeoaEmail] = useState('');
  const [geoaMobile, setGeoaMobile] = useState('');

  // GEOA form fields – Step 2: Technical Details
  const [geoaLoadMw, setGeoaLoadMw] = useState(10);
  const [geoaInjectionPoint, setGeoaInjectionPoint] = useState('Bhadla Pooling Station, 765kV');
  const [geoaDrawalPoint, setGeoaDrawalPoint] = useState('400kV Jajpur Substation');
  const [geoaScheduleType, setGeoaScheduleType] = useState('RTC');
  const [geoaDurationDays, setGeoaDurationDays] = useState(365);
  const [geoaStartDate, setGeoaStartDate] = useState('2026-06-01');
  const [geoaTimeBlocks, setGeoaTimeBlocks] = useState('10:00-18:00');
  const [geoaVoltageLevel, setGeoaVoltageLevel] = useState('33kV');
  const [geoaRenewableType, setGeoaRenewableType] = useState('Solar');

  // GEOA form fields – Step 3: Document uploads (simulated)
  const [geoaDocs, setGeoaDocs] = useState<GeoaDocField[]>([
    { key: 'ppa', label: 'Power Purchase Agreement (PPA)', required: true, fileName: '', status: 'pending' },
    { key: 'bg', label: 'Bank Guarantee / Security Deposit', required: true, fileName: '', status: 'pending' },
    { key: 'auth', label: 'Board Authorization Letter', required: true, fileName: '', status: 'pending' },
    { key: 'oa_app', label: 'GEOA Application Form (Signed)', required: true, fileName: '', status: 'pending' },
    { key: 'rec', label: 'Renewable Energy Certificate (REC)', required: false, fileName: '', status: 'pending' },
    { key: 'annexure_c', label: 'Annexure-C (Trilateral Agreement)', required: true, fileName: '', status: 'pending' },
    { key: 'annexure_d', label: 'Annexure-D (Connection Agreement)', required: false, fileName: '', status: 'pending' },
    { key: 'id_proof', label: 'Authorised Signatory ID Proof', required: true, fileName: '', status: 'pending' },
  ]);

  const [geoaStep1Valid, setGeoaStep1Valid] = useState(false);
  const [geoaStep2Valid, setGeoaStep2Valid] = useState(false);
  const [geoaSubmitSuccess, setGeoaSubmitSuccess] = useState(false);

  const GEOA_STEPS = [
    { num: 1, label: 'Applicant Details' },
    { num: 2, label: 'Technical Details' },
    { num: 3, label: 'Upload Documents' },
    { num: 4, label: 'Review & Submit' },
  ];

  const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

  const currentSupplier = suppliers.find((item) => item.id === selectedSupplierId) || null;

  // Pre-fill GEOA name from profile
  useEffect(() => {
    if (profile?.name && !geoaApplicantName) setGeoaApplicantName(profile.name);
    if (profile?.name && !consumerName) setConsumerName(profile.name);
    if (profile?.email && !geoaEmail) setGeoaEmail(profile.email);
    if (profile?.state) setGeoaState(profile.state);
  }, [profile, geoaApplicantName, geoaEmail, consumerName]);

  // Validate step 1
  useEffect(() => {
    setGeoaStep1Valid(!!(geoaApplicantName && geoaEntityType && geoaState && geoaContactPerson && geoaEmail && geoaMobile));
  }, [geoaApplicantName, geoaEntityType, geoaState, geoaContactPerson, geoaEmail, geoaMobile]);

  // Validate step 2
  useEffect(() => {
    setGeoaStep2Valid(!!(geoaLoadMw && geoaInjectionPoint && geoaDrawalPoint && geoaScheduleType && geoaDurationDays && geoaStartDate && geoaVoltageLevel));
  }, [geoaLoadMw, geoaInjectionPoint, geoaDrawalPoint, geoaScheduleType, geoaDurationDays, geoaStartDate, geoaVoltageLevel]);

  // Fetch supplier details when viewing profile
  useEffect(() => {
    if (activeTab === 'supplier-profile' && selectedSupplierId) {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/suppliers/${selectedSupplierId}`, {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
          });
          if (!res.ok) { setSupplierDetails(null); return; }
          const data = await res.json();
          setSupplierDetails(data);
        } catch { setSupplierDetails(null); }
      })();
    } else {
      setSupplierDetails(null);
    }
  }, [activeTab, selectedSupplierId, token]);

  const viewApplicationDetails = (applicationId: string) => {
  const app = applications.find(a => a.id === applicationId);
  if (app) {
    setSelectedApplication(app);
    setTab('application-details');
  }
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
    const contractStatus = statusLabel === 'APPROVED'
      ? 'Active Contract'
      : statusLabel === 'REJECTED'
      ? 'Rejected'
      : statusLabel === 'SUBMITTED'
      ? 'Supplier Review'
      : statusLabel;

    return {
      ...app,
      requestedMw: app.mw || 0,
      duration: `${app.durationDays || 0} Days`,
      basePrice: app.basePrice ?? 4.2,
      oaCharges: app.oaCharges ?? 1.1,
      finalPrice: app.finalPrice ?? 5.3,
      requestedPrice: app.requestedPrice || 0,
      requestStatus: app.requestStatus || statusLabel,
      // contractStatus: app.contractStatus || contractStatus,
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
    } catch {
      // keep existing applications if fetch fails
    }
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
  } catch (error) {
    console.error("Failed to refresh applications:", error);
  }
};



// Add this to load applications initially and when tab changes
useEffect(() => {
  if (activeTab === 'my-applications') {
    refreshApplications();
  }
}, [activeTab]);

  const openSupplierProfile = (supplierId: string) => { setSelectedSupplierId(supplierId); setTab('supplier-profile'); };


  const submitContractRequest = (e: React.FormEvent) => {
  e.preventDefault();
  
  setValidationErrors({});
  
  const errors: { mobile?: string; legalIdentifier?: string; discomConsumerNo?: string } = {};
  
  if (contactMobile && !validateMobileNumber(contactMobile)) {
    errors.mobile = 'Mobile number must start with +91 followed by exactly 10 digits (e.g., +919876543210)';
  }
  
  if (legalIdentifier && !validateLegalIdentifier(legalIdentifier)) {
    errors.legalIdentifier = 'CIN / GSTIN / Registration No. must be exactly 10 alphanumeric characters (e.g., ABC123XYZ9)';
  }
  
  if (discomConsumerNo && !validateDiscomConsumerNo(discomConsumerNo)) {
    errors.discomConsumerNo = 'DISCOM Consumer No. must be exactly 10 digits (only numbers 0-9)';
  }
  
  if (Object.keys(errors).length > 0) {
    setValidationErrors(errors);
    return;
  }
  
  if (!currentSupplier) { 
    setOpenContractWarning('Select a supplier to proceed.'); 
    return; 
  }
  
  (async () => {
    try {
      const body = {
        supplierId: currentSupplier.id,
        mw: requestMw,
        injectionPoint: currentSupplier.injectionPoint || requestDeliveryState,
        drawalPoint: requestDeliveryState || profile?.drawalPoint || '400kV Jajpur Substation',
        durationDays: requestDuration,
        requestedPrice: requestedPrice,
        consumerName: consumerName || profile?.name || user?.name || 'Consumer',
        applicantName: consumerName || profile?.name,
        entityType: 'Industrial',
        legalIdentifier: legalIdentifier || undefined,
        discomConsumerNo: discomConsumerNo || undefined,
        registeredAddress: profile?.address || '',
        state: profile?.state || 'Rajasthan',
        discom: 'JVVNL',
        contactPerson: consumerName || profile?.name,
        contactEmail: profile?.email || user?.email,
        contactMobile: contactMobile || undefined,
        voltageLevel: '33kV',
        renewableType: currentSupplier.renewableType || 'Solar',
        scheduleType: requestScheduleType,
        proposedStartDate: requestStartDate,
        timeBlocks: requestTimeBlocks,
        documentChecklist: []
      };
      
      const res = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) { 
        const error = await res.json();
        setOpenContractWarning(error.error || 'Unable to send request to supplier.');
        return; 
      }
      
      const data = await res.json();
      const newApp = mapBackendApplication({
        ...data.application,
        consumerName: consumerName || profile?.name || user?.name || 'Consumer',
        supplierName: currentSupplier.name,
        supplierState: currentSupplier.state,
        basePrice: currentSupplier.price,
        oaCharges: calculateOaCharges(currentSupplier),
        finalPrice: getFinalDeliveredPrice(currentSupplier),
        duration: `${requestDuration} Days`,
        requestStatus: 'Pending',
      });
      
      setApplications([newApp, ...applications]);
      setIsRequestFormOpen(false);
      setTab('my-applications');
      loadApplications();
      
      // Reset form fields
      setContactMobile('');
      setLegalIdentifier('');
      setDiscomConsumerNo('');
      setValidationErrors({});
      
    } catch (error) {
      setOpenContractWarning('Unable to send request to supplier.');
    }
  })();
};

  const handleDocUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: docName,
      category: docCat,
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0]
    };
    setUploadedDocs(prev => [newDoc, ...prev]);
    setDocName('');
    setDocCat('PPA');
  };

  const handlePayBill = (bill: any) => {
    setPayAmount(bill.amount);
    setPayRef(`TRX${Date.now()}`);
    setIsPaying(true);
  };

  const submitPayment = () => {
    setPayments(prev => [{ id: `pay-${Date.now()}`, reference: payRef || `TRX${Date.now()}`, createdAt: new Date().toISOString().split('T')[0], amount: payAmount, status: 'COMPLETED' }, ...prev]);
    setIsPaying(false);
    setPayAmount(0);
    setPayRef('');
  };

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
    setUploadedDocs([{ id: `doc-${Date.now()}`, name: docName, category: docCat, status: 'PENDING', date: new Date().toISOString().split('T')[0] }, ...uploadedDocs]);
    setDocName('');
  }, []);

  // ─── GEOA helpers ─────────────────────────────────────────────────────────
  const handleGeoaDocSimulate = (key: string, fileName: string) => {
    setGeoaDocs(prev => prev.map(d => d.key === key ? { ...d, fileName, status: 'uploaded' } : d));
  };

  const resetGeoaForm = () => {
    setGeoaStep(1); setGeoaSubmitSuccess(false);
    setGeoaDocs(prev => prev.map(d => ({ ...d, fileName: '', status: 'pending' })));
    setGeoaCin(''); setGeoaAddress(''); setGeoaConsumerNo('');
    setGeoaContactPerson(''); setGeoaMobile('');
  };

  const submitGeoaApplication = () => {
    const newApp: GeoaApplication = {
      id: `geoa-${Date.now()}`,
      refNo: `RERC/GEOA/2026/${String(Math.floor(Math.random() * 9000) + 1000)}`,
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
    setGeoaApplications(prev => [newApp, ...prev]);
    setGeoaSubmitSuccess(true);
  };

  const geoaStatusBadge = (status: GeoaApplication['status']) => {
    const map: Record<string, string> = {
      SUBMITTED: 'badge-blue',
      UNDER_REVIEW: 'badge-amber',
      NOC_ISSUED: 'badge-amber',
      APPROVED: 'badge-green',
      REJECTED: 'badge-red',
    };
    return map[status] || 'badge-amber';
  };

  const filteredSuppliers = suppliers.filter((s: any) => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.state?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = renewableTypeFilter === 'All' || s.renewableType === renewableTypeFilter;
    const isApproved = s.status === 'VERIFIED' || s.oaStatus === 'APPROVED';
    return matchesSearch && matchesType && isApproved;
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DASHBOARD TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'dashboard') {
    return (
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
          <div className="metric-card border-t-[3px] border-t-amber">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">CURRENT LOAD</span>
              <Zap className="w-4 h-4 text-amber" />
            </div>
            <p className="font-sora text-[24px] font-bold text-gray-900">20 <span className="text-[14px]">MW</span></p>
            <p className="text-[11px] text-gray-500 mt-1">RTC Grid Drawal Contracted</p>
          </div>
          <div className="metric-card border-t-[3px] border-t-green-mid">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">RENEWABLE MIX</span>
              <Award className="w-4 h-4 text-green-mid" />
            </div>
            <p className="font-sora text-[24px] font-bold text-gray-900">85 <span className="text-[14px]">%</span></p>
            <p className="text-[11px] text-gray-500 mt-1">Target Carbon Mitigation Match</p>
          </div>
          <div className="metric-card border-t-[3px] border-t-green-mid">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">SAVINGS TO DATE</span>
              <DollarSign className="w-4 h-4 text-green-mid" />
            </div>
            <p className="font-sora text-[24px] font-bold text-gray-900">₹4.8<span className="text-[14px]">L</span></p>
            <p className="text-[11px] text-gray-500 mt-1">Compared to Local Utility Tariff</p>
          </div>
          <div className="metric-card border-t-[3px] border-t-blue-dark">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">ACTIVE SUPPLIER</span>
              <ShieldAlert className="w-4 h-4 text-blue-dark" />
            </div>
            <p className="font-sora text-[16px] font-bold text-gray-900 leading-tight">Preferred Supplier Network</p>
            <p className="text-[11px] text-gray-500 mt-1">Industry-grade procurement pool</p>
          </div>
          <div className="metric-card border-t-[3px] border-t-red">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">PENDING DOCS</span>
              <Clock className="w-4 h-4 text-red animate-pulse" />
            </div>
            <p className="font-sora text-[24px] font-bold text-gray-900">1 <span className="text-[14px]">Doc</span></p>
            <p className="text-[11px] text-gray-500 mt-1">Requires Bank Security approval</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="tracker-card lg:col-span-2 flex flex-col justify-between !mb-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-sora font-bold text-[16px] text-gray-900">Intraday Energy Exchange Profiles</h3>
                <p className="text-gray-500 text-[12px] mt-0.5">Real-time scheduling dispatch vs industrial demand limits (MWh)</p>
              </div>
              <BarChart2 className="w-5 h-5 text-green-dark" />
            </div>
            <div className="relative h-64 flex items-end justify-between px-2 pt-6">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-12 pt-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border-t border-dashed border-[#e0e8e4] w-full flex justify-between text-[10px] text-gray-400">
                    <span>{80 - i * 20} MW</span>
                  </div>
                ))}
              </div>
              {[40, 50, 62, 75, 80, 72, 58, 64, 70, 75, 68, 55].map((val, idx) => {
                const hour = idx * 2;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 mx-1 z-10 group relative">
                    <div className="absolute -top-12 scale-0 group-hover:scale-100 transition-all bg-gray-900 px-2 py-1.5 rounded-[6px] text-[10px] text-white whitespace-nowrap z-30 shadow-md">
                      Cons: {val} MW<br />Solar Match: {Math.round(val * 0.85)} MW
                    </div>
                    <div className="w-full flex flex-col justify-end space-y-[1px]" style={{ height: `${val * 2}px` }}>
                      <div className="w-full bg-green-mid rounded-t-[2px] transition-all opacity-90 group-hover:opacity-100" style={{ height: '85%' }}></div>
                      <div className="w-full bg-amber rounded-b-[2px] transition-all opacity-90 group-hover:opacity-100" style={{ height: '15%' }}></div>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-2">{hour}:00</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center space-x-6 text-[11px] mt-6 pt-4 border-t border-[#e0e8e4]">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-mid"></span>
                <span className="text-gray-600 font-medium">Green Open Access Match (85%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber"></span>
                <span className="text-gray-600 font-medium">Conventional Grid Fallback (15%)</span>
              </div>
            </div>
          </div>

          <div className="tracker-card flex flex-col justify-between !mb-0">
            <div>
              <h3 className="font-sora font-bold text-[16px] text-gray-900 mb-1">Transmission Path Visualizer</h3>
              <p className="text-gray-500 text-[12px]">Real-time corridor feasibility and grid routing</p>
            </div>
            <div className="my-6 bg-gray-50 rounded-xl p-5 border border-[#e0e8e4] flex flex-col space-y-5 text-[12px] relative overflow-hidden">
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-green-pale z-0 -mt-2"></div>
              <div className="flex items-center justify-between z-10">
                <div className="bg-white border border-[#e0e8e4] p-3 rounded-lg text-center w-[100px] shadow-sm">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase">Injection</p>
                  <p className="font-bold text-gray-900 mt-1 leading-tight">Bhadla Pool</p>
                  <p className="text-[10px] text-green-dark font-medium mt-1">765kV Node</p>
                </div>
                <ArrowRight className="w-5 h-5 text-green-mid animate-bounce" />
                <div className="bg-white border border-[#e0e8e4] p-3 rounded-lg text-center w-[100px] shadow-sm">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase">Drawal</p>
                  <p className="font-bold text-gray-900 mt-1 leading-tight">Jajpur Sub</p>
                  <p className="text-[10px] text-green-dark font-medium mt-1">400kV Node</p>
                </div>
              </div>
              <div className="border-t border-[#e0e8e4] pt-4 flex flex-col space-y-2 text-[12px] text-gray-600">
                <div className="flex justify-between"><span className="font-medium">Corridor Loss:</span><span className="text-amber font-bold">3.2% (Approved)</span></div>
                <div className="flex justify-between"><span className="font-medium">Available Transfer Cap:</span><span className="text-green-dark font-bold">450 MW</span></div>
                <div className="flex justify-between"><span className="font-medium">Wheeling Congestion:</span><span className="text-green-dark font-bold">Normal (0.01%)</span></div>
              </div>
            </div>
            <button onClick={() => setTab('my-applications')} className="btn-outline w-full flex items-center justify-center space-x-2">
              <span>Explore Marketplace Bids</span><ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // OPEN-ACCESS TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'open-access') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Open Access Marketplace</h2>
          <p className="text-gray-500 text-[13px] mt-1">Browse only admin approved renewable suppliers.</p>
        </div>

        {drafts.length > 0 && (
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Save className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">Saved Drafts ({drafts.length})</h3>
            </div>
            <div className="space-y-2">
              {drafts.map(draft => (
                <div key={draft.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-200">
                  <div>
                    <p className="font-semibold text-gray-900">{draft.supplierName}</p>
                    <p className="text-xs text-gray-500">{draft.mw} MW • {draft.duration} days • Saved: {draft.savedAt}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadDraft(draft)} className="px-3 py-1 text-sm bg-amber-500 text-white rounded hover:bg-amber-600">
                      Load Draft
                    </button>
                    <button onClick={() => deleteDraft(draft.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-[var(--radius-md)] border border-[#e0e8e4] shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-[13px] text-gray-400 w-[18px] h-[18px]" />
            <input type="text" placeholder="Search supplier or state..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="form-control pl-10" />
          </div>
          <select value={renewableTypeFilter} onChange={(e) => setRenewableTypeFilter(e.target.value)} className="form-control">
            <option value="All">All Renewable Types</option>
            <option value="Solar">Solar</option>
            <option value="Wind">Wind</option>
            <option value="Hydro">Hydro</option>
            <option value="Biomass">Biomass</option>
          </select>
        </div>
        
        {openContractWarning && 
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{openContractWarning}</div>
        }

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-[var(--radius-md)] border border-[#e0e8e4] shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-[13px] text-gray-400 w-[18px] h-[18px]" />
            <input type="text" placeholder="Search supplier or state..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="form-control pl-10" />
          </div>
          <select value={renewableTypeFilter} onChange={(e) => setRenewableTypeFilter(e.target.value)} className="form-control">
            <option value="All">All Renewable Types</option>
            <option value="Solar">Solar</option>
            <option value="Wind">Wind</option>
            <option value="Hydro">Hydro</option>
            <option value="Biomass">Biomass</option>
          </select>
          
        </div>
        {openContractWarning && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{openContractWarning}</div>}
        {isRequestFormOpen && currentSupplier && (
  <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] p-6 mb-6 shadow-sm">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
      <div>
        <h3 className="font-sora text-[18px] font-bold text-gray-900">Apply for Open Access</h3>
        <p className="text-gray-500 text-[13px] mt-1">Send Open Access request to {currentSupplier.name}.</p>
      </div>
      <button type="button" onClick={() => setIsRequestFormOpen(false)} className="btn-outline text-[12px] px-4 py-2">
        Cancel
      </button>
    </div>
    
    <form onSubmit={submitContractRequest} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="form-group">
          <label className="required">Supplier</label>
          <input type="text" value={currentSupplier.name} readOnly className="form-control bg-gray-50" />
        </div>
        <div className="form-group">
          <label className="required">Consumer Name</label>
          <input type="text" value={consumerName} onChange={(e) => setConsumerName(e.target.value)} required className="form-control" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="form-group">
          <label className="required">Required MW</label>
          <input type="number" value={requestMw} onChange={(e) => setRequestMw(Number(e.target.value))} min={1} required className="form-control" />
        </div>
        <div className="form-group">
          <label className="required">Duration (Days)</label>
          <input type="number" value={requestDuration} onChange={(e) => setRequestDuration(Number(e.target.value))} min={30} required className="form-control" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="form-group">
          <label className="required">Offered Price (₹/unit)</label>
          <input type="number" value={requestedPrice} onChange={(e) => setRequestedPrice(Number(e.target.value))} min={0.1} step="0.01" required className="form-control" />
          {currentSupplier && (
            <p className="text-[11px] text-gray-400 mt-1">Supplier base: ₹{currentSupplier.price?.toFixed(2)}</p>
          )}
        </div>
        <div className="form-group">
          <label className="required">Start Date</label>
          <input type="date" value={requestStartDate} onChange={(e) => setRequestStartDate(e.target.value)} required className="form-control" />
        </div>
      </div>
      
      {/* Contact Mobile - Optional but must follow format if provided */}
      <div className="form-group">
        <label>Contact Mobile (Optional)</label>
        <input 
          type="tel" 
          value={contactMobile}
          onChange={(e) => setContactMobile(e.target.value)}
          placeholder="+919876543210"
          className={`form-control ${validationErrors.mobile ? 'border-red-500' : ''}`}
        />
        {validationErrors.mobile && (
          <p className="text-red-500 text-[11px] mt-1">{validationErrors.mobile}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-1">Format: +91 followed by 10 digits (e.g., +919876543210)</p>
      </div>
      
      {/* CIN/GSTIN - Optional but must be exactly 10 alphanumeric if provided */}
      <div className="form-group">
        <label>CIN / GSTIN / Registration No. (Optional)</label>
        <input 
          type="text" 
          value={legalIdentifier}
          onChange={(e) => setLegalIdentifier(e.target.value.toUpperCase())}
          placeholder="ABC123XYZ9"
          maxLength={10}
          className={`form-control ${validationErrors.legalIdentifier ? 'border-red-500' : ''}`}
        />
        {validationErrors.legalIdentifier && (
          <p className="text-red-500 text-[11px] mt-1">{validationErrors.legalIdentifier}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-1">Exactly 10 alphanumeric characters (A-Z, 0-9)</p>
      </div>
      
      {/* DISCOM Consumer No - Optional but must be exactly 10 digits if provided */}
      <div className="form-group">
        <label>DISCOM Consumer No. (Optional)</label>
        <input 
          type="text" 
          value={discomConsumerNo}
          onChange={(e) => setDiscomConsumerNo(e.target.value.replace(/\D/g, ''))}
          placeholder="1234567890"
          maxLength={10}
          className={`form-control ${validationErrors.discomConsumerNo ? 'border-red-500' : ''}`}
        />
        {validationErrors.discomConsumerNo && (
          <p className="text-red-500 text-[11px] mt-1">{validationErrors.discomConsumerNo}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-1">Exactly 10 digits (numbers only, 0-9)</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="form-group">
          <label className="required">Preferred Time Blocks</label>
          <input type="text" value={requestTimeBlocks} onChange={(e) => setRequestTimeBlocks(e.target.value)} required className="form-control" placeholder="e.g. 10:00-18:00" />
        </div>
        <div className="form-group">
          <label className="required">Delivery State</label>
          <input type="text" value={requestDeliveryState} onChange={(e) => setRequestDeliveryState(e.target.value)} required className="form-control" />
        </div>
      </div>
      
      <div className="form-group">
        <label>Notes (Optional)</label>
        <textarea value={requestNotes} onChange={(e) => setRequestNotes(e.target.value)} rows={3} className="form-control" placeholder="Optional message for supplier" />
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button type="submit" className="btn-green w-full sm:w-auto py-3 text-[15px]">Submit Application</button>
        <p className="text-gray-500 text-[12px]">After submission, the request will appear under My Applications.</p>
      </div>
    </form>
  </div>
)}
        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Supplier Name','Renewable Type','Available MW','Base Price','OA Charges','Final Price','Injection Point','Profile'].map(h => (
                  <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {filteredSuppliers.length > 0 ? filteredSuppliers.map((s, i) => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{s.name}</td>
                  <td className="py-3.5 px-5 text-gray-700">{s.renewableType || s.type || '—'}</td>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{s.capacity} MW</td>
                  <td className="py-3.5 px-5 text-gray-900">₹{Number(s.price || 0).toFixed(2)}</td>
                  <td className="py-3.5 px-5 text-gray-700">₹{calculateOaCharges(s).toFixed(2)}</td>
                  <td className="py-3.5 px-5 font-bold text-gray-900">₹{getFinalDeliveredPrice(s).toFixed(2)}</td>
                  <td className="py-3.5 px-5 text-gray-700">{s.injectionPoint || 'Bhadla'}</td>
                  <td className="py-3.5 px-5 text-right space-x-2 flex justify-end">
                    <button type="button" onClick={() => openSupplierProfile(s.id)} className="px-3 py-1.5 rounded-md bg-white border border-[#e0e8e4] text-gray-700 text-[12px] font-semibold hover:bg-gray-50">View Profile</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">No approved suppliers available in marketplace.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }



  // ══════════════════════════════════════════════════════════════════════════
  // MY-APPLICATIONS TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'my-applications') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">My Applications</h2>
          <p className="text-gray-500 text-[13px] mt-1">Track Open Access requests, upload documents, and review contract status.</p>
        </div>
        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-x-auto">
  <table className="w-full text-left border-collapse min-w-[800px]">
    <thead>
      <tr>
        {['Supplier Name', 'Requested MW', 'Duration', 'Base Price', 'OA Charges', 'Final Price', 'Status', 'Request Date'].map(h => (
          <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase whitespace-nowrap">{h}</th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
      {applications.length > 0 ? applications.map((app, i) => (
        <tr key={app.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
          <td className="py-3.5 px-5 font-semibold text-gray-900">{app.supplierName}</td>
          <td className="py-3.5 px-5 text-gray-700">{app.requestedMw} MW</td>
          <td className="py-3.5 px-5 text-gray-700">{app.duration}</td>
          <td className="py-3.5 px-5 text-gray-900">₹{app.basePrice?.toFixed(2) || '0'}</td>
          <td className="py-3.5 px-5 text-gray-700">₹{app.oaCharges?.toFixed(2) || '0'}</td>
          <td className="py-3.5 px-5 font-bold text-gray-900">₹{app.finalPrice?.toFixed(2) || '0'}</td>
          <td className="py-3.5 px-5">
            <span className={`badge ${
              app.requestStatus === 'APPROVED' ? 'badge-green' : 
              app.requestStatus === 'REJECTED' ? 'badge-red' : 
              app.requestStatus === 'PENDING' ? 'badge-amber' : 'badge-blue'
            }`}>
              {app.requestStatus === 'APPROVED' ? 'Accepted' : 
              app.requestStatus === 'REJECTED' ? 'Rejected' : 
              app.requestStatus === 'PENDING' ? 'Pending' : app.requestStatus || 'Submitted'}
            </span>
          </td>
          <td className="py-3.5 px-5 text-gray-600">{app.requestDate || app.createdAt?.split('T')[0] || '-'}</td>
        </tr>
      )) : (
        <tr>
          <td colSpan={8} className="text-center py-10 text-gray-500">
            No applications found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUPPLIER PROFILE TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'supplier-profile' && (supplierDetails || currentSupplier)) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-sora text-[22px] font-bold text-gray-900">Supplier Profile</h2>
            <p className="text-gray-500 text-[13px] mt-1">Review supplier capabilities, compliance, and delivery risk.</p>
          </div>
          <button type="button" onClick={() => setTab('open-access')} className="btn-outline">Back to Marketplace</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="tracker-card p-6">
            <h3 className="font-sora text-[16px] font-bold text-gray-900 mb-4">Company Information</h3>
            <p className="text-gray-700 font-semibold mb-1">{(supplierDetails && supplierDetails.name) || currentSupplier?.name}</p>
            <p className="text-gray-500 text-[13px]">State: {(supplierDetails && supplierDetails.state) || currentSupplier?.state}</p>
            <p className="text-gray-500 text-[13px]">Source: {(supplierDetails && supplierDetails.profile?.renewableType) || currentSupplier?.renewableType || currentSupplier?.type}</p>
            <p className="text-gray-500 text-[13px]">Available Capacity: {(supplierDetails && supplierDetails.profile?.generationCapacity) || currentSupplier?.capacity} MW</p>
            <p className="text-gray-500 text-[13px]">Injection Point: {(supplierDetails && supplierDetails.profile?.injectionPoint) || currentSupplier?.injectionPoint || 'Bhadla Pooling Station'}</p>
          </div>
          <div className="tracker-card p-6">
            <h3 className="font-sora text-[16px] font-bold text-gray-900 mb-4">Pricing & Performance</h3>
            <div className="space-y-3 text-[13px] text-gray-600">
              <div className="flex justify-between"><span>Base Price</span><span className="font-semibold text-gray-900">₹{Number((supplierDetails && supplierDetails.profile?.basePrice) || currentSupplier?.price || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Estimated OA Charges</span><span className="font-semibold text-gray-900">₹{calculateOaCharges((supplierDetails && { ...currentSupplier, ...supplierDetails.profile }) || currentSupplier).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Final Delivered Price</span><span className="font-semibold text-gray-900">₹{getFinalDeliveredPrice((supplierDetails && { ...currentSupplier, ...supplierDetails.profile }) || currentSupplier).toFixed(2)}</span></div>
              <div className="pt-3 border-t border-[#e0e8e4]"><p className="font-semibold text-gray-900">Ratings / Reliability</p><p className="text-[13px] text-gray-500">4.5 / 5 • 96% delivery compliance</p></div>
            </div>
          </div>
          <div className="tracker-card p-6">
            <h3 className="font-sora text-[16px] font-bold text-gray-900 mb-4">Compliance & Documents</h3>
            <div className="space-y-3 text-[13px] text-gray-600">
              <p>Renewable certificates: {(supplierDetails && supplierDetails.documents?.length) ? supplierDetails.documents.map((d: any) => d.title).join(', ') : (currentSupplier.renewableCertificate || 'RECs pending')}</p>
              <p>Historical performance: {currentSupplier.performance || '88% on-time delivery'}</p>
              <p>Available time slots: {currentSupplier.timeSlots || '10:00-18:00 daily'}</p>
              <p>Active contracts: {(supplierDetails && supplierDetails.applications) ? supplierDetails.applications.filter((a: any) => a.approvalStatus === 'APPROVED' || a.approvalStatus === 'NOC_APPROVED').length : (currentSupplier.activeContracts || 0)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONTRACTS TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'contracts') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Contracts</h2>
          <p className="text-gray-500 text-[13px] mt-1">Review contract summaries and download agreements for active arrangements.</p>
        </div>
        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Supplier','MW','Price','OA Status','Actions'].map(h => (
                  <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {applications.map((app, i) => (
                <tr key={app.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{app.supplierName}</td>
                  <td className="py-3.5 px-5 text-gray-700">{app.requestedMw} MW</td>
                  <td className="py-3.5 px-5 font-bold text-gray-900">₹{app.finalPrice.toFixed(2)}</td>
                  <td className="py-3.5 px-5"><span className="badge badge-amber">{app.requestStatus}</span></td>
                  <td className="py-3.5 px-5 text-right"><button onClick={() => viewApplicationDetails(app.id)} className="px-3 py-1.5 rounded-md bg-[#2d6a4f] text-white text-[12px] font-semibold hover:bg-[#1b4d3e]">View Contract</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONTRACT DETAILS TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'contracts') {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="pb-4 border-b border-[#e0e8e4]">
        <h2 className="font-sora text-[22px] font-bold text-gray-900">Contracts</h2>
        <p className="text-gray-500 text-[13px] mt-1">Review contract summaries and download agreements for active arrangements.</p>
      </div>
      <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase whitespace-nowrap">Supplier</th>
              <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase whitespace-nowrap">MW</th>
              <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase whitespace-nowrap">Price (₹/unit)</th>
              <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase whitespace-nowrap">Status</th>
              <th className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
            {applications.length > 0 ? applications.filter(app => app.requestStatus === 'APPROVED' || app.contractStatus === 'Active Contract').map((app, i) => (
              <tr key={app.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                <td className="py-3.5 px-5 font-semibold text-gray-900">{app.supplierName}</td>
                <td className="py-3.5 px-5 text-gray-700 font-semibold">{app.requestedMw} MW</td>
                <td className="py-3.5 px-5 font-bold text-gray-900">₹{app.finalPrice?.toFixed(2) || '0'}</td>
                <td className="py-3.5 px-5">
                  <span className={`badge ${
                    app.requestStatus === 'APPROVED' ? 'badge-green' : 
                    app.requestStatus === 'REJECTED' ? 'badge-red' : 'badge-amber'
                  }`}>
                    {app.requestStatus === 'APPROVED' ? 'Active' : app.requestStatus || 'Pending'}
                  </span>
                </td>
                <td className="py-3.5 px-5">
                  <button 
                    onClick={() => {
                      // Show application details instead of contract
                      setSelectedApplication(app);
                      setTab('application-details');
                    }} 
                    className="px-3 py-1.5 rounded-md bg-[#2d6a4f] text-white text-[12px] font-semibold hover:bg-[#1b4d3e] whitespace-nowrap"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-500">
                  No active contracts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

  // ══════════════════════════════════════════════════════════════════════════
  // SCHEDULES TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'schedules') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Active Grid Schedules</h2>
          <p className="text-gray-500 text-[13px] mt-1">National Open Access Registry (NOAR) dispatch approvals</p>
        </div>
        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Schedule ID','Renewable Supplier','Approved MW','Time Block (RTC)','Status'].map(h => (
                  <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {schedules.map((s, i) => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 text-gray-600 font-semibold uppercase">{s.id}</td>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{s.supplierName}</td>
                  <td className="py-3.5 px-5 font-bold text-green-dark">{s.mw} MW</td>
                  <td className="py-3.5 px-5 text-gray-700">{s.timeBlock}</td>
                  <td className="py-3.5 px-5"><span className={`badge ${s.gridStatus === 'RUNNING' ? 'badge-green' : 'badge-blue'}`}>{s.gridStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DOCUMENTS TAB  ←  FULL REWRITE WITH GEOA PORTAL
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'documents') {

    // ── LANDING VIEW ──────────────────────────────────────────────────────
    if (docView === 'landing') {
      return (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="pb-4 border-b border-[#e0e8e4]">
            <h2 className="font-sora text-[22px] font-bold text-gray-900">Documents & GEOA Portal</h2>
            <p className="text-gray-500 text-[13px] mt-1">
              Apply for Green Energy Open Access (GEOA) under RERC regulations or manage your regulatory compliance documents.
            </p>
          </div>

          {/* Regulatory notice */}
          <div className="alert alert-info">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[13px]">
              <span className="font-semibold">RERC GEOA Regulation 2022 —</span> All industrial consumers above 1 MW load are required to file a GEOA application through the Nodal Agency (RLDC/SLDC) before commencing Green Open Access transactions. Ensure all mandatory documents are uploaded prior to submission.
            </p>
          </div>

          {/* Action cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Apply GEOA card */}
            <div
              onClick={() => { resetGeoaForm(); setDocView('geoa-form'); }}
              className="group bg-white border-2 border-[#e0e8e4] hover:border-green-mid rounded-[var(--radius-md)] p-7 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="w-12 h-12 bg-green-pale rounded-xl flex items-center justify-center mb-5 group-hover:bg-green-mid/20 transition-colors">
                <ClipboardList className="w-6 h-6 text-green-dark" />
              </div>
              <h3 className="font-sora text-[17px] font-bold text-gray-900 mb-2">Apply GEOA</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
                File a formal Green Energy Open Access application to RERC / RLDC with applicant details, technical parameters, and all regulatory documents.
              </p>
              <div className="flex items-center text-green-dark text-[13px] font-semibold group-hover:gap-2 transition-all gap-1">
                <span>Apply for Green Energy Open Access</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Upload Documents card */}
            <div
              onClick={() => setDocView('doc-upload')}
              className="group bg-white border-2 border-[#e0e8e4] hover:border-blue-dark rounded-[var(--radius-md)] p-7 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="w-12 h-12 bg-blue-light rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-dark/10 transition-colors">
                <Upload className="w-6 h-6 text-blue-dark" />
              </div>
              <h3 className="font-sora text-[17px] font-bold text-gray-900 mb-2">Upload Regulatory Documents</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
                Submit PPAs, bank guarantees, board authorizations, and other compliance files to the Nodal Agency vault for admin verification.
              </p>
              <div className="flex items-center text-blue-dark text-[13px] font-semibold group-hover:gap-2 transition-all gap-1">
                <span>Open Compliance Vault</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* GEOA Applications tracker */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sora text-[18px] font-bold text-gray-900">My GEOA Applications</h3>
              <button onClick={() => { resetGeoaForm(); setDocView('geoa-form'); }} className="btn-green flex items-center gap-2 text-[13px] px-4 py-2">
                <ClipboardList className="w-4 h-4" /><span>New Application</span>
              </button>
            </div>
            <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    {['Ref No.','Applicant','Load (MW)','Schedule','Injection Point','Submitted On','Status','Docs'].map(h => (
                      <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                  {geoaApplications.length > 0 ? geoaApplications.map((app, i) => (
                    <tr key={app.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                      <td className="py-3.5 px-5 font-mono text-[12px] font-semibold text-green-dark">{app.refNo}</td>
                      <td className="py-3.5 px-5 font-semibold text-gray-900 max-w-[140px] truncate">{app.applicantName}</td>
                      <td className="py-3.5 px-5 font-bold text-gray-900">{app.loadMw} MW</td>
                      <td className="py-3.5 px-5 text-gray-700">{app.scheduleType}</td>
                      <td className="py-3.5 px-5 text-gray-700 max-w-[160px] truncate">{app.injectionPoint}</td>
                      <td className="py-3.5 px-5 text-gray-500">{app.submittedOn}</td>
                      <td className="py-3.5 px-5"><span className={`badge ${geoaStatusBadge(app.status)}`}>{app.status.replace('_', ' ')}</span></td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1 text-[12px] text-gray-500">
                          <CheckCircle className="w-3.5 h-3.5 text-green-mid" />
                          <span>{app.docs.filter(d => d.status === 'uploaded').length}/{app.docs.length}</span>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} className="text-center py-10 text-gray-500">No GEOA applications submitted yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regulatory Document Registry */}
          <div className="space-y-4">
            <h3 className="font-sora text-[18px] font-bold text-gray-900">Regulatory Document Registry</h3>
            <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    {['Document Name','Category','Uploaded On','Status'].map(h => (
                      <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                  {uploadedDocs.map((doc, i) => (
                    <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                      <td className="py-3.5 px-5 font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-gray-500" /></div>
                        {doc.name}
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
      );
    }

    // ── DOCUMENT UPLOAD VIEW ───────────────────────────────────────────────
    if (docView === 'doc-upload') {
      return (
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
              <h3 className="font-sora text-[16px] font-bold text-gray-900 mb-1">Upload Verification Files</h3>
              <p className="text-[13px] text-gray-500 mb-6 pb-6 border-b border-[#f0f4f2]">Submit necessary agreements and approvals to Nodal Agency.</p>
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
                <p className="text-gray-500 text-[13px]">Verify your company credentials with RLDC operators to prevent disconnection bans.</p>
                <div className="mt-4 space-y-2">
                  {[
                    { label: 'RLDC NOC', status: 'VERIFIED' },
                    { label: 'SLDC Approval', status: 'PENDING' },
                    { label: 'DISCOM Consent', status: 'VERIFIED' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#f0f4f2]">
                      <span className="text-[13px] text-gray-600">{item.label}</span>
                      <span className={`badge ${item.status === 'VERIFIED' ? 'badge-green' : 'badge-amber'}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-light p-4 rounded-lg border border-[#b5d4f4] mt-6">
                <p className="text-[12px] text-blue-dark leading-relaxed">
                  ★ Uploaded files are visible to NLDC administrators immediately. Status changes from PENDING → VERIFIED after audit checks.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-sora text-[16px] font-bold text-gray-900">Document Registry</h3>
            <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    {['Document Name','Category','Uploaded On','Status'].map(h => (
                      <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                  {uploadedDocs.map((doc, i) => (
                    <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                      <td className="py-3.5 px-5 font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-gray-500" /></div>
                        {doc.name}
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
      );
    }

    // ── GEOA FORM VIEW ─────────────────────────────────────────────────────
    if (docView === 'geoa-form') {

      // Success screen
      if (geoaSubmitSuccess) {
        const latest = geoaApplications[0];
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="pb-4 border-b border-[#e0e8e4]">
              <h2 className="font-sora text-[22px] font-bold text-gray-900">Apply for Green Energy Open Access</h2>
            </div>
            <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] p-12 flex flex-col items-center text-center space-y-5 max-w-xl mx-auto">
              <div className="w-16 h-16 bg-green-pale rounded-full flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-green-dark" />
              </div>
              <h3 className="font-sora text-[20px] font-bold text-gray-900">Application Submitted Successfully</h3>
              <p className="text-gray-500 text-[14px] leading-relaxed">
                Your GEOA application has been filed with the Nodal Agency. You will receive a confirmation notification once it is reviewed by RLDC/SLDC authorities.
              </p>
              <div className="bg-green-pale border border-[#9fe1cb] rounded-lg px-6 py-4 w-full text-left space-y-2">
                <p className="text-[12px] text-gray-500 uppercase font-semibold tracking-wider">Reference Number</p>
                <p className="font-mono text-[16px] font-bold text-green-dark">{latest?.refNo}</p>
                <p className="text-[12px] text-gray-500">Submitted on {latest?.submittedOn}</p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => { setDocView('landing'); }} className="btn-green flex-1">View My Applications</button>
                <button onClick={() => { resetGeoaForm(); }} className="btn-outline flex-1">Submit Another</button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="pb-4 border-b border-[#e0e8e4] flex items-center justify-between">
            <div>
              <h2 className="font-sora text-[22px] font-bold text-gray-900">Apply for Green Energy Open Access</h2>
              <p className="text-gray-500 text-[13px] mt-1">
                RERC GEOA Regulation 2022 — Fill all details carefully. Fields marked <span className="text-red font-semibold">*</span> are mandatory.
              </p>
            </div>
            <button onClick={() => setDocView('landing')} className="btn-outline flex items-center gap-2">
              <X className="w-4 h-4" /><span>Cancel</span>
            </button>
          </div>

          {/* Step progress bar */}
          <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] p-5">
            <div className="flex items-center gap-0">
              {GEOA_STEPS.map((step, idx) => (
                <React.Fragment key={step.num}>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-all ${
                      geoaStep > step.num
                        ? 'bg-green-dark border-green-dark text-white'
                        : geoaStep === step.num
                          ? 'bg-white border-green-dark text-green-dark'
                          : 'bg-white border-[#dde5e1] text-gray-400'
                    }`}>
                      {geoaStep > step.num ? <CheckCircle className="w-5 h-5" /> : step.num}
                    </div>
                    <span className={`text-[11px] font-semibold text-center leading-tight ${geoaStep >= step.num ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < GEOA_STEPS.length - 1 && (
                    <div className={`h-[2px] flex-1 mb-5 transition-all ${geoaStep > step.num ? 'bg-green-dark' : 'bg-[#e0e8e4]'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* ── STEP 1: Applicant Details ── */}
              {geoaStep === 1 && (
                <div className="form-card space-y-5">
                  <div className="pb-4 border-b border-[#f0f4f2]">
                    <h3 className="font-sora text-[16px] font-bold text-gray-900">Step 1: Applicant Details</h3>
                    <p className="text-gray-500 text-[13px] mt-1">Enter your company and authorised signatory information.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-group">
                      <label className="required">Applicant / Company Name</label>
                      <input type="text" value={geoaApplicantName} onChange={e => setGeoaApplicantName(e.target.value)} placeholder="e.g. Bharat Industries Pvt Ltd" className="form-control" required />
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
                      <label>CIN / GSTIN / Registration No.</label>
                      <input type="text" value={geoaCin} onChange={e => setGeoaCin(e.target.value)} placeholder="e.g. U40100RJ2020PTC012345" className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>DISCOM Consumer No.</label>
                      <input type="text" value={geoaConsumerNo} onChange={e => setGeoaConsumerNo(e.target.value)} placeholder="e.g. JVVNL-400220001" className="form-control" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Registered Address</label>
                    <textarea value={geoaAddress} onChange={e => setGeoaAddress(e.target.value)} rows={2} placeholder="Plot No., Industrial Area, City, State, PIN" className="form-control" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-group">
                      <label className="required">State</label>
                      <select value={geoaState} onChange={e => setGeoaState(e.target.value)} className="form-control">
                        {['Rajasthan','Gujarat','Maharashtra','Madhya Pradesh','Uttar Pradesh','Tamil Nadu','Karnataka','Haryana','Punjab','Telangana'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="required">DISCOM / Utility</label>
                      <select value={geoaDiscom} onChange={e => setGeoaDiscom(e.target.value)} className="form-control">
                        {['JVVNL','AVVNL','DVVNL','MSEDCL','PGVCL','TNEB','BESCOM'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-group">
                      <label className="required">Authorised Contact Person</label>
                      <input type="text" value={geoaContactPerson} onChange={e => setGeoaContactPerson(e.target.value)} placeholder="Full name" className="form-control" required />
                    </div>
                    <div className="form-group">
                      <label className="required">Email Address</label>
                      <input type="email" value={geoaEmail} onChange={e => setGeoaEmail(e.target.value)} placeholder="company@example.com" className="form-control" required />
                    </div>
                    <div className="form-group">
                      <label className="required">Mobile No.</label>
                      <input type="tel" value={geoaMobile} onChange={e => setGeoaMobile(e.target.value)} placeholder="+91 98XXXXXX00" className="form-control" required />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={!geoaStep1Valid}
                      onClick={() => setGeoaStep(2)}
                      className={`btn-green flex items-center gap-2 px-8 ${!geoaStep1Valid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span>Next: Technical Details</span><ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Technical Details ── */}
              {geoaStep === 2 && (
                <div className="form-card space-y-5">
                  <div className="pb-4 border-b border-[#f0f4f2]">
                    <h3 className="font-sora text-[16px] font-bold text-gray-900">Step 2: Technical & Supply Details</h3>
                    <p className="text-gray-500 text-[13px] mt-1">Specify the load requirement, grid points, and scheduling preferences.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-group">
                      <label className="required">Connected Load (MW)</label>
                      <input type="number" value={geoaLoadMw} onChange={e => setGeoaLoadMw(Number(e.target.value))} min={1} max={500} required className="form-control" />
                    </div>
                    <div className="form-group">
                      <label className="required">Voltage Level at Drawal Point</label>
                      <select value={geoaVoltageLevel} onChange={e => setGeoaVoltageLevel(e.target.value)} className="form-control">
                        <option value="11kV">11 kV</option>
                        <option value="33kV">33 kV</option>
                        <option value="66kV">66 kV</option>
                        <option value="110kV">110 kV</option>
                        <option value="220kV">220 kV</option>
                        <option value="400kV">400 kV</option>
                        <option value="765kV">765 kV</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="required">Source of Renewable Energy</label>
                      <select value={geoaRenewableType} onChange={e => setGeoaRenewableType(e.target.value)} className="form-control">
                        <option value="Solar">Solar</option>
                        <option value="Wind">Wind</option>
                        <option value="Hybrid">Solar-Wind Hybrid</option>
                        <option value="Hydro">Small Hydro</option>
                        <option value="Biomass">Biomass</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-group">
                      <label className="required">Injection Point (Generator End)</label>
                      <input type="text" value={geoaInjectionPoint} onChange={e => setGeoaInjectionPoint(e.target.value)} placeholder="e.g. Bhadla Pooling Station, 765kV" required className="form-control" />
                    </div>
                    <div className="form-group">
                      <label className="required">Drawal Point (Consumer End)</label>
                      <input type="text" value={geoaDrawalPoint} onChange={e => setGeoaDrawalPoint(e.target.value)} placeholder="e.g. 400kV Jajpur Substation" required className="form-control" />
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
                      <label className="required">Contract Duration (Days)</label>
                      <input type="number" value={geoaDurationDays} onChange={e => setGeoaDurationDays(Number(e.target.value))} min={30} required className="form-control" />
                    </div>
                    <div className="form-group">
                      <label className="required">Proposed Start Date</label>
                      <input type="date" value={geoaStartDate} onChange={e => setGeoaStartDate(e.target.value)} required className="form-control" />
                    </div>
                  </div>

                  {geoaScheduleType === 'Custom' && (
                    <div className="form-group">
                      <label className="required">Custom Time Blocks</label>
                      <input type="text" value={geoaTimeBlocks} onChange={e => setGeoaTimeBlocks(e.target.value)} placeholder="e.g. 06:00-10:00, 18:00-22:00" className="form-control" />
                      <p className="text-[11px] text-gray-400 mt-1">Specify in HH:MM-HH:MM format, comma-separated for multiple blocks.</p>
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <button type="button" onClick={() => setGeoaStep(1)} className="btn-outline flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 rotate-180" /><span>Back</span>
                    </button>
                    <button
                      type="button"
                      disabled={!geoaStep2Valid}
                      onClick={() => setGeoaStep(3)}
                      className={`btn-green flex items-center gap-2 px-8 ${!geoaStep2Valid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span>Next: Upload Documents</span><ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Document Upload ── */}
              {geoaStep === 3 && (
                <div className="form-card space-y-5">
                  <div className="pb-4 border-b border-[#f0f4f2]">
                    <h3 className="font-sora text-[16px] font-bold text-gray-900">Step 3: Upload Supporting Documents</h3>
                    <p className="text-gray-500 text-[13px] mt-1">Upload all required files in PDF format. Max 5MB per file. Fields marked <span className="text-red font-semibold">*</span> are mandatory.</p>
                  </div>

                  <div className="space-y-3">
                    {geoaDocs.map((doc) => (
                      <div key={doc.key} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${doc.status === 'uploaded' ? 'border-green-mid bg-green-pale/30' : 'border-[#e0e8e4] bg-white'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${doc.status === 'uploaded' ? 'bg-green-mid/20' : 'bg-gray-100'}`}>
                            {doc.status === 'uploaded'
                              ? <CheckCircle className="w-5 h-5 text-green-dark" />
                              : <FileText className="w-5 h-5 text-gray-400" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">
                              {doc.label}
                              {doc.required && <span className="text-red ml-1">*</span>}
                            </p>
                            {doc.fileName && <p className="text-[11px] text-green-dark font-medium truncate">{doc.fileName}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {doc.status === 'uploaded'
                            ? <span className="badge badge-green">Uploaded</span>
                            : (
                              <label className="px-3 py-1.5 rounded-md bg-white border border-[#e0e8e4] text-gray-700 text-[12px] font-semibold hover:bg-gray-50 cursor-pointer flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Choose File</span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleGeoaDocSimulate(doc.key, file.name);
                                  }}
                                />
                              </label>
                            )
                          }
                          {doc.status === 'uploaded' && (
                            <button
                              type="button"
                              onClick={() => setGeoaDocs(prev => prev.map(d => d.key === doc.key ? { ...d, fileName: '', status: 'pending' } : d))}
                              className="w-7 h-7 rounded-md border border-[#e0e8e4] flex items-center justify-center hover:bg-red-50 hover:border-red/30 transition-colors"
                            >
                              <X className="w-3.5 h-3.5 text-gray-400 hover:text-red" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-light border border-[#fac775] rounded-lg p-4">
                    <p className="text-[12px] text-amber leading-relaxed">
                      <span className="font-semibold">Note:</span> All mandatory documents must be uploaded before submitting. Uploaded files will be verified by the Nodal Agency within 3–5 working days. Ensure all documents are valid, self-attested, and clearly legible.
                    </p>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button type="button" onClick={() => setGeoaStep(2)} className="btn-outline flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 rotate-180" /><span>Back</span>
                    </button>
                    <button
                      type="button"
                      disabled={!geoaDocs.filter(d => d.required).every(d => d.status === 'uploaded')}
                      onClick={() => setGeoaStep(4)}
                      className={`btn-green flex items-center gap-2 px-8 ${!geoaDocs.filter(d => d.required).every(d => d.status === 'uploaded') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span>Next: Review & Submit</span><ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Review & Submit ── */}
              {geoaStep === 4 && (
                <div className="form-card space-y-6">
                  <div className="pb-4 border-b border-[#f0f4f2]">
                    <h3 className="font-sora text-[16px] font-bold text-gray-900">Step 4: Review & Submit Application</h3>
                    <p className="text-gray-500 text-[13px] mt-1">Verify all details before final submission to RERC / Nodal Agency.</p>
                  </div>

                  {/* Review – Applicant */}
                  <div>
                    <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-pale text-green-dark text-[10px] font-bold flex items-center justify-center">1</span>
                      Applicant Details
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
                        ...(geoaCin ? [{ l: 'CIN/GSTIN', v: geoaCin }] : []),
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
                      <span className="w-5 h-5 rounded-full bg-green-pale text-green-dark text-[10px] font-bold flex items-center justify-center">2</span>
                      Technical Details
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
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

                  {/* Review – Documents */}
                  <div>
                    <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-pale text-green-dark text-[10px] font-bold flex items-center justify-center">3</span>
                      Documents
                    </h4>
                    <div className="space-y-2">
                      {geoaDocs.map(doc => (
                        <div key={doc.key} className="flex items-center justify-between py-2 border-b border-[#f0f4f2]">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-[13px] text-gray-700">{doc.label}{doc.required && <span className="text-red ml-1">*</span>}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.fileName && <span className="text-[12px] text-gray-500 max-w-[160px] truncate">{doc.fileName}</span>}
                            <span className={`badge ${doc.status === 'uploaded' ? 'badge-green' : 'badge-amber'}`}>
                              {doc.status === 'uploaded' ? 'Ready' : 'Not Uploaded'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Declaration */}
                  <div className="bg-green-pale border border-[#9fe1cb] rounded-lg p-4">
                    <p className="text-[12px] text-green-dark leading-relaxed">
                      <span className="font-bold">Declaration:</span> I hereby declare that the information provided in this application is true and correct to the best of my knowledge. I understand that any false information may result in rejection of this application or cancellation of the Open Access permission granted.
                    </p>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button type="button" onClick={() => setGeoaStep(3)} className="btn-outline flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 rotate-180" /><span>Back</span>
                    </button>
                    <button type="button" onClick={submitGeoaApplication} className="btn-green flex items-center gap-2 px-10 py-3 text-[15px]">
                      <CheckCircle className="w-5 h-5" /><span>Submit GEOA Application</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar – checklist */}
            <div className="space-y-4">
              <div className="tracker-card p-5 !mb-0">
                <h4 className="font-sora font-bold text-[14px] text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-dark" />Application Checklist
                </h4>
                <div className="space-y-2.5">
                  {[
                    { label: 'Applicant Details', done: geoaStep1Valid, step: 1 },
                    { label: 'Technical Parameters', done: geoaStep2Valid, step: 2 },
                    { label: 'All Mandatory Docs', done: geoaDocs.filter(d => d.required).every(d => d.status === 'uploaded'), step: 3 },
                    { label: 'Review Complete', done: geoaStep === 4, step: 4 },
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

              <div className="tracker-card p-5 !mb-0">
                <h4 className="font-sora font-bold text-[14px] text-gray-900 mb-3">Required Documents</h4>
                <div className="space-y-2">
                  {geoaDocs.map(doc => (
                    <div key={doc.key} className="flex items-center gap-2 text-[12px]">
                      {doc.status === 'uploaded'
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-dark shrink-0" />
                        : <div className={`w-3.5 h-3.5 rounded-full border shrink-0 ${doc.required ? 'border-red bg-red-light/40' : 'border-gray-300'}`} />
                      }
                      <span className={doc.status === 'uploaded' ? 'text-gray-600 line-through' : doc.required ? 'text-gray-700' : 'text-gray-400'}>
                        {doc.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-light border border-[#b5d4f4] rounded-[var(--radius-md)] p-4">
                <p className="text-[12px] text-blue-dark leading-relaxed font-semibold mb-1">RERC Helpdesk</p>
                <p className="text-[12px] text-blue-dark leading-relaxed">For assistance with GEOA applications, contact the Nodal Agency at <span className="font-semibold">geoa@rerc.rajasthan.gov.in</span> or call <span className="font-semibold">0141-2740011</span>.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PROFILE TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'profile') {
    return (
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
              <div className="flex justify-between items-center text-[13px]"><span className="text-gray-500">Registered State</span><span className="font-semibold text-gray-900">{profile?.state || user?.state || 'Rajasthan'}</span></div>
              <div className="flex justify-between items-center text-[13px]"><span className="text-gray-500">Drawal Point</span><span className="font-semibold text-gray-900">{profile?.profile?.drawalPoint || requestDeliveryState || 'Jajpur Substation'}</span></div>
              <div className="flex justify-between items-center text-[13px]"><span className="text-gray-500">Load Requirement</span><span className="font-semibold text-gray-900">{requestMw} MW</span></div>
              <div className="flex justify-between items-center text-[13px]"><span className="text-gray-500">Account Status</span><span className="badge badge-green">{user?.status || 'VERIFIED'}</span></div>
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
                    <p className="text-[12px] text-gray-500 mt-0.5">Contract energy matching fee</p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-[18px] font-bold text-gray-900">₹{bill.amount.toLocaleString()}</p>
                      <span className={`badge mt-1 ${bill.status === 'PAID' ? 'badge-green' : 'badge-amber'}`}>{bill.status}</span>
                    </div>
                    {bill.status === 'UNPAID' && (
                      <button onClick={() => handlePayBill(bill)} className="btn-green px-4 py-2 text-[12px]">Pay Invoice</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isPaying && (
              <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
                <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl">
                  <h3 className="font-sora text-xl font-bold text-gray-900 mb-2">Simulated Gateway</h3>
                  <p className="text-gray-500 text-[13px] mb-6">Processing payment for ₹{payAmount.toLocaleString()}</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[12px] font-semibold text-gray-700">Transaction Reference</label>
                      <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} className="form-control mt-2" />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-gray-700">Payment Amount</label>
                      <input type="text" value={`₹${payAmount.toLocaleString()}`} disabled className="form-control mt-2 bg-gray-100" />
                    </div>
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
                <tr>
                  {['Transaction Ref','Date','Amount','Status'].map(h => (
                    <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 tracking-[0.03em] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                {payments.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                    <td className="py-3.5 px-5 text-gray-600 font-medium">{p.reference}</td>
                    <td className="py-3.5 px-5 text-gray-500">{p.createdAt}</td>
                    <td className="py-3.5 px-5 font-bold text-gray-900">₹{p.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-5"><span className="badge badge-green">{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
