import { z } from "zod"

// Remove endDate from your schema
export const fundraiserSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  category: z.string().min(1, "Please select a category"),
  goal: z.number().positive("Goal amount must be positive"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  images: z.array(z.instanceof(File)).optional(),
  // Removed endDate field
})

export type FundraiserFormData = z.infer<typeof fundraiserSchema>