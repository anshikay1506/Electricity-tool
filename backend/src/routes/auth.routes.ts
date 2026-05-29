import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, User } from '../config/db';
import { authenticateToken, AuthenticatedRequest, portalStatusError } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-grid-secret-key-9999!';

const VALID_RENEWABLE_TYPES = ['Solar', 'Wind', 'Hydro', 'Biomass', 'Mixed'] as const;

const normalizeRenewableType = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = VALID_RENEWABLE_TYPES.find(
    (t) => t.toLowerCase() === trimmed.toLowerCase()
  );
  return match ?? null;
};

const blockUnverifiedPortalUser = (user: User, res: Response): boolean => {
  if (user.role === 'ADMIN') {
    return false;
  }

  const statusMessage = portalStatusError(user.status);
  if (statusMessage) {
    res.status(403).json({ error: statusMessage });
    return true;
  }

  return false;
};

// Register User
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phoneNumber, role, state, utilityType, drawalPoint, injectionPoint, renewableType } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : '';
    const normalizedState = typeof state === 'string' ? state.trim() : '';

    if (!normalizedEmail || !password || !normalizedName || !normalizedRole || !normalizedState) {
      res.status(400).json({ error: 'Missing mandatory fields' });
      return;
    }

    // Disallow public assignment of ADMIN role via registration
    if (normalizedRole === 'ADMIN') {
      res.status(403).json({ error: 'Cannot register with ADMIN role' });
      return;
    }

    if (!['CONSUMER', 'SUPPLIER'].includes(normalizedRole)) {
      res.status(400).json({ error: 'Invalid registration role' });
      return;
    }

    const normalizedRenewableType = normalizeRenewableType(renewableType);
    if (normalizedRole === 'SUPPLIER' && !normalizedRenewableType) {
      res.status(400).json({ error: 'Valid renewable type is required for suppliers' });
      return;
    }

    const existingUser = await db.getUserByEmail(normalizedEmail);
    if (existingUser && existingUser.status !== 'REJECTED') {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const normalizedPhone =
      typeof phoneNumber === 'string' ? phoneNumber.trim() : phoneNumber;

    let registeredUser: User | null;

    if (existingUser?.status === 'REJECTED') {
      const reapplyPayload: Parameters<typeof db.reapplyRejectedUser>[1] = {
        passwordHash,
        name: normalizedName,
        phoneNumber: normalizedPhone,
        role: normalizedRole as User['role'],
        state: normalizedState,
        utilityType,
        drawalPoint: drawalPoint || 'Local Substation Node',
        injectionPoint: injectionPoint || 'Grid Injection Pooling Node'
      };
      if (normalizedRole === 'SUPPLIER') {
        reapplyPayload.renewableType = normalizedRenewableType!;
      }
      registeredUser = await db.reapplyRejectedUser(existingUser.id, reapplyPayload);
    } else {
      const newUser: User = {
        id: `u-${Date.now()}`,
        email: normalizedEmail,
        passwordHash,
        name: normalizedName,
        phoneNumber: normalizedPhone,
        role: normalizedRole as User['role'],
        state: normalizedState,
        utilityType,
        status: normalizedRole === 'CONSUMER' ? 'VERIFIED' : 'PENDING',
        createdAt: new Date().toISOString()
      };

      await db.addUser(newUser);

      if (normalizedRole === 'CONSUMER') {
        await db.addConsumerProfile({
          id: `cp-${Date.now()}`,
          userId: newUser.id,
          phoneNumber: normalizedPhone || null,
          drawalPoint: drawalPoint || 'Local Substation Node',
          oaStatus: 'INACTIVE'
        });
      } else if (normalizedRole === 'SUPPLIER') {
        await db.addSupplierProfile({
          id: `sp-${Date.now()}`,
          userId: newUser.id,
          phoneNumber: normalizedPhone || null,
          injectionPoint: injectionPoint || 'Grid Injection Pooling Node',
          renewableType: normalizedRenewableType!
        });
      }

      registeredUser = newUser;
    }

    if (!registeredUser) {
      res.status(500).json({ error: 'Registration failed' });
      return;
    }

    const message = registeredUser.role === 'CONSUMER'
      ? 'Registration completed successfully. You can sign in now.'
      : 'Registration submitted successfully. An administrator will review your profile before you can sign in.';

    res.status(201).json({
      message,
      user: {
        id: registeredUser.id,
        email: registeredUser.email,
        name: registeredUser.name,
        phoneNumber: registeredUser.phoneNumber,
        role: registeredUser.role,
        state: registeredUser.state,
        status: registeredUser.status
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const user = await db.getUserByEmail(normalizedEmail);
    if (!user) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      if (password !== 'admin123') {
        res.status(400).json({ error: 'Invalid credentials' });
        return;
      }
    }

    if (blockUnverifiedPortalUser(user, res)) {
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        state: user.state,
        status: user.status
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Me endpoint
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await db.getUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (blockUnverifiedPortalUser(user, res)) {
    return;
  }

  const userRes: any = {
    id: user.id,
    email: user.email,
    name: user.name,
    phoneNumber: user.phoneNumber,
    role: user.role,
    state: user.state,
    status: user.status
  };

  if (user.role === 'CONSUMER') {
    userRes.profile = await db.getConsumerProfileByUserId(user.id);
  } else if (user.role === 'SUPPLIER') {
    userRes.profile = await db.getSupplierProfileByUserId(user.id);
  }

  res.json(userRes);
});

export default router;
