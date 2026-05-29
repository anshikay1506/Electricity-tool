// Lightweight in-memory workflow for demo/testing purposes
type ConsumerRequest = {
  id: string;
  supplierId: string;
  consumerId?: string;
  consumerName: string;
  mw: number;
  duration: string;
  startDate: string;
  deliveryState: string;
  notes?: string;
  status: 'PENDING' | 'SUPPLIER_APPROVED' | 'ADMIN_APPROVED' | 'REJECTED';
  createdAt: string;
};

const supplierRequests: Record<string, ConsumerRequest[]> = {};
const adminQueue: ConsumerRequest[] = [];

export const addRequestToSupplier = (supplierId: string, req: Omit<ConsumerRequest, 'id' | 'status' | 'createdAt'>) => {
  const id = `req-${Date.now()}-${Math.floor(Math.random() * 9000)}`;
  const createdAt = new Date().toISOString().split('T')[0];
  const full: ConsumerRequest = { ...req, id, status: 'PENDING', createdAt, supplierId } as ConsumerRequest;
  if (!supplierRequests[supplierId]) supplierRequests[supplierId] = [];
  supplierRequests[supplierId].unshift(full);
  return full;
};

export const getRequestsForSupplier = (supplierId: string) => {
  return supplierRequests[supplierId] ? [...supplierRequests[supplierId]] : [];
};

export const supplierApproveRequest = (supplierId: string, requestId: string) => {
  const list = supplierRequests[supplierId] || [];
  const idx = list.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  const req = list[idx];
  req.status = 'SUPPLIER_APPROVED';
  // push to admin queue for final approval
  adminQueue.unshift(req);
  return req;
};

export const supplierRejectRequest = (supplierId: string, requestId: string) => {
  const list = supplierRequests[supplierId] || [];
  const idx = list.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  const req = list[idx];
  req.status = 'REJECTED';
  return req;
};

export const getAdminQueue = () => {
  return [...adminQueue];
};

export const adminApprove = (requestId: string) => {
  const idx = adminQueue.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  const req = adminQueue.splice(idx, 1)[0];
  req.status = 'ADMIN_APPROVED';
  return req;
};

export const adminReject = (requestId: string) => {
  const idx = adminQueue.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  const req = adminQueue.splice(idx, 1)[0];
  req.status = 'REJECTED';
  return req;
};

export default {
  addRequestToSupplier,
  getRequestsForSupplier,
  supplierApproveRequest,
  supplierRejectRequest,
  getAdminQueue,
  adminApprove,
  adminReject
};
