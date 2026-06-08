import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding admin user...");
  
  // Hash password for admin
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("admin123", salt);

  // Create Admin User only
  const admin = await prisma.user.upsert({
    where: { email: 'admin@goar.gov.in' },
    update: {},
    create: {
      id: `admin-${Date.now()}`,
      email: 'admin@goar.gov.in',
      name: 'NLDC System Operator',
      phoneNumber: '+911234567890',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    }
  });
  
  console.log("✅ Admin user created:", admin.email);
  console.log("   Email: admin@goar.gov.in");
  console.log("   Password: admin123");
  
  console.log("\n🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });