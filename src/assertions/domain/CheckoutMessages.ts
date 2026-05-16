export enum CheckoutErrorMessages {
  FIRST_NAME_REQUIRED = 'Error: First Name is required',
  LAST_NAME_REQUIRED  = 'Error: Last Name is required',
  POSTAL_CODE_REQUIRED = 'Error: Postal Code is required',
}

export const CheckoutPageExpectations = {
  STEP_ONE_URL:    '/checkout-step-one.html',
  STEP_TWO_URL:    '/checkout-step-two.html',
  COMPLETE_URL:    '/checkout-complete.html',
  COMPLETE_HEADER: 'Thank you for your order!',
} as const;
