// Prevents floating-point precision drift by performing currency calculations in integer cents

export function toCents(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 0;
  return Math.round(Number(amount) * 100);
}

export function fromCents(cents) {
  if (cents === null || cents === undefined || isNaN(cents)) return 0;
  return Number((cents / 100).toFixed(2));
}

export function sumMoney(...amounts) {
  const totalCents = amounts.reduce((acc, curr) => acc + toCents(curr), 0);
  return fromCents(totalCents);
}

export function roundMoney(amount) {
  return fromCents(toCents(amount));
}
