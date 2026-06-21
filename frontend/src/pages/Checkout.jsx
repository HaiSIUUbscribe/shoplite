import React from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useCheckout from '../hooks/useCheckout';
import ShippingAddressForm from '../components/checkout/ShippingAddressForm';
import PaymentMethods from '../components/checkout/PaymentMethods';
import CheckoutSummary from '../components/checkout/CheckoutSummary';

export default function Checkout() {
  const {
    isBuyNow, checkoutItems,
    form, fieldErrors, requestError, loading,
    locations, locationsLoading, locationsError, loadLocations,
    districts, wards,
    updateField, updateProvince, updateDistrict,
    voucherCode, updateVoucherCode, applyVoucher,
    voucherLoading, voucherStatus, voucherMessage, appliedVoucher,
    subtotal, discountAmount, total,
    handleSubmit, applySavedAddress
  } = useCheckout();

  if (!checkoutItems.length) {
    return (
      <Container className="py-5">
        <div className="empty-state">
          <i className="bi bi-cart-x" />
          <h2>Không có sản phẩm để thanh toán</h2>
          <p>Thêm sản phẩm vào giỏ trước khi tiếp tục.</p>
          <Button as={Link} to="/products">Tiếp tục mua sắm</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="checkout-page pt-4">
      <Form onSubmit={handleSubmit} noValidate>
        <Row className="g-4">
          <Col lg={7}>
            <Card className="checkout-panel border-0">
              <Card.Body>
                <ShippingAddressForm
                  form={form}
                  fieldErrors={fieldErrors}
                  requestError={requestError}
                  loading={loading}
                  locations={locations}
                  locationsLoading={locationsLoading}
                  locationsError={locationsError}
                  loadLocations={loadLocations}
                  districts={districts}
                  wards={wards}
                  updateField={updateField}
                  updateProvince={updateProvince}
                  updateDistrict={updateDistrict}
                  applySavedAddress={applySavedAddress}
                />

                <PaymentMethods
                  paymentMethod={form.paymentMethod}
                  onChange={updateField}
                />
              </Card.Body>
            </Card>
          </Col>

          <Col lg={5}>
            <Card className="checkout-panel order-summary border-0">
              <Card.Body>
                <CheckoutSummary
                  isBuyNow={isBuyNow}
                  checkoutItems={checkoutItems}
                  voucherCode={voucherCode}
                  updateVoucherCode={updateVoucherCode}
                  applyVoucher={applyVoucher}
                  voucherLoading={voucherLoading}
                  voucherStatus={voucherStatus}
                  voucherMessage={voucherMessage}
                  appliedVoucher={appliedVoucher}
                  subtotal={subtotal}
                  discountAmount={discountAmount}
                  total={total}
                  loading={loading}
                  locationsLoading={locationsLoading}
                  hasFieldErrors={Object.keys(fieldErrors).length > 0}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}
