import { Router, Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get approved suppliers for marketplace
router.get('/', async (req, res) => {
  try {
    const users: any[] = await db.getUsers();

    // Fetch supplier profiles and merge profile fields into the returned supplier objects
    const profiles: any[] = await db.getSupplierProfiles();

    const suppliers = users
      .filter((u: any) => u.role === 'SUPPLIER' && u.status === 'VERIFIED')
      .map((u: any) => {
        const p = profiles.find((pr: any) => pr.userId === u.id) || {};
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phoneNumber: u.phoneNumber || null,
          state: u.state,
          status: u.status,
          injectionPoint: p.injectionPoint || null,
          renewableType: p.renewableType || null,
          generationCapacity: p.generationCapacity || null,
          createdAt: u.createdAt
        };
      });

    res.json(suppliers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Get supplier full details (profile, documents, connected applications)
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await db.getUserById(id);
    if (!user || user.role !== 'SUPPLIER') {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    const profile = await db.getSupplierProfileByUserId(id);

    // Applications connected to this supplier
    const allApps = await db.getApplications();
    const supplierApps = allApps.filter(a => a.supplierId === id);
    const detailedApps = await Promise.all(supplierApps.map(async (a: any) => {
      const consumer = await db.getUserById(a.consumerId);
      return {
        ...a,
        consumerName: consumer?.name || 'Unknown Consumer'
      };
    }));

    // Documents (certificates) for supplier
    const docs = await db.getDocumentsByUserId(id);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || null,
      state: user.state,
      status: user.status,
      profile: profile || null,
      applications: detailedApps,
      documents: docs
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch supplier details' });
  }
});

export default router;