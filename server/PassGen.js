// server/PassGen.js
const bcrypt = require('bcryptjs');

// This script generates a bcrypt hash for a password.
// It uses the same hashing mechanism as the main application.
//
// Usage:
// 1. To hash the default password "password123":
//    node server/PassGen.js
//
// 2. To hash a custom password:
//    node server/PassGen.js your_secure_password_here

// Get password from command line arguments, or default to 'password123'.
const plainPassword = process.argv[2] || 'password123';

const generateHash = async () => {
  try {
    // Generate a salt with 10 rounds, just like in the main app.
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt.
    const hash = await bcrypt.hash(plainPassword, salt);
    
    console.log('--- SahabatBK Password Hash Generator ---');
    console.log(`\nUsage: node server/PassGen.js [your_password_here]`);
    console.log(`(If no password is provided, it defaults to "password123")`);
    console.log(`\nPassword being hashed: "${plainPassword}"`);
    console.log(`\n✅ Generated Bcrypt Hash:`);
    console.log(hash);
    console.log('\nCopy this hash and paste it into the `password_hash` column in your `users` database table.');

  } catch (error) {
    console.error('❌ Error generating password hash:', error);
  }
};

// Run the function.
generateHash();
