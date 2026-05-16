/**
 * Static string constants for the Login feature.
 * Import these in tests instead of hardcoding message strings.
 *
 * Why enums: the set of possible error messages is closed and known at design time.
 * Why const object for expectations: page-level values (titles, URL segments) are
 * configuration-like and benefit from object grouping for clarity.
 */

export enum LoginErrorMessages {
  CREDENTIALS_MISMATCH = 'Epic sadface: Username and password do not match any user in this service',
  ACCOUNT_LOCKED = 'Epic sadface: Sorry, this user has been locked out.',
  USERNAME_REQUIRED = 'Epic sadface: Username is required',
  PASSWORD_REQUIRED = 'Epic sadface: Password is required',
}
