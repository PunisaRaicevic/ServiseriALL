import 'dotenv/config';
import { db } from './db';
import { profiles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Check if it's a hashed password (contains salt separator)
  if (storedHash.includes(':')) {
    const [salt, hash] = storedHash.split(':');
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex') === hash);
      });
    });
  }
  // Legacy: plain text comparison
  return password === storedHash;
}

async function testLogin() {
  const username = 'admin';
  const password = 'admin123';

  console.log(`Testing login for: ${username} / ${password}\n`);

  try {
    const user = await db.select().from(profiles).where(eq(profiles.username, username));

    if (user.length === 0) {
      console.log('USER NOT FOUND!');
      process.exit(1);
    }

    console.log('Found user:');
    console.log(`  Username: ${user[0].username}`);
    console.log(`  Full Name: ${user[0].fullName}`);
    console.log(`  User Role: ${user[0].userRole}`);
    console.log(`  Password Hash: ${user[0].passwordHash.substring(0, 50)}...`);
    console.log('');

    const isValidPassword = await verifyPassword(password, user[0].passwordHash);

    if (isValidPassword) {
      console.log('✅ PASSWORD IS CORRECT!');
      console.log(`\nThis user should log in as: ${user[0].userRole}`);
    } else {
      console.log('❌ PASSWORD IS INCORRECT!');
      console.log('\nThe admin/admin123 credentials are NOT matching this user.');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

testLogin();
