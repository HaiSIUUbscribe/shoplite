const db = require('../db');

exports.createOrder = async (req, res) => {
  try {
    //console.log("Received order request:", req.body);
    //console.log("Auth user:", req.user);

    const { items, total } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: missing user" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid order items" });
    }

    const [result] = await db.query(
      "INSERT INTO orders (user_id, items, total, status) VALUES (?, ?, ?, ?)",
      [userId, JSON.stringify(items), total || 0, "pending"]
    );

    res.json({ message: "Order created", orderId: result.insertId });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Error creating order", error: err.message });
  }
};


// Xem tất cả đơn hàng của user
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    for (const order of orders) {
      if (typeof order.items === 'string') order.items = JSON.parse(order.items);
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
};

// Admin xem tất cả đơn hàng
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching all orders', error: err.message });
  }
};

// Admin cập nhật trạng thái đơn hàng
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating status', error: err.message });
  }
};


