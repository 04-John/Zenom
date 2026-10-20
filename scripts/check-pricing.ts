// Run with: npm run test:pricing
import assert from "node:assert/strict";
import { orderTotals, formatNaira, SIZES, artworkPrice } from "../src/lib/pricing";

const naira = (kobo: number) => kobo / 100;

// Portrait 16×20 framed, Kaduna: 40,000 + 5,000 + 1,500
let t = orderTotals([{ category: "portrait", sizeIndex: 2, framed: true, subjectCount: 1 }], "kaduna");
assert.equal(naira(t.total), 46_500);
assert.equal(naira(t.deposit), 23_250);

// Abstract 24×36 unframed, Kaduna: 95,000 + 1,500
t = orderTotals([{ category: "geometric", sizeIndex: 5, framed: false, subjectCount: 1 }], "kaduna");
assert.equal(naira(t.total), 96_500);

// Portrait 12×16 framed, 3 subjects, Kaduna: 30,000 + 3,000 + 20,000 + 1,500
t = orderTotals([{ category: "portrait", sizeIndex: 1, framed: true, subjectCount: 3 }], "kaduna");
assert.equal(naira(t.total), 54_500);

// Outside Kaduna: delivery left out of the total.
t = orderTotals([{ category: "portrait", sizeIndex: 2, framed: true, subjectCount: 1 }], "other");
assert.equal(naira(t.total), 45_000);
assert.equal(t.delivery, 0);

// Abstract ignores subject count (portraits only).
assert.equal(
  orderTotals([{ category: "figurative", sizeIndex: 0, framed: false, subjectCount: 5 }], "other").total,
  artworkPrice("figurative", 0)
);

assert.equal(SIZES.length, 6);
assert.equal(formatNaira(2_450_000), "₦24,500");

console.log("pricing checks passed");
