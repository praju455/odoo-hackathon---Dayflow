function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateSalary({
  fixedWage,
  pfEmployeePercent,
  pfEmployerPercent,
  professionalTax,
  components,
}) {
  const names = components.map((component) => component.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) {
    throw new Error("Salary component names must be unique");
  }

  const basicIndex = names.indexOf("basic");
  if (basicIndex === -1) {
    throw new Error("A Basic salary component is required");
  }

  const basic = components[basicIndex];
  if (basic.compType === "PERCENT_OF_BASIC") {
    throw new Error("Basic cannot be calculated as a percentage of itself");
  }

  const basicAmount = roundMoney(
    basic.compType === "FIXED"
      ? basic.value
      : fixedWage * (basic.value / 100),
  );

  const calculatedComponents = components.map((component, index) => {
    let calculatedAmount;
    if (index === basicIndex) {
      calculatedAmount = basicAmount;
    } else if (component.compType === "FIXED") {
      calculatedAmount = component.value;
    } else if (component.compType === "PERCENT_OF_WAGE") {
      calculatedAmount = fixedWage * (component.value / 100);
    } else {
      calculatedAmount = basicAmount * (component.value / 100);
    }

    return { ...component, calculatedAmount: roundMoney(calculatedAmount) };
  });

  const componentTotal = roundMoney(
    calculatedComponents.reduce((sum, component) => sum + component.calculatedAmount, 0),
  );
  if (componentTotal > fixedWage) {
    throw new Error(
      `Salary components total ${componentTotal.toFixed(2)} exceeds wage ${fixedWage.toFixed(2)}`,
    );
  }

  const pfEmployee = roundMoney(basicAmount * (pfEmployeePercent / 100));
  const pfEmployer = roundMoney(basicAmount * (pfEmployerPercent / 100));
  const totalDeductions = roundMoney(pfEmployee + professionalTax);

  return {
    basicAmount,
    earnings: calculatedComponents,
    grossEarnings: componentTotal,
    unallocatedWage: roundMoney(fixedWage - componentTotal),
    deductions: {
      pfEmployee,
      pfEmployer,
      professionalTax: roundMoney(professionalTax),
      totalDeductions,
    },
    netSalary: roundMoney(componentTotal - totalDeductions),
  };
}

module.exports = { calculateSalary, roundMoney };
