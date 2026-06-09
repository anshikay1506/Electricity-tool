import { Router, Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest, authenticateToken, requireVerifiedPortalUser } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all supplier routes
router.use(authenticateToken, requireVerifiedPortalUser);

// Get all suppliers (for admin)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.getUsers();
    const suppliers = users.filter((u: any) => u.role === 'SUPPLIER');
    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get supplier profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await db.getUserById(req.user!.id);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get supplier profile if exists
    const profile = await db.getSupplierProfileByUserId(req.user!.id);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      k_number: user.k_number,
      connection_type: user.connection_type,
      profile: profile || null
    });
  } catch (error: any) {
    console.error('Error fetching supplier profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get supplier by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await db.getUserById(req.params.id);
    
    if (!user || user.role !== 'SUPPLIER') {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    const profile = await db.getSupplierProfileByUserId(req.params.id);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      state: 'Rajasthan', // Default value since removed from User
      renewableType: profile?.renewableType || 'Solar',
      injectionPoint: profile?.injectionPoint || 'Bhadla Pooling Station',
      generationCapacity: 100,
      price: 4.2,
      status: 'VERIFIED' // Default since removed from User
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Get supplier with all their plants
router.get('/:supplierId/plants', authenticateToken, async (req: any, res: any) => {
  try {
    const { supplierId } = req.params;
    
    // Get supplier details
    const supplier = await db.getUserById(supplierId);
    if (!supplier || supplier.role !== 'SUPPLIER') {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    // Get supplier profile
    const profile = await db.getSupplierProfileByUserId(supplierId);
    
    // Get all plants/capacity entries for this supplier
    const plants = await db.getSupplierPlants(supplierId);
    
    res.json({
      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phoneNumber,
        state: supplier.state || 'Rajasthan',
        address: supplier.address || 'Not specified',
        discom: supplier.discom || 'JVVNL',
        generationCapacity: 120  
      },
      plants: plants || []
    });
  } catch (error) {
    console.error('Error fetching supplier plants:', error);
    res.status(500).json({ error: 'Failed to fetch supplier data' });
  }
});

export default router;