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
    return await prisma.user.update({
      where: { id },
      data: { status }
    });
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

async getSupplierPlants(supplierId: string) {
  try {
    return await prisma.plant.findMany({
      where: { supplierId }
    });
  } catch (error) {
    console.log("DB ERROR getSupplierPlants", error);
    return [];
  }
},

async addPlant(plantData: any) {
  try {
    return await prisma.plant.create({ data: plantData });
  } catch (error) {
    console.log("DB ERROR addPlant", error);
    throw error;
  }
},

async updatePlant(id: string, plantData: any) {
  try {
    return await prisma.plant.update({
      where: { id },
      data: plantData
    });
  } catch (error) {
    console.log("DB ERROR updatePlant", error);
    return null;
  }
},

async deletePlant(id: string) {
  try {
    return await prisma.plant.delete({ where: { id } });
  } catch (error) {
    console.log("DB ERROR deletePlant", error);
    return null;
  }
},


async addBid(bidData: any) {
  try {
    const cleanString = (str: string) => {
      if (!str) return '';
      return str.replace(/[\x00-\x1F\x7F]/g, '').trim();
    };
    
    return await prisma.bid.create({
      data: {
        consumerId: cleanString(bidData.consumerId),
        consumerName: cleanString(bidData.consumerName || 'Consumer'),
        mw: Number(bidData.mw),
        price: Number(bidData.price),
        duration: Number(bidData.duration),
        drawalPoint: cleanString(bidData.drawalPoint),
        scheduleType: bidData.scheduleType,
        message: cleanString(bidData.message),
        status: bidData.status || "ACTIVE",
        validityDays: Number(bidData.validityDays) || 30,
      }
    });
  } catch (error) {
    console.error('Error adding bid:', error);
    throw error;
  }
},


async getBidsByConsumer(consumerId: string) {
  try {
    return await prisma.bid.findMany({
      where: { consumerId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.log("DB ERROR getBidsByConsumer", error);
    return [];
  }
},


async getBidsBySupplier(supplierId: string) {
  try {
    // Now get offers made by this supplier, then find the parent bids
    const offers = await prisma.bidOffer.findMany({
      where: { supplierId },
      include: { bid: true },
      orderBy: { createdAt: 'desc' }
    });
    return offers.map(offer => ({
      ...offer.bid,
      offerId: offer.id,
      offeredPrice: offer.offeredPrice,
      offeredMw: offer.offeredMw,
      offerStatus: offer.status,
      offerMessage: offer.message,
      offerCreatedAt: offer.createdAt
    }));
  } catch (error) {
    console.log("DB ERROR getBidsBySupplier", error);
    return [];
  }
},



async getBidById(id: string) {
  try {
    return await prisma.bid.findUnique({
      where: { id }
    });
  } catch (error) {
    console.log("DB ERROR getBidById", error);
    return null;
  }
},

async updateBidStatus(id: string, status: string) {
  try {
    return await prisma.bid.update({
      where: { id },
      data: { status, updatedAt: new Date() }
    });
  } catch (error) {
    console.log("DB ERROR updateBidStatus", error);
    return null;
  }
},


async updateBidOfferStatus(offerId: string, status: string) {
  try {
    return await prisma.bidOffer.update({
      where: { id: offerId },
      data: { status, updatedAt: new Date() }
    });
  } catch (error) {
    console.log("DB ERROR updateBidOfferStatus", error);
    return null;
  }
},


async getActiveBids() {
  try {
    return await prisma.bid.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.log("DB ERROR getActiveBids", error);
    return [];
  }
},


async getOffersBySupplier(supplierId: string) {
  try {
    return await prisma.bidOffer.findMany({
      where: { supplierId },
      include: { bid: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.log("DB ERROR getOffersBySupplier", error);
    return [];
  }
},


async getOfferById(offerId: string) {
  try {
    return await prisma.bidOffer.findUnique({
      where: { id: offerId }
    });
  } catch (error) {
    console.log("DB ERROR getOfferById", error);
    return null;
  }
},


async getOffersByBid(bidId: string) {
  try {
    return await prisma.bidOffer.findMany({
      where: { bidId },
      orderBy: { offeredPrice: 'asc' }
    });
  } catch (error) {
    console.log("DB ERROR getOffersByBid", error);
    return [];
  }
},


async getOffersByConsumer(consumerId: string) {
  try {
    return await prisma.bidOffer.findMany({
      where: { 
        bid: { consumerId } 
      },
      include: { bid: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.log("DB ERROR getOffersByConsumer", error);
    return [];
  }
},


async rejectOtherOffers(bidId: string, acceptedOfferId: string) {
  try {
    return await prisma.bidOffer.updateMany({
      where: {
        bidId: bidId,
        id: { not: acceptedOfferId },
        status: 'PENDING'
      },
      data: { status: 'REJECTED' }
    });
  } catch (error) {
    console.log("DB ERROR rejectOtherOffers", error);
    return null;
  }
},

async addBidOffer(offerData: any) {
  try {
    const cleanString = (str: string) => {
      if (!str) return '';
      return str.replace(/[\x00-\x1F\x7F]/g, '').trim();
    };
    
    return await prisma.bidOffer.create({
      data: {
        bidId: offerData.bidId,
        supplierId: cleanString(offerData.supplierId),
        supplierName: cleanString(offerData.supplierName),
        offeredPrice: Number(offerData.offeredPrice),
        offeredMw: Number(offerData.offeredMw),
        message: cleanString(offerData.message),
        status: "PENDING",
      }
    });
  } catch (error) {
    console.error('Error adding bid offer:', error);
    throw error;
  }
},


async closeBid(bidId: string) {
  try {
    return await prisma.bid.update({
      where: { id: bidId },
      data: { 
        status: 'ACCEPTED', 
        updatedAt: new Date() 
      }
    });
  } catch (error) {
    console.log("DB ERROR closeBid", error);
    throw error;
  }
},


async updateBid(bidId: string, data: any) {
  try {
    return await prisma.bid.update({
      where: { id: bidId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.log("DB ERROR updateBid", error);
    return null;
  }
},


  // Other required methods (minimal implementations)
  async getBids() { return []; },
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