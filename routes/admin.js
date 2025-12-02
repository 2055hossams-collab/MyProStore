const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const Product = mongoose.model('Product'); 

// 🚨 Middleware للتحقق من أن المستخدم مسؤول (Admin) ومسجل الدخول
const isAdmin = (req, res, next) => {
    // يجب أن يكون المستخدم مسجلاً الدخول (userId موجود) و role هو 'admin'
    if (!req.session.userId || !req.session.isAdmin) {
        // توجيه لصفحة 404 أو صفحة تسجيل الدخول مع رسالة خطأ
        req.session.errorMessage = 'يجب تسجيل الدخول بحساب مسؤول للوصول لهذه الصفحة.';
        return res.redirect('/login');
    }
    next();
};

// 1. عرض صفحة إضافة منتج جديد
// المسار: GET /admin/add-product
router.get('/add-product', isAdmin, (req, res) => {
    res.render('admin/add-product', {
        title: 'إضافة منتج',
        pageName: 'add-product',
        editMode: false,
        product: {}
    });
});

// 2. معالجة إضافة منتج جديد
// المسار: POST /admin/add-product
router.post('/add-product', isAdmin, async (req, res) => {
    const { title, price, description, imageUrl } = req.body;

    try {
        const product = new Product({
            title: title,
            price: price,
            description: description,
            imageUrl: imageUrl,
            userId: req.session.userId // ربط المنتج بالمسؤول الذي أنشأه
        });

        await product.save();
        res.redirect('/admin/products'); 

    } catch (error) {
        console.error('Error creating product:', error);
        req.session.errorMessage = 'فشل في حفظ المنتج. يرجى التحقق من البيانات.';
        res.redirect('/admin/add-product');
    }
});

// 3. عرض قائمة المنتجات
// المسار: GET /admin/products
router.get('/products', isAdmin, async (req, res) => {
    try {
        const products = await Product.find({ userId: req.session.userId });

        res.render('admin/product-list', {
            title: 'قائمة المنتجات',
            pageName: 'admin-products',
            products: products
        });
    } catch (error) {
        console.error('Error fetching admin products:', error);
        res.redirect('/');
    }
});

// 4. حذف منتج
// المسار: POST /admin/delete-product
router.post('/delete-product', isAdmin, async (req, res) => {
    const prodId = req.body.productId;
    try {
        // حذف المنتج مع التأكد من أنه يخص المستخدم الحالي (أمان)
        await Product.deleteOne({ _id: prodId, userId: req.session.userId });
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error deleting product:', error);
        res.redirect('/admin/products');
    }
});


module.exports = router;
