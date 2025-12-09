import { z } from "zod";
import { passwordSchema as securePasswordSchema } from "./password-policy";
import { sanitizeInput } from "./sanitization";

// Common validation schemas
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .min(5, "Email must be at least 5 characters")
  .max(255, "Email must be less than 255 characters")
  .toLowerCase()
  .trim();

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be less than 15 digits")
  .trim();

export const passwordSchema = securePasswordSchema;

// Enhanced string validation
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(
    /^[a-zA-Z\s\-'\.]+$/,
    "Name can only contain letters, spaces, hyphens, apostrophes, and periods",
  )
  .trim();

export const addressSchema = z
  .string()
  .min(10, "Address must be at least 10 characters")
  .max(500, "Address must be less than 500 characters")
  .trim();

export const textSchema = z
  .string()
  .min(1, "This field is required")
  .max(1000, "Text must be less than 1000 characters")
  .trim();

// Date validation
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((date) => {
    const parsedDate = new Date(date);
    const now = new Date();
    const minDate = new Date(1900, 0, 1);
    return parsedDate >= minDate && parsedDate <= now;
  }, "Date must be between 1900 and today");

// Gender validation
export const genderSchema = z
  .enum(["MALE", "FEMALE", "OTHER", "Male", "Female", "Other"])
  .transform((val) => val.toUpperCase());

// Region validation
export const regionSchema = z.enum([
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "CENTRAL",
  "NORTHEAST",
  "NORTHWEST",
]);

// Zone validation
export const zoneSchema = z
  .string()
  .min(1, "Zone selection is required")
  .max(50, "Zone name must be less than 50 characters")
  .trim();

// User registration validation
export const userRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  role: z.enum(["ADMIN", "CANDIDATE", "VOTER"]),
  dateOfBirth: z.string().optional(),
  jurisdiction: z.enum(["LOCAL", "ALL"]).default("LOCAL"),
});

// Candidate nomination validation
export const candidateNominationSchema = z.object({
  candidateName: nameSchema,
  candidateSurname: nameSchema,
  candidateFatherSpouse: nameSchema,
  aliasNickname: z
    .string()
    .max(50, "Alias/Nickname must be less than 50 characters")
    .trim()
    .optional(),
  permanentAddress: addressSchema,
  gender: genderSchema,
  birthDate: dateSchema,
  mobileNumber: phoneSchema,
  emailId: emailSchema,
  zone: zoneSchema,
  proposerName: nameSchema,
  proposerSurname: nameSchema,
  proposerFatherSpouse: nameSchema,
  proposerAddress: addressSchema,
  proposerBirthDate: dateSchema,
  proposerMobile: phoneSchema,
  proposerEmail: emailSchema,
});

// Vote validation
export const voteSchema = z.object({
  votes: z.record(z.string(), z.string().min(1, "Invalid candidate selection")),
});

// Admin voter upload validation
export const voterUploadSchema = z.object({
  voters: z
    .array(
      z.object({
        name: z.string().min(2, "Name required"),
        phone: phoneSchema,
        voterId: z.string().min(1, "Voter ID required"),
        region: z.string().min(1, "Region required"),
      }),
    )
    .min(1, "At least one voter required"),
});

// Re-export sanitization functions from the comprehensive sanitization module
export {
  sanitizeInput,
  sanitizeEmail,
  sanitizePhone,
  sanitizeFileName,
  sanitizeId,
  sanitizeJson,
} from "./sanitization";

// Validate and sanitize text input
export function validateTextInput(
  input: string,
  minLength = 1,
  maxLength = 1000,
): string | null {
  const sanitized = sanitizeInput(input);

  if (sanitized.length < minLength) {
    return `Input must be at least ${minLength} characters`;
  }

  if (sanitized.length > maxLength) {
    return `Input must be no more than ${maxLength} characters`;
  }

  return null;
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 60000,
): boolean {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Overseas voter validation helper
// Checks if a voter has an email address registered in the database
// Only voters with email addresses (from Mail ID column) are considered overseas voters
export function hasRegisteredEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const trimmedEmail = email.trim().toLowerCase();
  // Valid email must have @ and be non-empty
  return trimmedEmail.includes('@') && trimmedEmail.length > 5;
}