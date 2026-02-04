import { z } from 'zod'

export const attributeSchema = z.object({
  trait_type: z.string().min(1, 'Trait type is required').max(50, 'Trait type too long'),
  value: z.string().min(1, 'Value is required').max(100, 'Value too long'),
})

export const mintSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be less than 1000 characters'),
  image: z.instanceof(File, { message: 'Image is required' })
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Image must be less than 10MB')
    .refine((file) => file.type.startsWith('image/'), 'File must be an image'),
  attributes: z.array(attributeSchema).max(10, 'Maximum 10 attributes allowed').optional().default([]),
})