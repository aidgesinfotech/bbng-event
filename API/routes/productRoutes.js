const express = require('express');
const router = express.Router();
const ProductsController = require('../controllers/productController');

router.post('/createProduct', ProductsController.createProduct);
router.get('/getAllProducts', ProductsController.getAllProducts);
router.put('/updateProduct/:id', ProductsController.updateProduct);
router.delete('/deleteProduct/:id', ProductsController.deleteProduct);

module.exports = router;