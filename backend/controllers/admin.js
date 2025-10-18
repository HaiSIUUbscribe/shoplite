const db = require("../db");

exports.getDashboardStats = async (req, res) => {
  try {
    //Thống kê tổng
    const [[{ totalProducts = 0 } = {}]] = await db.query(
      "SELECT COUNT(*) AS totalProducts FROM products"
    );

    const [[{ totalOrders = 0 } = {}]] = await db.query(
      "SELECT COUNT(*) AS totalOrders FROM orders"
    );

    const [[{ totalRevenue = 0 } = {}]] = await db.query(
      "SELECT SUM(total) AS totalRevenue FROM orders WHERE status != 'cancelled'"
    );

    // Thống kê theo tháng 
    const [monthlyStats] = await db.query(`
      SELECT 
        MONTH(created_at) AS month,
        SUM(total) AS revenue,
        COUNT(id) AS orders
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY MONTH(created_at)
      ORDER BY MONTH(created_at)
    `);

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      monthlyStats,
    });
  } catch (err) {
    console.error("Lỗi khi lấy thống kê Dashboard:", err);
    res
      .status(500)
      .json({ message: "Error fetching dashboard stats", error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(users);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách người dùng:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

//Cập nhật người dùng
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    await db.query(
      "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
      [name, email, role, id]
    );

    res.json({ message: "Cập nhật người dùng thành công" });
  } catch (err) {
    console.error("Lỗi khi cập nhật người dùng:", err);
    res.status(500).json({ message: "Error updating user" });
  }
};

//Xóa người dùng
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa người dùng:", err);
    res.status(500).json({ message: "Error deleting user" });
  }
};