const ExcelJS = require('exceljs');
const db = require('../db');
const ProductModel = require('../models/ProductModel');

function cellValueToString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value).trim();
  if (value.text) return String(value.text).trim();
  if (value.result !== undefined) return String(value.result).trim();
  if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('').trim();
  return String(value).trim();
}

function normalizeHeader(value) {
  return cellValueToString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseExcelNumber(value) {
  if (typeof value === 'number') return value;
  let text = cellValueToString(value).replace(/\s|₫|vnd/gi, '');
  if (!text) return Number.NaN;
  if (/^-?\d{1,3}([.,]\d{3})+$/.test(text)) text = text.replace(/[.,]/g, '');
  else text = text.replace(',', '.');
  return Number(text);
}

const HEADER_ALIASES = {
  title: ['title', 'ten san pham', 'ten'],
  description: ['description', 'mo ta'],
  price: ['price', 'gia', 'gia ban'],
  category: ['category', 'danh muc'],
  thumbnail: ['thumbnail', 'hinh anh', 'anh', 'image', 'url hinh anh'],
  stock: ['stock', 'ton kho', 'so luong'],
  sizes: ['sizes', 'size', 'kich thuoc'],
  colors: ['colors', 'color', 'mau sac', 'mau'],
};

function getImportColumns(worksheet) {
  const columns = {};
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    const header = normalizeHeader(cell.value);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(header)) columns[field] = columnNumber;
    }
  });
  return columns;
}

exports.generateTemplateBuffer = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('San pham');
  worksheet.columns = [
    { header: 'Tên sản phẩm', key: 'title', width: 30 },
    { header: 'Mô tả', key: 'description', width: 42 },
    { header: 'Giá bán', key: 'price', width: 16 },
    { header: 'Danh mục', key: 'category', width: 20 },
    { header: 'URL hình ảnh', key: 'thumbnail', width: 45 },
    { header: 'Tồn kho', key: 'stock', width: 14 },
    { header: 'Size (phân cách bằng dấu phẩy)', key: 'sizes', width: 28 },
    { header: 'Màu (phân cách bằng dấu phẩy)', key: 'colors', width: 32 },
  ];
  worksheet.addRow({
    title: 'Áo phông cotton',
    description: 'Chất liệu cotton thoáng mát',
    price: 150000,
    category: 'Thời trang',
    thumbnail: 'https://example.com/ao-phong.jpg',
    stock: 50,
    sizes: 'S, M, L, XL',
    colors: 'Đen, Trắng, Xám',
  });
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF105E4A' } };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = { from: 'A1', to: 'H1' };

  return workbook.xlsx.writeBuffer();
};

exports.importProductsFromBuffer = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch (error) {
    throw { status: 400, message: 'File Excel không hợp lệ hoặc đã bị hỏng.' };
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw { status: 400, message: 'File Excel không có sheet dữ liệu.' };
  if (worksheet.rowCount > 1001) throw { status: 400, message: 'Mỗi lần chỉ được nhập tối đa 1.000 sản phẩm.' };

  const columns = getImportColumns(worksheet);
  const missingHeaders = ['title', 'price', 'stock'].filter((field) => !columns[field]);
  if (missingHeaders.length) {
    throw { status: 422, message: 'File thiếu cột bắt buộc: Tên sản phẩm, Giá bán hoặc Tồn kho.' };
  }

  const products = [];
  const errors = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const title = cellValueToString(row.getCell(columns.title).value);
    const description = columns.description ? cellValueToString(row.getCell(columns.description).value) : '';
    const price = parseExcelNumber(row.getCell(columns.price).value);
    const category = columns.category ? cellValueToString(row.getCell(columns.category).value) : '';
    const thumbnail = columns.thumbnail ? cellValueToString(row.getCell(columns.thumbnail).value) : '';
    const stock = parseExcelNumber(row.getCell(columns.stock).value);
    const sizes = columns.sizes ? cellValueToString(row.getCell(columns.sizes).value).split(',').map((item) => item.trim()).filter(Boolean) : [];
    const colors = columns.colors ? cellValueToString(row.getCell(columns.colors).value).split(',').map((item) => item.trim()).filter(Boolean) : [];

    if (!title && !description && !category && !thumbnail && !Number.isFinite(price) && !Number.isFinite(stock)) continue;

    const rowErrors = [];
    if (title.length < 2 || title.length > 180) rowErrors.push('Tên sản phẩm phải có từ 2 đến 180 ký tự');
    if (!Number.isFinite(price) || price < 0) rowErrors.push('Giá bán không hợp lệ');
    if (!Number.isInteger(stock) || stock < 0) rowErrors.push('Tồn kho phải là số nguyên không âm');
    if (category.length > 100) rowErrors.push('Danh mục tối đa 100 ký tự');
    if (thumbnail.length > 1000) rowErrors.push('URL hình ảnh quá dài');
    if (sizes.length > 20 || sizes.some((item) => item.length > 30)) rowErrors.push('Danh sách size không hợp lệ');
    if (colors.length > 20 || colors.some((item) => item.length > 30)) rowErrors.push('Danh sách màu không hợp lệ');

    if (rowErrors.length) errors.push({ row: rowNumber, errors: rowErrors });
    else products.push({ title, description, price, category, sizes: [...new Set(sizes)], colors: [...new Set(colors)], thumbnail, stock });
  }

  if (errors.length) {
    throw {
      status: 422,
      message: `Có ${errors.length} dòng chưa hợp lệ. Chưa có sản phẩm nào được thêm.`,
      errors: errors.slice(0, 50),
    };
  }
  if (!products.length) throw { status: 400, message: 'File không có sản phẩm để nhập.' };

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    await ProductModel.insertMany(connection, products);
    await connection.commit();
    return products.length;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};
