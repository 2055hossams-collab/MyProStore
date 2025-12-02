const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const router = express.Router();
const User = mongoose.model('User'); 

// Middleware لمعالجة تمرير رسالة الخطأ قبل العرض
const handleErrorMessage = (req, res, next) => {
    res.locals.errorMessage = req.session.errorMessage || null;
    delete req.session.errorMessage;
    next();
};

// 1. عرض صفحة تسجيل الدخول
router.get('/login', handleErrorMessage, (req, res) => {
    res.render('login', {
        title: 'تسجيل الدخول',
        pageName: 'login'
    });
});

// 2. معالجة بيانات تسجيل الدخول
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email });

        if (!user) {
            req.session.errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            req.session.errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
            return res.redirect('/login');
        }

        // تسجيل الدخول بنجاح
        req.session.userId = user._id;
        req.session.isAdmin = user.role === 'admin';
        
        res.redirect('/home'); 

    } catch (error) {
        console.error('Login error:', error);
        req.session.errorMessage = 'حدث خطأ في الخادم.';
        res.redirect('/login');
    }
});

// 3. عرض صفحة التسجيل
router.get('/signup', handleErrorMessage, (req, res) => {
    res.render('signup', {
        title: 'تسجيل حساب جديد',
        pageName: 'signup'
    });
});

// 4. معالجة بيانات التسجيل
router.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        req.session.errorMessage = 'كلمة المرور وتأكيدها غير متطابقين.';
        return res.redirect('/signup');
    }

    try {
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            req.session.errorMessage = 'هذا البريد الإلكتروني مسجل بالفعل.';
            return res.redirect('/signup');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: 'user' 
        });

        await newUser.save();
        req.session.errorMessage = 'تم التسجيل بنجاح. يرجى تسجيل الدخول.';
        res.redirect('/login'); 

    } catch (error) {
        console.error('Signup error:', error);
        req.session.errorMessage = 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.';
        res.redirect('/signup');
    }
});

// 5. معالجة الخروج (Logout)
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;
