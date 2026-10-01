import assert from "node:assert/strict";
import test from "node:test";

import { evaluateAllocationExpression } from "./budgetExpression.js";

test("evaluateAllocationExpression calcula suma, resta y decimales exactamente", () => {
  assert.equal(evaluateAllocationExpression("500+50"), "550.00");
  assert.equal(evaluateAllocationExpression("500 - 25,50"), "474.50");
  assert.equal(evaluateAllocationExpression("-100+20.25"), "-79.75");
  assert.equal(evaluateAllocationExpression("0.10+0.20"), "0.30");
});

test("evaluateAllocationExpression rechaza sintaxis no permitida", () => {
  for (const expression of ["", "500+", "2*3", "100/2", "abc", "500--20", "1.234"]) {
    assert.throws(() => evaluateAllocationExpression(expression), /Usa solo importes/);
  }
});
