const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateSalary } = require("../src/utils/salary");

test("salary components use wage and Basic bases correctly", () => {
  const result = calculateSalary({
    fixedWage: 50000,
    pfEmployeePercent: 12,
    pfEmployerPercent: 12,
    professionalTax: 200,
    components: [
      { name: "Basic", compType: "PERCENT_OF_WAGE", value: 60 },
      { name: "HRA", compType: "PERCENT_OF_BASIC", value: 50 },
      { name: "Allowance", compType: "FIXED", value: 5000 },
    ],
  });

  assert.equal(result.basicAmount, 30000);
  assert.equal(result.earnings[1].calculatedAmount, 15000);
  assert.equal(result.grossEarnings, 50000);
  assert.equal(result.deductions.pfEmployee, 3600);
  assert.equal(result.netSalary, 46200);
});

test("salary rejects components above the wage", () => {
  assert.throws(
    () => calculateSalary({
      fixedWage: 50000,
      pfEmployeePercent: 0,
      pfEmployerPercent: 0,
      professionalTax: 0,
      components: [
        { name: "Basic", compType: "PERCENT_OF_WAGE", value: 80 },
        { name: "HRA", compType: "PERCENT_OF_BASIC", value: 50 },
      ],
    }),
    /exceeds wage/,
  );
});

test("salary requires a Basic component", () => {
  assert.throws(
    () => calculateSalary({
      fixedWage: 50000,
      pfEmployeePercent: 0,
      pfEmployerPercent: 0,
      professionalTax: 0,
      components: [{ name: "HRA", compType: "FIXED", value: 10000 }],
    }),
    /Basic salary component is required/,
  );
});
