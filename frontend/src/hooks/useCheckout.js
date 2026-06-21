import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { locationService, orderService, voucherService } from '../services/api';
import { calculateOrderAmounts } from '../utils/checkout';
import { formatCurrency } from '../utils/formatCurrency';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  provinceCode: '',
  districtCode: '',
  wardCode: '',
  streetAddress: '',
  paymentMethod: 'cod',
};

export default function useCheckout() {
  const { cartItems, buyNowItem, clearCart, clearBuyNow } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBuyNow = searchParams.get('mode') === 'buy-now';
  const checkoutItems = isBuyNow && buyNowItem ? [buyNowItem] : isBuyNow ? [] : cartItems;

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [requestError, setRequestError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState('');
  
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherStatus, setVoucherStatus] = useState('idle');
  const [voucherMessage, setVoucherMessage] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const { subtotal, discountAmount, total } = calculateOrderAmounts(
    checkoutItems,
    appliedVoucher?.discountAmount
  );

  useEffect(() => {
    setForm((current) => ({ ...current, name: user?.name || '', email: user?.email || '' }));
    if (!user) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem('shoplite_saved_voucher_v1') || 'null');
      if (saved?.userId === user.id && saved?.voucher?.code) {
        setVoucherCode(saved.voucher.code);
        setVoucherMessage('Voucher đã lưu từ trang sản phẩm. Nhấn Áp dụng để sử dụng.');
      }
    } catch {
      window.localStorage.removeItem('shoplite_saved_voucher_v1');
    }
  }, [user]);

  const loadLocations = useCallback(() => {
    setLocationsLoading(true);
    setLocationsError('');
    locationService.getVietnamLocations()
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) throw new Error('Empty location list');
        setLocations(data);
      })
      .catch(() => setLocationsError('Không thể tải dữ liệu địa chỉ. Vui lòng thử lại.'))
      .finally(() => setLocationsLoading(false));
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const selectedProvince = useMemo(
    () => locations.find((item) => String(item.code) === form.provinceCode),
    [locations, form.provinceCode]
  );
  const districts = selectedProvince?.districts || [];
  const selectedDistrict = districts.find((item) => String(item.code) === form.districtCode);
  const wards = selectedDistrict?.wards || [];
  const selectedWard = wards.find((item) => String(item.code) === form.wardCode);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
    if (name === 'email' && appliedVoucher) {
      setAppliedVoucher(null);
      setVoucherStatus('idle');
      setVoucherMessage('Email thay đổi, vui lòng áp dụng lại voucher.');
    }
  };

  const updateProvince = (event) => {
    setForm((current) => ({ ...current, provinceCode: event.target.value, districtCode: '', wardCode: '' }));
    setFieldErrors((current) => ({ ...current, provinceCode: '', districtCode: '', wardCode: '' }));
  };

  const updateDistrict = (event) => {
    setForm((current) => ({ ...current, districtCode: event.target.value, wardCode: '' }));
    setFieldErrors((current) => ({ ...current, districtCode: '', wardCode: '' }));
  };

  const applySavedAddress = (addr) => {
    if (!addr) {
      setForm((current) => ({
        ...current,
        name: user?.name || '',
        phone: '',
        streetAddress: '',
        provinceCode: '',
        districtCode: '',
        wardCode: '',
      }));
      setFieldErrors((current) => ({
        ...current,
        name: '', phone: '', streetAddress: '', provinceCode: '', districtCode: '', wardCode: ''
      }));
      return;
    }

    const p = locations.find((l) => l.name === addr.province);
    const d = p?.districts?.find((dist) => dist.name === addr.district);
    const w = d?.wards?.find((ward) => ward.name === addr.ward);

    setForm((current) => ({
      ...current,
      name: addr.recipient || current.name,
      phone: addr.phone || '',
      streetAddress: addr.street || '',
      provinceCode: p ? String(p.code) : '',
      districtCode: d ? String(d.code) : '',
      wardCode: w ? String(w.code) : '',
    }));
    setFieldErrors((current) => ({
      ...current,
      name: '', phone: '', streetAddress: '', provinceCode: '', districtCode: '', wardCode: ''
    }));
  };

  const updateVoucherCode = (event) => {
    setVoucherCode(event.target.value.toUpperCase());
    setAppliedVoucher(null);
    setVoucherStatus('idle');
    setVoucherMessage('');
  };

  const applyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!/^[A-Z0-9-]{6,32}$/.test(code)) {
      setVoucherStatus('error');
      setVoucherMessage('Vui lòng nhập mã voucher hợp lệ.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setVoucherStatus('error');
      setVoucherMessage('Nhập email nhận hàng trước khi áp dụng voucher.');
      return;
    }

    setVoucherLoading(true);
    setVoucherMessage('');
    try {
      const data = await voucherService.validate(code, form.email, subtotal);
      setAppliedVoucher(data);
      setVoucherCode(data.code);
      setVoucherStatus('success');
      setVoucherMessage(`Đã giảm ${formatCurrency(data.discountAmount)}.`);
    } catch (error) {
      setAppliedVoucher(null);
      setVoucherStatus('error');
      setVoucherMessage(error.response?.data?.message || 'Không thể kiểm tra voucher. Vui lòng thử lại.');
      if (['VOUCHER_USED', 'VOUCHER_ALREADY_USED', 'VOUCHER_EXPIRED', 'VOUCHER_UNAVAILABLE'].includes(error.response?.data?.code)) {
        window.localStorage.removeItem('shoplite_saved_voucher_v1');
      }
    } finally {
      setVoucherLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (form.name.trim().length < 2) errors.name = 'Họ tên phải có ít nhất 2 ký tự.';
    if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Email chưa đúng định dạng.';
    if (!/^[0-9+().\s-]{8,20}$/.test(form.phone)) errors.phone = 'Số điện thoại phải có từ 8 đến 20 ký tự hợp lệ.';
    if (!form.provinceCode) errors.provinceCode = 'Vui lòng chọn Tỉnh/Thành phố.';
    if (!form.districtCode) errors.districtCode = 'Vui lòng chọn Quận/Huyện.';
    if (!form.wardCode) errors.wardCode = 'Vui lòng chọn Phường/Xã.';
    if (form.streetAddress.trim().length < 5) errors.streetAddress = 'Vui lòng nhập số nhà và tên đường, tối thiểu 5 ký tự.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setRequestError('');
    if (!validateForm()) {
      window.requestAnimationFrame(() => {
        const firstInvalidField = document.querySelector('.checkout-page .is-invalid');
        firstInvalidField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalidField?.focus({ preventScroll: true });
      });
      return;
    }

    const customerAddress = [
      form.streetAddress.trim(),
      selectedWard?.name,
      selectedDistrict?.name,
      selectedProvince?.name,
    ].filter(Boolean).join(', ');

    setLoading(true);
    try {
      const response = await orderService.create({
        items: checkoutItems.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          size: item.size || undefined,
          color: item.color || undefined,
        })),
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        customer_address: customerAddress,
        payment_method: form.paymentMethod,
        voucher_code: appliedVoucher?.code || undefined,
      });
      if (appliedVoucher) window.localStorage.removeItem('shoplite_saved_voucher_v1');
      if (response.paymentUrl) {
        window.sessionStorage.setItem('shoplite_pending_checkout_mode', isBuyNow ? 'buy-now' : 'cart');
        window.location.assign(response.paymentUrl);
        return;
      }
      if (isBuyNow) clearBuyNow();
      else clearCart();
      navigate(`/order-success/${response.orderId}`, { replace: true });
    } catch (error) {
      setRequestError(error.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
      window.requestAnimationFrame(() => {
        document.getElementById('checkout-request-error')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isBuyNow, checkoutItems,
    form, fieldErrors, requestError, loading,
    locations, locationsLoading, locationsError, loadLocations,
    districts, wards,
    updateField, updateProvince, updateDistrict,
    voucherCode, updateVoucherCode, applyVoucher,
    voucherLoading, voucherStatus, voucherMessage, appliedVoucher,
    subtotal, discountAmount, total,
    handleSubmit, applySavedAddress
  };
}
