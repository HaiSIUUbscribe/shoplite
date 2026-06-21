async function send({ to, message }) {
  if (!to || !process.env.SMS_WEBHOOK_URL) return false;

  const response = await fetch(process.env.SMS_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.SMS_WEBHOOK_TOKEN
        ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({ to, message, sender: process.env.SMS_SENDER || 'ShopLite' }),
  });

  if (!response.ok) throw new Error(`SMS provider returned ${response.status}`);
  return true;
}

module.exports = { send };
