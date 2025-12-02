const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const Product = mongoose.model('Product'); 
const Favorite = mongoose.model('Favorite'); 
const Cart = mongoose.model('Cart');

// Middleware للتحقق من تسجيل الدخول
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        req.session.errorMessage = 'يرجى تسجيل الدخول أولاً.';
        return res.redirect('/login');
    }
    next();
};

// ====================================
// مسارات العرض (لا تغييرات)
// ====================================

// 1. صفحة المنتجات العامة (الصفحة الرئيسية)
router.get('/home', async (req, res) => {
    try {
        const products = await Product.aggregate([{ $sample: { size: 8 } }]);
        
        res.render('home', {
            title: 'الرئيسية',
            pageName: 'home',
            products: products
        });
    } catch (error) {
        console.error('Error fetching products for home:', error);
        res.render('home', {
            title: 'الرئيسية',
            pageName: 'home',
            products: []
        });
    }
});

// 2. عرض قائمة المنتجات بالكامل
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        
        res.render('shop/product-list', {
            title: 'جميع المنتجات',
            pageName: 'product-list',
            products: products
        });
    } catch (error) {
        console.error('Error fetching product list:', error);
        res.redirect('/');
    }
});

// 3. عرض صفحة عربة التسوق (Cart)
router.get('/cart', isAuthenticated, async (req, res) => {
    try {
        const userCart = await Cart.findOne({ userId: req.session.userId })
            .populate('products.productId');
        
        const cartItems = userCart ? userCart.products : [];
        
        let total = 0;
        if (cartItems.length > 0) {
            total = cartItems.reduce((acc, item) => {
                if (item.productId && item.productId.price) {
                    return acc + (item.productId.price * item.quantity);
                }
                return acc;
            }, 0);
        }

        res.render('shop/cart', {
            title: 'عربة التسوق',
            pageName: 'cart',
            cartItems: cartItems,
            totalPrice: total.toFixed(2)
        });

    } catch (error) {
        console.error('Error fetching cart:', error);
        req.session.errorMessage = 'حدث خطأ أثناء جلب محتويات العربة.';
        res.redirect('/products');
    }
});


// ====================================
// مسارات إجراءات العربة (Cart Actions)
// ====================================

// 4. معالجة إضافة منتج للعربة (بزيادة 1)
router.post('/add-to-cart', isAuthenticated, async (req, res) => {
    const productId = req.body.productId;
    const userId = req.session.userId;

    try {
        let userCart = await Cart.findOne({ userId: userId });

        if (!userCart) {
            userCart = new Cart({ userId: userId, products: [] });
        }

        const productIndex = userCart.products.findIndex(
            p => p.productId.toString() === productId
        );

        if (productIndex >= 0) {
            // المنتج موجود، زيادة الكمية
            userCart.products[productIndex].quantity += 1;
        } else {
            // المنتج غير موجود، إضافته بكمية 1
            userCart.products.push({ productId: productId, quantity: 1 });
        }

        await userCart.save();
        res.redirect('/cart'); 

    } catch (error) {
        console.error('Error adding to cart:', error);
        req.session.errorMessage = 'فشل إضافة المنتج إلى العربة.';
        res.redirect('/products');
    }
});


// 5. 🚨 المسار الجديد: تحديث كمية المنتج في العربة (زيادة/إنقاص/إزالة)
router.post('/cart/update-quantity', isAuthenticated, async (req, res) => {
    const { productId, action } = req.body;
    const userId = req.session.userId;

    try {
        const userCart = await Cart.findOne({ userId: userId });
        if (!userCart) {
            req.session.errorMessage = 'عربة التسوق غير موجودة.';
            return res.redirect('/cart');
        }

        const productIndex = userCart.products.findIndex(
            p => p.productId.toString() === productId
        );

        if (productIndex < 0) {
            req.session.errorMessage = 'المنتج غير موجود في العربة.';
            return res.redirect('/cart');
        }

        let currentQuantity = userCart.products[productIndex].quantity;

        if (action === 'increase') {
            userCart.products[productIndex].quantity += 1;
        } else if (action === 'decrease') {
            if (currentQuantity > 1) {
                userCart.products[productIndex].quantity -= 1;
            } else {
                // إذا كانت الكمية 1 ونريد إنقاصها، نقوم بإزالة المنتج
                userCart.products.splice(productIndex, 1);
            }
        } else if (action === 'remove') {
            // إزالة المنتج بالكامل بغض النظر عن الكمية
            userCart.products.splice(productIndex, 1);
        }

        await userCart.save();
        res.redirect('/cart');

    } catch (error) {
        console.error('Error updating cart quantity:', error);
        req.session.errorMessage = 'فشل في تحديث كمية المنتج.';
        res.redirect('/cart');
    }
});


// 6. إضافة منتج للمفضلة (لا تغييرات)
router.post('/add-to-favorites', isAuthenticated, async (req, res) => {
    const productId = req.body.productId;
    
    try {
        let favorites = await Favorite.findOne({ userId: req.session.userId });

        if (!favorites) {
            favorites = new Favorite({ userId: req.session.userId, products: [] });
        }

        const productExists = favorites.products.some(p => p.productId.toString() === productId);
        
        if (!productExists) {
            favorites.products.push({ productId: productId });
            await favorites.save();
        }

        res.redirect('/products');

    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.redirect('/products');
    }
});

module.exports = router;
