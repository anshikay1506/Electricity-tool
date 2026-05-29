import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Calculator, Zap } from 'lucide-react';

interface ChargesCalculatorProps {
  onBackToLanding?: () => void;
  onOpenRegulations?: () => void;
  onLogin?: () => void;
}

export const ChargesCalculator: React.FC<ChargesCalculatorProps> = ({
  onBackToLanding,
  onOpenRegulations,
  onLogin
}) => {
  const [demand, setDemand] = useState(1000);
  const [capacity, setCapacity] = useState(800);
  const [source, setSource] = useState('solar');
  const [system, setSystem] = useState('insts');
  const [category, setCategory] = useState('hv');
  const [units, setUnits] = useState(400000);
  const [duration, setDuration] = useState('medium');

  const [charges, setCharges] = useState({
    transmission: 0,
    wheeling: 0,
    css: 0,
    as: 0,
    sldc: 0,
    total: 0,
    annual: 0,
    security: 0
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `Rs. ${(value / 100000).toFixed(2)}L`;
    return `Rs. ${Math.round(value).toLocaleString('en-IN')}`;
  };

  useEffect(() => {
    let tcRate = system === 'insts' ? 0.12 : 0;
    const wcRate = system === 'discom' ? 0.10 : 0;
    let cssRate = category === 'captive' ? 0 : 0.30;
    let asRate = 0.10;

    if (['solar', 'solarbess', 'wind', 'hybrid'].includes(source)) {
      tcRate = 0;
    }
    if (source === 'bess') {
      asRate = 0.05;
    }
    if (duration === 'long') {
      cssRate *= 0.85;
    }

    const tc = Math.round(units * tcRate);
    const wc = Math.round(units * wcRate);
    const css = Math.round(units * cssRate);
    const asValue = Math.round(units * asRate);
    const sldc = Math.round(capacity * 15);
    const total = tc + wc + css + asValue + sldc;

    setCharges({
      transmission: tc,
      wheeling: wc,
      css,
      as: asValue,
      sldc,
      total,
      annual: total * 12,
      security: total * 3
    });
  }, [capacity, source, system, category, units, duration]);

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-gray-900 font-sans">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#e0e8e4] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <button type="button" onClick={onBackToLanding} className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 bg-[#1b4d3e] rounded-xl flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-sora font-bold text-[15px] text-gray-900 leading-none">GreenOA</p>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase leading-none mt-0.5">Charges Desk</p>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-gray-600">
            <button type="button" onClick={onBackToLanding} className="hover:text-[#1b4d3e] transition-colors">Home</button>
            <button type="button" onClick={onOpenRegulations} className="hover:text-[#1b4d3e] transition-colors">Regulations</button>
          </div>

          <button
            type="button"
            onClick={onLogin}
            className="px-4 py-2 text-[13px] font-semibold text-white bg-[#1b4d3e] rounded-lg hover:bg-[#2d6a4f] transition-colors shadow-sm"
          >
            Sign In
          </button>
        </div>
      </nav>

      <header className="bg-[#0d2b22] text-white">
        <div className="max-w-[1100px] mx-auto px-8 py-10">
          <button
            type="button"
            onClick={onBackToLanding}
            className="mb-6 inline-flex items-center gap-2 text-[13px] font-semibold text-white/75 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to landing page
          </button>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-5">
            <Calculator className="w-3.5 h-3.5 text-[#74c69d]" />
            <span className="text-[12px] font-bold uppercase tracking-wider text-white/85">Indicative Commercial Tool</span>
          </div>
          <h1 className="font-sora text-[34px] md:text-[42px] font-bold leading-tight">Open Access Charges Estimator</h1>
          <p className="text-white/70 text-[15px] mt-3 max-w-2xl">
            Estimate monthly GEOA charges using typical charge heads from Regulation 11. Final billing depends on notified RERC orders and nodal agency confirmation.
          </p>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-8 py-8">
        <div className="mb-6 bg-[#fff8ec] border border-[#f3a712] rounded-lg p-4 flex gap-3">
          <BookOpen className="w-5 h-5 text-[#9a6400] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#9a6400] font-semibold">Indicative Calculation</p>
            <p className="text-sm text-[#9a6400] mt-1">Actual charges are determined by RERC orders, applicable tariff regulations, connection conditions, and system usage approvals.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg border border-[#e0e8e4] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-5 h-5 text-[#1b4d3e]" />
              <h2 className="font-sora text-lg font-bold text-gray-900">Input Parameters</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Contract Demand / Load (kW)</label>
                <input type="number" value={demand} onChange={(e) => setDemand(Number(e.target.value))} min="100" className="w-full px-4 py-2 border border-[#dde5e1] rounded-lg focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-green-pale" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Open Access Capacity (kW)</label>
                <input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full px-4 py-2 border border-[#dde5e1] rounded-lg focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-green-pale" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Energy Source Type</label>
                <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-4 py-2 border border-[#dde5e1] rounded-lg focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-green-pale">
                  <option value="solar">Solar (without BESS)</option>
                  <option value="solarbess">Solar with BESS (&gt;5%)</option>
                  <option value="wind">Wind Energy</option>
                  <option value="hybrid">Solar + Wind Hybrid</option>
                  <option value="bess">Standalone BESS</option>
                  <option value="hydro">Small Hydro</option>
                  <option value="biomass">Biomass / Biogas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Transmission System</label>
                <select value={system} onChange={(e) => setSystem(e.target.value)} className="w-full px-4 py-2 border border-[#dde5e1] rounded-lg focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-green-pale">
                  <option value="insts">InSTS (RVPN)</option>
                  <option value="discom">Distribution (Discom)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Consumer Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 border border-[#dde5e1] rounded-lg focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-green-pale">
                  <option value="hv">HV Industrial (HV-2/HV-3)</option>
                  <option value="mv">MV Commercial</option>
                  <option value="captive">Captive Consumer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Units Consumed per Month (kWh)</label>
                <input type="number" value={units} onChange={(e) => setUnits(Number(e.target.value))} className="w-full px-4 py-2 border border-[#dde5e1] rounded-lg focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-green-pale" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Duration of GEOA</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-4 py-2 border border-[#dde5e1] rounded-lg focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-green-pale">
                  <option value="short">Short-term (up to 1 year)</option>
                  <option value="medium">Medium-term (1-12 years)</option>
                  <option value="long">Long-term (12-25 years)</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-[#0d2b22] rounded-lg border border-[#e0e8e4] p-6 text-white shadow-sm">
            <h2 className="font-sora text-lg font-bold mb-6">Estimated Monthly Charges</h2>

            <div className="space-y-4">
              {[
                ['Transmission Charges (InSTS)', charges.transmission],
                ['Wheeling Charges (Distribution)', charges.wheeling],
                ['Cross-Subsidy Surcharge', charges.css],
                ['Additional Surcharge', charges.as],
                ['SLDC / Scheduling Charges', charges.sldc]
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between items-center gap-4 pb-3 border-b border-white/10">
                  <span className="text-white/70">{label}</span>
                  <span className="font-semibold text-right">{formatCurrency(value as number)}</span>
                </div>
              ))}

              <div className="mt-6 p-4 bg-white/10 rounded-lg">
                <div className="flex justify-between items-center gap-4 mb-2">
                  <span className="text-white/70 text-sm">Total Estimated Monthly</span>
                  <span className="text-[#9fe1cb] font-sora text-2xl font-bold text-right">{formatCurrency(charges.total)}</span>
                </div>
                <p className="text-xs text-white/50">Excluding green power energy cost</p>
              </div>

              <div className="mt-6 p-3 bg-white/8 rounded text-xs text-white/70 leading-relaxed">
                <strong className="text-white/85">Model notes:</strong> Solar, wind, and hybrid sources use transmission charge exemptions in this indicative model. Captive consumers are modelled without CSS.
              </div>

              <div className="mt-6 space-y-2 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-white/70">Annualised Charge Estimate</span>
                  <span className="font-semibold text-right">{formatCurrency(charges.annual)}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-white/70">Security Deposit (3 months)</span>
                  <span className="font-semibold text-right">{formatCurrency(charges.security)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 bg-blue-light border border-[#b5d4f4] rounded-lg p-4">
          <p className="text-sm text-blue-dark">
            <strong>Important:</strong> This calculator provides an indicative estimate based on typical rates. Actual charges may vary by voltage level, drawal point, injection point, metering, banking treatment, open access tenure, and notified tariff orders.
          </p>
        </div>
      </main>
    </div>
  );
};
