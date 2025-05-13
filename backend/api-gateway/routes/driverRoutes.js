const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driverController");
const { authMiddleware } = require("../middlewares/auth");

router.post("/signup", driverController.signup);
router.post("/login", driverController.login);
router.post("/logout", driverController.logout);

router.get("/", authMiddleware(["admin"]), driverController.getAllDrivers);
router.get("/search", authMiddleware(["customer", "admin"]), driverController.searchDrivers);
router.get("/:id", authMiddleware(["customer", "driver", "admin"]), driverController.getDriverById);
router.put("/:id", authMiddleware(["driver", "admin"]), driverController.updateDriver);
router.delete("/:id", authMiddleware(["driver", "admin"]), driverController.deleteDriver);

router.post("/:id/video", authMiddleware(["driver"]), driverController.addDriverVideo);
router.get("/:id/video", authMiddleware(["customer", "driver", "admin"]), driverController.getDriverVideos);


module.exports = router;