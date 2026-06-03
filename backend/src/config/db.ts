import { PrismaClient } from '@prisma/client';

export type Role = 'ADMIN' | 'SUPPLIER' | 'CONSUMER' | 'TRADER';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phoneNumber?: string | null;
  role: Role;
  state: string;
  utilityType?: string | null;
  status: string;
  createdAt?: string;
}

export interface ConsumerProfile {
  id: string;
  userId: string;
  phoneNumber?: string | null;
  drawalPoint: string;
  oaStatus: string;
}

export interface SupplierProfile {
  id: string;
  userId: string;
  phoneNumber?: string | null;
  injectionPoint: string;
  renewableType: string;
}

export interface Bid {
  id: string;
  userId: string;
  mw: number;
  price: number;
  marketType: string;
  timeBlock: string;
  status: string;
  createdAt?: string;
}

export interface Application {
  id: string;
  consumerId: string;
  supplierId: string;
  mw: number;
  type: string;
  applicantName?: string;
  entityType?: string;
  legalIdentifier?: string;
  discomConsumerNo?: string;
  registeredAddress?: string;
  state?: string;
  discom?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactMobile?: string;
  voltageLevel?: string;
  renewableType?: string;
  scheduleType?: string;
  proposedStartDate?: string;
  timeBlocks?: string;
  documentChecklist?: any;

  // Workflow tracking
  adminApprovedAt?: string;
  supplierApprovedAt?: string;
  contractGeneratedAt?: string;
  rejectionReason?: string;

  // Contract details
  contractId?: string;
  contractUrl?: string;

  requestedPrice?: number;
  consumerName?: string;
  annexureCStatus?: string;
  annexureDStatus?: string;
  annexureEStatus?: string;
  approvalStatus?: string;
  lossPercentage?: number;
  injectionPoint: string;
  drawalPoint: string;
  durationDays?: number;
  ppaUrl?: string;
  oaAppUrl?: string;
  bgUrl?: string;
  authLetterUrl?: string;
  createdAt?: string;
  // updatedAt: string;
}

// export interface Contract {
//   id: string;
//   applicationId: string;
//   consumerId: string;
//   supplierId: string;
//   contractNumber: string;
//   startDate: string;
//   endDate: string;
//   mw: number;
//   pricePerUnit: number;
//   totalValue: number;
//   status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED';
//   signedByConsumer: boolean;
//   signedBySupplier: boolean;
//   signedAt?: string;
//   pdfUrl?: string;
//   createdAt: string;
// }

export interface Schedule {
  id?: string;
  applicationId: string;
  supplierId: string;
  consumerId: string;
  mw: number;
  timeBlock: string;
  gridStatus: string;
  createdAt?: string;
}

// export interface Document {
//   id: string;
//   title: string;
//   category: string;
//   fileUrl: string;
//   status: string;
//   userId: string;
//   createdAt?: string;
// }

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency?: string;
  status: string;
  reference?: string;
  createdAt?: string;
}

export interface MarketPrice {
  id?: string;
  market: string;
  price: number;
  change: string;
}

const prisma = new PrismaClient();

const parseDate = (input?: string | Date | null) => {
  if (!input) return undefined;
  return input instanceof Date ? input : new Date(input);
};

const formatRecord = <T extends { createdAt?: string | Date | null }>(record: T | null): Omit<T, 'createdAt'> & { createdAt?: string } | null => {
  if (!record) return null;
  return {
    ...record,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt
  } as Omit<T, 'createdAt'> & { createdAt?: string };
};

const formatRecords = <T extends { createdAt?: string | Date | null }>(records: Array<T>): Array<Omit<T, 'createdAt'> & { createdAt?: string }> =>
  records.map((record) => formatRecord(record) as Omit<T, 'createdAt'> & { createdAt?: string });


const validateMobileNumber = (mobile: string): boolean => {
  // Check if mobile has +91 prefix and then 10 digits
  const mobileRegex = /^\+91\d{10}$/;
  return mobileRegex.test(mobile);
};

