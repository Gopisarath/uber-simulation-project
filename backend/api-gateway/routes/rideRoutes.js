const express = require("express");
const router = express.Router();
const rideController = require("../controllers/rideController");
const { authMiddleware } = require("../middlewares/auth");

router.post("/", authMiddleware(["customer", "driver", "admin"]), rideController.createRide);
router.get("/statistics", authMiddleware(["admin"]), rideController.getRideStatistics);
router.get("/:id", authMiddleware(["customer", "driver", "admin"]), rideController.getRideById);
router.get("/", authMiddleware(["admin"]), rideController.getAllRides);
router.put("/:id", authMiddleware(["customer", "driver", "admin"]), rideController.updateRide);
router.delete("/:id",  authMiddleware(["customer", "driver", "admin"]), rideController.deleteRide);
router.patch("/:id/status",  authMiddleware(["customer", "driver", "admin"]), rideController.updateRideStatus);
router.get("/customer/:customerId",  authMiddleware(["customer", "admin"]), rideController.getRidesByCustomerId);
router.get("/driver/:driverId", authMiddleware(["driver", "admin"]), rideController.getRidesByDriverId);
router.post("/:id/images", authMiddleware(["customer"]), rideController.uploadRideImages);


module.exports = router;