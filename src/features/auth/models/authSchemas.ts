import { z } from 'zod';

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Campo obrigatório'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Signup — dono de empresa ─────────────────────────────────────────────────

export const signUpOwnerSchema = z.object({
  companyName: z.string().min(2, 'Mínimo 2 caracteres'),
  fullName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export type SignUpOwnerFormValues = z.infer<typeof signUpOwnerSchema>;

// ─── Signup — membro via convite ──────────────────────────────────────────────

export const signUpMemberSchema = z.object({
  inviteCode: z
    .string()
    .length(6, 'O código tem 6 caracteres')
    .transform((v) => v.toUpperCase()),
  fullName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export type SignUpMemberFormValues = z.infer<typeof signUpMemberSchema>;

// ─── Esqueci minha senha ───────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
