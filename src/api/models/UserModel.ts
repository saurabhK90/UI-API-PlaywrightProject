import { z } from 'zod';

/**
 * Example Zod schema for a User API response.
 * TODO: update this schema to match your actual API contract.
 *
 * To bootstrap a schema from a live API response:
 *   npm run generate-schema -- --endpoint /api/users/me --method GET --output UserModel.ts
 * Then review the generated file and mark optional fields.
 */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'standard', 'readonly']),
  createdAt: z.string(),
  isActive: z.boolean(),
  profile: z
    .object({
      avatar: z.string().url().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
});

export type User = z.infer<typeof UserSchema>;

export const LoginResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string().optional(),
  user: UserSchema.optional(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['admin', 'standard', 'readonly']).default('standard'),
});

export type CreateUserPayload = z.infer<typeof CreateUserSchema>;
