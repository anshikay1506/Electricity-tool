import { Router, Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get list of all suppliers with their profile details
router.get('/suppliers', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  const suppliers = (await db.getUsers()).filter(u => u.role === 'SUPPLIER');
  const details = await Promise.all(suppliers.map(async (s) => {
    const prof = await db.getSupplierProfileByUserId(s.id);
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      phoneNumber: s.phoneNumber || '',
      state: s.state,
      status: s.status,
      // capacity: prof?.generationCapacity || 0,
      injectionPoint: prof?.injectionPoint || '',
      renewableType: prof?.renewableType ?? null
    };
  }));
  res.json(details);
});

// Get list of all consumers with their profile details
router.get('/consumers', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  const consumers = (await db.getUsers()).filter(u => u.role === 'CONSUMER');
  const details = await Promise.all(consumers.map(async (c) => {
    const prof = await db.getConsumerProfileByUserId(c.id);
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phoneNumber: c.phoneNumber || '',
      state: c.state,
      status: c.status,
      drawalPoint: prof?.drawalPoint || '',
      oaStatus: prof?.oaStatus || 'INACTIVE'
    };
  }));
  res.json(details);
});

// Get a specific consumer profile for suppliers and admins
router.get('/consumers/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!['ADMIN', 'SUPPLIER'].includes(req.user.role) && req.user.id !== id) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const consumer = await db.getUserById(id);
  if (!consumer || consumer.role !== 'CONSUMER') {
    res.status(404).json({ error: 'Consumer profile not found' });
    return;
  }

  const prof = await db.getConsumerProfileByUserId(id);
  res.json({
    id: consumer.id,
    name: consumer.name,
    email: consumer.email,
    phoneNumber: consumer.phoneNumber || '',
    state: consumer.state,
    status: consumer.status,
    drawalPoint: prof?.drawalPoint || '',
    oaStatus: prof?.oaStatus || 'INACTIVE'
  });
});

// Admin approves user profile
router.patch('/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  const { id } = req.params;
  const user = await db.getUserById(id);
  if (!user) {
    res.status(404).json({ error: 'User profile not found' });
    return;
  }

  if (user.status !== 'PENDING') {
    res.status(400).json({ error: 'Only pending registrations can be approved' });
    return;
  }

  await db.updateUserStatus(id, 'VERIFIED');
  res.json({ success: true, message: 'User profile approved successfully' });
});

// Admin rejects user profile
router.patch('/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  const { id } = req.params;
  const user = await db.getUserById(id);
  if (!user) {
    res.status(404).json({ error: 'User profile not found' });
    return;
  }

  if (user.status !== 'PENDING') {
    res.status(400).json({ error: 'Only pending registrations can be rejected' });
    return;
  }

  await db.updateUserStatus(id, 'REJECTED');
  res.json({ success: true, message: 'User profile status set to REJECTED' });
});

export default router;
