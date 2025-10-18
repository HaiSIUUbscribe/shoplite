import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container,Table,Button,Spinner,Alert,Modal,Form,Image,Toast,ToastContainer} from "react-bootstrap";
import { formatCurrency } from "../../utils/formatCurrency";

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [useDummy, setUseDummy] = useState(false); 
  const [selectedProduct, setSelectedProduct] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    thumbnail: "",
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = useDummy
        ? "https://dummyjson.com/products"
        : "http://localhost:3600/api/products";

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = useDummy ? res.data.products : res.data;
      setProducts(data);
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm:", err);
      setError("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [useDummy]);

  // Mở modal thêm/sửa
  const handleEdit = (product) => {
    setIsEditing(true);
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedProduct({
      title: "",
      price: "",
      description: "",
      category: "",
      thumbnail: "",
    });
    setShowModal(true);
  };

  // Xóa sản phẩm
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    try {
      const url = useDummy
        ? `https://dummyjson.com/products/${id}`
        : `http://localhost:3600/api/products/${id}`;
      await axios.delete(url);
      setToastMsg("Xóa sản phẩm thành công!");
      setShowToast(true);
      fetchProducts();
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
      setToastMsg("Xóa sản phẩm thất bại!");
      setShowToast(true);
    }
  };

  // Lưu thêm / sửa
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (isEditing) {
        const url = useDummy
          ? `https://dummyjson.com/products/${selectedProduct.id}`
          : `http://localhost:3600/api/products/${selectedProduct.id}`;
        await axios.put(url, selectedProduct, { headers });
        setToastMsg("Cập nhật sản phẩm thành công!");
      } else {
        const url = useDummy
          ? "https://dummyjson.com/products/add"
          : "http://localhost:3600/api/products";
        await axios.post(url, selectedProduct, { headers });
        setToastMsg("Thêm sản phẩm mới thành công!");
      }

      setShowToast(true);
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error("Lỗi khi lưu sản phẩm:", err);
      setToastMsg("Lưu sản phẩm thất bại!");
      setShowToast(true);
    }
  };

  return (
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">
          <i className="bi bi-box-seam me-2"></i> Quản lý sản phẩm
        </h2>

        <div className="d-flex gap-2">
          <Button
            variant={useDummy ? "warning" : "success"}
            onClick={() => setUseDummy(!useDummy)}
          >
            {useDummy ? "Dùng dữ liệu thật" : "Dùng dữ liệu giả (Dummy)"}
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            <i className="bi bi-plus-circle me-2"></i> Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p>Đang tải sản phẩm...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <Table bordered hover responsive className="align-middle shadow-sm">
          <thead className="table-primary">
            <tr>
              <th>#</th>
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Giá</th>
              <th>Danh mục</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, index) => (
              <tr key={p.id}>
                <td>{index + 1}</td>
                <td>
                  <Image
                    src={p.thumbnail}
                    alt={p.title}
                    width={60}
                    height={60}
                    rounded
                    style={{ objectFit: "cover" }}
                  />
                </td>
                <td>{p.title}</td>
                <td className="text-danger fw-bold">
                  {formatCurrency(p.price * 1000)}
                </td>
                <td>{p.category || "—"}</td>
                <td>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(p)}
                  >
                    <i className="bi bi-pencil-square"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(p.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Modal thêm/sửa */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tên sản phẩm</Form.Label>
              <Form.Control
                value={selectedProduct?.title || ""}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    title: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Giá</Form.Label>
              <Form.Control
                type="number"
                value={selectedProduct?.price || ""}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    price: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Danh mục</Form.Label>
              <Form.Control
                value={selectedProduct?.category || ""}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    category: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ảnh (URL)</Form.Label>
              <Form.Control
                value={selectedProduct?.thumbnail || ""}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    thumbnail: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={selectedProduct?.description || ""}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    description: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {isEditing ? "Lưu thay đổi" : "Thêm sản phẩm"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast thông báo */}
      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          bg="light"
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={2500}
          autohide
        >
          <Toast.Body className="fw-semibold">{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
