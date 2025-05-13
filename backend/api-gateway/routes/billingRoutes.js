const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");
const { authMiddleware } = require("../middlewares/auth");

router.post('/rides/:rideId', authMiddleware(['customer', 'admin']), billingController.generateBill);
router.get('/', authMiddleware(['admin']), billingController.getAllBills);
router.get('/search', authMiddleware(['admin']), billingController.searchBills);
router.get('/:id', authMiddleware(['admin']), billingController.getBillById);
router.get('/customer/:customerId', authMiddleware(['customer', 'admin']), billingController.getBillsByCustomerId);
router.get('/driver/:driverId', authMiddleware(['driver', 'admin']), billingController.getBillsByDriverId);
router.patch("/:id/status", authMiddleware(['customer', 'admin']),billingController.updateBillStatus);
router.delete("/:id", authMiddleware(['admin']), billingController.deleteBill);

module.exports = router;