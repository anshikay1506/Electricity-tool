import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/db';

const router = Router();

// Create a new bid request
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { mw, price, duration, message, consumerName, consumerId, scheduleType,drawalPoint, validityDays } = req.body;
    
    // Validate required fields
    if (!mw || !price || !duration) {
      return res.status(400).json({ error: 'mw, price, and duration are required' });
    }
    
    const bid = {
      consumerId: consumerId || req.user.id,
      consumerName: consumerName || req.user.name,
      mw: Number(mw),
      price: Number(price),
      duration: Number(duration),
      drawalPoint: drawalPoint || 'Not specified',
      scheduleType: scheduleType || 'RTC',
      validityDays: Number(validityDays) || 30,
      message: message || '',
      status: 'ACTIVE'
    };
    
    const newBid = await db.addBid(bid);
    res.status(201).json({ success: true, bid: newBid });
  } catch (error) {
    console.error('Error creating bid:', error);
    res.status(500).json({ error: error.message || 'Failed to create bid' });
  }
});


// Cancel a bid
router.patch('/:bidId/cancel', authenticateToken, async (req: any, res: any) => {
  try {
    const { bidId } = req.params;
    
    // Find the bid first to check if it exists and belongs to the consumer
    const existingBid = await db.getBidById(bidId);
    
    if (!existingBid) {
      return res.status(404).json({ error: 'Bid not found' });
    }
    
    // Only allow cancellation if status is ACTIVE or PENDING
    if (existingBid.status !== 'ACTIVE' && existingBid.status !== 'PENDING') {
      return res.status(400).json({ error: 'Cannot cancel bid that is already ' + existingBid.status });
    }
    
    const updatedBid = await db.updateBidStatus(bidId, 'CANCELLED');
    res.json({ success: true, bid: updatedBid });
  } catch (error) {
    console.error('Error cancelling bid:', error);
    res.status(500).json({ error: 'Failed to cancel bid' });
  }
});


router.get('/consumer/:consumerId', authenticateToken, async (req: any, res: any) => {
  try {
    const { consumerId } = req.params;
    const bids = await db.getBidsByConsumer(consumerId);
    res.json(bids);
  } catch (error) {
    console.error('Error fetching consumer bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});;

// Get bids for a supplier
router.get('/supplier/:supplierId', authenticateToken, async (req: any, res: any) => {
  try {
    const bids = await db.getBidsBySupplier(req.params.supplierId);
    res.json(bids);
  } catch (error) {
    console.error('Error fetching supplier bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Update bid status (approve/reject)
router.patch('/:id/approve', authenticateToken, async (req: any, res: any) => {
  try {
    const bid = await db.updateBidStatus(req.params.id, 'APPROVED');
    res.json({ success: true, bid });
  } catch (error) {
    console.error('Error approving bid:', error);
    res.status(500).json({ error: 'Failed to approve bid' });
  }
});

router.patch('/:id/reject', authenticateToken, async (req: any, res: any) => {
  try {
    const bid = await db.updateBidStatus(req.params.id, 'REJECTED');
    res.json({ success: true, bid });
  } catch (error) {
    console.error('Error rejecting bid:', error);
    res.status(500).json({ error: 'Failed to reject bid' });
  }
});


router.get('/active', authenticateToken, async (req: any, res: any) => {
  try {
    const activeBids = await db.getActiveBids();
    res.json(activeBids);
  } catch (error) {
    console.error('Error fetching active bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});


// Get all offers by a supplier
router.get('/offers/supplier/:supplierId', authenticateToken, async (req: any, res: any) => {
  try {
    const { supplierId } = req.params;
    const offers = await db.getOffersBySupplier(supplierId);
    res.json(offers);
  } catch (error) {
    console.error('Error fetching supplier offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});


router.post('/offers', authenticateToken, async (req: any, res: any) => {
  try {
    const { bidId, supplierId, supplierName, offeredPrice, offeredMw, message } = req.body;
    
    // Check if supplier already made an offer on this bid
    const existingOffers = await db.getOffersByBid(bidId);
    const alreadyOffered = existingOffers.some((offer: any) => offer.supplierId === supplierId);
    
    if (alreadyOffered) {
      return res.status(400).json({ error: 'You have already submitted an offer for this bid' });
    }
    
    const offer = await db.addBidOffer({
      bidId,
      supplierId,
      supplierName,
      offeredPrice,
      offeredMw,
      message: message || ''
    });
    
    res.status(201).json({ success: true, offer });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: 'Failed to create offer' });
  }
});


router.get('/offers/bid/:bidId', authenticateToken, async (req: any, res: any) => {
  try {
    const { bidId } = req.params;
    const offers = await db.getOffersByBid(bidId);
    res.json(offers);
  } catch (error) {
    console.error('Error fetching bid offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});


// In your bid.routes.ts, update the accept endpoint:
router.patch('/offers/:offerId/accept', authenticateToken, async (req: any, res: any) => {
  try {
    const { offerId } = req.params;
    
    const offer = await db.getOfferById(offerId);
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    // Accept this offer
    const updatedOffer = await db.updateBidOfferStatus(offerId, 'ACCEPTED');
    
    await db.rejectOtherOffers(offer.bidId, offerId);
    await db.closeBid(offer.bidId);
    
    await db.updateBid(offer.bidId, {
      supplierId: offer.supplierId,
      supplierName: offer.supplierName
    });
    
    res.json({ success: true, offer: updatedOffer });
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ error: error.message || 'Failed to accept offer' });
  }
});


router.patch('/offers/:offerId/reject', authenticateToken, async (req: any, res: any) => {
  try {
    const { offerId } = req.params;
    const updatedOffer = await db.updateBidOfferStatus(offerId, 'REJECTED');
    res.json({ success: true, offer: updatedOffer });
  } catch (error) {
    console.error('Error rejecting offer:', error);
    res.status(500).json({ error: 'Failed to reject offer' });
  }
});

export default router;