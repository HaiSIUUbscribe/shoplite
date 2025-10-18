const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/*Đăng ký tài khoản mới*/
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });

    // Kiểm tra trùng email
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: 'Email đã được đăng ký.' });

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thêm vào DB
    await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
      name,
      email,
      hashedPassword,
      'client',
    ]);

    res.json({ message: 'Đăng ký thành công!' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

/*Đăng nhập*/
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0)
      return res.status(400).json({ message: 'Tài khoản không tồn tại.' });

    const user = users[0];
    let isMatch = false;

    // Nếu password được mã hóa bằng bcrypt
    if (user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    if (!isMatch)
      return res.status(400).json({ message: 'Sai mật khẩu.' });

    // Tạo token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0)
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    res.json({ user: users[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.user.id;

    let query = "UPDATE users SET name=?, email=?";
    const params = [name, email];

    if (password) {
      const bcrypt = require("bcryptjs");
      const hashed = await bcrypt.hash(password, 10);
      query += ", password=?";
      params.push(hashed);
    }

    query += " WHERE id=?";
    params.push(userId);

    await db.query(query, params);
    res.json({ message: "Cập nhật thông tin thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi cập nhật tài khoản." });
  }
};