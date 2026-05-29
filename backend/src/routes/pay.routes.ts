import { Router, Response } from 'express';
import { db, Payment } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.post('/checkout', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) {
    res.status(400).json({ error: 'Valid checkout amount is required' });
    return;
  }

  const newPay: Payment = {
    id: `pay-${Date.now()}`,
    userId: req.user.id,
    amount: Number(amount),
    currency: 'INR',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  await db.addPayment(newPay);

  res.status(201).json({
    success: true,
    sessionId: `cs_stripe_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    payment: newPay
  });
});

router.post('/confirm', async (req: AuthenticatedRequest, res: Response) => {
  const { paymentId, reference } = req.body;

  if (!paymentId) {
    res.status(400).json({ error: 'Payment record reference is required' });
    return;
  }

  const pays = await db.getPayments();
  const payment = pays.find(p => p.id === paymentId);

  if (!payment) {
    res.status(404).json({ error: 'Payment record not found' });
    return;
  }

  payment.status = 'COMPLETED';
  payment.reference = reference || `txn_mock_${Date.now()}`;

  await db.addPayment(payment);

  res.json({ success: true, payment });
});

router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let history = await db.getPayments();

  if (req.user.role !== 'ADMIN') {
    history = history.filter(h => h.userId === req.user?.id);
  }

  const detailed = await Promise.all(history.map(async (h) => {
    const user = await db.getUserById(h.userId);
    return {
      ...h,
      userName: user?.name || 'Grid Operator',
      userRole: user?.role || 'TRADER'
    };
  }));

  res.json(detailed);
});

export default router;
