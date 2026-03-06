import { MemberUnit } from '@/constants/enum/unit-type';
import { BaseResponse } from '@/schemas/base';
import { z } from 'zod';

// Form
export const formResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  unit: z.nativeEnum(MemberUnit),
  startsAt: z.string(),
  endsAt: z.string(),
  active: z.boolean(),
  available: z.boolean(),
});
export type FormResponse = BaseResponse<typeof formResponseSchema>;
export type FormType = z.infer<typeof formResponseSchema>;

// Form List
export const formListResponseSchema = z.array(formResponseSchema);
export type FormListResponse = BaseResponse<typeof formListResponseSchema>;
export type FormListType = z.infer<typeof formListResponseSchema>;

// Create Form
export const createFormSchema = formResponseSchema.omit({
  id: true,
  available: true,
});
export type CreateFormRequest = z.infer<typeof createFormSchema>;

// Update Form
export const updateFormSchema = formResponseSchema.omit({ id: true }).partial();
export type UpdateFormRequest = z.infer<typeof updateFormSchema>;

// Delete Form
export const deleteFormResponseSchema = z.string();
export type DeleteFormResponse = BaseResponse<typeof deleteFormResponseSchema>;

export const formApplicationPortfolioSchema = z.object({
  createdAt: z.string(),
  filename: z.string(),
  path: z.string(),
  portfolioUuid: z.string(),
  uuid: z.string(),
});

export type FormApplicationPortfolioType = z.infer<
  typeof formApplicationPortfolioSchema
>;

// Form Application
export const formApplicationSchema = z.object({
  uuid: z.string(),
  formId: z.number(),
  portfolio: formApplicationPortfolioSchema,
  memberUUID: z.string(),
  portfolioAssetUUID: z.string(),
  name: z.string(),
  studentId: z.string(),
  googleEmail: z.string(),
  phoneNumber: z.string(),
  introduction: z.string(),
  motivation: z.string(),
  expectedActivities: z.string(),
  reasonToChoose: z.string(),
  creatorQuestion: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  submittedAt: z.string().optional(),
  submitted: z.boolean(),
});
export type FormApplicationResponse = BaseResponse<
  typeof formApplicationSchema
>;
export type FormApplicationType = z.infer<typeof formApplicationSchema>;

// Form Application List
export const FormApplicationListResponseSchema = z.array(formApplicationSchema);
export type FormApplicationListResponse = BaseResponse<
  typeof FormApplicationListResponseSchema
>;
export type FormApplicationListType = z.infer<
  typeof FormApplicationListResponseSchema
>;

// Delete Form Application
export const DeleteFormApplicationResponseSchema = z.string();
export type DeleteFormApplicationResponse = BaseResponse<
  typeof DeleteFormApplicationResponseSchema
>;

// Create Form Application (Public)
export const createFormApplicationSchema = formApplicationSchema.pick({
  phoneNumber: true,
  introduction: true,
  motivation: true,
  expectedActivities: true,
  reasonToChoose: true,
  creatorQuestion: true,
});
export type CreateFormApplicationRequest = z.infer<
  typeof createFormApplicationSchema
>;

// Update Form Application (Public)
export const updateFormApplicationSchema =
  createFormApplicationSchema.partial();
export type UpdateFormApplicationRequest = z.infer<
  typeof updateFormApplicationSchema
>;

// Form Application File (Public)
export const uploadFormApplicationFile = z.string();
export type UploadFormApplicationFileResponse = BaseResponse<
  typeof uploadFormApplicationFile
>;
export type UploadFormApplicationFileType = z.infer<
  typeof uploadFormApplicationFile
>;

export const formApplicationFile = z.object({ downloadUrl: z.string() });
export type FormApplicationFileResponse = BaseResponse<
  typeof formApplicationFile
>;
export type FormApplicationFileType = z.infer<typeof formApplicationFile>;

export const formAccessibility = z.boolean();
export type FormAccessibilityResponse = BaseResponse<typeof formAccessibility>;
export type FormAccessibilityType = z.infer<typeof formAccessibility>;