const validateLegalIdentifier = (identifier: string): boolean => {
  // CIN/GSTIN - exactly 10 alphanumeric characters
  const cinRegex = /^[A-Z0-9]{10}$/i;
  return cinRegex.test(identifier);
};

const validateDiscomConsumerNo = (consumerNo: string): boolean => {
  // Exactly 10 digits
  const consumerNoRegex = /^\d{10}$/;
  return consumerNoRegex.test(consumerNo);
};



export const db = {
  async getUsers() {
  try {
    return (await prisma.user.findMany()).map(formatRecord);
  } catch (error) {
    console.log("DB ERROR getUsers", error);
    return [];
  }
},

  async getUserById(id: string) {
  try {
    return formatRecord(await prisma.user.findUnique({
      where: { id }
    }));
  } catch (error) {
    console.log("DB ERROR getUserById", error);
    return null;
  }
},

  async getUserByEmail(email: string) {
    try {
      return formatRecord(await prisma.user.findUnique({ where: { email } }));
    } catch (error) {
      console.log("DB ERROR getUserByEmail", error);
      return null;
    }
  },

  async addUser(user: User) {
    return formatRecord(
      await prisma.user.create({
        data: {
          ...user,
          createdAt: parseDate(user.createdAt)
        }
      })
    );
  },

  async updateUserStatus(id: string, status: string) {
    return formatRecord(await prisma.user.update({ where: { id }, data: { status } }));
  },

  async reapplyRejectedUser(
    userId: string,
    data: {
      passwordHash: string;
      name: string;
      phoneNumber?: string | null;
      role: Role;
      state: string;
      utilityType?: string | null;
      drawalPoint?: string;
      injectionPoint?: string;
      renewableType?: string;
    }
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: data.passwordHash,
        name: data.name,
        phoneNumber: data.phoneNumber,
        role: data.role,
        state: data.state,
        utilityType: data.utilityType ?? null,
        status: data.role === 'CONSUMER' ? 'VERIFIED' : 'PENDING'
      }
    });

    if (data.role === 'CONSUMER') {
      await prisma.supplierProfile.deleteMany({ where: { userId } });
      await prisma.consumerProfile.upsert({
        where: { userId },
        create: {
          id: `cp-${Date.now()}`,
          userId,
          phoneNumber: data.phoneNumber ?? null,
          drawalPoint: data.drawalPoint || 'Local Substation Node',
          oaStatus: 'INACTIVE'
        },
        update: {
          phoneNumber: data.phoneNumber ?? null,
          drawalPoint: data.drawalPoint || 'Local Substation Node',
          oaStatus: 'INACTIVE'
        }
      });
    } else if (data.role === 'SUPPLIER') {
      if (!data.renewableType) {
        throw new Error('renewableType is required for supplier profiles');
      }
      await prisma.consumerProfile.deleteMany({ where: { userId } });
      await prisma.supplierProfile.upsert({
        where: { userId },
        create: {
          id: `sp-${Date.now()}`,
          userId,
          phoneNumber: data.phoneNumber ?? null,
          injectionPoint: data.injectionPoint || 'Grid Injection Pooling Node',
          renewableType: data.renewableType
        },
        update: {
          phoneNumber: data.phoneNumber ?? null,
          injectionPoint: data.injectionPoint || 'Grid Injection Pooling Node',
          renewableType: data.renewableType
        }
      });
    }

    return formatRecord(await prisma.user.findUnique({ where: { id: userId } }));
  },

  async getConsumerProfiles() {
    return await prisma.consumerProfile.findMany();
  },

  async getConsumerProfileByUserId(userId: string) {
    return await prisma.consumerProfile.findUnique({ where: { userId } });
  },

  async addConsumerProfile(profile: ConsumerProfile) {
    return await prisma.consumerProfile.create({ data: profile });
  },

  async getSupplierProfiles() {
    return await prisma.supplierProfile.findMany();
  },

  async getSupplierProfileByUserId(userId: string) {
    return await prisma.supplierProfile.findUnique({ where: { userId } });
  },

  async addSupplierProfile(profile: SupplierProfile) {
    return await prisma.supplierProfile.create({ data: profile });
  },

  async getBids() {
    return await prisma.bid.findMany();
  },

  async addBid(bid: Bid) {
    return await prisma.bid.create({
      data: {
        ...bid,
        createdAt: parseDate(bid.createdAt)
      }
    });
  },

  async updateBidStatus(id: string, status: string) {
    return await prisma.bid.update({ where: { id }, data: { status } });
  },

  async getApplications() {
    return formatRecords(await prisma.application.findMany());
  },

  async getApplicationById(id: string) {
    return formatRecord(await prisma.application.findUnique({ where: { id } }));
  },

  async addApplication(app: Application) {
    return formatRecord(
      await prisma.application.create({
        data: {
          ...app,
          createdAt: parseDate(app.createdAt)
        }
      })
    );
  },

  async updateApplication(id: string, updates: Partial<Application>) {
    return formatRecord(await prisma.application.update({ where: { id }, data: updates }));
  },

  async getSchedules() {
    return formatRecords(await prisma.schedule.findMany());
  },

  async addSchedule(schedule: Schedule) {
    return formatRecord(
      await prisma.schedule.create({
        data: {
          ...schedule,
          createdAt: parseDate(schedule.createdAt)
        }
      })
    );
  },

  async updateScheduleStatus(id: string, status: string) {
    return formatRecord(await prisma.schedule.update({ where: { id }, data: { gridStatus: status } }));
  },

  async getDocuments() {
  try {
    const docs = await prisma.document.findMany({
      include: { user: true }  // Include user relation if needed
    });
    return docs.map(doc => ({
      ...doc,
      createdAt: doc.createdAt?.toISOString(),
      userId: doc.userId
    }));
  } catch (error) {
    console.log("DB ERROR getDocuments", error);
    return [];
  }
},

