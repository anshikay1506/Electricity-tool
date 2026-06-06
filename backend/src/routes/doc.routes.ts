// import { Router, Response } from 'express';
// import multer from 'multer';
// import fs from 'fs';
// import path from 'path';
// import { db, Document } from '../config/db';
// import { AuthenticatedRequest } from '../middleware/auth';

// const router = Router();

// const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
// if (!fs.existsSync(UPLOADS_DIR)) {
//   fs.mkdirSync(UPLOADS_DIR, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, UPLOADS_DIR);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({ storage });

// router.post('/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
//   if (!req.user) {
//     res.status(401).json({ error: 'Unauthorized' });
//     return;
//   }

//   if (!req.file) {
//     res.status(400).json({ error: 'No file uploaded' });
//     return;
//   }

//   const { title, category } = req.body;
//   if (!title || !category) {
//     res.status(400).json({ error: 'Document title and category are required' });
//     return;
//   }

//   const fileUrl = `/uploads/${req.file.filename}`;

//   const newDoc: Document = {
//     id: `doc-${Date.now()}`,
//     title,
//     category,
//     fileUrl,
//     status: 'PENDING',
//     userId: req.user.id,
//     createdAt: new Date().toISOString()
//   };

//   await db.addDocument(newDoc);

//   res.status(201).json({
//     success: true,
//     document: newDoc
//   });
// });

// router.get('/', async (req: AuthenticatedRequest, res: Response) => {
//   if (!req.user) {
//     res.status(401).json({ error: 'Unauthorized' });
//     return;
//   }

//   let docs = await db.getDocuments();

//   if (req.user.role !== 'ADMIN') {
//     docs = docs.filter(d => d.userId === req.user?.id);
//   }

//   const detailedDocs = await Promise.all(docs.map(async (d) => {
//     const user = await db.getUserById(d.userId);
//     return {
//       ...d,
//       uploaderName: user?.name || 'Grid Operator',
//       uploaderRole: user?.role || 'TRADER'
//     };
//   }));

//   res.json(detailedDocs);
// });

// router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
//   if (req.user?.role !== 'ADMIN') {
//     res.status(403).json({ error: 'Only administrators can verify regulatory documents' });
//     return;
//   }

//   const { id } = req.params;
//   const { status } = req.body; // VERIFIED, REJECTED

//   if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
//     res.status(400).json({ error: 'Invalid document status' });
//     return;
//   }

//   await db.updateDocumentStatus(id, status);
//   res.json({ success: true, message: `Document status successfully set to ${status}` });
// });

// export default router;
