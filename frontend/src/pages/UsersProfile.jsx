import React, { useEffect, useState, useContext } from "react";
import { adminService, userService } from "../services/api";
import { Container,Card,Form,Button,Spinner,Alert,Table,Modal } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";

const UserProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  // Modal chỉnh sửa client
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchProfile();
    if (user?.role === "admin") fetchClients();
  }, [user]);

  //Lấy thông tin người dùng hiện tại
  const fetchProfile = async () => {
    try {
      const data = await userService.getProfile();
      setProfile(data.user);
      setFormData({ name: data.user.name, email: data.user.email });
    } catch (err) {
      console.error("Lỗi khi tải thông tin người dùng:", err);
      setError("Không thể tải thông tin tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage({ type: "", text: "" });
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage({ type: "danger", text: "Mật khẩu xác nhận không khớp." });
      return;
    }
    setPasswordLoading(true);
    try {
      const data = await userService.changePassword(passwordForm.current, passwordForm.next);
      setPasswordMessage({ type: "success", text: data.message });
      setPasswordForm({ current: "", next: "", confirm: "" });
    } catch (requestError) {
      setPasswordMessage({ type: "danger", text: requestError.response?.data?.message || "Không thể đổi mật khẩu." });
    } finally {
      setPasswordLoading(false);
    }
  };

  //Lấy danh sách client 
  const fetchClients = async () => {
    try {
      setClients(await adminService.getUsers());
    } catch (err) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
    }
  };

  //Lưu cập nhật thông tin cá nhân
  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const data = await userService.updateProfile(formData);
      updateUser(data.user);
      setSuccess("Cập nhật thông tin thành công!");
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      console.error("Lỗi khi lưu thông tin:", err);
      setError("Cập nhật thất bại. Vui lòng thử lại.");
    }
  };

  //Chỉnh sửa client
  const handleEditClient = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleSaveClient = async () => {
    try {
      await adminService.updateUser(selectedClient.id, selectedClient);
      alert("Cập nhật người dùng thành công!");
      setShowModal(false);
      fetchClients();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi cập nhật người dùng!");
    }
  };

  //Xóa client
  const handleDeleteClient = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa người dùng này không?")) {
      try {
        await adminService.deleteUser(id);
        alert("Xóa thành công!");
        fetchClients();
      } catch (err) {
        console.error(err);
        alert("Xóa thất bại!");
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p>Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  return (
    <Container className="my-5">
      <Card className="p-4 shadow-sm border-0">
        <Card.Title as="h2" className="mb-4 text-primary fw-bold">
          <i className="bi bi-person-circle me-2"></i> Thông Tin Tài Khoản
        </Card.Title>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {!profile ? (
          <Alert variant="warning">Không tìm thấy thông tin tài khoản.</Alert>
        ) : (
          <Form onSubmit={handleSave}>
            <Form.Group className="mb-3">
              <Form.Label>Họ và Tên</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                disabled={!editMode}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                disabled={!editMode}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </Form.Group>

            <p className="text-muted">
              <i className="bi bi-person-badge me-1"></i> Vai trò:{" "}
              <strong>{profile.role}</strong>
            </p>
            <p className="text-muted">
              <i className="bi bi-calendar me-1"></i> Ngày tạo:{" "}
              {new Date(profile.created_at).toLocaleString("vi-VN")}
            </p>

            <div className="d-flex justify-content-end mt-4">
              {editMode ? (
                <>
                  <Button
                    variant="secondary"
                    className="me-2"
                    onClick={() => setEditMode(false)}
                  >
                    Hủy
                  </Button>
                  <Button variant="success" type="submit">
                    <i className="bi bi-save me-1"></i> Lưu thay đổi
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={() => setEditMode(true)}>
                  <i className="bi bi-pencil-square me-1"></i> Chỉnh sửa
                </Button>
              )}
            </div>
          </Form>
        )}
      </Card>

      <Card className="p-4 mt-4 shadow-sm border-0 account-security-card">
        <Card.Title as="h3" className="fw-bold mb-1"><i className="bi bi-shield-lock me-2"></i>Bảo mật tài khoản</Card.Title>
        <p className="text-muted">Đổi mật khẩu định kỳ để bảo vệ tài khoản và lịch sử đơn hàng.</p>
        {passwordMessage.text && <Alert variant={passwordMessage.type}>{passwordMessage.text}</Alert>}
        <Form onSubmit={handleChangePassword} className="password-form">
          <Form.Group><Form.Label>Mật khẩu hiện tại</Form.Label><Form.Control type="password" value={passwordForm.current} onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })} required /></Form.Group>
          <Form.Group><Form.Label>Mật khẩu mới</Form.Label><Form.Control type="password" minLength={8} value={passwordForm.next} onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })} required /></Form.Group>
          <Form.Group><Form.Label>Xác nhận mật khẩu mới</Form.Label><Form.Control type="password" minLength={8} value={passwordForm.confirm} onChange={(event) => setPasswordForm({ ...passwordForm, confirm: event.target.value })} required /></Form.Group>
          <Button type="submit" disabled={passwordLoading}>{passwordLoading ? <Spinner size="sm" /> : "Đổi mật khẩu"}</Button>
        </Form>
      </Card>

      {/* Admin*/}
      {user?.role === "admin" && (
        <Card className="p-4 mt-5 shadow-sm border-0">
          <Card.Title as="h3" className="text-success fw-bold mb-3">
            <i className="bi bi-people me-2"></i> Danh Sách Người Dùng
          </Card.Title>

          {clients.length === 0 ? (
            <Alert variant="info">Chưa có người dùng nào.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead className="table-success">
                <tr>
                  <th>#</th>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={c.id}>
                    <td>{i + 1}</td>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>
                      <span
                        className={`badge ${
                          c.role === "admin" ? "bg-danger" : "bg-primary"
                        }`}
                      >
                        {c.role}
                      </span>
                    </td>
                    <td>
                      {new Date(c.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEditClient(c)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClient(c.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClient && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Tên</Form.Label>
                <Form.Control
                  value={selectedClient.name}
                  onChange={(e) =>
                    setSelectedClient({
                      ...selectedClient,
                      name: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  value={selectedClient.email}
                  onChange={(e) =>
                    setSelectedClient({
                      ...selectedClient,
                      email: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Vai trò</Form.Label>
                <Form.Select
                  value={selectedClient.role}
                  onChange={(e) =>
                    setSelectedClient({
                      ...selectedClient,
                      role: e.target.value,
                    })
                  }
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSaveClient}>
            Lưu thay đổi
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserProfile;
