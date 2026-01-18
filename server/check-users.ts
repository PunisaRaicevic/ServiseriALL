import 'dotenv/config';
import { db } from './db';
import { profiles } from '@shared/schema';

async function checkUsers() {
  console.log('Checking all users in database...\n');

  try {
    const allUsers = await db.select().from(profiles);

    console.log(`Found ${allUsers.length} user(s):\n`);

    allUsers.forEach((user, index) => {
      console.log(`--- User ${index + 1} ---`);
      console.log(`ID: ${user.id}`);
      console.log(`Username: "${user.username}"`);
      console.log(`Full Name: ${user.fullName}`);
      console.log(`Email: ${user.email}`);
      console.log(`User Role: "${user.userRole}" (type: ${typeof user.userRole})`);
      console.log(`Organization ID: ${user.organizationId}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkUsers();
