import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { addressService, locationService } from '../../services/api';

const EMPTY_FORM = {
  label: '', recipient: '', phone: '',
  province: '', district: '', ward: '', street: '',
  is_default: false,
};

function AddressCard({ address, onEdit, onDelete, onSetDefault }) {
  const fullAddress = [address.street, address.ward, address.district, address.province]
    .filter(Boolean).join(', ');
  return (
    <div className={`address-card${address.is_default ? ' is-default' : ''}`}>
      <div className="address-card-body">
        <div className="address-card-header">
          <strong>{address.label || 'Địa chỉ'}</strong>
          {address.is_default && <span className="address-default-badge">Mặc định</span>}
        </div>
        <p className="address-recipient">{address.recipient}{address.phone && <span> · {address.phone}</span>}</p>
        <p className="address-detail">{fullAddress}</p>
      </div>
      <div className="address-card-actions">
        {!address.is_default && (
          <button type="button" className="address-action-btn" onClick={() => onSetDefault(address.id)}>
            Đặt mặc định
          </button>
        )}
        <button type="button" className="address-action-btn" onClick={() => onEdit(address)}>
          <i className="bi bi-pencil me-1" />Sửa
        </button>
        <button type="button" className="address-action-btn address-action-btn--danger" onClick={() => onDelete(address.id)}>
          <i className="bi bi-trash me-1" />Xoá
        </button>
      </div>
    </div>
  );
}

function AddressFormModal({ show, onHide, initial, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadLocations = useCallback(() => {
    setLocLoading(true);
    setLocError('');
    locationService.getVietnamLocations()
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) throw new Error('Empty location list');
        setLocations(data);
      })
      .catch(() => setLocError('Không thể tải dữ liệu tỉnh thành. Vui lòng thử lại.'))
      .finally(() => setLocLoading(false));
  }, []);

  useEffect(() => {
    if (show && locations.length === 0 && !locLoading && !locError) loadLocations();
  }, [loadLocations, locError, locLoading, locations.length, show]);

  useEffect(() => {
    setForm(initial ? { ...EMPTY_FORM, ...initial, is_default: Boolean(initial.is_default) } : EMPTY_FORM);
  }, [initial, show]);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'province') setForm((prev) => ({ ...prev, province: value, district: '', ward: '' }));
    if (field === 'district') setForm((prev) => ({ ...prev, district: value, ward: '' }));
  };

  const selectedProvince = locations.find((p) => p.name === form.province);
  const districts = selectedProvince?.districts || [];
  const selectedDistrict = districts.find((d) => d.name === form.district);
  const wards = selectedDistrict?.wards || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (initial?.id) {
        await addressService.update(initial.id, form);
        toast.success('Đã cập nhật địa chỉ.');
      } else {
        await addressService.create(form);
        toast.success('Đã thêm địa chỉ mới.');
      }
      onSaved();
      onHide();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Không thể lưu địa chỉ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold">
          {initial?.id ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {locError && (
            <Alert variant="warning" className="d-flex align-items-center justify-content-between gap-3">
              <span>{locError}</span>
              <Button type="button" size="sm" variant="outline-dark" onClick={loadLocations}>
                Thử lại
              </Button>
            </Alert>
          )}
          <div className="row g-3">
            <div className="col-sm-6">
              <Form.Group>
                <Form.Label>Nhãn địa chỉ</Form.Label>
                <Form.Control placeholder="VD: Nhà riêng, Văn phòng" value={form.label} onChange={set('label')} maxLength={60} />
              </Form.Group>
            </div>
            <div className="col-sm-6">
              <Form.Group>
                <Form.Label>Người nhận <span className="text-danger">*</span></Form.Label>
                <Form.Control value={form.recipient} onChange={set('recipient')} required maxLength={120} />
              </Form.Group>
            </div>
            <div className="col-sm-6">
              <Form.Group>
                <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
                <Form.Control type="tel" value={form.phone} onChange={set('phone')} placeholder="09xx xxx xxx" required maxLength={12} />
              </Form.Group>
            </div>
            <div className="col-sm-6">
              <Form.Group>
                <Form.Label>Tỉnh/Thành phố <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.province} onChange={set('province')} required disabled={locLoading}>
                  <option value="">{locLoading ? 'Đang tải...' : 'Chọn Tỉnh/Thành phố'}</option>
                  {locations.map((p) => <option key={p.code} value={p.name}>{p.name}</option>)}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-sm-6">
              <Form.Group>
                <Form.Label>Quận/Huyện <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.district} onChange={set('district')} required disabled={!form.province}>
                  <option value="">Chọn Quận/Huyện</option>
                  {districts.map((d) => <option key={d.code} value={d.name}>{d.name}</option>)}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-sm-6">
              <Form.Group>
                <Form.Label>Phường/Xã <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.ward} onChange={set('ward')} required disabled={!form.district}>
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map((w) => <option key={w.code} value={w.name}>{w.name}</option>)}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-12">
              <Form.Group>
                <Form.Label>Địa chỉ cụ thể <span className="text-danger">*</span></Form.Label>
                <Form.Control placeholder="Số nhà, tên đường" value={form.street} onChange={set('street')} required maxLength={300} />
              </Form.Group>
            </div>
            <div className="col-12">
              <Form.Check
                id="addr-default"
                label="Đặt làm địa chỉ mặc định"
                checked={form.is_default}
                onChange={set('is_default')}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? <Spinner size="sm" className="me-1" /> : <i className="bi bi-save me-1" />}
            {initial?.id ? 'Cập nhật' : 'Thêm địa chỉ'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default function ProfileAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setAddresses(await addressService.list());
    } catch {
      toast.error('Không thể tải danh sách địa chỉ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleEdit = (address) => { setEditTarget(address); setModalOpen(true); };
  const handleAdd = () => { setEditTarget(null); setModalOpen(true); };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xoá địa chỉ này không?')) return;
    try {
      await addressService.remove(id);
      toast.success('Đã xoá địa chỉ.');
      reload();
    } catch {
      toast.error('Xoá thất bại. Vui lòng thử lại.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefault(id);
      toast.success('Đã đặt địa chỉ mặc định.');
      reload();
    } catch {
      toast.error('Không thể cập nhật. Vui lòng thử lại.');
    }
  };

  return (
    <Card className="profile-panel border-0">
      <Card.Body>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h2 className="profile-panel-title mb-0">
            <i className="bi bi-geo-alt me-2" />Địa chỉ giao hàng
          </h2>
          <Button variant="primary" size="sm" onClick={handleAdd}>
            <i className="bi bi-plus-lg me-1" />Thêm địa chỉ
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
        ) : addresses.length === 0 ? (
          <div className="empty-state py-4">
            <i className="bi bi-geo-alt" />
            <h3>Chưa có địa chỉ nào</h3>
            <p>Thêm địa chỉ giao hàng để thanh toán nhanh hơn.</p>
            <Button variant="primary" onClick={handleAdd}>
              <i className="bi bi-plus-lg me-1" />Thêm địa chỉ đầu tiên
            </Button>
          </div>
        ) : (
          <div className="address-list">
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}
      </Card.Body>

      <AddressFormModal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        initial={editTarget}
        onSaved={reload}
      />
    </Card>
  );
}
