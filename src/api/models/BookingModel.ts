import { z } from 'zod';

export const BookingDatesSchema = z.object({
  checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export const BookingSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  totalprice: z.number().int().positive(),
  depositpaid: z.boolean(),
  bookingdates: BookingDatesSchema,
  additionalneeds: z.string().optional(),
});

export const CreateBookingResponseSchema = z.object({
  bookingid: z.number().int().positive(),
  booking: BookingSchema,
});

export const BookingIdItemSchema = z.object({
  bookingid: z.number().int().positive(),
});

export const BookingListSchema = z.array(BookingIdItemSchema);

export const AuthTokenSchema = z.object({
  token: z.string().min(1),
});

export const AuthErrorSchema = z.object({
  reason: z.string(),
});

export type Booking = z.infer<typeof BookingSchema>;
export type BookingDates = z.infer<typeof BookingDatesSchema>;
export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;
export type BookingIdItem = z.infer<typeof BookingIdItemSchema>;
export type AuthToken = z.infer<typeof AuthTokenSchema>;
export type AuthError = z.infer<typeof AuthErrorSchema>;
