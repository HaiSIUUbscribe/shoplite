const express = require("express");
const router = express.Router();
const { authenticate, isAdmin } = require("../middlewares/auth");
const { getDashboardStats ,getAllUsers, updateUser, deleteUser} = require("../controllers/admin");

// Route thống kê dashboard
router.get("/dashboard", authenticate, isAdmin, getDashboardStats);
router.get("/users", authenticate, isAdmin, getAllUsers);
router.put("/users/:id", authenticate, isAdmin, updateUser);
router.delete("/users/:id", authenticate, isAdmin, deleteUser);

module.exports = router;
