import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Calculator, FileText, Scale, ShieldCheck, Zap } from 'lucide-react';

interface RegulationsPageProps {
  onBackToLanding?: () => void;
  onOpenCalculator?: () => void;
  onLogin?: () => void;
}

const regulations = [
  {
    id: 'reg-1',
    label: 'Reg. 1 - Title & Scope',
    title: 'Regulation 1 - Title & Scope',
    summary: 'Defines the short title, commencement, and applicability of the Green Energy Open Access framework across Rajasthan.',
    points: [
      'Applies to open access for electricity generated from renewable energy sources.',
      'Covers use of intra-state transmission and distribution systems.',
      'Prevails for matters specific to Green Energy Open Access where applicable.'
    ]
  },
  {
    id: 'reg-2',
    label: 'Reg. 2 - Definitions',
    title: 'Regulation 2 - Definitions',
    summary: 'Sets the regulatory vocabulary used across GEOA applications, scheduling, banking, settlement, and compliance.',
    points: [
      'Defines Green Energy Open Access consumer, banking, nodal agency, renewable energy, and BESS.',
      'Clarifies drawal, injection, open access, obligated entity, and distribution licensee references.',
      'Keeps operational and commercial terms consistent across the application lifecycle.'
    ]
  },
  {
    id: 'reg-3',
    label: 'Reg. 3 - Eligibility',
    title: 'Regulation 3 - Eligibility',
    summary: 'Specifies which consumers and entities may procure power through Green Energy Open Access.',
    points: [
      'Consumers with contract demand or sanctioned load of 100 kW or more are eligible.',
      'Captive consumers may qualify without the same minimum load threshold.',
      'Consumers may source green energy for part or all of their electricity requirement.'
    ]
  },
  {
    id: 'reg-4',
    label: 'Reg. 4 - Categorization',
    title: 'Regulation 4 - Categorization',
    summary: 'Classifies open access by tenure so applications, approvals, and scheduling can follow the correct route.',
    points: [
      'Long-term GEOA: 12 years to 25 years.',
      'Medium-term GEOA: 1 year to 12 years.',
      'Short-term GEOA: up to 1 year, subject to the applicable minimum period.'
    ]
  },
  {
    id: 'reg-5',
    label: 'Reg. 5 - Application Process',
    title: 'Regulation 5 - Application Process',
    summary: 'Defines the information and documents required for applying to the appropriate nodal agency.',
    points: [
      'Applicant details, consumer number, quantum, duration, and voltage level are required.',
      'Source, injection point, drawal point, and generator details must be captured.',
      'Applications should include the selected sourcing route such as captive, third-party, or exchange.'
    ]
  },
  {
    id: 'reg-7',
    label: 'Reg. 7 - Nodal Agency',
    title: 'Regulation 7 - Nodal Agency',
    summary: 'Identifies the agency responsible for receiving, validating, and processing GEOA applications.',
    points: [
      'RVPN generally acts as nodal agency for intra-state transmission system access.',
      'Distribution licensee handling may apply for distribution-level access cases.',
      'The nodal agency coordinates technical feasibility, consent, and approval workflow.'
    ]
  },
  {
    id: 'reg-8',
    label: 'Reg. 8 - Allotment Priority',
    title: 'Regulation 8 - Allotment Priority',
    summary: 'Establishes priority principles for granting open access when network capacity is constrained.',
    points: [
      'Applications are handled according to tenure, timing, and system availability.',
      'Priority rules help allocate transmission and distribution corridors transparently.',
      'Technical feasibility remains central before access is confirmed.'
    ]
  },
  {
    id: 'reg-11',
    label: 'Reg. 11 - Charges',
    title: 'Regulation 11 - Charges',
    summary: 'Lists the commercial charges that may apply to Green Energy Open Access consumers.',
    points: [
      'Transmission, wheeling, cross-subsidy surcharge, additional surcharge, and SLDC charges may apply.',
      'Renewable and BESS-related exemptions or concessions may apply subject to the regulation and orders.',
      'Standby and banking-related charges are handled as notified by the Commission.'
    ]
  },
  {
    id: 'reg-12',
    label: 'Reg. 12 - Banking',
    title: 'Regulation 12 - Banking',
    summary: 'Covers treatment of surplus green energy injected into the grid by eligible GEOA consumers.',
    points: [
      'Surplus injected green energy may be banked with the distribution licensee where permitted.',
      'Drawal of banked energy is subject to applicable conditions and charges.',
      'Unused green energy may be treated according to RPO and settlement provisions.'
    ]
  },
  {
    id: 'reg-16',
    label: 'Reg. 16 - Scheduling',
    title: 'Regulation 16 - Scheduling',
    summary: 'Defines scheduling, dispatch coordination, and energy accounting responsibilities.',
    points: [
      'Approved GEOA transactions must follow SLDC/RLDC scheduling procedures.',
      'Injection and drawal schedules are tracked for deviation, settlement, and grid discipline.',
      'Consumers and suppliers must provide timely schedules and revisions as applicable.'
    ]
  },
  {
    id: 'reg-21',
    label: 'Reg. 21 - Green Energy Tariff',
    title: 'Regulation 21 - Green Energy Tariff',
    summary: 'Provides the route for consumers to procure green energy through a distribution licensee tariff.',
    points: [
      'Consumers may requisition green energy from their distribution licensee.',
      'The requisition should specify quantum and category of green energy for the applicable period.',
      'Distribution licensees procure and supply green energy subject to tariff and regulatory terms.'
    ]
  },
  {
    id: 'reg-23',
    label: 'Reg. 23 - Green Certificate',
    title: 'Regulation 23 - Green Certificate',
    summary: 'Covers certification or recognition of green energy consumption for eligible consumers.',
    points: [
      'Eligible consumption may support issuance or recognition of green energy attributes.',
      'Certificates help document procurement and sustainability compliance.',
      'Certificate treatment remains subject to the Commission and applicable national framework.'
    ]
  }
];

