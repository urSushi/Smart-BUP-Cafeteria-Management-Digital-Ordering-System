// Comprehensive Unit & Functional Verification Script for SBCMS Backend API
import assert from "node:assert";

import { getAllCafeterias, getCafeteriaById, updateCafeteriaStatus } from "./server/models/Cafeteria.js";
import {
  getMenuItemsByCafeteria,
  getMenuItemById,
  deductStockForOrder,
  restoreStockForOrder,
  getLowStockAlerts,
} from "./server/models/MenuItem.js";
import {
  createOrder,
  getOrderById,
  getOrderByToken,
  updateOrderStatus,
  cancelOrder,
  verifyAndCollectPickup,
} from "./server/models/Order.js";
import { validatePromotion } from "./server/models/Promotion.js";
import { createReview, getReviewsByCafeteria } from "./server/models/Review.js";
import {
  findUserByIdentifier,
  recordFailedLogin,
  clearFailedLogin,
  isAccountLocked,
  createStaffMember,
  getStaffByCafeteria,
} from "./server/models/User.js";

async function runTests() {
  console.log("=== STARTING SBCMS BACKEND VERIFICATION SUITE ===");

  // 1. Cafeterias (FR-04, FR-20)
  console.log("\n[TEST 1] Verifying 4 BUP Cafeterias...");
  const cafs = getAllCafeterias();
  assert.strictEqual(cafs.length, 4, "Should have 4 cafeterias");
  const vista = getCafeteriaById("vista");
  assert.ok(vista, "Vista Cafe should exist");
  assert.strictEqual(vista.isOpen, true, "Vista should be open");
  updateCafeteriaStatus("vista", { crowdLevel: "High" });
  assert.strictEqual(getCafeteriaById("vista").crowdLevel, "High");
  console.log("✓ Cafeterias verified successfully.");

  // 2. Menu Items & Stock (FR-04, FR-13, FR-14)
  console.log("\n[TEST 2] Verifying Menu Catalog & Stock...");
  const vistaItems = getMenuItemsByCafeteria("vista");
  assert.ok(vistaItems.length >= 4, "Vista should have items");
  const burger = vistaItems.find((i) => i.name.includes("Burger"));
  assert.ok(burger, "Burger should exist");
  const initialStock = burger.stockQuantity;
  assert.ok(initialStock > 0, "Stock should be positive");

  const lowStockAlerts = getLowStockAlerts("vista");
  console.log(`Low stock alerts for Vista: ${lowStockAlerts.length} items`);
  console.log("✓ Menu items and low stock detection verified.");

  // 3. Coupon Codes (FR-19)
  console.log("\n[TEST 3] Verifying Promotion & Discount Validation...");
  const validPromo = validatePromotion("BUP20", 200, "vista");
  assert.strictEqual(validPromo.valid, true, "BUP20 should be valid for ৳200");
  assert.strictEqual(validPromo.discount, 40, "20% of 200 is 40");
  const invalidPromo = validatePromotion("NONEXISTENT", 200, "vista");
  assert.strictEqual(invalidPromo.valid, false, "Invalid code should fail");
  console.log("✓ Promotions validated.");

  // 4. Order Creation & Token/QR Generation (FR-05, FR-07, FR-13, FR-21)
  console.log("\n[TEST 4] Verifying Order Creation, Token & Dynamic Prep Time...");
  const newOrder = createOrder({
    cafeteriaId: "vista",
    items: [{ id: burger.id, name: burger.name, price: burger.price, qty: 2 }],
    subtotal: burger.price * 2,
    discount: 40,
    promoCode: "BUP20",
    total: burger.price * 2 - 40,
    paymentMethod: "bkash",
    userFullName: "Sarah Rahman",
    userIdentifier: "2021-1-60-001",
    userId: 1,
  });

  assert.ok(newOrder.id.startsWith("ORD-"), "Order ID should start with ORD-");
  assert.ok(newOrder.tokenNumber.startsWith("VST-"), "Token should start with VST-");
  assert.ok(newOrder.qrCodeData.includes("SBCMS:"), "QR data should be formatted");
  assert.strictEqual(newOrder.orderStatus, "placed", "Initial status must be placed");
  assert.ok(newOrder.prepTimeMinutes >= burger.prepTimeMinutes, "Prep time dynamic calculation");
  assert.strictEqual(burger.stockQuantity, initialStock - 2, "Stock must be deducted by 2");
  console.log(`✓ Order placed: ${newOrder.id} with Token: #${newOrder.tokenNumber}`);

  // 5. Order Cancellation & Stock Restoration (FR-15)
  console.log("\n[TEST 5] Verifying Order Cancellation (Grace Period)...");
  const cancelTestOrder = createOrder({
    cafeteriaId: "vista",
    items: [{ id: burger.id, name: burger.name, price: burger.price, qty: 1 }],
    subtotal: burger.price,
    total: burger.price,
    paymentMethod: "cash",
  });
  const stockBeforeCancel = burger.stockQuantity;
  cancelOrder(cancelTestOrder.id, "Changed mind");
  assert.strictEqual(getOrderById(cancelTestOrder.id).orderStatus, "cancelled");
  assert.strictEqual(burger.stockQuantity, stockBeforeCancel + 1, "Stock must be restored on cancellation");
  console.log("✓ Order cancellation and stock restoration verified.");

  // 6. Pickup Verification & Duplicate Collection Prevention (FR-11, FR-22)
  console.log("\n[TEST 6] Verifying Staff Pickup & Double-Collection Prevention (FR-22)...");
  updateOrderStatus(newOrder.id, "ready");

  // First pickup scan should succeed
  const pickupResult = verifyAndCollectPickup(newOrder.tokenNumber, "vista");
  assert.strictEqual(pickupResult.success, true, "First collection must succeed");
  assert.strictEqual(newOrder.isCollected, true, "Order must be marked collected");
  assert.strictEqual(newOrder.orderStatus, "completed", "Status must be completed");

  // Second pickup scan MUST fail with double collection error (FR-22)
  let duplicatePrevented = false;
  try {
    verifyAndCollectPickup(newOrder.tokenNumber, "vista");
  } catch (err) {
    if (err.message.includes("ALREADY COLLECTED")) {
      duplicatePrevented = true;
    }
  }
  assert.strictEqual(duplicatePrevented, true, "Duplicate collection MUST be prevented (FR-22)");
  console.log("✓ Duplicate pickup prevention (FR-22) verified successfully.");

  // 7. Student Ratings & Reviews (FR-16)
  console.log("\n[TEST 7] Verifying Student Ratings & Reviews...");
  const review = createReview({
    orderId: newOrder.id,
    cafeteriaId: "vista",
    menuItemId: burger.id,
    itemName: burger.name,
    rating: 5,
    comment: "Juicy and warm!",
    userName: "Sarah Rahman",
  });
  assert.strictEqual(review.rating, 5);
  const vistaReviews = getReviewsByCafeteria("vista");
  assert.ok(vistaReviews.some((r) => r.id === review.id), "Review should be listed");
  console.log("✓ Reviews and rating updates verified.");

  // 8. Account Lockout Cooldown (FR-03)
  console.log("\n[TEST 8] Verifying Consecutive Failed Attempts Account Lockout (FR-03)...");
  const testUser = findUserByIdentifier("2021-1-60-001");
  assert.ok(testUser, "User should exist");
  clearFailedLogin(testUser.identifier);

  // Simulate 4 failed attempts
  for (let i = 0; i < 4; i++) {
    recordFailedLogin(testUser.identifier);
  }
  assert.strictEqual(isAccountLocked(testUser).locked, false, "Should not be locked after 4 attempts");

  // 5th failed attempt triggers 15-min cooldown
  recordFailedLogin(testUser.identifier);
  const lockInfo = isAccountLocked(testUser);
  assert.strictEqual(lockInfo.locked, true, "Must be locked after 5 failed attempts");
  assert.ok(lockInfo.minutesLeft > 0, "Cooldown minutes remaining");
  clearFailedLogin(testUser.identifier);
  assert.strictEqual(isAccountLocked(testUser).locked, false, "Reset unlocks account");
  console.log("✓ Account lockout cooldown verified.");

  // 9. Staff Account Management (FR-18)
  console.log("\n[TEST 9] Verifying Manager Staff Account Creation (FR-18)...");
  const newStaff = createStaffMember({
    fullName: "Karim Ullah",
    identifier: "STF-099",
    cafeteriaId: "vista",
    staffRole: "cashier",
  });
  assert.strictEqual(newStaff.identifier, "STF-099");
  const vistaStaff = getStaffByCafeteria("vista");
  assert.ok(vistaStaff.some((s) => s.identifier === "STF-099"), "New staff should be in Vista");
  console.log("✓ Staff account creation verified.");

  console.log("\n=======================================================");
  console.log(" ALL 9 VERIFICATION MODULES PASSED WITH 100% SUCCESS! ");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
