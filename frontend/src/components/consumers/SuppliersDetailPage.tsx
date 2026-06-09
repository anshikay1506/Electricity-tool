import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Building, Phone, Mail, MapPin, Zap, X } from 'lucide-react';

interface SupplierDetailPageProps {
  supplierId: string;
  onBack: () => void;
}

interface Plant {
  id: string;
  name: string;
  type: string;
  total: number;
  available: number;
  price: number;
  injectionPoint: string;
  status: string;
}

export const SupplierDetailPage: React.FC<SupplierDetailPageProps> = ({ supplierId, onBack }) => {
  const { token } = useAuth();
  
  const [supplier, setSupplier] = useState<any>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Bid modal state
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [bidMw, setBidMw] = useState(10);
  const [bidPrice, setBidPrice] = useState(4.5);
  const [bidDuration, setBidDuration] = useState(12);
  const [bidMessage, setBidMessage] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  
  const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';
  
  const calculateDeliveredPrice = (plant: Plant, supplierState: string) => {
    const basePrice = plant.price;
    const oaCharges = supplierState === 'Rajasthan' ? 0.6 : 0.85;
    return Number((basePrice + oaCharges).toFixed(2));
  };
  
  useEffect(() => {
    const fetchSupplierData = async () => {
      if (!token || !supplierId) return;
      
      setLoading(true);
      try {
        const supplierRes = await fetch(`${API_BASE}/api/suppliers/${supplierId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const plantsRes = await fetch(`${API_BASE}/api/plants/supplier/${supplierId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!supplierRes.ok || !plantsRes.ok) {
          throw new Error('Failed to fetch supplier data');
        }
        
        const supplierData = await supplierRes.json();
        const plantsData = await plantsRes.json();
        
        setSupplier(supplierData);
        setPlants(plantsData);
      } catch (err) {
        setError('Failed to load supplier details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSupplierData();
  }, [supplierId, token]);
  
  const submitBidRequest = async () => {
    if (!token || !selectedPlant || !supplier) return;
    
    setIsSubmittingBid(true);
    try {
      const response = await fetch(`${API_BASE}/api/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          supplierId: supplier.id,
          supplierName: supplier.name,
          plantId: selectedPlant.id,
          plantName: selectedPlant.name,
          mw: bidMw,
          price: bidPrice,
          duration: bidDuration,
          message: bidMessage,
          consumerName: 'Consumer',
          consumerId: 'consumer-id',
          status: 'PENDING'
        })
      });
      
      if (!response.ok) throw new Error('Failed to submit bid');
      
      alert('Bid request sent successfully!');
      setShowBidModal(false);
      setSelectedPlant(null);
      setBidMw(10);
      setBidPrice(4.5);
      setBidDuration(12);
      setBidMessage('');
    } catch (error) {
      console.error('Error submitting bid:', error);
      alert('Failed to submit bid. Please try again.');
    } finally {
      setIsSubmittingBid(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-dark border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading supplier details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error || 'Supplier not found'}</p>
          <button onClick={onBack} className="mt-4 btn-green">Go Back</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#f4f7f5] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={onBack} 
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-green-dark transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Marketplace</span>
        </button>
        
        {/* Supplier Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-[#e0e8e4]">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-sora text-2xl font-bold text-gray-900">{supplier.name}</h1>
              <p className="text-gray-500 mt-1">{supplier.renewableType || 'Renewable Energy'} Supplier</p>
            </div>
            <div className="bg-green-pale px-4 py-2 rounded-lg">
              <span className="text-green-dark font-semibold">✓ Verified Supplier</span>
            </div>
          </div>
          
          {/* Company Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#e0e8e4]">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase">Headquarters</p>
                <p className="font-semibold text-gray-900">{supplier.address || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase">State</p>
                <p className="font-semibold text-gray-900">{supplier.state || 'Rajasthan'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase">Total Capacity</p>
                <p className="font-bold text-xl text-green-dark">{supplier.generationCapacity || 120} MW</p>
              </div>
            </div>
          </div>
          
          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#e0e8e4]">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase">Email</p>
                <p className="font-semibold text-gray-900">{supplier.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase">Phone</p>
                <p className="font-semibold text-gray-900">{supplier.phoneNumber || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Plants Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0e8e4] overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-[#e0e8e4]">
            <h2 className="font-sora text-xl font-bold text-gray-900">Generation Plants</h2>
            <p className="text-gray-500 text-sm mt-1">Available capacity and pricing details</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-green-dark">
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Plant Name</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Type</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Total MW</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Available MW</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Base Price</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Delivered Price</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Injection Point</th>
                  <th className="text-white text-[12px] font-semibold px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f2]">
                {plants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      No plants registered by this supplier
                    </td>
                  </tr>
                ) : (
                  plants.map((plant, idx) => (
                    <tr key={plant.id} className={`hover:bg-gray-50 ${idx % 2 !== 0 ? 'bg-[#f9fcfa]' : ''}`}>
                      <td className="py-3.5 px-5 font-semibold text-gray-900">{plant.name}</td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">
                          {plant.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-gray-900">{plant.total} MW</td>
                      <td className="py-3.5 px-5 font-bold text-green-dark">{plant.available} MW</td>
                      <td className="py-3.5 px-5 font-semibold text-gray-900">₹{plant.price.toFixed(2)}</td>
                      <td className="py-3.5 px-5 font-bold text-green-dark">₹{calculateDeliveredPrice(plant, supplier.state).toFixed(2)}</td>
                      <td className="py-3.5 px-5 text-gray-600 text-[12px]">{plant.injectionPoint}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedPlant(plant);
                              setBidMw(plant.available);
                              setBidPrice(plant.price);
                              setShowBidModal(true);
                            }}
                            className="px-3 py-1.5 rounded-md bg-amber-500 text-white text-[11px] font-semibold hover:bg-amber-600"
                          >
                            Raise Bid
                          </button>
                          <button
                            className="px-3 py-1.5 rounded-md bg-green-dark text-white text-[11px] font-semibold hover:bg-green-mid"
                          >
                            Apply OA
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Bid Modal */}
      {showBidModal && selectedPlant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBidModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-sora text-xl font-bold text-gray-900">Raise Bid</h3>
                <p className="text-[13px] text-gray-500">For {selectedPlant.name}</p>
              </div>
              <button onClick={() => setShowBidModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Quantity Required (MW) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={bidMw}
                  onChange={(e) => setBidMw(Number(e.target.value))}
                  min={1}
                  max={selectedPlant.available}
                  className="form-control"
                />
                <p className="text-[11px] text-gray-400 mt-1">Max available: {selectedPlant.available} MW</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Offered Price (₹/unit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(Number(e.target.value))}
                  min={0.1}
                  className="form-control"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Duration (months) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={bidDuration}
                  onChange={(e) => setBidDuration(Number(e.target.value))}
                  min={1}
                  max={60}
                  className="form-control"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  rows={3}
                  placeholder="Add any special requirements..."
                  className="form-control"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={submitBidRequest}
                  disabled={isSubmittingBid}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg"
                >
                  {isSubmittingBid ? 'Submitting...' : 'Submit Bid'}
                </button>
                <button
                  onClick={() => setShowBidModal(false)}
                  className="flex-1 btn-outline py-2.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};