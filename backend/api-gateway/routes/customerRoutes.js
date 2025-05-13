const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const { authMiddleware } = require("../middlewares/auth");

router.post("/signup", customerController.signup);
router.post("/login", customerController.login);
router.post("/logout", customerController.logout);

//Protected routes
router.get("/", authMiddleware(["admin"]), customerController.getAllCustomers);
router.delete("/:id", authMiddleware(["customer", "admin"]), customerController.deleteCustomer);
router.get("/nearby-drivers", authMiddleware(['customer']), customerController.getNearbyDrivers);
router.get("/:id", authMiddleware(["customer", "driver", "admin"]), customerController.getCustomerById);

module.exports = router;