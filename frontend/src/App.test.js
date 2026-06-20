import { formatCurrency } from './utils/formatCurrency';

test('formats product prices as Vietnamese dong', () => {
  const result = formatCurrency(125000);
  expect(result).toContain('125.000');
  expect(result).toMatch(/₫|VND/);
});
