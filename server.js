const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 🚨🚨🚨 يجب استبدال هذا الرابط برابط MongoDB Atlas الخاص بك 🚨🚨🚨
const MONGODB_URI = 'mongodb+srv://hossams777910778_db_user:5aw3IhNH7cldnMf2@cluster0.kfz30vh.mongodb.net/?appName=Cluster0.mongodb.net/MyProStoreDB?retryWrites=true&w=majority'; 

// الاتصال بـ MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ تم الاتصال بقاعدة بيانات MongoDB Atlas بنجاح!'))
    .catch(err => console.error('❌ خطأ في الاتصال بـ MongoDB:', err));

// تحميل الموديلات
require('./models/user'); 
require('./models/product'); 
require('./models/favorite'); 
// 🚨 إضافة موديل العربة
require('./models/cart'); 
const Cart = mongoose.model('Cart'); // جلب موديل العربة

// إعداد المحرك (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// إعداد Session
app.use(session({
    secret: 'mysecretkeyforprostore',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hour
}));

// معالجة البيانات المرسلة
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ملفات ثابتة (CSS, JS, صور)
app.use(express.static(path.join(__dirname, 'public')));

// Global EJS Variables Middleware
app.use(async (req, res, next) => {
    // حالة تسجيل الدخول
    res.locals.isLoggedIn = req.session.userId ? true : false;
    // حالة المسؤول
    res.locals.isAdmin = req.session.isAdmin ? true : false;
    
    // 🚨 تحديث: حساب عدد عناصر العربة بشكل ديناميكي
    res.locals.cartCount = 0; 
    if (req.session.userId) {
        try {
            const userCart = await Cart.findOne({ userId: req.session.userId });
            if (userCart) {
                // عدد المنتجات هو مجموع كميات المنتجات المختلفة في العربة
                res.locals.cartCount = userCart.products.reduce((acc, product) => acc + product.quantity, 0);
            }
        } catch (err) {
            console.error('Error fetching cart count:', err);
        }
    }
    
    // تمرير رسائل الفلاش
    res.locals.errorMessage = req.session.errorMessage;
    delete req.session.errorMessage;

    next();
});


// تحميل مسارات التطبيق 
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin'); 
const shopRoutes = require('./routes/shop');

// استخدام المسارات
app.use(authRoutes); 
app.use('/admin', adminRoutes); 
app.use(shopRoutes); 

// مسار الصفحة الرئيسية الافتراضي
app.get('/', (req, res) => {
    res.redirect('/home');
});

// مسار 404
app.use((req, res, next) => {
    res.status(404).render('404', { title: '404 - الصفحة غير موجودة', pageName: '404' });
});


// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});
