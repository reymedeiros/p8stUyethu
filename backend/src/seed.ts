import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import config from './config';

async function seedAdmin() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      email: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      isAdmin: true,
    });

    console.log('✅ Admin user created successfully');
    console.log('   Email: admin');
    console.log('   Password: admin123');
    console.log('   IMPORTANT: Change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedAdmin();
