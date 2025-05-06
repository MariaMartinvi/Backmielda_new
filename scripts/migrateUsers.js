const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({ name: { $exists: false } });
    console.log(`Found ${users.length} users to update`);

    for (const user of users) {
      // Extraer el nombre del email (parte antes del @)
      const name = user.email.split('@')[0];
      user.name = name;
      await user.save();
      console.log(`Updated user ${user.email} with name ${name}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateUsers(); 