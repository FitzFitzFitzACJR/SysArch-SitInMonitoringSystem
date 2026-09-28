import { z } from "zod";

export const idNumberSchema = z
  .string()
  .trim()
  .min(1, "ID number is required")
  .max(20)
  .regex(/^[A-Za-z0-9-]+$/, "Only letters, numbers and dashes");

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

// Normalise before validating, so a pasted " Ana@School.edu " is accepted.
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"));

const name = (label: string) => z.string().trim().min(1, `${label} is required`).max(60);

export const LoginSchema = z.object({
  idNumber: idNumberSchema,
  password: z.string().min(1, "Password is required").max(128),
});

export const RegisterSchema = z
  .object({
    idNumber: idNumberSchema,
    firstName: name("First name"),
    middleName: z.string().trim().max(60).optional(),
    lastName: name("Last name"),
    email: emailSchema,
    courseId: z.string().min(1, "Select a course"),
    yearLevel: z.coerce.number().int().min(1, "Select a year level").max(4),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from the current one",
  });

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(20),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
