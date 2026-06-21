import { formatCurrency } from './utils/formatCurrency';
import { calculateOrderAmounts } from './utils/checkout';
import { formatOrderDate } from './utils/orderStatus';

test('formats product prices as Vietnamese dong', () => {
  const result = formatCurrency(125000);
  expect(result).toContain('125.000');
  expect(result).toMatch(/₫|VND/);
});

test('calculates checkout totals and caps discounts at the subtotal', () => {
  const items = [
    { price: 125000, qty: 2 },
    { price: 50000, qty: 1 },
  ];
  expect(calculateOrderAmounts(items, 100000)).toEqual({
    subtotal: 300000,
    discountAmount: 100000,
    total: 200000,
  });
  expect(calculateOrderAmounts(items, 999999).total).toBe(0);
});

test('formats order dates with friendly relative labels', () => {
  const now = new Date(2026, 5, 21, 10, 0);
  expect(formatOrderDate(new Date(2026, 5, 21, 3, 37), now)).toContain('Hôm nay lúc 03:37');
  expect(formatOrderDate(new Date(2026, 5, 20, 22, 17), now)).toContain('Hôm qua lúc 22:17');
  expect(formatOrderDate(new Date(2026, 4, 10, 9, 0), now)).toContain('10 tháng 5, 2026');
});
