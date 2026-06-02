import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Zap, ShieldAlert, Award, Clock,
  Search, ArrowRight, Upload, DollarSign, BarChart2, Settings,
  FileText, CheckCircle, ChevronRight, ClipboardList, AlertCircle, X, Eye, Save, Download
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

// ─── GEOA Draft storage key ───────────────────────────────────────────────────
const GEOA_DRAFT_KEY = 'geoa_form_draft';

export const ConsumerDashboard: React.FC<ConsumerDashboardProps> = ({ activeTab, setTab }) => {
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

  // ─── GEOA state ───────────────────────────────────────────────────────────
  const [docView, setDocView] = useState<'landing' | 'geoa-form' | 'doc-upload'>('landing');
  const [geoaStep, setGeoaStep] = useState(1);
  const [geoaDraftSaved, setGeoaDraftSaved] = useState(false);
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

  // Step 1 fields
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

  // Step 1 validation errors
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // Step 2 fields
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

  // Step 3 documents
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

  const [geoaSubmitSuccess, setGeoaSubmitSuccess] = useState(false);

  const GEOA_STEPS = [
    { num: 1, label: 'Applicant Details' },
    { num: 2, label: 'Technical Details' },
    { num: 3, label: 'Upload Documents' },
    { num: 4, label: 'Review & Submit' },
  ];

  const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';
  const currentSupplier = suppliers.find((item) => item.id === selectedSupplierId) || null;

  // ── Auto-fill supplier injection point when selected in Step 2 ─────────────
  useEffect(() => {
    if (geoaSelectedSupplierId) {
      const sup = suppliers.find(s => s.id === geoaSelectedSupplierId);
      if (sup) {
        setGeoaInjectionPoint(sup.injectionPoint || `${sup.state} Grid Injection Point`);
        setGeoaRenewableType(sup.renewableType || 'Solar');
      }
    }
  }, [geoaSelectedSupplierId, suppliers]);

  // ── Pre-fill GEOA from profile ─────────────────────────────────────────────
  useEffect(() => {
    if (profile?.name && !geoaApplicantName) setGeoaApplicantName(profile.name);
    if (profile?.name && !consumerName) setConsumerName(profile.name);
    if (profile?.email && !geoaEmail) setGeoaEmail(profile.email);
    if (profile?.state) { setGeoaState(profile.state); setRequestDeliveryState(profile.state); }
  }, [profile]);

  // ── Load draft from localStorage on mount ─────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(GEOA_DRAFT_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d.geoaApplicantName) setGeoaApplicantName(d.geoaApplicantName);
        if (d.geoaEntityType) setGeoaEntityType(d.geoaEntityType);
        if (d.geoaCin) setGeoaCin(d.geoaCin);
        if (d.geoaAddress) setGeoaAddress(d.geoaAddress);
        if (d.geoaState) setGeoaState(d.geoaState);
        if (d.geoaDiscom) setGeoaDiscom(d.geoaDiscom);
        if (d.geoaConsumerNo) setGeoaConsumerNo(d.geoaConsumerNo);
        if (d.geoaContactPerson) setGeoaContactPerson(d.geoaContactPerson);
        if (d.geoaEmail) setGeoaEmail(d.geoaEmail);
        if (d.geoaMobile) setGeoaMobile(d.geoaMobile);
        if (d.geoaLoadMw) setGeoaLoadMw(d.geoaLoadMw);
        if (d.geoaSelectedSupplierId) setGeoaSelectedSupplierId(d.geoaSelectedSupplierId);
        if (d.geoaInjectionPoint) setGeoaInjectionPoint(d.geoaInjectionPoint);
        if (d.geoaDrawalPoint) setGeoaDrawalPoint(d.geoaDrawalPoint);
        if (d.geoaScheduleType) setGeoaScheduleType(d.geoaScheduleType);
        if (d.geoaDurationDays) setGeoaDurationDays(d.geoaDurationDays);
        if (d.geoaStartDate) setGeoaStartDate(d.geoaStartDate);
        if (d.geoaTimeBlocks) setGeoaTimeBlocks(d.geoaTimeBlocks);
        if (d.geoaVoltageLevel) setGeoaVoltageLevel(d.geoaVoltageLevel);
        if (d.geoaRenewableType) setGeoaRenewableType(d.geoaRenewableType);
      } catch { /* ignore */ }
    }
    const savedOaDrafts = localStorage.getItem('openAccessDrafts');
    if (savedOaDrafts) setDrafts(JSON.parse(savedOaDrafts));
  }, []);

  // ── Save GEOA draft helper ─────────────────────────────────────────────────
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

  // ── Step 1 validation (all 3 new fields mandatory) ────────────────────────
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

  // ── Step 2 validation ─────────────────────────────────────────────────────
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

  // ── Fetch supplier details for supplier-profile tab ───────────────────────
  useEffect(() => {
    if (activeTab === 'supplier-profile' && selectedSupplierId) {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/suppliers/${selectedSupplierId}`, {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
          });
          if (!res.ok) { setSupplierDetails(null); return; }
          setSupplierDetails(await res.json());
        } catch { setSupplierDetails(null); }
      })();
    } else {
      setSupplierDetails(null);
    }
  }, [activeTab, selectedSupplierId, token]);

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

  useEffect(() => {
    if (activeTab === 'my-applications') refreshApplications();
  }, [activeTab]);

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
  }, []);

  const handleGeoaDocSimulate = (key: string, fileName: string) => {
    setGeoaDocs(prev => prev.map(d => d.key === key ? { ...d, fileName, status: 'uploaded' } : d));
  };

  const resetGeoaForm = () => {
    setGeoaStep(1); setGeoaSubmitSuccess(false);
    setGeoaDocs(prev => prev.map(d => ({ ...d, fileName: '', status: 'pending' })));
    setGeoaCin(''); setGeoaAddress(''); setGeoaConsumerNo('');
    setGeoaContactPerson(''); setGeoaMobile(''); setGeoaSelectedSupplierId('');
    setGeoaInjectionPoint(''); setStep1Errors({}); setStep2Errors({});
    localStorage.removeItem(GEOA_DRAFT_KEY);
  };

  // ── Submit GEOA to backend as an application ───────────────────────────────
  const submitGeoaApplication = async () => {
    const selectedSupplier = suppliers.find(s => s.id === geoaSelectedSupplierId);

    console.log('Selected supplier:', selectedSupplier);
  console.log('Supplier ID being sent:', geoaSelectedSupplierId);

    try {
      const body = {
        supplierId: geoaSelectedSupplierId,
        supplierName: selectedSupplier?.name,  // Store supplier name too
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
      // Also add to my-applications
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

  const geoaStatusBadge = (status: GeoaApplication['status']) => {
    const map: Record<string, string> = {
      SUBMITTED: 'badge-blue', UNDER_REVIEW: 'badge-amber',
      NOC_ISSUED: 'badge-amber', APPROVED: 'badge-green', REJECTED: 'badge-red'
    };
    return map[status] || 'badge-amber';
  };

  const filteredSuppliers = suppliers.filter((s: any) => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.state?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = renewableTypeFilter === 'All' || s.renewableType === renewableTypeFilter;
    const isApproved = s.status === 'VERIFIED' || s.oaStatus === 'APPROVED';
    return matchesSearch && matchesType && isApproved;
  });

  // ── step 1 validity for button ─────────────────────────────────────────────
  const step1Valid = !!(geoaApplicantName && geoaContactPerson && geoaEmail && /^\d{10}$/.test(geoaMobile) && geoaCin && geoaConsumerNo && geoaAddress);
  const step2Valid = !!(geoaSelectedSupplierId && geoaLoadMw >= 1 && geoaDrawalPoint && geoaDurationDays >= 30 && geoaStartDate);
  const step3Valid = geoaDocs.filter(d => d.required).every(d => d.status === 'uploaded');

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
              {[40,50,62,75,80,72,58,64,70,75,68,55].map((val,idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 mx-1 z-10 group relative">
                  <div className="w-full flex flex-col justify-end space-y-[1px]" style={{ height: `${val * 1.8}px` }}>
                    <div className="w-full bg-green-mid rounded-t-[2px] opacity-90 group-hover:opacity-100" style={{ height: '85%' }}></div>
                    <div className="w-full bg-amber rounded-b-[2px] opacity-90 group-hover:opacity-100" style={{ height: '15%' }}></div>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">{idx*2}:00</span>
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
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // OPEN-ACCESS TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'open-access') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="pb-4 border-b border-[#e0e8e4]">
          <h2 className="font-sora text-[22px] font-bold text-gray-900">Suppliers Marketplace</h2>
          <p className="text-gray-500 text-[13px] mt-1">Browse only admin approved renewable suppliers.</p>
        </div>
        {openContractWarning && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{openContractWarning}</div>}
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


        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Supplier Name','Type','Available MW','Base Price','OA Charges','Final Price','Injection Point','Actions'].map(h => (
                  <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {filteredSuppliers.length > 0 ? filteredSuppliers.map((s, i) => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{s.name}</td>
                  <td className="py-3.5 px-5 text-gray-700">{s.renewableType || '—'}</td>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{s.generationCapacity || s.capacity || '—'} MW</td>
                  <td className="py-3.5 px-5 text-gray-900">₹{Number(s.price || 4.2).toFixed(2)}</td>
                  <td className="py-3.5 px-5 text-gray-700">₹{calculateOaCharges(s).toFixed(2)}</td>
                  <td className="py-3.5 px-5 font-bold text-gray-900">₹{getFinalDeliveredPrice(s).toFixed(2)}</td>
                  <td className="py-3.5 px-5 text-gray-700 text-[12px] max-w-[140px] truncate">{s.injectionPoint || 'Bhadla'}</td>
                  <td className="py-3.5 px-5 flex gap-2 justify-end">
                    <button type="button" onClick={() => openSupplierProfile(s.id)} className="px-3 py-1.5 rounded-md bg-white border border-[#e0e8e4] text-gray-700 text-[12px] font-semibold hover:bg-gray-50">Profile</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">No approved suppliers available.</td></tr>
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
        <div className="pb-4 border-b border-[#e0e8e4] flex items-center justify-between">
          <div>
            <h2 className="font-sora text-[22px] font-bold text-gray-900">My Applications</h2>
            <p className="text-gray-500 text-[13px] mt-1">Track Open Access and GEOA requests — status updates automatically.</p>
          </div>
          <button onClick={refreshApplications} className="btn-outline flex items-center gap-2 text-[12px] px-4 py-2">
            <ArrowRight className="w-3.5 h-3.5 rotate-[-90deg]" /><span>Refresh</span>
          </button>
        </div>
        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr>
                {['Supplier Name','Requested MW','Duration','Base Price','OA Charges','Final Price','Status','Submitted'].map(h => (
                  <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {applications.length > 0 ? applications.map((app, i) => (
                <tr key={app.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{app.supplierName}</td>
                  <td className="py-3.5 px-5 text-gray-700">{app.requestedMw} MW</td>
                  <td className="py-3.5 px-5 text-gray-700">{app.duration}</td>
                  <td className="py-3.5 px-5 text-gray-900">₹{app.basePrice?.toFixed(2) || '—'}</td>
                  <td className="py-3.5 px-5 text-gray-700">₹{app.oaCharges?.toFixed(2) || '—'}</td>
                  <td className="py-3.5 px-5 font-bold text-gray-900">₹{app.finalPrice?.toFixed(2) || '—'}</td>
                  <td className="py-3.5 px-5">
                    <span className={`badge ${
                      app.requestStatus === 'APPROVED' || app.requestStatus === 'SUPPLIER_APPROVED' ? 'badge-green' :
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
                <tr><td colSpan={8} className="text-center py-12 text-gray-500">No applications yet. Go to Open Access Marketplace or Documents → Apply GEOA to submit one.</td></tr>
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
    );
  }




// APPLICATION DETAILS TAB (for contracts and applications)

if (activeTab === 'application-details' && selectedApplication) {
  return (
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

      {/* Contract Status Banner */}
      <div className={`rounded-lg p-4 border ${
        selectedApplication.requestStatus === 'APPROVED' 
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
          
          {/* Contract Summary Card */}
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

          {/* Pricing Breakdown */}
          <div className="form-card">
            <h3 className="font-sora text-[16px] font-bold text-gray-900 mb-4">Pricing Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-600">Base Price (Supplier)</span>
                <span className="font-semibold text-gray-900">₹{selectedApplication.basePrice?.toFixed(2) || '—'}/unit</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-600">Open Access Charges</span>
                <span className="font-semibold text-gray-900">₹{selectedApplication.oaCharges?.toFixed(2) || '—'}/unit</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f0f4f2]">
                <span className="text-gray-600">Wheeling Charges</span>
                <span className="font-semibold text-gray-900">₹0.85/unit</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-pale px-4 rounded-lg -mx-2">
                <span className="font-bold text-gray-900">Final Delivered Price</span>
                <span className="font-bold text-[18px] text-green-dark">₹{selectedApplication.finalPrice?.toFixed(2) || '—'}/unit</span>
              </div>
            </div>
          </div>

          {/* Timeline / Milestones */}
          <div className="form-card">
            <h3 className="font-sora text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-dark" />
              Approval Timeline
            </h3>
            <div className="space-y-4">
              {selectedApplication.approvalTimeline?.map((milestone: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      milestone.status === 'Completed' ? 'bg-green-dark text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {milestone.status === 'Completed' ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    {idx < selectedApplication.approvalTimeline.length - 1 && (
                      <div className="absolute top-8 left-4 w-0.5 h-8 bg-gray-300"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-semibold text-gray-900">{milestone.stage}</p>
                    <p className="text-[12px] text-gray-500">{milestone.date}</p>
                    <span className={`badge text-[10px] mt-1 ${
                      milestone.status === 'Completed' ? 'badge-green' : 'badge-amber'
                    }`}>{milestone.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          
          {/* Supplier Information */}
          <div className="form-card">
            <h3 className="font-sora text-[16px] font-bold text-gray-900 mb-3">Supplier Information</h3>
            <div className="space-y-3 text-[13px]">
              <div>
                <p className="text-gray-500 text-[11px] uppercase font-semibold">Name</p>
                <p className="font-semibold text-gray-900">{selectedApplication.supplierName}</p>
              </div>
              <div>
                <p className="text-gray-500 text-[11px] uppercase font-semibold">State</p>
                <p className="text-gray-700">{selectedApplication.supplierState}</p>
              </div>
              <div>
                <p className="text-gray-500 text-[11px] uppercase font-semibold">Delivery Point</p>
                <p className="text-gray-700">{selectedApplication.deliveryState}</p>
              </div>
            </div>
          </div>

          {/* Consumer Information */}
          <div className="form-card">
            <h3 className="font-sora text-[16px] font-bold text-gray-900 mb-3">Consumer Information</h3>
            <div className="space-y-3 text-[13px]">
              <div>
                <p className="text-gray-500 text-[11px] uppercase font-semibold">Name</p>
                <p className="font-semibold text-gray-900">{profile?.name || 'Consumer'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-[11px] uppercase font-semibold">State</p>
                <p className="text-gray-700">{profile?.state || 'Rajasthan'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-[11px] uppercase font-semibold">Drawal Point</p>
                <p className="text-gray-700">400kV Jajpur Substation</p>
              </div>
            </div>
          </div>

          {/* Contract Documents */}
          <div className="form-card">
            <h3 className="font-sora text-[16px] font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-dark" />
              Contract Documents
            </h3>
            <div className="space-y-2">
              <button className="w-full btn-outline flex items-center justify-between px-4 py-3">
                <span className="text-[13px] font-semibold">📄 PPA Agreement</span>
                <Eye className="w-4 h-4" />
              </button>
              <button className="w-full btn-outline flex items-center justify-between px-4 py-3">
                <span className="text-[13px] font-semibold">🔒 Bank Guarantee</span>
                <Eye className="w-4 h-4" />
              </button>
              <button className="w-full btn-outline flex items-center justify-between px-4 py-3">
                <span className="text-[13px] font-semibold">📑 Open Access Approval</span>
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {selectedApplication.requestStatus !== 'APPROVED' && (
              <button className="btn-green w-full flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Sign Contract Electronically</span>
              </button>
            )}
            <button className="btn-outline w-full flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              <span>Download Contract PDF</span>
            </button>
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
          <p className="text-gray-500 text-[13px] mt-1">Active and approved contract arrangements.</p>
        </div>
        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr>
                {['Supplier','MW','Price','Status','Actions'].map(h => (
                  <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
              {applications.filter(app => ['APPROVED','SUPPLIER_APPROVED','Active Contract'].includes(app.requestStatus || app.contractStatus)).length > 0
                ? applications.filter(app => ['APPROVED','SUPPLIER_APPROVED','Active Contract'].includes(app.requestStatus || app.contractStatus)).map((app, i) => (
                  <tr key={app.id} className={`hover:bg-gray-50 ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                    <td className="py-3.5 px-5 font-semibold text-gray-900">{app.supplierName}</td>
                    <td className="py-3.5 px-5 text-gray-700">{app.requestedMw} MW</td>
                    <td className="py-3.5 px-5 font-bold text-gray-900">₹{app.finalPrice?.toFixed(2)}</td>
                    <td className="py-3.5 px-5"><span className="badge badge-green">Active</span></td>
                    <td className="py-3.5 px-5"><button onClick={() => { setSelectedApplication(app); setTab('application-details'); }} className="px-3 py-1.5 rounded-md bg-[#2d6a4f] text-white text-[12px] font-semibold hover:bg-[#1b4d3e]">View Details</button></td>
                  </tr>
                ))
                : <tr><td colSpan={5} className="text-center py-10 text-gray-500">No active contracts yet.</td></tr>
              }
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
          <p className="text-gray-500 text-[13px] mt-1">NOAR dispatch approvals</p>
        </div>
        <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Schedule ID','Supplier','Approved MW','Time Block','Status'].map(h => (
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
              )) : <tr><td colSpan={5} className="text-center py-10 text-gray-500">No active schedules yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DOCUMENTS TAB
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'documents') {

    // ── LANDING ──────────────────────────────────────────────────────────────
    if (docView === 'landing') {
      return (
        <div className="space-y-8 animate-fadeIn">
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
                <thead><tr>{['Document Name','Category','Uploaded On','Status'].map(h => <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase">{h}</th>)}</tr></thead>
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
        </div>
      );
    }

    // ── DOCUMENT UPLOAD ───────────────────────────────────────────────────────
    if (docView === 'doc-upload') {
      return (
        <div className="space-y-8 animate-fadeIn">
          <div className="pb-4 border-b border-[#e0e8e4] flex items-center justify-between">
            <div><h2 className="font-sora text-[22px] font-bold text-gray-900">Upload Regulatory Documents</h2><p className="text-gray-500 text-[13px] mt-1">Submit compliance files to the Nodal Agency verification vault.</p></div>
            <button onClick={() => setDocView('landing')} className="btn-outline flex items-center gap-2"><X className="w-4 h-4" /><span>Back</span></button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="form-card lg:col-span-2">
              <form onSubmit={handleDocUpload} className="space-y-5">
                <div className="form-group"><label className="required">Document Title</label><input type="text" placeholder="e.g. Trilateral Connection Agreement..." value={docName} onChange={(e) => setDocName(e.target.value)} required className="form-control" /></div>
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
                  <div className="flex items-end"><button type="submit" className="btn-outline w-full flex items-center justify-center space-x-2 h-[42px]"><Upload className="w-4 h-4" /><span>Upload & File Metadata</span></button></div>
                </div>
              </form>
            </div>
            <div className="tracker-card flex flex-col justify-between !mb-0">
              <div><h3 className="font-sora font-bold text-[16px] text-gray-900 mb-2">Grid Compliance Vault</h3>
                <div className="mt-4 space-y-2">
                  {[{label:'RLDC NOC',status:'VERIFIED'},{label:'SLDC Approval',status:'PENDING'},{label:'DISCOM Consent',status:'VERIFIED'}].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#f0f4f2]"><span className="text-[13px] text-gray-600">{item.label}</span><span className={`badge ${item.status === 'VERIFIED' ? 'badge-green' : 'badge-amber'}`}>{item.status}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-light p-4 rounded-lg border border-[#b5d4f4] mt-6"><p className="text-[12px] text-blue-dark">★ Uploaded files visible to NLDC administrators immediately. PENDING → VERIFIED after audit.</p></div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-sora text-[16px] font-bold text-gray-900">Document Registry</h3>
            <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead><tr>{['Document Name','Category','Uploaded On','Status'].map(h => <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase">{h}</th>)}</tr></thead>
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
        </div>
      );
    }

    // ── GEOA FORM ─────────────────────────────────────────────────────────────
    if (docView === 'geoa-form') {

      if (geoaSubmitSuccess) {
        const latest = geoaApplications[0];
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="pb-4 border-b border-[#e0e8e4]"><h2 className="font-sora text-[22px] font-bold text-gray-900">Apply for Green Energy Open Access</h2></div>
            <div className="bg-white rounded-[var(--radius-md)] border border-[#e0e8e4] p-12 flex flex-col items-center text-center space-y-5 max-w-xl mx-auto">
              <div className="w-16 h-16 bg-green-pale rounded-full flex items-center justify-center"><CheckCircle className="w-9 h-9 text-green-dark" /></div>
              <h3 className="font-sora text-[20px] font-bold text-gray-900">Application Submitted Successfully</h3>
              <p className="text-gray-500 text-[14px] leading-relaxed">Your GEOA application has been filed. It is now visible in the Admin OA Applications panel for review and approval.</p>
              <div className="bg-green-pale border border-[#9fe1cb] rounded-lg px-6 py-4 w-full text-left space-y-2">
                <p className="text-[12px] text-gray-500 uppercase font-semibold tracking-wider">Reference Number</p>
                <p className="font-mono text-[16px] font-bold text-green-dark">{latest?.refNo}</p>
                <p className="text-[12px] text-gray-500">Submitted on {latest?.submittedOn}</p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => { setDocView('landing'); setTab('my-applications'); }} className="btn-green flex-1">View My Applications</button>
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

              {/* ── STEP 1 ── */}
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

              {/* ── STEP 2 ── */}
              {geoaStep === 2 && (
                <div className="form-card space-y-5">
                  <div className="pb-4 border-b border-[#f0f4f2]">
                    <h3 className="font-sora text-[16px] font-bold text-gray-900">Step 2: Technical & Supply Details</h3>
                    <p className="text-gray-500 text-[13px] mt-1">Select a registered supplier and specify grid parameters.</p>
                  </div>

                  {/* Supplier dropdown — registered suppliers */}
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
                      <label className="required">Injection Point (auto-filled from supplier)</label>
                      <input type="text" value={geoaInjectionPoint} onChange={e => setGeoaInjectionPoint(e.target.value)} placeholder="Select a supplier above to auto-fill" className="form-control" />
                    </div>
                    <div className="form-group">
                      <label className="required">Drawal Point (Consumer End)</label>
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
                      <span>Next: Upload Documents</span><ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3 ── */}
              {geoaStep === 3 && (
                <div className="form-card space-y-5">
                  <div className="pb-4 border-b border-[#f0f4f2]">
                    <h3 className="font-sora text-[16px] font-bold text-gray-900">Step 3: Upload Supporting Documents</h3>
                    <p className="text-gray-500 text-[13px] mt-1">Upload required files (PDF/JPG/PNG, max 5MB). Mandatory fields marked <span className="text-red font-semibold">*</span>.</p>
                  </div>

                  <div className="space-y-3">
                    {geoaDocs.map((doc) => (
                      <div key={doc.key} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${doc.status === 'uploaded' ? 'border-green-mid bg-green-pale/30' : 'border-[#e0e8e4] bg-white'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${doc.status === 'uploaded' ? 'bg-green-mid/20' : 'bg-gray-100'}`}>
                            {doc.status === 'uploaded' ? <CheckCircle className="w-5 h-5 text-green-dark" /> : <FileText className="w-5 h-5 text-gray-400" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{doc.label}{doc.required && <span className="text-red ml-1">*</span>}</p>
                            {doc.fileName && <p className="text-[11px] text-green-dark font-medium truncate">{doc.fileName}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {doc.status === 'uploaded' ? <span className="badge badge-green">Uploaded</span> : (
                            <label className="px-3 py-1.5 rounded-md bg-white border border-[#e0e8e4] text-gray-700 text-[12px] font-semibold hover:bg-gray-50 cursor-pointer flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5" /><span>Choose File</span>
                              <input type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleGeoaDocSimulate(doc.key, file.name); }} />
                            </label>
                          )}
                          {doc.status === 'uploaded' && (
                            <button type="button" onClick={() => setGeoaDocs(prev => prev.map(d => d.key === doc.key ? { ...d, fileName: '', status: 'pending' } : d))} className="w-7 h-7 rounded-md border border-[#e0e8e4] flex items-center justify-center hover:bg-red-50">
                              <X className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-light border border-[#fac775] rounded-lg p-4">
                    <p className="text-[12px] text-amber leading-relaxed"><span className="font-semibold">Note:</span> All mandatory documents must be uploaded before proceeding. Files verified by Nodal Agency within 3–5 working days.</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setGeoaStep(2)} className="btn-outline flex items-center gap-2"><ArrowRight className="w-4 h-4 rotate-180" /><span>Back</span></button>
                      <button type="button" onClick={saveGeoaDraft} className="btn-outline flex items-center gap-2 text-[13px]"><Save className="w-4 h-4" /><span>Save Draft</span></button>
                    </div>
                    <button type="button" disabled={!step3Valid} onClick={() => setGeoaStep(4)} className={`btn-green flex items-center gap-2 px-8 ${!step3Valid ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <span>Next: Review & Submit</span><ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4 ── */}
              {geoaStep === 4 && (
                <div className="form-card space-y-6">
                  <div className="pb-4 border-b border-[#f0f4f2]">
                    <h3 className="font-sora text-[16px] font-bold text-gray-900">Step 4: Review & Submit Application</h3>
                    <p className="text-gray-500 text-[13px] mt-1">Verify all details before final submission to RERC / Nodal Agency.</p>
                  </div>

                  {/* Review – Applicant */}
                  <div>
                    <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-pale text-green-dark text-[10px] font-bold flex items-center justify-center">1</span>Applicant Details
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[{l:'Company Name',v:geoaApplicantName},{l:'Entity Type',v:geoaEntityType},{l:'State',v:geoaState},{l:'DISCOM',v:geoaDiscom},{l:'Contact Person',v:geoaContactPerson},{l:'Email',v:geoaEmail},{l:'Mobile',v:geoaMobile},{l:'CIN/GSTIN',v:geoaCin},{l:'Address',v:geoaAddress},{l:'DISCOM No.',v:geoaConsumerNo}].map(item => (
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
                        {l:'Supplier',v:suppliers.find(s=>s.id===geoaSelectedSupplierId)?.name||'—'},
                        {l:'Load (MW)',v:`${geoaLoadMw} MW`},{l:'Voltage Level',v:geoaVoltageLevel},
                        {l:'Renewable Source',v:geoaRenewableType},{l:'Schedule Type',v:geoaScheduleType},
                        {l:'Duration',v:`${geoaDurationDays} Days`},{l:'Start Date',v:geoaStartDate},
                        {l:'Injection Point',v:geoaInjectionPoint},{l:'Drawal Point',v:geoaDrawalPoint},
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
                      <span className="w-5 h-5 rounded-full bg-green-pale text-green-dark text-[10px] font-bold flex items-center justify-center">3</span>Documents
                    </h4>
                    <div className="space-y-2">
                      {geoaDocs.map(doc => (
                        <div key={doc.key} className="flex items-center justify-between py-2 border-b border-[#f0f4f2]">
                          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /><span className="text-[13px] text-gray-700">{doc.label}{doc.required && <span className="text-red ml-1">*</span>}</span></div>
                          <div className="flex items-center gap-2">
                            {doc.fileName && <span className="text-[12px] text-gray-500 max-w-[140px] truncate">{doc.fileName}</span>}
                            <span className={`badge ${doc.status === 'uploaded' ? 'badge-green' : 'badge-amber'}`}>{doc.status === 'uploaded' ? 'Ready' : 'Not Uploaded'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-green-pale border border-[#9fe1cb] rounded-lg p-4">
                    <p className="text-[12px] text-green-dark leading-relaxed"><span className="font-bold">Declaration:</span> I hereby declare that the information provided is true and correct. I understand that any false information may result in rejection or cancellation of Open Access permission.</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={() => setGeoaStep(3)} className="btn-outline flex items-center gap-2"><ArrowRight className="w-4 h-4 rotate-180" /><span>Back</span></button>
                    <button type="button" onClick={submitGeoaApplication} className="btn-green flex items-center gap-2 px-10 py-3 text-[15px]">
                      <CheckCircle className="w-5 h-5" /><span>Submit GEOA Application</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              <div className="tracker-card p-5 !mb-0">
                <h4 className="font-sora font-bold text-[14px] text-gray-900 mb-4 flex items-center gap-2"><Eye className="w-4 h-4 text-green-dark" />Application Checklist</h4>
                <div className="space-y-2.5">
                  {[
                    {label:'Applicant Details',done:step1Valid,step:1},
                    {label:'Technical Parameters',done:step2Valid,step:2},
                    {label:'All Mandatory Docs',done:step3Valid,step:3},
                    {label:'Review Complete',done:geoaStep===4,step:4},
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
                      {doc.status === 'uploaded' ? <CheckCircle className="w-3.5 h-3.5 text-green-dark shrink-0" /> : <div className={`w-3.5 h-3.5 rounded-full border shrink-0 ${doc.required ? 'border-red' : 'border-gray-300'}`} />}
                      <span className={doc.status === 'uploaded' ? 'text-gray-500 line-through' : doc.required ? 'text-gray-700' : 'text-gray-400'}>{doc.label}</span>
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
                {(profile?.name || user?.name || 'Consumer').split(' ').map((w: string) => w[0]).join('').slice(0,2)}
              </div>
              <div>
                <h3 className="font-sora text-[18px] font-bold text-gray-900">{profile?.name || user?.name || 'Consumer Enterprise'}</h3>
                <p className="text-[13px] text-gray-500">{profile?.email || user?.email || 'company@example.com'}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-[#f0f4f2] space-y-3">
              <div className="flex justify-between items-center text-[13px]"><span className="text-gray-500">Registered State</span><span className="font-semibold text-gray-900">{profile?.state || 'Rajasthan'}</span></div>
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
              <thead><tr>{['Transaction Ref','Date','Amount','Status'].map(h => <th key={h} className="bg-green-dark text-white text-[12px] font-semibold px-5 py-3 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#f0f4f2] text-[13px]">
                {payments.length > 0 ? payments.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                    <td className="py-3.5 px-5 text-gray-600 font-medium">{p.reference}</td>
                    <td className="py-3.5 px-5 text-gray-500">{p.createdAt}</td>
                    <td className="py-3.5 px-5 font-bold text-gray-900">₹{p.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-5"><span className="badge badge-green">{p.status}</span></td>
                  </tr>
                )) : <tr><td colSpan={4} className="text-center py-8 text-gray-500">No transactions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
};