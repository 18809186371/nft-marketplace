'use client'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Attribute {
  trait_type: string
  value: string
}

interface AttributesFormProps {
  attributes: Attribute[]
  onChange: (attrs: Attribute[]) => void
}

export function AttributesForm({ attributes, onChange }: AttributesFormProps) {
  const addAttribute = () => {
    onChange([...attributes, { trait_type: '', value: '' }])
  }

  const updateAttribute = (index: number, field: keyof Attribute, value: string) => {
    const newAttrs = [...attributes]
    newAttrs[index][field] = value
    onChange(newAttrs)
  }

  const removeAttribute = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Attributes</h3>
        <Button
          type="button"
        //   variant="outline"
        //   size="sm"
          onClick={addAttribute}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      {attributes.map((attr, index) => (
        <div key={index} className="flex gap-2 items-center">
          <Input
            placeholder="Trait (e.g., Color)"
            value={attr.trait_type}
            onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
          />
          <Input
            placeholder="Value (e.g., Blue)"
            value={attr.value}
            onChange={(e) => updateAttribute(index, 'value', e.target.value)}
          />
          <Button
            type="button"
            onClick={() => removeAttribute(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {attributes.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No attributes added. Add traits like rarity, color, etc.
        </p>
      )}
    </div>
  )
}