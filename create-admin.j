// ==========================================================
// create-admin.js
// سكريبت يتم تشغيله لمرة واحدة لإضافة مستخدم مشرف مشفر
// ==========================================================

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 🚨 البيانات التي سيتم إدراجها للمشرف
const ADMIN_EMAIL = 'admin@prostore.com';
const ADMIN_PASSWORD_RAW = 'StrongAdminPass123'; // ⚠️ كلمة السر قبل التشفير
const ADMIN_USERNAME = 'SuperAdmin';
const MONGODB_URI = 'mongodb://127.0.0.1:27017/my_pro_store';

// تحميل نموذج المستخدم
require('./models/user');
const User = mongoose.model('User');

async function createAdminUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB.');

        // 1. التحقق من وجود المشرف بالفعل
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log(`⚠️ Admin user with email ${ADMIN_EMAIL} already exists. Skipping creation.`);
            return;
        }

        // 2. تشفير كلمة المرور
        console.log('Encrypting password...');
        // استخدام Salt Rounds بقيمة 12 للتشفير الآمن
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD_RAW, 12); 
        console.log('Password encrypted successfully.');

        // 3. إنشاء وحفظ مستند المشرف
        const adminUser = new User({
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            password: hashedPassword, // حفظ كلمة المرور المشفرة
            role: 'admin' // 🚨 الدور الحاسم
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
