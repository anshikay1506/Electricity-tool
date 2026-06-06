import { Router, Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest, authenticateToken, requireVerifiedPortalUser } from '../middleware/auth';

const router = Router();

// Apply auth middleware
router.use(authenticateToken, requireVerifiedPortalUser);

// Get all consumers (for admin)
router.get('/consumers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.getUsers();
    const consumers = users.filter((u: any) => u.role === 'CONSUMER');
    
    const consumersWithProfile = await Promise.all(
      consumers.map(async (c: any) => {
        const profile = await db.getConsumerProfileByUserId(c.id);
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          phoneNumber: c.phoneNumber,
          role: c.role,
          k_number: c.k_number,
          connection_type: c.connection_type,
          drawalPoint: profile?.drawalPoint || 'Not specified'
        };
      })
    );
    
    res.json(consumersWithProfile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get consumer by ID
router.get('/consumers/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const consumer = await db.getUserById(req.params.id);
    
    if (!consumer || consumer.role !== 'CONSUMER') {
      res.status(404).json({ error: 'Consumer not found' });
      return;
    }

    const profile = await db.getConsumerProfileByUserId(req.params.id);

    res.json({
      id: consumer.id,
      name: consumer.name,
      email: consumer.email,
      phoneNumber: consumer.phoneNumber,
      role: consumer.role,
      k_number: consumer.k_number,
      connection_type: consumer.connection_type,
      drawalPoint: profile?.drawalPoint || '400kV Jajpur Substation'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get consumer profile for logged in user
router.get('/consumer-profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await db.getUserById(req.user!.id);
    
    if (!user || user.role !== 'CONSUMER') {
      res.status(404).json({ error: 'Consumer profile not found' });
      return;
    }

    const profile = await db.getConsumerProfileByUserId(req.user!.id);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      k_number: user.k_number,
      connection_type: user.connection_type,
      drawalPoint: profile?.drawalPoint || '400kV Jajpur Substation'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all suppliers (for admin)
router.get('/suppliers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.getUsers();
    const suppliers = users.filter((u: any) => u.role === 'SUPPLIER');
    
    const suppliersWithProfile = await Promise.all(
      suppliers.map(async (s: any) => {
        const profile = await db.getSupplierProfileByUserId(s.id);
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          phoneNumber: s.phoneNumber,
          role: s.role,
          k_number: s.k_number,
          renewableType: profile?.renewableType || 'Solar',
          injectionPoint: profile?.injectionPoint || 'Bhadla Pooling Station'
        };
      })
    );
    
    res.json(suppliersWithProfile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;