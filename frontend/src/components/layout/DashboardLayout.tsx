import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LogOut, Menu, X, Globe } from 'lucide-react';

export const DashboardLayout: React.FC<{ 
  children: React.ReactNode; 
  currentTab: string; 
  setTab: (tab: string) => void; 
}> = ({ children, currentTab, setTab }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage(); // This will trigger page reload on change
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleHomeClick = () => {
    window.location.href = '/'; 
  };

  const menuItems = {
    CONSUMER: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'open-access', label: 'Open Access Marketplace' },
      { id: 'my-applications', label: 'My Applications' },
      { id: 'contracts', label: 'Contracts' },
      { id: 'schedules', label: 'Schedules' },
      { id: 'documents', label: 'Apply for Open Access' },
      { id: 'profile', label: 'Profile' },
    ],
    SUPPLIER: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'capacity-management', label: 'Capacity Management' },
      { id: 'consumer-requests', label: 'Consumer Requests' },
      { id: 'contracts', label: 'Contracts' },
      { id: 'revenue', label: 'Revenue' },
      { id: 'documents', label: 'Documents' },
      { id: 'profile', label: 'Profile' },
    ],
    ADMIN: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'consumers', label: 'ConsumerProfile' },
      { id: 'suppliers', label: 'SupplierProfile' },
      { id: 'applications', label: 'OA Applications' },
      { id: 'contracts', label: 'Contracts' },
      { id: 'market-monitoring', label: 'Market Monitoring' },
      { id: 'document-verification', label: 'Document Verification' }
    ]
  };

  const activeRole = user?.role || 'CONSUMER';
  const activeMenu = menuItems[activeRole as 'CONSUMER' | 'SUPPLIER' | 'ADMIN'] || menuItems.CONSUMER;

  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as 'English' | 'Hindi';
    setLanguage(newLanguage); // This will trigger translation and page reload
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-[#e0e8e4]">
      {/* Brand / Logo */}
      <div onClick={handleHomeClick} className="h-16 flex items-center px-6 border-b border-[#e0e8e4] shrink-0">
        <div className="w-8 h-8 bg-green-dark rounded-[8px] flex items-center justify-center mr-3 shrink-0">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] fill-white">
            <path d="M12 2L4 7v5c0 5.25 3.4 10.15 8 11.35C16.6 22.15 20 17.25 20 12V7l-8-5z"/>
            <path d="M9 12l2 2 4-4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div className="font-sora text-[14px] font-bold text-green-dark leading-[1.2]">GEOA Portal</div>
          <div className="text-[10px] text-gray-500 font-normal">Rajasthan State</div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
        {activeMenu.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all ${
                isActive 
                  ? 'bg-green-pale text-green-dark font-bold border border-[#9fe1cb]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-green-dark border border-transparent'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[#e0e8e4] bg-gray-50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-green-dark rounded-full flex items-center justify-center text-white text-[12px] font-bold">
            {user?.name?.charAt(0) || activeRole.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-[13px] font-bold text-gray-900 truncate">{user?.name || activeRole}</p>
            <p className="text-[11px] text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-white border border-[#e0e8e4] text-[12px] text-gray-600 hover:text-red hover:bg-red-50 hover:border-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-gray-900 font-dm flex overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="relative w-64 max-w-[80%] h-full bg-white flex flex-col shadow-2xl transition-transform duration-300">
            <SidebarContent />
            <button 
              className="absolute top-4 right-[-40px] w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-600 shadow-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
          
          {/* <div className="flex items-center">
          
            <button 
              className="lg:hidden mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-sora text-[16px] font-bold text-gray-900 hidden sm:block">
              {activeMenu.find(m => m.id === currentTab)?.label || 'Dashboard'}
            </h1>
          </div> */}

          <div className="flex items-center ">
            {/* Language Selector - Now Working! */}
            {/* <div className="flex items-center text-gray-600">
              <Globe className="w-4 h-4 mr-1.5" />
              <select
                value={language}
                onChange={handleLanguageChange}
                className="notranslate bg-transparent text-[12px] font-medium outline-none cursor-pointer border-none focus:ring-0 p-0 pr-6"
                style={{ appearance: 'auto' }} // Ensures dropdown arrow is visible
              >
                <option value="English">English</option>
                <option value="Hindi">हिंदी</option>
              </select>
            </div> */}
          </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto py-8 px-4 sm:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};