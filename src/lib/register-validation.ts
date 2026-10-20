import "server-only";

import { z } from "zod";
import { isValidStellarAddress } from "@/lib/stellar";

export interface RegistrationValidationError {
  field: string;
  message: string;
}

/**
 * Shared Zod field validators for registration payload.
 */
const stellarAddressField = z
  .string()
  .trim()
  .min(1, "Stellar address is required")
  .max(56, "Stellar address must be 56 characters or fewer")
  .refine(
    (addr) => addr.length === 56,
    "Stellar address must be exactly 56 characters"
  )
  .refine(
    (addr) => addr.startsWith("G"),
    "Stellar address must start with 'G'"
  )
  .refine(
    (addr) => isValidStellarAddress(addr),
    "Invalid Stellar G-address format — checksum failed or invalid encoding"
  );

/**
 * Zod schema for registration POST request body.
 * Provides type-safe validation with structured error reporting.
 */
export const registrationPayloadSchema = z.object({
  stellarAddress: stellarAddressField,
});

export type RegistrationPayload = z.infer<typeof registrationPayloadSchema>;

/**
 * Coerce unknown input to a plain object for validation.
 * Used when parsing JSON request bodies.
 */
export const registrationInputSchema = z
  .unknown()
  .transform((val) => {
    if (typeof val === "object" && val !== null) {
      return val as Record<string, unknown>;
    }
    return {};
  })
  .pipe(registrationPayloadSchema);

/**
 * Validates registration form input using Zod.
 * Returns an array of validation errors (backward-compatible format), empty if input is valid.
 *
 * Exported for backward compatibility with existing callers.
 * Prefer using `registrationPayloadSchema.safeParse()` directly in new code.
 */
export function validateRegistrationInput(
  input: unknown
): RegistrationValidationError[] {
  const result = registrationInputSchema.safeParse(input);

  if (!result.success) {
    return result.error.errors.map((err) => ({
      field: err.path.join(".") || "stellarAddress",
      message: err.message,
    }));
  }

  return [];
}

/**
 * Type-safe validation that throws on error.
 * Useful in typed contexts where you know input should be valid.
 */
export function validateRegistrationPayload(
  input: unknown
): RegistrationPayload {
  return registrationPayloadSchema.parse(input);
}
