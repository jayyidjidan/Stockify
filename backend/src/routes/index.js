const { Router } = require('express');
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const supplierRoutes = require('./suppliers');
const stockInRoutes = require('./stockIn');
const stockOutRoutes = require('./stockOut');
const stockMovementRoutes = require('./stockMovements');
const reportRoutes = require('./reports');
const userRoutes = require('./users');

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/stock-in', stockInRoutes);
router.use('/stock-out', stockOutRoutes);
router.use('/stock-movements', stockMovementRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);

module.exports = router;
