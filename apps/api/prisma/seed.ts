// Admin Seeder - Creates default admin user
// Run with: pnpm db:seed

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_ADMIN = {
  email: process.env.ADMIN_EMAIL || 'admin@reservio.com',
  password: process.env.ADMIN_PASSWORD || 'Admin123!',
  fullname: process.env.ADMIN_FULLNAME || 'Admin User',
};

async function main() {
  console.log('🌱 Starting database seeding...\n');

  const existingAdmin = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN.email },
  });

  if (existingAdmin) {
    console.log(`⚠️  Admin user already exists: ${DEFAULT_ADMIN.email}`);
    console.log('   Skipping admin creation.\n');
    return;
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);

  const admin = await prisma.user.create({
    data: {
      email: DEFAULT_ADMIN.email,
      password: hashedPassword,
      fullname: DEFAULT_ADMIN.fullname,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Name: ${admin.fullname}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   ID: ${admin.id}\n`);

  console.log('📝 Default login credentials:');
  console.log(`   Email: ${DEFAULT_ADMIN.email}`);
  console.log(`   Password: ${DEFAULT_ADMIN.password}`);
  console.log('\n⚠️  Please change the password after first login!\n');
}

main()
  .then(async () => {
    console.log('🌱 Seeding completed!');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('❌ Seeding failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
