// app/mint/types.ts
export interface MintFormData {
  name: string
  description: string
  image: File | null
  attributes: Array<{
    trait_type: string
    value: string
  }>
}

// app/mint/schema.ts
import { z } from 'zod'

export const mintSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(1000),
  image: z.instanceof(File).nullable().refine((file) => file !== null, {
    message: 'Image is required',
  }),
  attributes: z.array(z.object({
    trait_type: z.string().min(1, 'Trait type required'),
    value: z.string().min(1, 'Value required'),
  })).max(10, 'Maximum 10 attributes allowed'),
})