import 'dotenv/config';
import { db } from './db';
import { organizations, profiles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function fixUsers() {
  console.log('Fixing users and creating test accounts...');

  try {
    // Get or create default organization
    let org = await db.select().from(organizations).limit(1);
    let orgId: string;

    if (org.length === 0) {
      orgId = 'org_default';
      await db.insert(organizations).values({
        id: orgId,
        name: 'Default Organization',
        isActive: true,
      });
      console.log('Created default organization');
    } else {
      orgId = org[0].id;
      console.log('Using existing organization:', org[0].name);
    }

    // Delete all existing users
    await db.delete(profiles);
    console.log('Deleted existing users');

    // Create Super Admin
    const superAdminId = crypto.randomUUID();
    const superAdminPassword = await hashPassword('admin123');
    await db.insert(profiles).values({
      id: superAdminId,
      username: 'admin',
      passwordHash: superAdminPassword,
      fullName: 'Super Administrator',
      email: 'admin@servicex.com',
      userRole: 'super_admin',
      organizationId: orgId,
    });
    console.log('Created: Super Admin (admin / admin123)');

    // Create Org Admin
    const orgAdminId = crypto.randomUUID();
    const orgAdminPassword = await hashPassword('orgadmin123');
    await db.insert(profiles).values({
      id: orgAdminId,
      username: 'orgadmin',
      passwordHash: orgAdminPassword,
      fullName: 'Organization Admin',
      email: 'orgadmin@servicex.com',
      userRole: 'org_admin',
      organizationId: orgId,
    });
    console.log('Created: Org Admin (orgadmin / orgadmin123)');

    // Create Technician
    const techId = crypto.randomUUID();
    const techPassword = await hashPassword('tech123');
    await db.insert(profiles).values({
      id: techId,
      username: 'tech',
      passwordHash: techPassword,
      fullName: 'Marko Tehničar',
      email: 'tech@servicex.com',
      userRole: 'technician',
      organizationId: orgId,
    });
    console.log('Created: Technician (tech / tech123)');

    console.log('');
    console.log('='.repeat(50));
    console.log('Test users created successfully!');
    console.log('='.repeat(50));
    console.log('');
    console.log('Login credentials:');
    console.log('');
    console.log('  SUPER ADMIN:');
    console.log('    Username: admin');
    console.log('    Password: admin123');
    console.log('');
    console.log('  ORG ADMIN:');
    console.log('    Username: orgadmin');
    console.log('    Password: orgadmin123');
    console.log('');
    console.log('  TECHNICIAN:');
    console.log('    Username: tech');
    console.log('    Password: tech123');
    console.log('');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixUsers();
