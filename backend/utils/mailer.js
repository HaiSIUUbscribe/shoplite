const nodemailer = require('nodemailer');

let transporter;

function hasMailTransport() {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
}

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
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 8000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 8000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 12000),
    };
    if (process.env.SMTP_USER) {
      options.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
    }
    transporter = nodemailer.createTransport(options);
  }
  return transporter;
}

async function sendWithResend(message) {
  const attachments = (message.attachments || []).map((attachment) => ({
    filename: attachment.filename,
    content: Buffer.isBuffer(attachment.content)
      ? attachment.content.toString('base64')
      : attachment.content,
  }));
  const payload = {
    from: process.env.RESEND_FROM || process.env.MAIL_FROM || 'ShopLite <onboarding@resend.dev>',
    to: Array.isArray(message.to) ? message.to : [message.to],
    subject: message.subject,
    text: message.text,
    html: message.html,
  };
  if (message.replyTo) payload.reply_to = message.replyTo;
  if (attachments.length) payload.attachments = attachments;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend rejected email (${response.status}): ${details}`);
  }
}

async function sendMail(message) {
  if (process.env.RESEND_API_KEY) return sendWithResend(message);
  const client = getTransporter();
  if (!client) return false;
  await client.sendMail(message);
  return true;
}

exports.sendPasswordReset = async ({ to, name, resetUrl }) => {
  if (!hasMailTransport()) return false;
  return sendMail({
    from: process.env.MAIL_FROM || 'ShopLite <no-reply@shoplite.vn>',
    to,
    subject: 'Đặt lại mật khẩu ShopLite',
    text: `Xin chào ${name}, mở liên kết sau để đặt lại mật khẩu trong vòng 30 phút: ${resetUrl}`,
    html: `<p>Xin chào <strong>${name}</strong>,</p><p>Bạn vừa yêu cầu đặt lại mật khẩu ShopLite.</p><p><a href="${resetUrl}">Đặt lại mật khẩu</a></p><p>Liên kết có hiệu lực trong 30 phút. Nếu không thực hiện yêu cầu này, bạn có thể bỏ qua email.</p>`,
  });
};

exports.sendNotification = async ({ to, name, title, message, actionUrl }) => {
  if (!hasMailTransport() || !to) return false;
  const safeName = escapeHtml(name || 'bạn');
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const action = actionUrl
    ? `<p><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:10px 16px;color:#fff;background:#105e4a;border-radius:6px;text-decoration:none">Xem chi tiết</a></p>`
    : '';

  return sendMail({
    from: process.env.MAIL_FROM || 'ShopLite <no-reply@shoplite.vn>',
    to,
    subject: `[ShopLite] ${title}`,
    text: `Xin chào ${name || 'bạn'},\n\n${title}\n${message}${actionUrl ? `\n\nXem chi tiết: ${actionUrl}` : ''}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#17211d"><p>Xin chào <strong>${safeName}</strong>,</p><h1 style="font-size:22px">${safeTitle}</h1><p>${safeMessage}</p>${action}<p>ShopLite</p></div>`,
  });
};

exports.sendContactMessage = async ({ name, email, phone, subject, order_id: orderId, message, attachments = [] }) => {
  if (!hasMailTransport()) return false;
  const subjectLabels = {
    order: 'Đơn hàng',
    payment: 'Thanh toán',
    returns: 'Đổi trả',
    product: 'Sản phẩm',
    account: 'Tài khoản',
    other: 'Khác',
  };
  const subjectLabel = subjectLabels[subject] || subject;
  return sendMail({
    from: process.env.MAIL_FROM || 'ShopLite <no-reply@shoplite.vn>',
    to: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
    replyTo: email,
    subject: `[ShopLite hỗ trợ][${subjectLabel}]${orderId ? ` Đơn #${orderId}` : ''}`,
    text: `Phân loại: ${subjectLabel}\nMã đơn: ${orderId || 'Không cung cấp'}\nKhách hàng: ${name}\nEmail: ${email}\nĐiện thoại: ${phone || 'Không cung cấp'}\n\n${message}`,
    attachments,
  });
};

