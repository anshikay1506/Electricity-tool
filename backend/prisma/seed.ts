import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database records...");
  
  // Hashed password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("admin123", salt);

  // 1. Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@goar.gov.in' },
    update: {},
    create: {
      email: 'admin@goar.gov.in',
      name: 'NLDC System Operator',
      phoneNumber: '+911234567890',
      passwordHash,
      role: 'ADMIN',
      state: 'Delhi',
      status: 'VERIFIED'
    }
  });

  // 2. Supplier
  // const supplier = await prisma.user.upsert({
  //   where: { email: 'solar@greengen.com' },
  //   update: {},
  //   create: {
  //     email: 'solar@greengen.com',
  //     name: 'SolarGen Renewables Corp',
  //     phoneNumber: '+919876543210',
  //     passwordHash,
  //     role: 'SUPPLIER',
  //     state: 'Rajasthan',
  //     status: 'VERIFIED',
  //     supplierProfile: {
  //       create: {
          // generationCapacity: 120.0,
  //         injectionPoint: '765kV Bhadla Pooling Station',
  //         renewableType: 'Solar'
  //       }
  //     }
  //   }
  // });

  // 3. Consumer
//   const consumer = await prisma.user.upsert({
//     where: { email: 'tata.steel@tata.com' },
//     update: {},
//     create: {
//       email: 'tata.steel@tata.com',
//       name: 'Tata Steel Limited',
//       phoneNumber: '+919112233445',
//       passwordHash,
//       role: 'CONSUMER',
//       state: 'Odisha',
//       status: 'VERIFIED',
//       consumerProfile: {
//         create: {
       // loadRequirement: 50.0,
//           drawalPoint: '400kV Jajpur Substation',
//           oaStatus: 'ACTIVE'
//         }
//       }
//     }
//   });

//   await prisma.marketPrice.upsert({
//     where: { market: 'DAM' },
//     update: {},
//     create: {
//       market: 'DAM',
//       price: 5.8,
//       change: '+0.3'
//     }
//   });

//   await prisma.marketPrice.upsert({
//     where: { market: 'RTM' },
//     update: {},
//     create: {
//       market: 'RTM',
//       price: 7.4,
//       change: '+0.2'
//     }
//   });

//   await prisma.marketPrice.upsert({
//     where: { market: 'GDAM' },
//     update: {},
//     create: {
//       market: 'GDAM',
//       price: 6.1,
//       change: '+0.1'
//     }
//   });

//   console.log({ admin, supplier, consumer });
//   console.log("Database seeded successfully!");
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
