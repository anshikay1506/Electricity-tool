import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, User } from '../config/db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { sendEmailOTP, sendPhoneOTP, verifyOTP } from '../services/otpService';

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

// Register User (simplified for regular email registration)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phoneNumber, role, drawalPoint, injectionPoint, renewableType } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : '';

    if (!normalizedEmail || !password || !normalizedName || !normalizedRole) {
      res.status(400).json({ error: 'Missing mandatory fields' });
      return;
    }

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
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const normalizedPhone = typeof phoneNumber === 'string' ? phoneNumber.trim() : phoneNumber;

    const newUser: User = {
      id: `u-${Date.now()}`,
      email: normalizedEmail,
      passwordHash,
      name: normalizedName,
      phoneNumber: normalizedPhone,
      role: normalizedRole as any,
    };

    await db.addUser(newUser);

    if (normalizedRole === 'CONSUMER') {
      await db.addConsumerProfile({
        id: `cp-${Date.now()}`,
        userId: newUser.id,
        phoneNumber: normalizedPhone || null,
        drawalPoint: drawalPoint || 'Local Substation Node',
       
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

    const message = newUser.role === 'CONSUMER'
      ? 'Registration completed successfully. You can sign in now.'
      : 'Registration submitted successfully.';

    res.status(201).json({
      message,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
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
      res.status(400).json({ error: 'Invalid credentials' });
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
        k_number: (user as any).k_number,
        connection_type: (user as any).connection_type,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/validate-knumber', async (req: any, res: any) => {
  try {
    const { k_number } = req.body;
    
    if (!k_number) {
      return res.status(400).json({ error: 'K number is required' });
    }
    
    // Query YOUR database to check if user exists with this K-number
    const user = await db.getUserByKNumber(k_number);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'No account found with this K-number. Please register first.' 
      });
    }
    
    // User exists - return their data for login
    res.json({
      success: true,
      consumer: {
        name: user.name,
        email: user.email,
        mobile_number: user.phoneNumber,
        connection_type: user.connection_type || 'Industrial',
        k_number: user.k_number
      }
    });
    
  } catch (error) {
    console.error('Validate K-number error:', error);
    res.status(500).json({ error: 'Failed to validate K-number' });
  }
});


// ============================================
// NEW ENDPOINT FOR REGISTRATION - Uses Electric Board API
// ============================================
router.post('/validate-knumber-for-registration', async (req: any, res: any) => {
  try {
    const { k_number } = req.body;
    
    if (!k_number) {
      return res.status(400).json({ error: 'K number is required' });
    }
    
    // Check Electric Board API for valid K-number
    const consumer = await db.getConsumerByKNumber(k_number);
    
    if (!consumer) {
      return res.status(404).json({ error: 'Invalid K number' });
    }
    
    // Check if already registered in YOUR database
    const existingUser = await db.getUserByKNumber(k_number);
    if (existingUser) {
      return res.status(400).json({ error: 'K number already registered. Please login.' });
    }
    
    res.json({
      success: true,
      consumer: {
        name: consumer.name,
        email: consumer.email,
        mobile_number: consumer.mobile_number,
        connection_type: consumer.connection_type,
        k_number: consumer.k_number
      }
    });
    
  } catch (error) {
    console.error('Validate K-number for registration error:', error);
    res.status(500).json({ error: 'Failed to validate K-number' });
  }
});


// Register consumer using K number
router.post('/register-with-knumber', async (req, res) => {
  try {
    const { k_number, email, password } = req.body;
    
    if (!k_number || !email || !password) {
      res.status(400).json({ error: 'K number, email and password are required' });
      return;
    }
    
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }
    
    // Validate K number exists
    const consumer = await db.getConsumerByKNumber(k_number.trim());
    
    if (!consumer) {
      res.status(404).json({ error: 'Invalid K number' });
      return;
    }
    
    // Check if already registered
    const isRegistered = await db.isKNumberRegistered(k_number.trim());
    
    if (isRegistered) {
      res.status(400).json({ error: 'This K number is already registered' });
      return;
    }
    
    // Check if email already used
    const existingUser = await db.getUserByEmail(email.toLowerCase());
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create user with K number data (no state parameter)
    const newUser = await db.createUserWithKNumber({
      email: email.toLowerCase(),
      passwordHash,
      name: consumer.name,
      phoneNumber: consumer.mobile_number,
      k_number: consumer.k_number,
      connection_type: consumer.connection_type,
    });
    
    // Create consumer profile
    try {
      const existingProfile = await db.getConsumerProfileByUserId(newUser.id);
      if (!existingProfile) {
        await db.addConsumerProfile({
          id: `cp-${Date.now()}`,
          userId: newUser.id,
          phoneNumber: consumer.mobile_number,
          drawalPoint: '400kV Jajpur Substation',
          
        });
      }
    } catch (profileError) {
      console.error('Error creating consumer profile:', profileError);
    }
    
    // Generate token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        k_number: newUser.k_number,
        connection_type: newUser.connection_type,
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
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

  const userRes: any = {
    id: user.id,
    email: user.email,
    name: user.name,
    phoneNumber: user.phoneNumber,
    role: user.role,
    k_number: (user as any).k_number,
    connection_type: (user as any).connection_type
  };

  if (user.role === 'CONSUMER') {
    userRes.profile = await db.getConsumerProfileByUserId(user.id);
  } else if (user.role === 'SUPPLIER') {
    userRes.profile = await db.getSupplierProfileByUserId(user.id);
  }

  res.json(userRes);
});


router.post('/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user exists with this email
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }
    
    await sendEmailOTP(email);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send email OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
});


router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    // Verify OTP
    const verification = await verifyOTP(email, otp, 'email');
    if (!verification.success) {
      return res.status(400).json({ error: verification.error });
    }
    
    // Get user
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Verify email OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});



router.post('/send-phone-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Check if user exists with this phone number
    const users = await db.getUsers();
    const user = users.find(u => u.phoneNumber === phone || u.phoneNumber === `+91${phone}`);
    
    if (!user) {
      return res.status(404).json({ error: 'No account found with this phone number' });
    }
    
    await sendPhoneOTP(phone);
    res.json({ success: true, message: 'OTP sent to your phone' });
  } catch (error) {
    console.error('Send phone OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});


router.post('/verify-phone-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }
    
    const verification = await verifyOTP(phone, otp, 'phone');
    if (!verification.success) {
      return res.status(400).json({ error: verification.error });
    }
    
    const users = await db.getUsers();
    const user = users.find(u => u.phoneNumber === phone || u.phoneNumber === `+91${phone}`);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Verify phone OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});


export default router;