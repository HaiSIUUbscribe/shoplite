export function formatCurrency(amount, currency = "VND", locale = "vi-VN") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }
  