export const RegulationsPage: React.FC<RegulationsPageProps> = ({
  onBackToLanding,
  onOpenCalculator,
  onLogin
}) => {
  const [activeReg, setActiveReg] = useState(regulations[0].id);
  const active = regulations.find((reg) => reg.id === activeReg) || regulations[0];

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
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase leading-none mt-0.5">Regulatory Desk</p>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-gray-600">
            <button type="button" onClick={onBackToLanding} className="hover:text-[#1b4d3e] transition-colors">Home</button>
            <button type="button" onClick={onOpenCalculator} className="hover:text-[#1b4d3e] transition-colors">Charges Calculator</button>
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
        <div className="max-w-7xl mx-auto px-6 py-12">
          <button
            type="button"
            onClick={onBackToLanding}
            className="mb-7 inline-flex items-center gap-2 text-[13px] font-semibold text-white/75 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to landing page
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-end">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-5">
                <Scale className="w-3.5 h-3.5 text-[#74c69d]" />
                <span className="text-[12px] font-bold uppercase tracking-wider text-white/85">RERC GEOA Compliance</span>
              </div>
              <h1 className="font-sora text-[34px] md:text-[44px] font-bold leading-tight">
                Key Green Energy Open Access Regulations
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70">
                A clean regulatory reference for application filing, nodal agency processing, charges, banking, scheduling, and green energy tariff workflows.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Key Rules', value: regulations.length },
                { label: 'Load Floor', value: '100 kW' },
                { label: 'Tenure', value: '25 yrs' }
              ].map((item) => (
                <div key={item.label} className="bg-white/10 border border-white/15 rounded-lg p-4">
                  <p className="font-sora text-[22px] font-bold">{item.value}</p>
                  <p className="text-[11px] uppercase tracking-wider text-white/55 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <aside className="lg:sticky lg:top-24 lg:self-start bg-white border border-[#e0e8e4] rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#1b4d3e]" />
              <h2 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Key Regulations</h2>
            </div>
            <div className="space-y-1">
              {regulations.map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => setActiveReg(reg.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-[13px] transition-colors ${
                    activeReg === reg.id
                      ? 'bg-green-pale text-[#1b4d3e] font-bold border border-[#9fe1cb]'
                      : 'text-gray-650 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </aside>

          <section className="bg-white border border-[#e0e8e4] rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-[#e0e8e4] bg-[#f9fcfa] px-7 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-green-pale border border-[#9fe1cb] flex items-center justify-center text-[#1b4d3e] shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-sora text-[22px] font-bold text-gray-900">{active.title}</h2>
                  <p className="text-[13px] text-gray-500 mt-1 max-w-2xl">{active.summary}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenCalculator}
                className="inline-flex items-center justify-center gap-2 text-[13px] font-bold text-[#1b4d3e] border border-[#c8e6d8] bg-green-pale hover:bg-[#d1ead9] rounded-lg px-4 py-2.5 transition-colors"
              >
                <Calculator className="w-4 h-4" />
                Charges Estimate
              </button>
            </div>

            <div className="p-7">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
                {['Applicability', 'Compliance', 'Workflow'].map((label) => (
                  <div key={label} className="border border-[#e0e8e4] rounded-lg p-4 bg-white">
                    <ShieldCheck className="w-4 h-4 text-[#1b4d3e] mb-3" />
                    <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                    <p className="text-[13px] text-gray-600 mt-1">Mapped into portal checks and document flow.</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {active.points.map((point, index) => (
                  <div key={point} className="flex gap-3 rounded-lg border border-[#e0e8e4] bg-[#fbfdfc] p-4">
                    <span className="w-7 h-7 rounded-full bg-[#1b4d3e] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-[14px] leading-relaxed text-gray-700">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 bg-blue-light border border-[#b5d4f4] rounded-lg p-4">
          <p className="text-sm text-blue-dark">
            <strong>Note:</strong> These are summarized operational references for the portal. Final interpretation should follow the notified RERC GEOA regulations, amendments, tariff orders, and nodal agency directions.
          </p>
        </div>
      </main>
    </div>
  );
};
