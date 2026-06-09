// backend/src/routes/plant.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/db';

const router = Router();

// Get all plants for a supplier
router.get('/supplier/:supplierId', authenticateToken, async (req: any, res: any) => {
  try {
    const plants = await db.getSupplierPlants(req.params.supplierId);
    res.json(plants);
  } catch (error) {
    console.error('Error fetching supplier plants:', error);
    res.status(500).json({ error: 'Failed to fetch supplier plants' });
  }
});

// Add new plant
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'SUPPLIER') {
      return res.status(403).json({ error: 'Only suppliers can add plants' });
    }
    
    const plant = await db.addPlant({
      id: `plant-${Date.now()}`,
      ...req.body,
      supplierId: req.user.id,
    });
    
    res.status(201).json(plant);
  } catch (error) {
    console.error('Error adding plant:', error);
    res.status(500).json({ error: 'Failed to add plant' });
  }
});

// Update plant
router.put('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const plant = await db.updatePlant(req.params.id, req.body);
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json(plant);
  } catch (error) {
    console.error('Error updating plant:', error);
    res.status(500).json({ error: 'Failed to update plant' });
  }
});

// Delete plant
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const plant = await db.deletePlant(req.params.id);
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json({ message: 'Plant deleted successfully' });
  } catch (error) {
    console.error('Error deleting plant:', error);
    res.status(500).json({ error: 'Failed to delete plant' });
  }
});

export default router;