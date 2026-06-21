import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Form, Row } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import { addressService } from '../../services/api';

export default function ShippingAddressForm({
  form, fieldErrors, requestError, loading,
  locations, locationsLoading, locationsError, loadLocations,
  districts, wards,
  updateField, updateProvince, updateDistrict, applySavedAddress
}) {
  const { user } = useContext(AuthContext);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  useEffect(() => {
    if (user) {
      addressService.list()
        .then((data) => setSavedAddresses(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [user]);
  return (
    <>
      <h2>Thông tin giao hàng</h2>
      {requestError && <Alert id="checkout-request-error" variant="danger">{requestError}</Alert>}
      {locationsError && (
        <Alert variant="warning" className="d-flex justify-content-between align-items-center">
          {locationsError}
          <Button type="button" size="sm" variant="outline-dark" onClick={loadLocations}>Thử lại</Button>
        </Alert>
      )}

      {user && savedAddresses.length > 0 && (
        <div className="saved-addresses-selector mb-4">
          <Form.Label>Hoặc chọn địa chỉ đã lưu của bạn:</Form.Label>
          <div className="d-flex overflow-auto pb-2 gap-3" style={{ scrollSnapType: 'x mandatory' }}>
            {savedAddresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              return (
                <div 
                  key={addr.id} 
                  className="saved-address-mini-card p-3 border rounded shadow-sm flex-shrink-0 position-relative" 
                  style={{ 
                    width: '280px', 
                    cursor: 'pointer', 
                    scrollSnapAlign: 'start', 
                    backgroundColor: isSelected ? '#eafaf1' : '#fdfdfd', 
                    borderColor: isSelected ? '#198754' : '#dee2e6',
                    borderWidth: isSelected ? '2px' : '1px',
                    transition: 'all 0.2s' 
                  }}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedAddressId(null);
                      applySavedAddress(null);
                    } else {
                      setSelectedAddressId(addr.id);
                      applySavedAddress(addr);
                    }
                  }}
                >
                  <div className="fw-bold d-flex justify-content-between mb-1 pe-4">
                    <span>{addr.label || 'Địa chỉ'} {addr.is_default && <span className="badge bg-light text-dark border ms-1" style={{ fontSize: '0.65rem' }}>Mặc định</span>}</span>
                  </div>
                  {isSelected && (
                    <div className="position-absolute d-flex align-items-center justify-content-center bg-success text-white rounded-circle" style={{ top: '12px', right: '12px', width: '20px', height: '20px', fontSize: '12px' }}>
                      <i className="bi bi-check" />
                    </div>
                  )}
                  <div className="text-muted small mb-1">{addr.recipient} - {addr.phone}</div>
                  <div className="text-muted small text-truncate" title={[addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}>
                    {[addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="checkout-name">
            <Form.Label>Họ và tên</Form.Label>
            <Form.Control name="name" value={form.name} onChange={updateField} autoComplete="name" isInvalid={Boolean(fieldErrors.name)} disabled={loading} />
            <Form.Control.Feedback type="invalid">{fieldErrors.name}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="checkout-phone">
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control name="phone" value={form.phone} onChange={updateField} autoComplete="tel" placeholder="09xx xxx xxx" isInvalid={Boolean(fieldErrors.phone)} disabled={loading} />
            <Form.Control.Feedback type="invalid">{fieldErrors.phone}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3" controlId="checkout-email">
        <Form.Label>Email nhận xác nhận</Form.Label>
        <Form.Control name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" isInvalid={Boolean(fieldErrors.email)} disabled={loading} />
        <Form.Control.Feedback type="invalid">{fieldErrors.email}</Form.Control.Feedback>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="checkout-province">
            <Form.Label>Tỉnh/Thành phố</Form.Label>
            <Form.Select name="provinceCode" value={form.provinceCode} onChange={updateProvince} isInvalid={Boolean(fieldErrors.provinceCode)} disabled={loading || locationsLoading}>
              <option value="">{locationsLoading ? 'Đang tải...' : 'Chọn Tỉnh/Thành phố'}</option>
              {locations.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{fieldErrors.provinceCode}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="checkout-district">
            <Form.Label>Quận/Huyện</Form.Label>
            <Form.Select name="districtCode" value={form.districtCode} onChange={updateDistrict} isInvalid={Boolean(fieldErrors.districtCode)} disabled={loading || !form.provinceCode}>
              <option value="">Chọn Quận/Huyện</option>
              {districts.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{fieldErrors.districtCode}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3" controlId="checkout-ward">
        <Form.Label>Phường/Xã</Form.Label>
        <Form.Select name="wardCode" value={form.wardCode} onChange={updateField} isInvalid={Boolean(fieldErrors.wardCode)} disabled={loading || !form.districtCode}>
          <option value="">Chọn Phường/Xã</option>
          {wards.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{fieldErrors.wardCode}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-4" controlId="checkout-street">
        <Form.Label>Địa chỉ cụ thể</Form.Label>
        <Form.Control name="streetAddress" value={form.streetAddress} onChange={updateField} autoComplete="street-address" placeholder="Số nhà, tên đường" isInvalid={Boolean(fieldErrors.streetAddress)} disabled={loading} />
        <Form.Control.Feedback type="invalid">{fieldErrors.streetAddress}</Form.Control.Feedback>
      </Form.Group>
    </>
  );
}

ShippingAddressForm.propTypes = {
  form: PropTypes.object.isRequired,
  fieldErrors: PropTypes.object.isRequired,
  requestError: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  locations: PropTypes.array.isRequired,
  locationsLoading: PropTypes.bool.isRequired,
  locationsError: PropTypes.string,
  loadLocations: PropTypes.func.isRequired,
  districts: PropTypes.array.isRequired,
  wards: PropTypes.array.isRequired,
  updateField: PropTypes.func.isRequired,
  updateProvince: PropTypes.func.isRequired,
  updateDistrict: PropTypes.func.isRequired,
  applySavedAddress: PropTypes.func.isRequired,
};
