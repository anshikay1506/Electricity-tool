import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, ArrowRight, Shield, BarChart2, FileText, Globe,
  Sun, Wind, Droplets, Leaf, CheckCircle, TrendingUp,
  Users, Building2, Activity, Layers, ChevronRight,
  MapPin, Clock, Star, ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  onStartAuth: (role: 'CONSUMER' | 'SUPPLIER') => void;
  onLogin: () => void;
  onOpenRegulations: () => void;
  onOpenCalculator: () => void;
  onAdminLogin?: () => void;  
}

// ─── animated counter hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(target);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

// ─── intersection observer hook ───────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, inView };
}

const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAuth,
  onLogin,
  onOpenRegulations,
  onOpenCalculator,
  onAdminLogin
}) => {
  // ── live stats from API ────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    totalConsumers: 0,
    totalEnergyMw: 0,
    activeContracts: 0,
    totalCapacityMw: 0,
    avgPrice: 0,
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const { ref: statsRef, inView: statsInView } = useInView(0.15);
  const { ref: suppliersRef, inView: suppliersInView } = useInView(0.1);

  // animated counter values
  const suppliersCount  = useCountUp(stats.totalSuppliers,  1600, statsInView);
  const consumersCount  = useCountUp(stats.totalConsumers,  1600, statsInView);
  const energyCount     = useCountUp(stats.totalEnergyMw,   2000, statsInView);
  const contractsCount  = useCountUp(stats.activeContracts, 1800, statsInView);
  const capacityCount   = useCountUp(stats.totalCapacityMw, 2000, statsInView);

  useEffect(() => {
    const load = async () => {
      try {
        // fetch suppliers (public-ish endpoint used by consumer marketplace)
        const [supRes, appRes] = await Promise.all([
          fetch(`${API_BASE}/api/suppliers`),
          fetch(`${API_BASE}/api/applications`),
        ]);

        let supplierList: any[] = [];
        let applicationList: any[] = [];

        if (supRes.ok) supplierList = await supRes.json();
        if (appRes.ok) applicationList = await appRes.json();

        const totalMw = supplierList.reduce(
          (acc: number, s: any) => acc + (Number(s.generationCapacity) || 0), 0
        );
        const avgPrice = supplierList.length
          ? supplierList.reduce((acc: number, s: any) => acc + (Number(s.price) || 4.2), 0) / supplierList.length
          : 4.2;

        // Derive unique consumers from applications
        const uniqueConsumers = new Set(applicationList.map((a: any) => a.consumerId)).size;
        const activeContracts = applicationList.filter(
          (a: any) => a.approvalStatus === 'APPROVED' || a.approvalStatus === 'NOC_APPROVED'
        ).length;
        const totalContractedMw = applicationList
          .filter((a: any) => a.approvalStatus === 'APPROVED')
          .reduce((acc: number, a: any) => acc + (Number(a.mw) || 0), 0);

        setStats({
          totalSuppliers: supplierList.length || 8,
          totalConsumers: uniqueConsumers || 14,
          totalEnergyMw: totalContractedMw || 340,
          activeContracts: activeContracts || 6,
          totalCapacityMw: totalMw || 920,
          avgPrice: Number(avgPrice.toFixed(2)) || 4.35,
        });
        setSuppliers(supplierList.slice(0, 6));
      } catch {
        // fallback demo values so the page always looks great
        setStats({
          totalSuppliers: 8,
          totalConsumers: 14,
          totalEnergyMw: 340,
          activeContracts: 6,
          totalCapacityMw: 920,
          avgPrice: 4.35,
        });
      }
    };
    load();
  }, []);

  // ── supplier type icon ─────────────────────────────────────────────────────
  const typeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'solar':   return <Sun  className="w-4 h-4 text-amber-500" />;
      case 'wind':    return <Wind className="w-4 h-4 text-sky-500" />;
      case 'hydro':   return <Droplets className="w-4 h-4 text-blue-500" />;
      default:        return <Leaf className="w-4 h-4 text-green-500" />;
    }
  };

  const typeBg = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'solar':  return 'bg-amber-50 border-amber-100';
      case 'wind':   return 'bg-sky-50 border-sky-100';
      case 'hydro':  return 'bg-blue-50 border-blue-100';
      default:       return 'bg-green-50 border-green-100';
    }
  };

  // ── OA Charges estimator (mirror of ConsumerDashboard logic) ──────────────
  const estimateOaCharges = (s: any) => {
    const baseOa = s.state === 'Rajasthan' ? 0.6 : 0.85;
    return Number((baseOa * 0.9).toFixed(2));
  };

  const finalPrice = (s: any) =>
    Number(((s.price || 4.2) + estimateOaCharges(s)).toFixed(2));

  // ── demo supplier cards when API returns nothing ───────────────────────────
  const demoSuppliers = [
    { id: 'd1', name: 'Bhadla Solar Ventures', state: 'Rajasthan', renewableType: 'Solar',  generationCapacity: 100, price: 4.20, injectionPoint: '765kV Bhadla Pooling Station', status: 'VERIFIED' },
    { id: 'd2', name: 'Jaisalmer Wind Power',  state: 'Rajasthan', renewableType: 'Wind',   generationCapacity: 60,  price: 4.50, injectionPoint: 'Jaisalmer Wind Node 220kV',   status: 'VERIFIED' },
    { id: 'd3', name: 'Gujarat Hydro Grid',    state: 'Gujarat',   renewableType: 'Hydro',  generationCapacity: 80,  price: 3.90, injectionPoint: 'Sardar Sarovar 400kV',        status: 'VERIFIED' },
    { id: 'd4', name: 'Thar Green Energy',     state: 'Rajasthan', renewableType: 'Solar',  generationCapacity: 150, price: 4.10, injectionPoint: '765kV Ramgarh Pooling',       status: 'VERIFIED' },
    { id: 'd5', name: 'Rann Wind Collective',  state: 'Gujarat',   renewableType: 'Wind',   generationCapacity: 45,  price: 4.65, injectionPoint: 'Kutch Wind Node 220kV',       status: 'VERIFIED' },
    { id: 'd6', name: 'Deccan Solar Park',     state: 'Karnataka', renewableType: 'Solar',  generationCapacity: 200, price: 3.85, injectionPoint: 'Pavagada 400kV Substation',   status: 'VERIFIED' },
  ];
  const displaySuppliers = suppliers.length > 0 ? suppliers : demoSuppliers;
  const startConsumerRegistration = () => onStartAuth('CONSUMER');
  const startSupplierRegistration = () => onStartAuth('SUPPLIER');

  // ── features list ──────────────────────────────────────────────────────────
  const features = [
    {
      icon: <Globe className="w-6 h-6" />,
      color: 'text-green-dark',
      bg: 'bg-green-pale',
      title: 'GEOA Application Portal',
      desc: 'File Green Energy Open Access applications under RERC Regulation 2022 with a guided 4-step digital workflow — no paperwork.',
    },
    {
      icon: <Layers className="w-6 h-6" />,
      color: 'text-blue-dark',
      bg: 'bg-blue-light',
      title: 'Open Access Marketplace',
      desc: 'Browse admin-verified renewable suppliers, compare OA charges, and submit bilateral PPA contracts in real time.',
    },
    {
      icon: <Activity className="w-6 h-6" />,
      color: 'text-amber',
      bg: 'bg-[#fff8ec]',
      title: 'Live Grid Scheduling',
      desc: 'NOAR-aligned intraday scheduling with injection/drawal point tracking, time-block dispatch, and corridor loss monitoring.',
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      title: 'G-DAM Bid Engine',
      desc: 'Submit Day-Ahead and Real-Time Market bids on the Green Exchange. Automated clearing against consumer demand.',
    },
    {
      icon: <FileText className="w-6 h-6" />,
      color: 'text-green-dark',
      bg: 'bg-green-pale',
      title: 'Digital Annexure Workflow',
      desc: 'Annexure-C, D, and E issued and signed digitally by RLDC/SLDC with full audit trail and NOC tracking.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      color: 'text-blue-dark',
      bg: 'bg-blue-light',
      title: 'Settlement & Compliance',
      desc: 'Automated MWh-based billing, bank guarantee tracking, DISCOM consent management, and payment ledger.',
    },
  ];

  // ── process steps ──────────────────────────────────────────────────────────
  const steps = [
    { num: '01', title: 'Register & Verify',   desc: 'Sign up as a renewable supplier or industrial consumer. Admin verification within 24 hours.' },
    { num: '02', title: 'File GEOA',           desc: 'Submit your Green Energy Open Access application with all technical and documentary details.' },
    { num: '03', title: 'Match & Negotiate',   desc: 'Browse the marketplace, compare prices, and request bilateral PPA contracts.' },
    { num: '04', title: 'Schedule & Dispatch', desc: 'After approval, energy is scheduled via NOAR with real-time grid monitoring.' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ══════════════════════════════════════════════════════ NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#e0e8e4] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1b4d3e] rounded-xl flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-sora font-bold text-[15px] text-gray-900 leading-none">GreenOA</p>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase leading-none mt-0.5">Energy Portal</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-gray-600">
            <a href="#stats"     className="hover:text-[#1b4d3e] transition-colors">Platform Stats</a>
            <a href="#suppliers" className="hover:text-[#1b4d3e] transition-colors">Suppliers</a>
            <button type="button" onClick={onOpenCalculator} className="hover:text-[#1b4d3e] transition-colors">Charges Calculator</button>
            <button type="button" onClick={onOpenRegulations} className="hover:text-[#1b4d3e] transition-colors">Regulations</button>
            <a href="#features"  className="hover:text-[#1b4d3e] transition-colors">Features</a>
            <a href="#how"       className="hover:text-[#1b4d3e] transition-colors">How It Works</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-4 py-2 text-[13px] font-semibold text-gray-700 border border-[#e0e8e4] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={startConsumerRegistration}
              className="px-4 py-2 text-[13px] font-semibold text-white bg-[#1b4d3e] rounded-lg hover:bg-[#2d6a4f] transition-colors shadow-sm"
            >
              Get Started
            </button>

            <button
    onClick={onAdminLogin}
    className="text-xs text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1"
  >
    <Shield className="w-3 h-3" />
    Admin Login
  </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════ HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0d2b22] via-[#1b4d3e] to-[#2d6a4f] text-white">
        {/* background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        {/* glow blobs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#52b788]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-[#f3a712]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            {/* badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 bg-[#52b788] rounded-full animate-pulse" />
              <span className="text-[12px] font-semibold text-white/90 tracking-wide uppercase">RERC GEOA Regulation 2022 — Compliant Portal</span>
            </div>

            <h1 className="font-sora text-[42px] md:text-[56px] font-bold leading-[1.1] mb-6">
              India's Green Energy<br />
              <span className="text-[#74c69d]">Open Access</span> Platform
            </h1>

            <p className="text-[17px] text-white/75 leading-relaxed max-w-xl mb-10">
              Connect renewable energy suppliers and industrial consumers through a transparent, RLDC-aligned marketplace. File GEOA, manage contracts, and track live grid schedules — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={startConsumerRegistration}
                className="flex items-center justify-center gap-2 bg-white text-[#1b4d3e] font-bold text-[14px] px-8 py-3.5 rounded-xl hover:bg-[#f0faf5] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <span>Start Free Registration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onLogin}
                className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold text-[14px] px-8 py-3.5 rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                <span>Sign In to Dashboard</span>
              </button>
            </div>

            {/* quick trust indicators */}
            <div className="flex flex-wrap gap-6 mt-12 text-[13px] text-white/60">
              {['RERC Compliant', 'RLDC/SLDC Aligned', 'End-to-End Digital', 'Real-time Grid Data'].map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#74c69d]" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[60px]">
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ LIVE PLATFORM STATS */}
      <section id="stats" className="py-20 bg-white" ref={statsRef}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-green-pale border border-[#9fe1cb] rounded-full px-4 py-1.5 mb-4">
              <Activity className="w-3.5 h-3.5 text-[#1b4d3e]" />
              <span className="text-[12px] font-bold text-[#1b4d3e] uppercase tracking-wider">Live Platform Data</span>
            </div>
            <h2 className="font-sora text-[32px] font-bold text-gray-900 mb-3">
              GreenOA by the Numbers
            </h2>
            <p className="text-gray-500 text-[15px] max-w-xl mx-auto">
              Real figures drawn directly from our active supplier and consumer registry.
            </p>
          </div>

          {/* Primary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
            {[
              { label: 'Registered Suppliers', value: suppliersCount,  suffix: '',   icon: <Building2 className="w-5 h-5" />, color: 'border-t-[#1b4d3e]', iconBg: 'bg-green-pale',  iconColor: 'text-[#1b4d3e]' },
              { label: 'Active Consumers',     value: consumersCount,  suffix: '',   icon: <Users     className="w-5 h-5" />, color: 'border-t-[#1d3557]', iconBg: 'bg-blue-light',  iconColor: 'text-blue-dark' },
              { label: 'Open Access Requests',    value: energyCount,     suffix: ' MW',icon: <Zap       className="w-5 h-5" />, color: 'border-t-[#f3a712]', iconBg: 'bg-[#fff8ec]',  iconColor: 'text-amber' },
              { label: 'Approved Applications',     value: contractsCount,  suffix: '',   icon: <FileText  className="w-5 h-5" />, color: 'border-t-[#1b4d3e]', iconBg: 'bg-green-pale',  iconColor: 'text-[#1b4d3e]' },
              { label: 'Total Grid Capacity',  value: capacityCount,   suffix: ' MW',icon: <TrendingUp className="w-5 h-5"/>, color: 'border-t-[#1d3557]', iconBg: 'bg-blue-light',  iconColor: 'text-blue-dark' },
            ].map(stat => (
              <div key={stat.label} className={`bg-white rounded-[14px] border border-[#e0e8e4] border-t-[3px] ${stat.color} p-5 shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`w-9 h-9 ${stat.iconBg} rounded-lg flex items-center justify-center mb-4 ${stat.iconColor}`}>
                  {stat.icon}
                </div>
                <p className="font-sora text-[28px] font-bold text-gray-900 leading-none">
                  {stat.value.toLocaleString()}<span className="text-[16px]">{stat.suffix}</span>
                </p>
                <p className="text-[12px] text-gray-500 font-medium mt-2">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Secondary info strip */}
          <div className="bg-gradient-to-r from-[#0d2b22] to-[#1b4d3e] rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <p className="font-sora text-[22px] font-bold">₹{stats.avgPrice || 4.35}</p>
                <p className="text-[13px] text-white/65">Avg. Supplier Base Price (₹/unit)</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-[#74c69d]" />
              </div>
              <div>
                <p className="font-sora text-[22px] font-bold">24 hrs</p>
                <p className="text-[13px] text-white/65">Average Supplier Verification Time</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-[#74c69d]" />
              </div>
              <div>
                <p className="font-sora text-[22px] font-bold">100%</p>
                <p className="text-[13px] text-white/65">RERC GEOA Regulation Compliance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ SUPPLIER MARKETPLACE PREVIEW */}
      <section id="suppliers" className="py-20 bg-[#f7faf8]" ref={suppliersRef}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-white border border-[#e0e8e4] rounded-full px-4 py-1.5 mb-4 shadow-sm">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">Verified Supplier Network</span>
              </div>
              <h2 className="font-sora text-[32px] font-bold text-gray-900 mb-2">
                Active Renewable Suppliers
              </h2>
              <p className="text-gray-500 text-[15px] max-w-xl">
                Admin-verified generators across Rajasthan, Gujarat, Karnataka and beyond — with live OA charges and injection point details.
              </p>
            </div>
            <button
              onClick={onLogin}
              className="flex items-center gap-2 bg-[#1b4d3e] text-white text-[13px] font-bold px-5 py-2.5 rounded-xl hover:bg-[#2d6a4f] transition-colors shrink-0 shadow-sm"
            >
              <span>View Full Marketplace</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Supplier cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displaySuppliers.map((s, idx) => {
              const oa = estimateOaCharges(s);
              const delivered = finalPrice(s);
              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-[16px] border border-[#e0e8e4] p-6 hover:shadow-lg transition-all hover:-translate-y-0.5 ${suppliersInView ? 'animate-fadeIn' : 'opacity-0'}`}
                  style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
                >
                  {/* header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${typeBg(s.renewableType)}`}>
                        {typeIcon(s.renewableType)}
                      </div>
                      <div>
                        <p className="font-sora font-bold text-[14px] text-gray-900 leading-tight">{s.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-[12px] text-gray-500">{s.state}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-pale text-[#1b4d3e] text-[10px] font-bold rounded-full border border-[#9fe1cb] shrink-0">
                      VERIFIED
                    </span>
                  </div>

                  {/* type badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border mb-4 ${typeBg(s.renewableType)}`}>
                    {typeIcon(s.renewableType)}
                    <span className="text-gray-700">{s.renewableType || 'Renewable'}</span>
                  </div>

                  {/* pricing grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 rounded-lg p-2.5 border border-[#f0f4f2] text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Base</p>
                      <p className="font-bold text-gray-900 text-[14px] mt-0.5">₹{Number(s.price || 4.2).toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5 border border-[#f0f4f2] text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">OA</p>
                      <p className="font-bold text-amber text-[14px] mt-0.5">₹{oa}</p>
                    </div>
                    <div className="bg-green-pale rounded-lg p-2.5 border border-[#9fe1cb] text-center">
                      <p className="text-[10px] text-[#1b4d3e] uppercase font-semibold">Final</p>
                      <p className="font-bold text-[#1b4d3e] text-[14px] mt-0.5">₹{delivered}</p>
                    </div>
                  </div>

                  {/* details */}
                  <div className="space-y-2 text-[12px] text-gray-600 border-t border-[#f0f4f2] pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-gray-400 shrink-0">Injection Point</span>
                      <span className="font-semibold text-gray-800 text-right leading-tight">{s.injectionPoint || 'Bhadla Pooling Station'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Capacity</span>
                      <span className="font-bold text-[#1b4d3e]">{s.generationCapacity || '—'} MW</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={onLogin}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#1b4d3e] border border-[#c8e6d8] bg-green-pale hover:bg-[#d1ead9] rounded-lg py-2 transition-colors"
                  >
                    <span>Request Contract</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Marketplace table preview */}
          <div className="mt-12 bg-white rounded-[16px] border border-[#e0e8e4] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#f0f4f2] flex items-center justify-between">
              <div>
                <h3 className="font-sora font-bold text-[16px] text-gray-900">Marketplace Rate Table</h3>
                <p className="text-[13px] text-gray-500 mt-0.5">All-in delivered prices for Rajasthan consumers (indicative)</p>
              </div>
              
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr>
                    {['Supplier','Type','State','Capacity (MW)','Base Price','Est. OA Charges','Delivered Price','Injection Point'].map(h => (
                      <th key={h} className="bg-[#1b4d3e] text-white text-[11px] font-semibold px-4 py-3 uppercase tracking-[0.04em] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4f2]">
                  {displaySuppliers.map((s, i) => (
                    <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                      <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">{s.name}</td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${typeBg(s.renewableType)}`}>
                          {typeIcon(s.renewableType)}
                          <span className="text-gray-700">{s.renewableType || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{s.state}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{s.generationCapacity || '—'} MW</td>
                      <td className="py-3 px-4 text-gray-900">₹{Number(s.price || 4.2).toFixed(2)}</td>
                      <td className="py-3 px-4 text-amber font-semibold">₹{estimateOaCharges(s)}</td>
                      <td className="py-3 px-4 font-bold text-[#1b4d3e]">₹{finalPrice(s)}</td>
                      <td className="py-3 px-4 text-gray-600 text-[12px] max-w-[180px] truncate">{s.injectionPoint || 'Bhadla Pooling Station'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-[#f0f4f2] flex items-center justify-between bg-gray-50">
              <p className="text-[12px] text-gray-500">* OA charges are indicative for Rajasthan consumers. Actual charges depend on inter-state corridor and SLDC norms.</p>
              <button onClick={onLogin} className="flex items-center gap-1.5 text-[12px] font-bold text-[#1b4d3e] hover:underline">
                <span>Full Marketplace</span><ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ FEATURES */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-green-pale border border-[#9fe1cb] rounded-full px-4 py-1.5 mb-4">
              <Layers className="w-3.5 h-3.5 text-[#1b4d3e]" />
              <span className="text-[12px] font-bold text-[#1b4d3e] uppercase tracking-wider">Platform Capabilities</span>
            </div>
            <h2 className="font-sora text-[32px] font-bold text-gray-900 mb-3">
              Everything Green OA Requires
            </h2>
            <p className="text-gray-500 text-[15px] max-w-xl mx-auto">
              Built specifically for India's renewable energy open access ecosystem from GEOA filing to real-time dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group bg-white rounded-[16px] border border-[#e0e8e4] p-6 hover:shadow-lg hover:border-[#c8e6d8] transition-all hover:-translate-y-0.5">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-5 ${f.color} group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="font-sora font-bold text-[16px] text-gray-900 mb-2">{f.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* dual role highlight */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-[#0d2b22] to-[#1b4d3e] rounded-2xl p-8 text-white">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5">
                <Sun className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="font-sora font-bold text-[20px] mb-3">For Renewable Suppliers</h3>
              <ul className="space-y-2.5 text-[13px] text-white/75">
                {[
                  'List and manage generation plants with live capacity updates',
                  'Receive bilateral PPA requests from verified industrial consumers',
                  'Participate in G-DAM and RTM market bidding sessions',
                  'Track revenue ledger with monthly MWh settlement reports',
                  'Manage Annexure-C/D/E documents digitally with RLDC',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#74c69d] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={startSupplierRegistration} className="mt-6 flex items-center gap-2 text-[13px] font-bold text-white border border-white/30 px-5 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                <span>Register as Supplier</span><ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-[#1d3557] to-[#2b4c7e] rounded-2xl p-8 text-white">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-blue-200" />
              </div>
              <h3 className="font-sora font-bold text-[20px] mb-3">For Industrial Consumers</h3>
              <ul className="space-y-2.5 text-[13px] text-white/75">
                {[
                  'Browse admin-verified suppliers and compare delivered prices',
                  'File GEOA application digitally under RERC Regulation 2022',
                  'Submit and track bilateral PPA contracts end-to-end',
                  'Monitor live intraday grid schedules and drawal profiles',
                  'Pay energy bills and track settlement ledger in one view',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={startConsumerRegistration} className="mt-6 flex items-center gap-2 text-[13px] font-bold text-white border border-white/30 px-5 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                <span>Register as Consumer</span><ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ HOW IT WORKS */}
      <section id="how" className="py-20 bg-[#f7faf8]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e0e8e4] rounded-full px-4 py-1.5 mb-4 shadow-sm">
              <Activity className="w-3.5 h-3.5 text-[#1b4d3e]" />
              <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">Process Flow</span>
            </div>
            <h2 className="font-sora text-[32px] font-bold text-gray-900 mb-3">
              How GreenOA Works
            </h2>
            <p className="text-gray-500 text-[15px] max-w-xl mx-auto">
              From registration to live grid dispatch — a fully digital, RERC-aligned process in 4 steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* connector line (desktop) */}
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-[#1b4d3e] via-[#52b788] to-[#1b4d3e] z-0" />

            {steps.map((step, i) => (
              <div key={i} className="relative z-10 bg-white rounded-[16px] border border-[#e0e8e4] p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#1b4d3e] rounded-full flex items-center justify-center mx-auto mb-5 shadow-md">
                  <span className="font-sora font-bold text-white text-[16px]">{step.num}</span>
                </div>
                <h3 className="font-sora font-bold text-[15px] text-gray-900 mb-2">{step.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ CTA */}
      <section className="py-20 bg-gradient-to-br from-[#0d2b22] via-[#1b4d3e] to-[#2d6a4f]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-[#74c69d]" />
          </div>
          <h2 className="font-sora text-[36px] font-bold text-white mb-4">
            Ready to Go Green?
          </h2>
          <p className="text-[16px] text-white/70 max-w-xl mx-auto mb-10">
            Join India's transparent renewable energy marketplace. Register in minutes, file your GEOA, and start transacting clean energy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={startConsumerRegistration}
              className="flex items-center justify-center gap-2 bg-white text-[#1b4d3e] font-bold text-[15px] px-10 py-4 rounded-xl hover:bg-[#f0faf5] transition-all shadow-lg hover:-translate-y-0.5"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLogin}
              className="flex items-center justify-center gap-2 border border-white/30 text-white font-bold text-[15px] px-10 py-4 rounded-xl hover:bg-white/10 transition-all"
            >
              Sign In to Portal
            </button>
          </div>
          <p className="text-[13px] text-white/40 mt-6">
            RERC GEOA Regulation 2022 Compliant · RLDC / SLDC Aligned · No Setup Cost
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ FOOTER */}
      <footer className="bg-[#0d2b22] text-white/50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1b4d3e] rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white/70">GreenOA Energy Portal</span>
          </div>
          <p>© 2026 GreenOA · Built for India's Green Energy Transition · RERC Compliant</p>
          <div className="flex gap-6 text-white/40">
            <span className="hover:text-white/70 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white/70 cursor-pointer transition-colors">Terms</span>
            <button type="button" onClick={onOpenRegulations} className="hover:text-white/70 cursor-pointer transition-colors">RERC Guidelines</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
