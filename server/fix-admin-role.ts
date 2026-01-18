import 'dotenv/config';
import { db } from './db';
import { profiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function fixAdminRole() {
  console.log('Fixing admin user role...');

  try {
    // First, check current admin user
    const adminUser = await db.select().from(profiles).where(eq(profiles.username, 'admin'));

    if (adminUser.length === 0) {
      console.log('Admin user not found!');
      process.exit(1);
    }

    console.log('Current admin user:', {
      username: adminUser[0].username,
      fullName: adminUser[0].fullName,
      userRole: adminUser[0].userRole
    });

    // Update to super_admin
    await db.update(profiles)
      .set({ userRole: 'super_admin' })
      .where(eq(profiles.username, 'admin'));

    // Verify the update
    const updatedUser = await db.select().from(profiles).where(eq(profiles.username, 'admin'));

    console.log('');
    console.log('Updated admin user:', {
      username: updatedUser[0].username,
      fullName: updatedUser[0].fullName,
      userRole: updatedUser[0].userRole
    });

    console.log('');
    console.log('SUCCESS! Admin user role updated to super_admin');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixAdminRole();
