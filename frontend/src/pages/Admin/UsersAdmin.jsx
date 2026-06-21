import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Badge, Button, Container, Form, Modal, Pagination, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import { adminService } from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';

const INITIAL_RESPONSE = {
  items: [],
  total: 0,
  page: 1,
  pages: 1,
  summary: { total: 0, admins: 0, clients: 0, active: 0, locked: 0 },
};

const EMPTY_FILTERS = { search: '', role: '', status: '', provider: '' };

const providerLabels = { local: 'Email', google: 'Google', facebook: 'Facebook' };

function formatDate(value, fallback = 'Chưa có') {
  if (!value) return fallback;
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

export default function UsersAdmin() {
  const { user: currentUser, updateUser: updateCurrentUser } = useContext(AuthContext);
  const [response, setResponse] = useState(INITIAL_RESPONSE);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'client' });
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setResponse(await adminService.getUsers({ ...filters, page, limit: 20 }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const updateFilter = (field) => (event) => {
    setPage(1);
    setFilters((current) => ({ ...current, [field]: event.target.value }));
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  };

  const resetFilters = () => {
    setSearchInput('');
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const openEdit = (account) => {
    setEditingUser(account);
    setEditForm({
      name: account.name || '',
      email: account.email || '',
      phone: account.phone || '',
      role: account.role,
    });
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await adminService.updateUser(editingUser.id, editForm);
      if (Number(editingUser.id) === Number(currentUser?.id) && data.user) {
        updateCurrentUser({ ...currentUser, ...data.user });
      }
      toast.success('Đã cập nhật tài khoản.');
      setEditingUser(null);
      await loadUsers();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Không thể cập nhật tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (account) => {
    const nextStatus = account.status === 'locked' ? 'active' : 'locked';
    const action = nextStatus === 'locked' ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản "${account.name}"?`)) return;
    try {
      await adminService.updateUserStatus(account.id, nextStatus);
      toast.success(nextStatus === 'locked' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
      await loadUsers();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || `Không thể ${action} tài khoản.`);
    }
  };

  const deleteUser = async (account) => {
    if (!window.confirm(`Xóa vĩnh viễn tài khoản "${account.name}"?`)) return;
    try {
      await adminService.deleteUser(account.id);
      toast.success('Đã xóa tài khoản.');
      if (response.items.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadUsers();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Không thể xóa tài khoản.');
    }
  };

  const summaryCards = [
    ['Tổng tài khoản', response.summary.total, 'bi-people', 'blue'],
    ['Khách hàng', response.summary.clients, 'bi-person', 'teal'],
    ['Quản trị viên', response.summary.admins, 'bi-shield-check', 'violet'],
    ['Đang bị khóa', response.summary.locked, 'bi-person-lock', 'amber'],
  ];
  const visiblePages = [];
  for (let number = Math.max(1, page - 2); number <= Math.min(response.pages, page + 2); number += 1) {
    visiblePages.push(number);
  }

  return (
    <Container className="admin-page">
      <div className="admin-heading">
        <div><span>Quản trị hệ thống</span><h1>Quản lý tài khoản</h1></div>
        <Button variant="outline-dark" onClick={loadUsers} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-2" />Làm mới
        </Button>
      </div>

      <div className="admin-user-stats">
        {summaryCards.map(([label, value, icon, color]) => (
          <div className={`stat-card ${color}`} key={label}>
            <i className={`bi ${icon}`} /><div><span>{label}</span><strong>{value}</strong></div>
          </div>
        ))}
      </div>

      <div className="admin-user-filters">
        <Form onSubmit={submitSearch} className="admin-user-search">
          <Form.Control value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm theo tên, email hoặc ID" maxLength={120} />
          <Button type="submit" aria-label="Tìm tài khoản"><i className="bi bi-search" /></Button>
        </Form>
        <Form.Select value={filters.role} onChange={updateFilter('role')} aria-label="Lọc vai trò">
          <option value="">Tất cả vai trò</option><option value="client">Khách hàng</option><option value="admin">Quản trị viên</option>
        </Form.Select>
        <Form.Select value={filters.status} onChange={updateFilter('status')} aria-label="Lọc trạng thái">
          <option value="">Tất cả trạng thái</option><option value="active">Hoạt động</option><option value="locked">Đã khóa</option>
        </Form.Select>
        <Form.Select value={filters.provider} onChange={updateFilter('provider')} aria-label="Lọc nguồn đăng nhập">
          <option value="">Mọi nguồn</option><option value="local">Email</option><option value="google">Google</option><option value="facebook">Facebook</option>
        </Form.Select>
        <Button variant="light" className="icon-button" onClick={resetFilters} title="Xóa bộ lọc"><i className="bi bi-x-lg" /></Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="page-loader"><Spinner animation="border" /><span>Đang tải tài khoản...</span></div>
      ) : (
        <div className="admin-table-wrap">
          <Table responsive hover className="align-middle mb-0 admin-users-table">
            <thead><tr><th>Tài khoản</th><th>Liên hệ</th><th>Phân quyền</th><th>Hoạt động</th><th>Đơn hàng</th><th className="text-end">Thao tác</th></tr></thead>
            <tbody>
              {response.items.map((account) => {
                const isSelf = Number(account.id) === Number(currentUser?.id);
                return (
                  <tr key={account.id} className={account.status === 'locked' ? 'is-locked' : ''}>
                    <td><div className="admin-user-cell"><span>{String(account.name || '?').charAt(0).toUpperCase()}</span><div><strong>{account.name}{isSelf && <small>Bạn</small>}</strong><small>#{account.id} · {providerLabels[account.provider] || account.provider}</small></div></div></td>
                    <td><span>{account.email}</span><small className="table-subtext">{account.phone || 'Chưa có số điện thoại'}</small></td>
                    <td><Badge bg={account.role === 'admin' ? 'dark' : 'secondary'}>{account.role === 'admin' ? 'Quản trị' : 'Khách hàng'}</Badge><small className="table-subtext"><span className={`account-status-dot ${account.status}`} />{account.status === 'locked' ? 'Đã khóa' : 'Hoạt động'}</small></td>
                    <td><span>{formatDate(account.last_login_at, 'Chưa đăng nhập')}</span><small className="table-subtext">Tạo {formatDate(account.created_at)}</small></td>
                    <td><strong>{account.order_count} đơn</strong><small className="table-subtext">{formatCurrency(Number(account.total_spent))}</small></td>
                    <td className="text-end"><div className="admin-row-actions">
                      <Button variant="light" className="icon-button" onClick={() => openEdit(account)} title="Chỉnh sửa"><i className="bi bi-pencil" /></Button>
                      <Button variant="light" className="icon-button" onClick={() => toggleStatus(account)} disabled={isSelf} title={account.status === 'locked' ? 'Mở khóa' : 'Khóa tài khoản'}><i className={`bi ${account.status === 'locked' ? 'bi-unlock' : 'bi-lock'}`} /></Button>
                      <Button variant="outline-danger" className="icon-button" onClick={() => deleteUser(account)} disabled={isSelf || Number(account.order_count) > 0} title={Number(account.order_count) > 0 ? 'Không thể xóa tài khoản đã có đơn hàng' : 'Xóa tài khoản'}><i className="bi bi-trash" /></Button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {!response.items.length && <div className="empty-table">Không có tài khoản phù hợp.</div>}
        </div>
      )}

      {response.pages > 1 && (
        <Pagination className="admin-pagination">
          <Pagination.Prev disabled={page <= 1} onClick={() => setPage((current) => current - 1)} />
          {visiblePages.map((number) => <Pagination.Item key={number} active={number === page} onClick={() => setPage(number)}>{number}</Pagination.Item>)}
          <Pagination.Next disabled={page >= response.pages} onClick={() => setPage((current) => current + 1)} />
        </Pagination>
      )}

      <Modal show={Boolean(editingUser)} onHide={() => !saving && setEditingUser(null)} centered>
        <Form onSubmit={saveUser}>
          <Modal.Header closeButton><Modal.Title>Chỉnh sửa tài khoản</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Họ tên</Form.Label><Form.Control value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} minLength={2} maxLength={120} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={editForm.email} onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Số điện thoại</Form.Label><Form.Control type="tel" value={editForm.phone} onChange={(event) => setEditForm((current) => ({ ...current, phone: event.target.value }))} maxLength={20} /></Form.Group>
            <Form.Group><Form.Label>Vai trò</Form.Label><Form.Select value={editForm.role} onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value }))} disabled={Number(editingUser?.id) === Number(currentUser?.id)}><option value="client">Khách hàng</option><option value="admin">Quản trị viên</option></Form.Select>{Number(editingUser?.id) === Number(currentUser?.id) && <Form.Text>Bạn không thể tự thu hồi quyền quản trị.</Form.Text>}</Form.Group>
          </Modal.Body>
          <Modal.Footer><Button variant="light" onClick={() => setEditingUser(null)} disabled={saving}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? <Spinner size="sm" /> : 'Lưu thay đổi'}</Button></Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
