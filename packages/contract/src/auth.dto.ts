import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is too short")
    .max(50, "Name is too long")
    .regex(/^[a-zA-Z\s]*$/, "Name contains invalid characters"),

  email: z
    .email("Invalid email format")
    .trim()
    .toLowerCase()
    .max(255, "Email is too long"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[A-Z]/, "Password needs an uppercase letter")
    .regex(/[a-z]/, "Password needs a lowercase letter")
    .regex(/[0-9]/, "Password needs a number")
    .regex(/[^a-zA-Z0-9]/, "Password needs a special character"),

  consent: z.boolean().default(false),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}

export const LoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .toLowerCase()
    .min(6, "Identifier is required")
    .max(255, "Identifier is too long"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

export class LoginDto extends createZodDto(LoginSchema) {}
