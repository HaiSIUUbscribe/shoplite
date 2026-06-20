import React, { useEffect, useState } from 'react';
import { Alert, Button, Container, Form, Image, Modal, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { productService } from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';

const emptyProduct = { title: '', price: '', stock: 0, description: '', category: '', thumbnail: '', sizesText: '', colorsText: '' };

const parseOptions = (value) => [...new Set(String(value || '').split(',').map((item) => item.trim()).filter(Boolean))];

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [product, setProduct] = useState(emptyProduct);

  const loadProducts = () => {
    setLoading(true);
    setError('');
    productService.list()
      .then((data) => setProducts(data))
      .catch(() => setError('Không thể tải danh sách sản phẩm.'))
      .finally(() => setLoading(false));
  };
  useEffect(loadProducts, []);

  const openCreate = () => { setProduct(emptyProduct); setShowModal(true); };
  const openEdit = (selected) => { setProduct({ ...selected, sizesText: (selected.sizes || []).join(', '), colorsText: (selected.colors || []).join(', ') }); setShowModal(true); };
  const updateField = (event) => setProduct((current) => ({ ...current, [event.target.name]: event.target.value }));

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...product,
        price: Number(product.price),
        stock: Number(product.stock),
        sizes: parseOptions(product.sizesText),
        colors: parseOptions(product.colorsText),
      };
      delete payload.sizesText;
      delete payload.colorsText;
      if (product.id) await productService.update(product.id, payload);
      else await productService.create(payload);
      toast.success(product.id ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm.');
      setShowModal(false);
      loadProducts();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Không thể lưu sản phẩm.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (selected) => {
    if (!window.confirm(`Xóa sản phẩm "${selected.title}"?`)) return;
    try {
      await productService.remove(selected.id);
      toast.success('Đã xóa sản phẩm.');
      loadProducts();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Không thể xóa sản phẩm.');
    }
  };

  const downloadTemplate = async () => {
    try {
      const file = await productService.downloadImportTemplate();
      const url = window.URL.createObjectURL(new Blob([file]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'shoplite-product-template.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      toast.error('Không thể tải file mẫu.');
    }
  };

  const importProducts = async (event) => {
    event.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportErrors([]);
    try {
      const response = await productService.importExcel(importFile);
      toast.success(response.message);
      setShowImportModal(false);
      setImportFile(null);
      loadProducts();
    } catch (requestError) {
      const responseData = requestError.response?.data;
      setImportErrors(responseData?.errors || []);
      toast.error(responseData?.message || 'Không thể nhập sản phẩm.');
    } finally {
      setImporting(false);
    }
  };

  const uploadProductImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const data = await productService.uploadImages([file]);
      setProduct((current) => ({ ...current, thumbnail: data.images[0].url }));
      toast.success('Đã tải ảnh sản phẩm.');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Không thể tải ảnh sản phẩm.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  return <Container className="admin-page">
    <div className="admin-heading"><div><span>Danh mục hàng hóa</span><h1>Quản lý sản phẩm</h1></div><div className="admin-heading-actions"><Button variant="outline-dark" onClick={() => { setImportErrors([]); setImportFile(null); setShowImportModal(true); }}><i className="bi bi-file-earmark-spreadsheet me-2" />Nhập Excel</Button><Button onClick={openCreate}><i className="bi bi-plus-lg me-2" />Thêm sản phẩm</Button></div></div>
    {loading && <div className="page-loader"><Spinner animation="border" /><span>Đang tải sản phẩm...</span></div>}
    {error && <Alert variant="danger">{error}</Alert>}
    {!loading && !error && <div className="admin-table-wrap"><Table responsive hover className="align-middle mb-0">
      <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Tồn kho</th><th className="text-end">Thao tác</th></tr></thead>
      <tbody>{products.map((item) => <tr key={item.id}>
        <td><div className="admin-product-cell">{item.thumbnail ? <Image src={item.thumbnail} alt={item.title} /> : <span><i className="bi bi-image" /></span>}<div><strong>{item.title}</strong><small>#{item.id}</small></div></div></td>
        <td>{item.category || 'Chưa phân loại'}</td><td><strong>{formatCurrency(Number(item.price))}</strong></td><td><span className={`inventory ${Number(item.stock) === 0 ? 'empty' : Number(item.stock) < 10 ? 'low' : ''}`}>{item.stock}</span></td>
        <td className="text-end"><Button variant="light" className="icon-button me-2" onClick={() => openEdit(item)} title="Sửa sản phẩm"><i className="bi bi-pencil" /></Button><Button variant="outline-danger" className="icon-button" onClick={() => deleteProduct(item)} title="Xóa sản phẩm"><i className="bi bi-trash" /></Button></td>
      </tr>)}</tbody>
    </Table></div>}

    <Modal show={showModal} onHide={() => !saving && setShowModal(false)} size="lg" centered>
      <Form onSubmit={saveProduct}>
        <Modal.Header closeButton><Modal.Title>{product.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label>Tên sản phẩm</Form.Label><Form.Control name="title" value={product.title} onChange={updateField} required minLength={2} maxLength={180} /></Form.Group>
          <div className="form-grid"><Form.Group><Form.Label>Giá bán (VND)</Form.Label><Form.Control name="price" type="number" min="0" step="1000" value={product.price} onChange={updateField} required /></Form.Group><Form.Group><Form.Label>Tồn kho</Form.Label><Form.Control name="stock" type="number" min="0" step="1" value={product.stock} onChange={updateField} required /></Form.Group></div>
          <Form.Group className="my-3"><Form.Label>Danh mục</Form.Label><Form.Control name="category" value={product.category} onChange={updateField} maxLength={100} /></Form.Group>
          <div className="form-grid mb-3"><Form.Group><Form.Label>Size sản phẩm</Form.Label><Form.Control name="sizesText" value={product.sizesText} onChange={updateField} placeholder="S, M, L, XL" /><Form.Text>Để trống nếu sản phẩm không cần chọn size.</Form.Text></Form.Group><Form.Group><Form.Label>Màu sản phẩm</Form.Label><Form.Control name="colorsText" value={product.colorsText} onChange={updateField} placeholder="Đen, Trắng, Xám" /><Form.Text>Phân cách mỗi lựa chọn bằng dấu phẩy.</Form.Text></Form.Group></div>
          <Form.Group className="mb-3"><Form.Label>URL hình ảnh</Form.Label><Form.Control name="thumbnail" type="url" value={product.thumbnail} onChange={updateField} maxLength={1000} placeholder="https://..." /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Tải ảnh từ máy</Form.Label><div className="product-image-upload"><Form.Control type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadProductImage} disabled={uploadingImage || saving} />{uploadingImage && <Spinner size="sm" />}{product.thumbnail && <Image src={product.thumbnail} alt="Xem trước sản phẩm" />}</div><Form.Text>JPEG, PNG hoặc WebP; tối đa 5 MB.</Form.Text></Form.Group>
          <Form.Group><Form.Label>Mô tả</Form.Label><Form.Control name="description" as="textarea" rows={4} value={product.description} onChange={updateField} /></Form.Group>
        </Modal.Body>
        <Modal.Footer><Button variant="light" onClick={() => setShowModal(false)} disabled={saving}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? <Spinner size="sm" /> : 'Lưu sản phẩm'}</Button></Modal.Footer>
      </Form>
    </Modal>

    <Modal show={showImportModal} onHide={() => !importing && setShowImportModal(false)} centered>
      <Form onSubmit={importProducts}>
        <Modal.Header closeButton><Modal.Title>Nhập sản phẩm từ Excel</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="import-template-row"><div><strong>File mẫu ShopLite</strong><span>Định dạng cột và một dòng dữ liệu mẫu</span></div><Button type="button" variant="outline-dark" onClick={downloadTemplate}><i className="bi bi-download me-2" />Tải file mẫu</Button></div>
          <Form.Group className="mt-4"><Form.Label>File Excel (.xlsx)</Form.Label><Form.Control type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { setImportFile(event.target.files?.[0] || null); setImportErrors([]); }} disabled={importing} required /><Form.Text>Tối đa 5 MB và 1.000 sản phẩm mỗi lần.</Form.Text></Form.Group>
          {importErrors.length > 0 && <Alert variant="danger" className="import-errors mt-3"><strong>Các dòng cần sửa:</strong>{importErrors.map((item) => <span key={item.row}>Dòng {item.row}: {item.errors.join('; ')}</span>)}</Alert>}
        </Modal.Body>
        <Modal.Footer><Button type="button" variant="light" onClick={() => setShowImportModal(false)} disabled={importing}>Hủy</Button><Button type="submit" disabled={!importFile || importing}>{importing ? <><Spinner size="sm" className="me-2" />Đang nhập...</> : 'Nhập sản phẩm'}</Button></Modal.Footer>
      </Form>
    </Modal>
  </Container>;
}
