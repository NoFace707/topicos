function decimalTokenToCents(token) {
  const sign = token.startsWith("-") ? -1 : 1;
  const unsigned = token.replace(/^[+-]/, "");
  const [units, decimals = ""] = unsigned.split(".");
  return sign * (Number(units) * 100 + Number(decimals.padEnd(2, "0")));
}

export function evaluateAllocationExpression(expression) {
  const normalized = String(expression ?? "").replace(/\s+/g, "").replace(/,/g, ".");
  const validExpression = /^[+-]?\d+(?:\.\d{1,2})?(?:[+-]\d+(?:\.\d{1,2})?)*$/;
  if (!validExpression.test(normalized)) {
    throw new Error("Usa solo importes con + o -, por ejemplo 500+50.");
  }
  const tokens = normalized.match(/[+-]?\d+(?:\.\d{1,2})?/g) || [];
  const cents = tokens.reduce((total, token) => total + decimalTokenToCents(token), 0);
  return (cents / 100).toFixed(2);
}
