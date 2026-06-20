const nodemailer = require('nodemailer');

let transporter;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value));
}

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const options = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
    };
    if (process.env.SMTP_USER) {
      options.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
    }
    transporter = nodemailer.createTransport(options);
  }
  return transporter;
}

exports.sendPasswordReset = async ({ to, name, resetUrl }) => {
  const client = getTransporter();
  if (!client) return false;
  await client.sendMail({
    from: process.env.MAIL_FROM || 'ShopLite <no-reply@shoplite.vn>',
    to,
    subject: 'Đặt lại mật khẩu ShopLite',
    text: `Xin chào ${name}, mở liên kết sau để đặt lại mật khẩu trong vòng 30 phút: ${resetUrl}`,
    html: `<p>Xin chào <strong>${name}</strong>,</p><p>Bạn vừa yêu cầu đặt lại mật khẩu ShopLite.</p><p><a href="${resetUrl}">Đặt lại mật khẩu</a></p><p>Liên kết có hiệu lực trong 30 phút. Nếu không thực hiện yêu cầu này, bạn có thể bỏ qua email.</p>`,
  });
  return true;
};

exports.sendContactMessage = async ({ name, email, phone, subject, message }) => {
  const client = getTransporter();
  if (!client) return false;
  await client.sendMail({
    from: process.env.MAIL_FROM || 'ShopLite <no-reply@shoplite.vn>',
    to: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
    replyTo: email,
    subject: `[ShopLite hỗ trợ] ${subject}`,
    text: `Khách hàng: ${name}\nEmail: ${email}\nĐiện thoại: ${phone || 'Không cung cấp'}\n\n${message}`,
  });
  return true;
};

exports.sendOrderConfirmation = async (order) => {
  const client = getTransporter();
  if (!client) return false;

  const paymentLabels = {
    cod: 'Thanh toán khi nhận hàng',
    bank_transfer: 'Chuyển khoản ngân hàng',
    vnpay: 'VNPay',
  };
  const itemLines = order.items.map((item) => (
    `${item.title}${item.size ? ` - Size ${item.size}` : ''}${item.color ? ` - ${item.color}` : ''} x ${item.qty}: ${formatCurrency(Number(item.price) * Number(item.qty))}`
  ));
  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${escapeHtml(item.title)}${item.size ? ` · Size ${escapeHtml(item.size)}` : ''}${item.color ? ` · ${escapeHtml(item.color)}` : ''} × ${Number(item.qty)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right">${formatCurrency(Number(item.price) * Number(item.qty))}</td>
    </tr>`).join('');

  await client.sendMail({
    from: process.env.MAIL_FROM || 'ShopLite <no-reply@shoplite.vn>',
    to: order.customer_email,
    subject: `Xác nhận đơn hàng ShopLite #${order.id}`,
    text: [
      `Xin chào ${order.customer_name},`,
      `Đơn hàng #${order.id} đã được ghi nhận.`,
      ...itemLines,
      `Tổng thanh toán: ${formatCurrency(order.total)}`,
      `Phương thức: ${paymentLabels[order.payment_method] || order.payment_method}`,
      `Địa chỉ nhận hàng: ${order.customer_address}`,
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17211d">
        <h1 style="font-size:24px">ShopLite đã nhận đơn hàng #${order.id}</h1>
        <p>Xin chào <strong>${escapeHtml(order.customer_name)}</strong>, đơn hàng của bạn đã được ghi nhận thành công.</p>
        <table style="width:100%;border-collapse:collapse">${itemRows}</table>
        <p style="font-size:18px"><strong>Tổng thanh toán: ${formatCurrency(order.total)}</strong></p>
        <p>Phương thức: ${escapeHtml(paymentLabels[order.payment_method] || order.payment_method)}</p>
        <p>Giao tới: ${escapeHtml(order.customer_address)}</p>
        <p>Cảm ơn bạn đã mua sắm tại ShopLite.</p>
      </div>`,
  });
  return true;
};
