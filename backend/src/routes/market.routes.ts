import { Router, Response } from 'express';
import { db, Bid } from '../config/db';
import { authenticateToken, requireVerifiedPortalUser, AuthenticatedRequest } from '../middleware/auth';

const protectedMarket = [authenticateToken, requireVerifiedPortalUser];

const router = Router();

router.get('/prices', async (req, res) => {
  res.json(await db.getMarketPrices());
});

router.post('/bids', ...protectedMarket, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { mw, price, marketType, timeBlock } = req.body;
  if (!mw || !price || !marketType || !timeBlock) {
    res.status(400).json({ error: 'All bidding parameters are required' });
    return;
  }

  const newBid: Bid = {
    id: `bid-${Date.now()}`,
    userId: req.user.id,
    mw: Number(mw),
    price: Number(price),
    marketType,
    timeBlock,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  await db.addBid(newBid);
  await matchBids();

  res.status(201).json({ success: true, bid: newBid });
});

router.get('/bids', ...protectedMarket, async (req: AuthenticatedRequest, res: Response) => {
  const bids: any[] = await db.getBids();
  const enriched = await Promise.all(bids.map(async (b: any) => {
    const user = await db.getUserById(b.userId);
    return {
      ...b,
      userName: user?.name || 'Anonymous Grid Operator',
      userRole: user?.role || 'TRADER'
    };
  }));
  res.json(enriched);
});

async function matchBids() {
  const bids: any[] = (await db.getBids()).filter((b: any) => b.status === 'PENDING');

  const markets = [...new Set(bids.map((b: any) => b.marketType))] as string[];
  const blocks = [...new Set(bids.map((b: any) => b.timeBlock))] as string[];

  for (const m of markets) {
    for (const bl of blocks) {
      const activeBids = bids.filter((b: any) => b.marketType === m && b.timeBlock === bl);

      const buyers = await Promise.all(activeBids.map(async (b: any) => {
        const user = await db.getUserById(b.userId);
        return { bid: b, role: user?.role };
      }));

      const buyersOnly = buyers
        .filter((entry) => entry.role === 'CONSUMER')
        .map((entry) => entry.bid)
        .sort((a: any, b: any) => b.price - a.price);

      const sellers = await Promise.all(activeBids.map(async (b: any) => {
        const user = await db.getUserById(b.userId);
        return { bid: b, role: user?.role };
      }));

      const sellersOnly = sellers
        .filter((entry) => entry.role === 'SUPPLIER')
        .map((entry) => entry.bid)
        .sort((a: any, b: any) => a.price - b.price);

      for (const buyer of buyersOnly) {
        for (const seller of sellersOnly) {
          if (buyer.status === 'PENDING' && seller.status === 'PENDING' && buyer.price >= seller.price) {
            const matchedMw = Math.min(buyer.mw, seller.mw);
            const clearingPrice = (buyer.price + seller.price) / 2;

            await db.updateBidStatus(buyer.id, 'MATCHED');
            await db.updateBidStatus(seller.id, 'MATCHED');

            await db.addSchedule({
              id: `sch-auto-${Date.now()}`,
              applicationId: 'matched-market-trade',
              supplierId: seller.userId,
              consumerId: buyer.userId,
              mw: matchedMw,
              timeBlock: bl,
              gridStatus: 'SCHEDULED',
              createdAt: new Date().toISOString()
            });

            await db.addPayment({
              id: `pay-auto-${Date.now()}`,
              userId: buyer.userId,
              amount: Number((matchedMw * clearingPrice * 1000).toFixed(2)),
              currency: 'INR',
              status: 'COMPLETED',
              reference: `cleared_${buyer.id}_${seller.id}`,
              createdAt: new Date().toISOString()
            });

            await db.updateMarketPrice(m, Number(clearingPrice.toFixed(2)), '+0.3');
          }
        }
      }
    }
  }
}

router.post('/clear', ...protectedMarket, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Only administrators can run manual market clearing' });
    return;
  }
  await matchBids();
  res.json({ success: true, message: 'Market clearing algorithm completed. Matches resolved.' });
});

export default router;
