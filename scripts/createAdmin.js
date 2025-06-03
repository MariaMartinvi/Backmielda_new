#!/usr/bin/env node

/**
 * Script para crear un usuario administrador con acceso ilimitado a la generación de cuentos
 * Usage: node scripts/createAdmin.js <email> <password>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createAdmin() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('❌ Usage: node scripts/createAdmin.js <email> <password>');
      console.log('📧 Example: node scripts/createAdmin.js admin@audiogretel.com mySecurePassword123');
      process.exit(1);
    }

    const [email, password] = args;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      process.exit(1);
    }

    // Validate password strength
    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isAdmin) {
        console.log('👑 User is already an admin:', email);
      } else {
        // Update existing user to admin
        await User.findByIdAndUpdate(existingUser._id, { isAdmin: true });
        console.log('🔄 Updated existing user to admin:', email);
      }
    } else {
      // Create new admin user
      console.log('👤 Creating new admin user...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const adminUser = new User({
        email,
        password: hashedPassword,
        isAdmin: true,
        isVerified: true,
        subscriptionStatus: 'active',
        isPremium: true
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n🎉 Admin user setup complete!');
    console.log('📋 Admin capabilities:');
    console.log('   • ♾️  Unlimited story generation');
    console.log('   • 🎵 Unlimited audio generation');
    console.log('   • 🔓 No monthly limits');
    console.log('   • 👑 Admin privileges');
    
    console.log('\n📧 Admin credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Keep these credentials secure!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createAdmin(); 