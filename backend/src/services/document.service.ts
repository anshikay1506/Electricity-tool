import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export class DocumentService {
  static async saveDocument(
    userId: string,
    file: Express.Multer.File,
    metadata: { title: string; category: string; applicationId?: string }
  ) {
    // Create document record
    const document = await prisma.document.create({
      data: {
        title: metadata.title,
        category: metadata.category,
        fileUrl: file.path.replace(/\\/g, '/'),
        status: 'PENDING',
        userId,
        applicationId: metadata.applicationId
      }
    });

    // Check if user is supplier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role === 'SUPPLIER') {
      await prisma.supplierDocument.create({
        data: {
          id: document.id,
          supplierId: userId,
          name: metadata.title,
          documentType: metadata.category,
          filePath: file.path.replace(/\\/g, '/'),
          fileSize: file.size,
          mimeType: file.mimetype,
          status: 'PENDING'
        }
      });
    }

    return document;
  }

  static async getDocumentsByUser(userId: string) {
    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const supplierDocs = await prisma.supplierDocument.findMany({
      where: { supplierId: userId },
      include: { supplier: { select: { name: true, email: true } } }
    });

    return { documents, supplierDocuments: supplierDocs };
  }

  static async verifyDocument(documentId: string, status: string, adminId: string) {
    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        verifiedBy: adminId,
        verifiedAt: new Date()
      }
    });

    await prisma.supplierDocument.updateMany({
      where: { id: documentId },
      data: {
        status: status === 'VERIFIED' ? 'VERIFIED' : 'REJECTED',
        verifiedBy: adminId,
        verifiedAt: new Date()
      }
    });

    return document;
  }
}