exports.sendNewsletterVoucher = async ({ to, code, discountValue, minOrderAmount, maxDiscountAmount, expiresAt }) => {
  if (!hasMailTransport()) return false;
  const expires = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(expiresAt));
  const minimum = formatCurrency(minOrderAmount);
  const maximum = formatCurrency(maxDiscountAmount);

  return sendMail({
    from: process.env.MAIL_FROM || 'ShopLite <no-reply@shoplite.vn>',
    to,
    subject: `Voucher chào mừng ${discountValue}% từ ShopLite`,
    text: `Mã voucher của bạn: ${code}. Giảm ${discountValue}% cho đơn từ ${minimum}, tối đa ${maximum}. Hạn sử dụng: ${expires}. Mã chỉ dùng một lần và chỉ áp dụng với email này.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#17211d">
        <h1 style="font-size:24px">Voucher chào mừng từ ShopLite</h1>
        <p>Cảm ơn bạn đã đăng ký nhận tin. Đây là mã ưu đãi dành riêng cho email của bạn:</p>
        <div style="margin:24px 0;padding:18px;text-align:center;background:#e8f4ef;border:1px solid #b8d8ca;border-radius:8px">
          <strong style="font-size:26px;letter-spacing:1px;color:#105e4a">${escapeHtml(code)}</strong>
        </div>
        <p>Giảm <strong>${Number(discountValue)}%</strong> cho đơn từ <strong>${minimum}</strong>, tối đa <strong>${maximum}</strong>.</p>
        <p>Hạn sử dụng: <strong>${expires}</strong>. Mã chỉ dùng một lần và chỉ áp dụng khi email nhận hàng là ${escapeHtml(to)}.</p>
      </div>`,
  });
};

exports.sendOrderConfirmation = async (order) => {
  if (!hasMailTransport()) return false;

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

  return sendMail({
    from: process.env.MAIL_FROM || 'ShopLite <no-reply@shoplite.vn>',
    to: order.customer_email,
    subject: `Xác nhận đơn hàng ShopLite #${order.id}`,
    text: [
      `Xin chào ${order.customer_name},`,
      `Đơn hàng #${order.id} đã được ghi nhận.`,
      ...itemLines,
      `Tạm tính: ${formatCurrency(order.subtotal || order.total)}`,
      ...(Number(order.discount_amount) > 0 ? [`Voucher ${order.voucher_code}: -${formatCurrency(order.discount_amount)}`] : []),
      `Tổng thanh toán: ${formatCurrency(order.total)}`,
      `Phương thức: ${paymentLabels[order.payment_method] || order.payment_method}`,
      `Địa chỉ nhận hàng: ${order.customer_address}`,
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17211d">
        <h1 style="font-size:24px">ShopLite đã nhận đơn hàng #${order.id}</h1>
        <p>Xin chào <strong>${escapeHtml(order.customer_name)}</strong>, đơn hàng của bạn đã được ghi nhận thành công.</p>
        <table style="width:100%;border-collapse:collapse">${itemRows}</table>
        <p>Tạm tính: ${formatCurrency(order.subtotal || order.total)}</p>
        ${Number(order.discount_amount) > 0 ? `<p>Voucher ${escapeHtml(order.voucher_code)}: <strong>-${formatCurrency(order.discount_amount)}</strong></p>` : ''}
        <p style="font-size:18px"><strong>Tổng thanh toán: ${formatCurrency(order.total)}</strong></p>
        <p>Phương thức: ${escapeHtml(paymentLabels[order.payment_method] || order.payment_method)}</p>
        <p>Giao tới: ${escapeHtml(order.customer_address)}</p>
        <p>Cảm ơn bạn đã mua sắm tại ShopLite.</p>
      </div>`,
  });
};
