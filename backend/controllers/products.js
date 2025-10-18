const db = require("../db");

//Lấy danh sách sản phẩm
exports.getProducts = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", err);
    res.status(500).json({ message: "Không thể tải danh sách sản phẩm." });
  }
};

//Lấy chi tiết 1 sản phẩm
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    res.json(rows[0]);
  } catch (err) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", err);
    res.status(500).json({ message: "Không thể tải chi tiết sản phẩm." });
  }
};

//Thêm sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, thumbnail } = req.body;

    if (!title || !price)
      return res.status(400).json({ message: "Tên và giá sản phẩm là bắt buộc." });

    const [result] = await db.query(
      "INSERT INTO products (title, description, price, category, thumbnail) VALUES (?, ?, ?, ?, ?)",
      [title, description || "", price, category || "", thumbnail || ""]
    );

    res.json({
      message: "Thêm sản phẩm thành công!",
      productId: result.insertId,
    });
  } catch (err) {
    console.error("Lỗi khi thêm sản phẩm:", err);
    res.status(500).json({ message: "Không thể thêm sản phẩm mới." });
  }
};

//Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, thumbnail } = req.body;

    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Sản phẩm không tồn tại." });

    await db.query(
      "UPDATE products SET title=?, description=?, price=?, category=?, thumbnail=? WHERE id=?",
      [title, description, price, category, thumbnail, id]
    );

    res.json({ message: "Cập nhật sản phẩm thành công!" });
  } catch (err) {
    console.error("Lỗi khi cập nhật sản phẩm:", err);
    res.status(500).json({ message: "Không thể cập nhật sản phẩm." });
  }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Sản phẩm không tồn tại." });

    await db.query("DELETE FROM products WHERE id = ?", [id]);
    res.json({ message: "Xóa sản phẩm thành công!" });
  } catch (err) {
    console.error("Lỗi khi xóa sản phẩm:", err);
    res.status(500).json({ message: "Không thể xóa sản phẩm." });
  }
};
