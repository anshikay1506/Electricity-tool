import { PrismaClient } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phoneNumber?: string;
  role: string;  // 'CONSUMER', 'SUPPLIER', 'ADMIN'
  k_number?: string;
  connection_type?: string;
}

interface ElectricBoardConsumer {
  k_number: string;
  name: string;
  mobile_number: string;
  email?: string;
  connection_type: string;
  meter_type?: string;
  area_type?: string;
  connected_load?: number;
  demand_load?: number;
  address?: string;
  discom?: string;  
}

export interface ConsumerProfile {
  id: string;
  userId: string;
  phoneNumber?: string | null;
  drawalPoint: string;
  k_number?: string;
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
  injectionPoint: string;
  drawalPoint: string;
  durationDays?: number;
  requestedPrice?: number;
  consumerName?: string;
  approvalStatus?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface Schedule {
  id: string;
  applicationId: string;
  supplierId: string;
  consumerId: string;
  mw: number;
  timeBlock: string;
  gridStatus: string;
  createdAt?: string;
}

export interface Document {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  status: string;
  userId: string;
  createdAt?: string;
}

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

export const db = {
  // User methods
  async getUsers() {
    try {
      return await prisma.user.findMany();
    } catch (error) {
      console.log("DB ERROR getUsers", error);
      return [];
    }
  },

  async getUserById(id: string): Promise<any> {
  try {
    return await prisma.user.findUnique({ where: { id } });
  } catch (error) {
    console.log("DB ERROR getUserById", error);
    return null;
  }
},

  async getUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      console.log("DB ERROR getUserByEmail", error);
      return null;
    }
  },

  async addUser(user: User) {
    try {
      return await prisma.user.create({ data: user });
    } catch (error) {
      console.log("DB ERROR addUser", error);
      throw error;
    }
  },

  // ElectricBoard methods
  async getConsumerByKNumber(k_number: string) {
    try {
      return await prisma.electricboard.findUnique({
        where: { k_number }
      });
    } catch (error) {
      console.error('Error getting consumer by K number:', error);
      return null;
    }
  },

  async isKNumberRegistered(k_number: string) {
    try {
      const user = await prisma.user.findFirst({
        where: { k_number }
      });
      return !!user;
    } catch (error) {
      console.error('Error checking K number registration:', error);
      return false;
    }
  },

  async createUserWithKNumber(userData: {
    email: string;
    passwordHash: string;
    name: string;
    phoneNumber: string;
    k_number: string;
    connection_type: string;
  }) {
    try {
      const user = await prisma.user.create({
        data: {
          id: `u-${Date.now()}`,
          email: userData.email,
          passwordHash: userData.passwordHash,
          name: userData.name,
          phoneNumber: userData.phoneNumber,
          role: 'CONSUMER',
          k_number: userData.k_number,
          connection_type: userData.connection_type,
        }
      });
      return user;
    } catch (error) {
      console.error('Error creating user with K number:', error);
      throw error;
    }
  },

  // ConsumerProfile methods
  async getConsumerProfileByUserId(userId: string) {
    try {
      return await prisma.consumerProfile.findUnique({ where: { userId } });
    } catch (error) {
      console.log("DB ERROR getConsumerProfileByUserId", error);
      return null;
    }
  },

  async addConsumerProfile(profile: ConsumerProfile) {
    try {
      return await prisma.consumerProfile.create({ data: profile });
    } catch (error) {
      console.log("DB ERROR addConsumerProfile", error);
      throw error;
    }
  },

  // SupplierProfile methods
  async getSupplierProfileByUserId(userId: string) {
    try {
      return await prisma.supplierProfile.findUnique({ where: { userId } });
    } catch (error) {
      console.log("DB ERROR getSupplierProfileByUserId", error);
      return null;
    }
  },

  async addSupplierProfile(profile: SupplierProfile) {
    try {
      return await prisma.supplierProfile.create({ data: profile });
    } catch (error) {
      console.log("DB ERROR addSupplierProfile", error);
      throw error;
    }
  },

  // Application methods
  async getApplications() {
    try {
      return await prisma.application.findMany();
    } catch (error) {
      console.log("DB ERROR getApplications", error);
      return [];
    }
  },

  async getApplicationById(id: string) {
    try {
      return await prisma.application.findUnique({ where: { id } });
    } catch (error) {
      console.log("DB ERROR getApplicationById", error);
      return null;
    }
  },

  async addApplication(app: Application) {
    try {
      return await prisma.application.create({ data: app });
    } catch (error) {
      console.log("DB ERROR addApplication", error);
      throw error;
    }
  },

  async updateApplication(id: string, updates: Partial<Application>) {
    try {
      return await prisma.application.update({ where: { id }, data: updates });
    } catch (error) {
      console.log("DB ERROR updateApplication", error);
      throw error;
    }
  },

  async updateUserStatus(id: string, status: string) {
  try {
    // Since status field doesn't exist anymore, just return the user
    return await prisma.user.findUnique({ where: { id } });
  } catch (error) {
    console.log("DB ERROR updateUserStatus", error);
    return null;
  }
},

async updateDocumentStatus(id: string, status: string) {
  try {
    return await prisma.document.update({
      where: { id },
      data: { status }
    });
  } catch (error) {
    console.log("DB ERROR updateDocumentStatus", error);
    return null;
  }
},

async getUserByKNumber(k_number: string) {
  try {
    return await prisma.user.findFirst({
      where: { k_number: k_number }
    });
  } catch (error) {
    console.log("DB ERROR getUserByKNumber", error);
    return null;
  }
},

  // Other required methods (minimal implementations)
  async getBids() { return []; },
  async addBid(bid: Bid) { return bid; },
  async updateBidStatus(id: string, status: string) { return null; },
  async getSchedules() { return []; },
  async addSchedule(schedule: Schedule) { return schedule; },
  async getDocuments() { return []; },
  async getDocumentsByUserId(userId: string) { return []; },
  async addDocument(doc: Document) { return doc; },
  async getPayments() { return []; },
  async getPaymentsByUserId(userId: string) { return []; },
  async addPayment(payment: Payment) { return payment; },
  async getMarketPrices() { return []; },
  async updateMarketPrice(market: string, price: number, change: string) { return null; },
  async getSupplierDocumentsByUserId(supplierId: string) { return []; },
  async getSupplierDocumentById(id: string) { return null; },
  async addSupplierDocument(doc: any) { return doc; },
  async deleteSupplierDocument(id: string) {},
  async updateSupplierDocumentStatus(id: string, status: string, verifiedBy?: string) { return null; },
};