export function calculateOrderAmounts(items, requestedDiscount = 0) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0
  );
  const discountAmount = Math.min(subtotal, Math.max(0, Number(requestedDiscount) || 0));
  return {
    subtotal,
    discountAmount,
    total: subtotal - discountAmount,
  };
}
