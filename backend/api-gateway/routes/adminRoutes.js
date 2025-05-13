const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authMiddleware } = require("../middlewares/auth");

router.post("/signup", adminController.signup);
router.post("/login", adminController.login);
router.post("/logout", adminController.logout);

router.post('/drivers', authMiddleware(["admin"]), adminController.addDriver);
router.post('/customers', authMiddleware(["admin"]), adminController.addCustomer);

router.get('/drivers/:driverId', authMiddleware(["admin"]), adminController.reviewDriver);
router.get('/customers/:customerId', authMiddleware(["admin"]), adminController.reviewCustomer);

router.get('/statistics/revenue', authMiddleware(["admin"]), adminController.getRevenueStatistics);
router.get('/statistics/rides', authMiddleware(["admin"]), adminController.getRideStatistics);

router.get('/bills/search', authMiddleware(["admin"]), adminController.searchBills);
router.get('/bills/:billId', authMiddleware(["admin"]), adminController.getBillDetails);

module.exports = router;