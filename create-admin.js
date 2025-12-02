// ==========================================================
// create-admin.js - تم التبديل إلى bcryptjs
// ==========================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // 🚨 تم التغيير هنا

const ADMIN_EMAIL = 'admin@prostore.com';
const ADMIN_PASSWORD_RAW = 'StrongAdminPass123';
const ADMIN_USERNAME = 'SuperAdmin';
const MONGODB_URI = 'mongodb+srv://hossams777910778_db_user:5aw3IhNH7cldnMf2@cluster0.kfz30vh.mongodb.net/?appName=Cluster0.mongodb.net/MyProStoreDB?retryWrites=true&w=majority';

require('./models/user'); 
const User = mongoose.model('User');

async function createAdminUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB.');

        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log(`⚠️ Admin user with email ${ADMIN_EMAIL} already exists. Skipping creation.`);
            return;
        }

        console.log('Encrypting password...');
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD_RAW, 12); 
        console.log('Password encrypted successfully.');

        const adminUser = new User({
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            password: hashedPassword, 
            role: 'admin' 
        });

        await adminUser.save();
        
        console.log('\n----------------------------------------------------');
        console.log('🎉 Admin User Created Successfully!');
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password (Raw): ${ADMIN_PASSWORD_RAW}`);
        console.log('----------------------------------------------------');

    } catch (error) {
        console.error('❌ Failed to create Admin user:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

createAdminUser();
