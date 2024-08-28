const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.use(express.static('public'));

// Route to initiate payment
router.post('/checkout/:id', paymentController.createCheckoutSession);
router.get('/success', (req,res)=>{res.render("success")});
router.get('/cancel', (req,res)=>{res.render("cancel")});

module.exports = router;