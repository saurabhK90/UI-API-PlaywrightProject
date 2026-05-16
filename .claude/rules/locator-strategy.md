# Locator Strategy Rules

How to select and write locators in this framework. Applied to all Page Objects.

---

## Priority Order (highest to lowest stability)

1. **`data-testid` attribute** — preferred, decoupled from styling and structure
   ```typescript
   page.getByTestId('submit-order-btn')
   ```

2. **ARIA role + accessible name** — semantically meaningful, resilient to DOM changes
   ```typescript
   page.getByRole('button', { name: 'Add to Cart' })
   page.getByRole('textbox', { name: 'Email address' })
   ```

3. **Semantic text** — for labels, headings, links where text is stable
   ```typescript
   page.getByLabel('Password')
   page.getByPlaceholder('Search products…')
   page.getByText('Order confirmed')
   ```

4. **CSS selector** — only when the above are not available, using stable class names
   ```typescript
   page.locator('.checkout-summary__total')
   ```

5. **XPath** — last resort only, document the reason in a comment
   ```typescript
   page.locator('//table[@id="order-table"]//tr[2]/td[1]')  // grid has no testids
   ```

---

## Where Locators Live

All locators are **`private readonly` class fields** at the top of the Page class — never inline strings in methods.

```typescript
export class CheckoutPage extends BasePage {
  // ✅ Correct — stable testid, defined once
  private readonly orderSummaryTotal = this.page.getByTestId('order-total');
  private readonly placeOrderBtn = this.page.getByRole('button', { name: 'Place Order' });

  // ❌ Wrong — inline locator string buried in a method
  async placeOrder(): Promise<void> {
    await this.page.getByTestId('place-order-btn').click();  // don't do this
  }
}
```

---

## Naming Locators

Name by **semantic purpose**, not visual appearance or DOM position.

| ✅ Good | ❌ Bad |
|---|---|
| `usernameInput` | `inputField1` |
| `loginButton` | `blueButton` |
| `errorMessage` | `topRightDiv` |
| `navigationMenu` | `element3` |

---

## Dynamic Locators

For locators that require runtime parameters (row index, item ID), use methods that return a `Locator`:

```typescript
getOrderRow(orderId: string): Locator {
  return this.page.getByTestId(`order-row-${orderId}`);
}
```

---

## Locator Registry

When a locator is actively used in tests, it should be registered in `resources/locator-registry/locators.json`. This file is the input to the self-healing locator agent.

Format:
```json
{
  "CheckoutPage.placeOrderBtn": {
    "selector": "[data-testid='place-order-btn']",
    "lastVerified": "2026-05-15",
    "alternatives": ["role=button[name='Place Order']"],
    "deprecated": []
  }
}
```

---

## Locator Review Checklist

- [ ] Uses `data-testid` or ARIA role — not position-based CSS or XPath
- [ ] Defined as `private readonly` field at the top of the class
- [ ] Named by semantic purpose
- [ ] Registered in `locator-registry/locators.json` if used in smoke/regression tests
- [ ] No inline locator strings in action methods