async getDocumentsByUserId(userId: string) {
  try {
    const docs = await prisma.document.findMany({ 
      where: { userId },
      include: { user: true }
    });
    return docs.map(doc => ({
      ...doc,
      createdAt: doc.createdAt?.toISOString(),
      userId: doc.userId
    }));
  } catch (error) {
    console.log("DB ERROR getDocumentsByUserId", error);
    return [];
  }
},

  async addDocument(doc: { id?: string; title: string; category: string; fileUrl: string; status: string; userId: string; createdAt?: string }) {
  try {
    const result = await prisma.document.create({
      data: {
        title: doc.title,
        category: doc.category,
        fileUrl: doc.fileUrl,
        status: doc.status,
        user: {
          connect: { id: doc.userId }  // Connect to existing user instead of creating new
        }
      }
    });
    
    return {
      ...result,
      createdAt: result.createdAt?.toISOString()
    };
  } catch (error) {
    console.log("DB ERROR addDocument", error);
    throw error;
  }
},

  async updateDocumentStatus(id: string, status: string) {
  try {
    const result = await prisma.document.update({ 
      where: { id }, 
      data: { status } 
    });
    return {
      ...result,
      createdAt: result.createdAt?.toISOString()
    };
  } catch (error) {
    console.log("DB ERROR updateDocumentStatus", error);
    throw error;
  }
},

  async getPayments() {
    return formatRecords(await prisma.payment.findMany());
  },

  async getPaymentsByUserId(userId: string) {
    return formatRecords(await prisma.payment.findMany({ where: { userId } }));
  },

  async addPayment(payment: Payment) {
    return formatRecord(
      await prisma.payment.upsert({
        where: { id: payment.id },
        create: {
          ...payment,
          createdAt: parseDate(payment.createdAt)
        },
        update: {
          ...payment,
          createdAt: parseDate(payment.createdAt)
        }
      })
    );
  },

  async getMarketPrices() {
    return await prisma.marketPrice.findMany();
  },

  async updateMarketPrice(market: string, price: number, change: string) {
    return await prisma.marketPrice.upsert({
      where: { market },
      create: { market, price, change },
      update: { price, change }
    });
  },

  // async addContract(contract: Contract) {
  //   try {
  //     return await prisma.contract.create({
  //       data: {
  //         id: contract.id,
  //         applicationId: contract.applicationId,
  //         consumerId: contract.consumerId,
  //         supplierId: contract.supplierId,
  //         contractNumber: contract.contractNumber,
  //         startDate: new Date(contract.startDate),
  //         endDate: new Date(contract.endDate),
  //         mw: contract.mw,
  //         pricePerUnit: contract.pricePerUnit,
  //         totalValue: contract.totalValue,
  //         status: contract.status,
  //         signedByConsumer: contract.signedByConsumer,
  //         signedBySupplier: contract.signedBySupplier,
  //         signedAt: contract.signedAt ? new Date(contract.signedAt) : undefined,
  //         pdfUrl: contract.pdfUrl,
  //         createdAt: new Date()
  //       }
  //     });
  //   } catch (error) {
  //     console.log("DB ERROR addContract", error);
  //     throw error;
  //   }
  // },

  // async getContractById(id: string) {
  //   try {
  //     return await prisma.contract.findUnique({ where: { id } });
  //   } catch (error) {
  //     console.log("DB ERROR getContractById", error);
  //     return null;
  //   }
  // },

  // async getContractsByConsumerId(consumerId: string) {
  //   try {
  //     return await prisma.contract.findMany({ where: { consumerId } });
  //   } catch (error) {
  //     console.log("DB ERROR getContractsByConsumerId", error);
  //     return [];
  //   }
  // },

  // async getContractsBySupplierId(supplierId: string) {
  //   try {
  //     return await prisma.contract.findMany({ where: { supplierId } });
  //   } catch (error) {
  //     console.log("DB ERROR getContractsBySupplierId", error);
  //     return [];
  //   }
  // },

  // async getAllContracts() {
  //   try {
  //     return await prisma.contract.findMany();
  //   } catch (error) {
  //     console.log("DB ERROR getAllContracts", error);
  //     return [];
  //   }
  // },

  // async updateContract(id: string, updates: Partial<Contract>) {
  //   try {
  //     return await prisma.contract.update({
  //       where: { id },
  //       data: {
  //         ...updates,
  //         signedAt: updates.signedAt ? new Date(updates.signedAt) : undefined
  //       }
  //     });
  //   } catch (error) {
  //     console.log("DB ERROR updateContract", error);
  //     throw error;
  //   }
  // },

  // SUPPLIER DOCUMENT METHODS
  async getSupplierDocumentsByUserId(supplierId: string) {
    try {
      const docs = await prisma.supplierDocument.findMany({
        where: { supplierId },
        orderBy: { uploadedAt: 'desc' }
      });
      return docs;
    } catch (error) {
      console.log("DB ERROR getSupplierDocumentsByUserId", error);
      return [];
    }
  },

  async getSupplierDocumentById(id: string) {
    try {
      return await prisma.supplierDocument.findUnique({ where: { id } });
    } catch (error) {
      console.log("DB ERROR getSupplierDocumentById", error);
      return null;
    }
  },

  async addSupplierDocument(doc: any) {
    try {
      return await prisma.supplierDocument.create({
        data: {
          id: doc.id,
          supplierId: doc.supplierId,
          name: doc.name,
          documentType: doc.documentType,
          description: doc.description,
          filePath: doc.filePath,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          status: doc.status || 'PENDING',
          verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt) : undefined,
          verifiedBy: doc.verifiedBy,
          uploadedAt: new Date()
        }
      });
    } catch (error) {
      console.log("DB ERROR addSupplierDocument", error);
      throw error;
    }
  },

  async deleteSupplierDocument(id: string) {
    try {
      await prisma.supplierDocument.delete({ where: { id } });
    } catch (error) {
      console.log("DB ERROR deleteSupplierDocument", error);
      throw error;
    }
  },

  async updateSupplierDocumentStatus(id: string, status: string, verifiedBy?: string) {
    try {
      return await prisma.supplierDocument.update({
        where: { id },
        data: {
          status,
          verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
          verifiedBy
        }
      });
    } catch (error) {
      console.log("DB ERROR updateSupplierDocumentStatus", error);
      throw error;
    }
  }

  
};
