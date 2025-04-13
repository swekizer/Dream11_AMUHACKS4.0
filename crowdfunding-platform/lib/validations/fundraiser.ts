import { z } from "zod"

export const fundraiserSchema = z.object({
  title: z.string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  category: z.string().min(1, "Category is required"),
  goal: z.number()
    .positive("Goal amount must be greater than 0")
    .max(1000000000, "Goal amount must be less than 1 billion"),
  description: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must be less than 5000 characters"),
  images: z.array(z.any())
    .min(1, "At least one image is required")
    .max(5, "Maximum 5 images allowed")
})

export type FundraiserFormData = z.infer<typeof fundraiserSchema>