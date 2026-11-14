import test from 'node:test';
import assert from 'node:assert/strict';
import { BLUEPRINT_LIMITS, clampString, sanitizeInvoiceItems, sanitizeShopProfile } from './sanitizers';

test('clampString trims and enforces maxLength', () => {
  assert.equal(clampString('  Dhaka Loom  ', 5), 'Dhaka');
});

test('sanitizeShopProfile enforces blueprint string limits', () => {
  const longText = 'x'.repeat(300);
  const res = sanitizeShopProfile({
    shopName: longText,
    tagline: longText,
    phone: longText,
    address: longText,
    stampText: longText,
  });
  assert.equal(res.shopName.length, BLUEPRINT_LIMITS.SHOP_NAME_MAX);
  assert.equal(res.tagline.length, BLUEPRINT_LIMITS.TAGLINE_MAX);
  assert.equal(res.phone.length, BLUEPRINT_LIMITS.PHONE_MAX);
  assert.equal(res.address.length, BLUEPRINT_LIMITS.ADDRESS_MAX);
  assert.equal(res.stampText.length, BLUEPRINT_LIMITS.STAMP_MAX);
});

test('sanitizeInvoiceItems drops blank names, bounds count to 50, and clamps numbers', () => {
  const many = Array.from({ length: 65 }, (_, i) => ({
    id: `id-${i}`,
    name: i === 0 ? '   ' : `Product ${i}`,
    quantity: -5,
    unitPrice: -100,
  }));
  const sanitized = sanitizeInvoiceItems(many);
  assert.equal(sanitized.length, 50);
  assert.equal(sanitized[0].name, 'Product 1');
  assert.equal(sanitized[0].quantity, 0.01);
  assert.equal(sanitized[0].unitPrice, 0);
});
