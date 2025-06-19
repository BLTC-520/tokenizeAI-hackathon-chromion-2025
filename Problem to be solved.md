# 🛠️ Dev Log – Issue Summary (Date: 25/6)

## Overview

This document outlines known issues and tasks identified on 25 June, related to token creation, KYC flows, marketplace, dashboard navigation, manual mode errors, back button behavior, and wallet disconnect flow. Use this as a reference for debugging or enhancing the platform later.

---

## 🧱 1. Token Creation

* **Problem**: New token is being created, but the **bundle name remains the same** (e.g., `Bundle-1` for all).
* **Expected Fix**: Ensure each created token gets a **unique bundle name**, possibly using `timestamp`, `UUID`, or token ID suffix.

---

## 👥 2. KYC Confirmation Bug

* **Problem**: KYC request is **sent twice** to the DON (Decentralized Oracle Network) after confirming.
* **Expected Fix**: Prevent duplicate requests by:

  * Debouncing the request
  * Locking the button after first click
  * Verifying submission state before re-request

---

## 🛒 3. Marketplace: Buy Token Flow

* **Task**: Implement or fix **token purchasing functionality** in the Marketplace.
* **Expected Behavior**:

  * Clicking "Buy" triggers `buyToken(tokenId)`
  * Proper transaction feedback (success/fail)
  * Updates UI (e.g., mark as owned or remove from listing)

---

## 🧱 4. Dashboard Navigation

* **Problem**: After reaching dashboard, user is sometimes forced through flow again.
* **Expected Fix**:

  * Once on dashboard, allow the user to **freely choose tabs**
  * Ensure **router state or user state** persists to avoid rerouting

---

## ⚙️ 5. Manual Mode Cancel Bug

* **Problem**: Cancelling Manual Mode causes:

```bash
Error: [CONTRACT] CONTRACT_ERROR: "Transaction was rejected. Please try again."
```

* **Cause**: Possibly user-rejected MetaMask tx or contract call failure
* **Fix**:

  * Catch this error and show user-friendly message (e.g., “You cancelled the transaction.”)
  * Don't treat as critical error – **graceful fallback**

---

## 🔙 6. Back Button Behavior

* **Problem**: Pressing back navigates **out of localhost**, losing progress.
* **Fix**:

  * Override default behavior
  * Back button should **undo step-by-step**, not exit app
  * Use `history.replace` / router guard to control navigation stack

---

## 🔌 7. Wallet Disconnect Behavior

* **Problem**: After disconnect → reconnect, app redirects user to questionnaire
* **Fix**:

  * **Persist session data** (tokenCreated, questionnaireComplete, etc.) in localStorage or contract state
  * On reconnect, check if token was already created
  * If yes, redirect directly to **dashboard**

---

## 🔄 Suggested Enhancements

| Task                         | Priority | Notes                         |
| ---------------------------- | -------- | ----------------------------- |
| Unique Bundle Name per Token | High     | Fix in token creation service |
| KYC Confirmation Guard       | High     | Use lock or debounce          |
| Token Buy Flow               | High     | Test MetaMask + backend logic |
| Manual Mode Error Handling   | Medium   | Graceful catch/cancel         |
| Navigation Flexibility       | Medium   | Dashboard tab choice          |
| Back Button Logic            | Medium   | Override default navigation   |
| Wallet Disconnect Flow Fix   | Medium   | Use session/token flag        |

---

## ✅ Done Checklist (Once Fixed)

* [ ] Unique bundle names generated
* [ ] Only 1 KYC request sent per user
* [ ] Buying token from marketplace is functional
* [ ] Free tab navigation after dashboard
* [ ] Cancelling transaction doesn't throw hard error
* [ ] Back button stays inside app flow
* [ ] Reconnect wallet restores previous state without redoing questionnaire





