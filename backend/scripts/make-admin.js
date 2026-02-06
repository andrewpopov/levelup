#!/usr/bin/env node

/**
 * CLI script to promote a user to admin role.
 * Usage: node scripts/make-admin.js user@example.com
 */

import { initializeDatabase } from '../database.js';
import db from '../database.js';
import { UserRepository } from '../repositories/UserRepository.js';

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/make-admin.js <email>');
  process.exit(1);
}

async function makeAdmin() {
  await initializeDatabase();
  const userRepository = new UserRepository(db);

  const user = await userRepository.findByEmail(email);
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const alreadyAdmin = await userRepository.hasRole(user.id, 'admin');
  if (alreadyAdmin) {
    console.log(`${email} is already an admin.`);
    process.exit(0);
  }

  await userRepository.addRole(user.id, 'admin');
  console.log(`Successfully promoted ${email} (id: ${user.id}) to admin.`);
  process.exit(0);
}

makeAdmin().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
