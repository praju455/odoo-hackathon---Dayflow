const test = require("node:test");
const assert = require("node:assert/strict");

const { generateLoginId, splitName } = require("../src/utils/loginId");

test("login ID uses company, names, year, and next serial", async () => {
  const client = {
    user: {
      findMany: async () => [
        { loginId: "OCALSM20250001" },
        { loginId: "OCBOCA20250007" },
      ],
    },
  };
  const id = await generateLoginId(client, { id: "company", code: "oc" }, "Bob", "Carter", 2025);
  assert.equal(id, "OCBOCA20250008");
});

test("single names remain valid", () => {
  assert.deepEqual(splitName("Prince"), { firstName: "Prince", lastName: "Prince" });
});
