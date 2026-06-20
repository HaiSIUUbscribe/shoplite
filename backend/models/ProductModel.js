const db = require('../db');

const SORT_OPTIONS = {
  newest: 'id DESC',
  'price-asc': 'price ASC',
  'price-desc': 'price DESC',
  name: 'title ASC',
};

const PRODUCT_COLUMNS = 'id, title, description, price, category, sizes, colors, thumbnail, stock, created_at';

exports.findAll = async ({ search = '', category = '', sort = 'newest', min_price: minPrice, max_price: maxPrice } = {}) => {
  const where = [];
  const params = [];
  if (search) {
    where.push('title LIKE ?');
    params.push(`%${search}%`);
  }
  if (category) {
    where.push('category = ?');
    params.push(category);
  }
  if (minPrice !== undefined && minPrice !== '') {
    where.push('price >= ?');
    params.push(Number(minPrice));
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    where.push('price <= ?');
    params.push(Number(maxPrice));
  }
  const orderBy = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;
  const query = `SELECT ${PRODUCT_COLUMNS} FROM products ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${orderBy}`;
  const [rows] = await db.query(query, params);
  return rows;
};

exports.findCategories = async () => {
  const [rows] = await db.query(
    "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category"
  );
  return rows.map((row) => row.category);
};

exports.findById = async (id) => {
  const [rows] = await db.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

exports.create = async ({ title, description, price, category, sizes, colors, thumbnail, stock }) => {
  const [result] = await db.query(
    'INSERT INTO products (title, description, price, category, sizes, colors, thumbnail, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description, price, category, JSON.stringify(sizes || []), JSON.stringify(colors || []), thumbnail, stock]
  );
  return result.insertId;
};

exports.update = async (id, { title, description, price, category, sizes, colors, thumbnail, stock }) => {
  const [result] = await db.query(
    'UPDATE products SET title = ?, description = ?, price = ?, category = ?, sizes = ?, colors = ?, thumbnail = ?, stock = ? WHERE id = ?',
    [title, description, price, category, JSON.stringify(sizes || []), JSON.stringify(colors || []), thumbnail, stock, id]
  );
  return result.affectedRows;
};

exports.deleteById = async (id) => {
  const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows;
};

exports.findByIdsForUpdate = async (connection, ids) => {
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await connection.query(
    `SELECT id, title, price, sizes, colors, thumbnail, stock FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
    ids
  );
  return rows;
};

exports.decrementStock = (connection, id, quantity) => (
  connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, id])
);

exports.incrementStock = (connection, id, quantity) => (
  connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, id])
);

exports.insertMany = async (connection, products) => {
  for (let index = 0; index < products.length; index += 200) {
    const batch = products.slice(index, index + 200);
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = batch.flatMap((product) => [
      product.title, product.description, product.price, product.category,
      JSON.stringify(product.sizes || []), JSON.stringify(product.colors || []), product.thumbnail, product.stock,
    ]);
    await connection.query(
      `INSERT INTO products (title, description, price, category, sizes, colors, thumbnail, stock) VALUES ${placeholders}`,
      values
    );
  }
};

exports.getStats = async () => {
  const [[row]] = await db.query(
    'SELECT COUNT(*) AS totalProducts, COALESCE(SUM(stock), 0) AS totalStock FROM products'
  );
  return row;
};
