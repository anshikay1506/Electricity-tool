import { Router, Response } from 'express';
import { db, Application, Schedule } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Submit Open Access request (simplified - no contract generation)
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'CONSUMER') {
    res.status(403).json({ error: 'Only electricity consumers can apply for Green Open Access' });
    return;
  }

  const {
    supplierId,
    mw,
    injectionPoint,
    drawalPoint,
    durationDays,
    requestedPrice,
    consumerName,
    applicantName,
    entityType,
    legalIdentifier,
    discomConsumerNo,
    registeredAddress,
    state,
    discom,
    contactPerson,
    contactEmail,
    contactMobile,
    voltageLevel,
    renewableType,
    scheduleType,
    proposedStartDate,
    timeBlocks,
    documentChecklist
  } = req.body;
  
  if (!supplierId || !mw || !injectionPoint || !drawalPoint) {
    res.status(400).json({ error: 'Missing necessary application details' });
    return;
  }

  if (legalIdentifier && !/^[A-Za-z0-9]{10}$/.test(String(legalIdentifier).trim())) {
    res.status(400).json({ error: 'CIN / GSTIN / Registration No. must be exactly 10 alphanumeric characters' });
    return;
  }

  if (discomConsumerNo && !/^\d{10}$/.test(String(discomConsumerNo).trim())) {
    res.status(400).json({ error: 'DISCOM Consumer No. must be exactly 10 digits' });
    return;
  }

  const consumer = await db.getUserById(req.user.id);
  
  const newApp: Application = {
    id: `oa-${Date.now()}`,
    consumerId: req.user.id,
    supplierId,
    mw: Number(mw),
    type: 'Green OA',
    applicantName: applicantName || consumerName || consumer?.name || 'Consumer',
    entityType,
    legalIdentifier: legalIdentifier ? String(legalIdentifier).trim().toUpperCase() : undefined,
    discomConsumerNo: discomConsumerNo ? String(discomConsumerNo).trim() : undefined,
    registeredAddress,
    state,
    discom,
    contactPerson,
    contactEmail,
    contactMobile,
    voltageLevel,
    renewableType,
    scheduleType,
    proposedStartDate,
    timeBlocks,
    documentChecklist,
    annexureCStatus: 'PENDING',
    annexureDStatus: 'PENDING',
    annexureEStatus: 'PENDING',
    approvalStatus: 'ADMIN_PENDING',
    lossPercentage: 3.5,
    injectionPoint,
    drawalPoint,
    durationDays: Number(durationDays || 365),
    requestedPrice: Number(requestedPrice || 0),
    consumerName: consumerName || consumer?.name || 'Consumer',
    ppaUrl: '/uploads/ppa_placeholder.pdf',
    oaAppUrl: '/uploads/oa_placeholder.pdf',
    bgUrl: '/uploads/bg_placeholder.pdf',
    authLetterUrl: '/uploads/auth_placeholder.pdf',
    createdAt: new Date().toISOString()
  };

  await db.addApplication(newApp);
  // console.log("✅ Application created:", { id: newApp.id, supplierId: newApp.supplierId, consumerId: newApp.consumerId });
  res.status(201).json({ success: true, application: newApp });
});

// Get applications lists
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // console.log("🔍 GET /api/applications - User:", { id: req.user.id, role: req.user.role });

  const apps: any[] = await db.getApplications();
  
  let filtered: any[] = apps;

  if (req.user.role === 'CONSUMER') {
    filtered = apps.filter((a: any) => a.consumerId === req.user?.id);
  } else if (req.user.role === 'SUPPLIER') {
    filtered = apps.filter((a: any) => a.supplierId === req.user?.id);
  } else if (req.user.role === 'ADMIN') {
    filtered = apps;
  }

  const detailedApps = await Promise.all(filtered.map(async (a: any) => {
    const consumer = await db.getUserById(a.consumerId);
    const supplier = await db.getUserById(a.supplierId);
    return {
      ...a,
      consumerName: a.consumerName || consumer?.name || 'Consumer',
      supplierName: supplier?.name || 'Supplier',
      requestedPrice: a.requestedPrice || 0
    };
  }));

  // console.log("📤 Returning", detailedApps.length, "applications to", req.user.role);
  res.json(detailedApps);
});

// Admin approves application
router.patch('/:id/admin-approve', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Only admin can approve applications' });
    return;
  }

  const { id } = req.params;
  const app = await db.getApplicationById(id);
  
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const updated = await db.updateApplication(id, {
    adminApprovedAt: new Date().toISOString(),
    approvalStatus: 'APPROVED'
  });

  res.json({ success: true, application: updated });
});

// Supplier approves application
router.patch('/:id/supplier-approve', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPPLIER') {
    res.status(403).json({ error: 'Only supplier can approve applications' });
    return;
  }

  const { id } = req.params;
  const app = await db.getApplicationById(id);
  
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  if (app.supplierId !== req.user.id) {
    res.status(403).json({ error: 'Not authorized for this application' });
    return;
  }

  if (!app.adminApprovedAt) {
    res.status(400).json({ error: 'Application must be admin approved first' });
    return;
  }

  const updated = await db.updateApplication(id, {
    supplierApprovedAt: new Date().toISOString(),
    approvalStatus: 'SUPPLIER_APPROVED'
  });

  // Create schedule
  await db.addSchedule({
    id: `sch-${Date.now()}`,
    applicationId: app.id,
    supplierId: app.supplierId,
    consumerId: app.consumerId,
    mw: app.mw || 0,
    timeBlock: app.timeBlocks || '00:00-24:00 (RTC)',
    gridStatus: 'SCHEDULED',
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, application: updated });
});

// Reject application
router.patch('/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const app = await db.getApplicationById(id);
  
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  if (req.user?.role === 'ADMIN') {
    await db.updateApplication(id, {
      approvalStatus: 'REJECTED',
      rejectionReason: reason || 'Rejected by admin'
    });
  } else if (req.user?.role === 'SUPPLIER' && app.supplierId === req.user.id) {
    await db.updateApplication(id, {
      approvalStatus: 'REJECTED',
      rejectionReason: reason || 'Rejected by supplier'
    });
  } else {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }

  res.json({ success: true });
});

// Admin issues NOC Annexure-D Form details
router.post('/:id/annexure-d', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Only Admin / RLDC operators can issue Annexure-D NOC' });
    return;
  }

  const { id } = req.params;
  const { transferCapability, lossPercentage, approvalDuration } = req.body;

  const app = await db.getApplicationById(id);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  await db.updateApplication(id, {
    annexureDStatus: 'ISSUED',
    approvalStatus: 'NOC_APPROVED',
    lossPercentage: Number(lossPercentage || 3.2),
    durationDays: Number(approvalDuration || 365)
  });

  res.json({ success: true, message: 'Annexure-D NOC Digitally Generated and Transmitted' });
});

// Schedules endpoint
router.get('/schedules', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const schedules: any[] = await db.getSchedules();
  let filtered: any[] = schedules;

  if (req.user.role === 'CONSUMER') {
    filtered = schedules.filter((s: any) => s.consumerId === req.user?.id);
  } else if (req.user.role === 'SUPPLIER') {
    filtered = schedules.filter((s: any) => s.supplierId === req.user?.id);
  }

  const detailed = await Promise.all(filtered.map(async (s: any) => {
    const consumer = await db.getUserById(s.consumerId);
    const supplier = await db.getUserById(s.supplierId);
    return {
      ...s,
      consumerName: consumer?.name || 'Industrial Consumer',
      supplierName: supplier?.name || 'Renewable Supplier'
    };
  }));

  res.json(detailed);
});

export default router;