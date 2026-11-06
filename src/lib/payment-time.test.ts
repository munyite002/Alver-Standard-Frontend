// Run: node --test src/lib/payment-time.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { paymentTimeZone } from "./payment-time.ts";

const kenyanTime = (stored: string, type: string) =>
    new Intl.DateTimeFormat("en-GB", {
        timeZone: paymentTimeZone(type),
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).format(new Date(stored));

// Every row below is a payment made at 12:30 in Kenya, stored the way the backend stores it.
test("paybill rows read back as the Kenyan clock time in winter", () => {
    assert.equal(kenyanTime("2026-11-06T11:30:00Z", "Pay Bill"), "12:30");
});

test("paybill rows read back as the Kenyan clock time in summer", () => {
    assert.equal(kenyanTime("2026-07-06T10:30:00Z", "Pay Bill"), "12:30");
});

test("failed paybill rows are stored the same way", () => {
    assert.equal(kenyanTime("2026-11-06T11:30:00Z", "Failed Payment - Meter Not Found"), "12:30");
});

test("STK rows are true instants, so they read in Kenyan time", () => {
    for (const type of ["STK_PUSH_SUCCESS", "PENDING_STK_PUSH", "STK_PUSH_FAILED_1032", "CALLBACK_NO_MATCH"]) {
        assert.equal(kenyanTime("2026-11-06T09:30:00Z", type), "12:30");
    }
});

test("midnight shows as 00, not 24", () => {
    assert.equal(kenyanTime("2026-11-05T23:05:00Z", "Pay Bill"), "00:05");
});
