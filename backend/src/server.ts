import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

// Routes imports
import authRoutes from './routes/auth.routes';
import supplierRoutes from './routes/supplier.routes';
import userRoutes from './routes/user.routes';
import marketRoutes from './routes/market.routes';
import appRoutes from './routes/app.routes';
import docRoutes from './routes/doc.routes';
import payRoutes from './routes/pay.routes';
import { authenticateToken, requireVerifiedPortalUser } from './middleware/auth';
import plantRoutes from './routes/plant.routes';
import bidRoutes from './routes/bid.routes';


const protectedApiMiddleware = [authenticateToken, requireVerifiedPortalUser];

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow any origins for simplified local development
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Static Uploads Folder Serving
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Route Bindings
app.use('/api/auth', authRoutes);
app.use('/api/users', ...protectedApiMiddleware, userRoutes);
app.use('/api/market', ...protectedApiMiddleware, marketRoutes);
app.use('/api/applications', ...protectedApiMiddleware, appRoutes);
app.use('/api/documents', ...protectedApiMiddleware, docRoutes);
app.use('/api/payments', ...protectedApiMiddleware, payRoutes);
app.use('/api/suppliers', ...protectedApiMiddleware, supplierRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/bids', bidRoutes);


// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'GOAR-NOAR Grid Core Engine',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build (SPA) if present to avoid refresh routing issues
const frontendDist = path.join(process.cwd(), 'my-app', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  // Fallback to index.html for client-side routing (must be after API routes)
  app.get('*', (req, res) => {
    // If request is for API, skip fallback
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// App launch
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` GOAR / NOAR Grid Server Running on :${PORT}`);
  console.log(`========================================`);
});
