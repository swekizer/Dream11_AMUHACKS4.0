"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/components/auth-provider'

export default function CreateFundraiser() {
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const handleCreate = async (formData: FormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a fundraiser",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      )

      const campaignData = {
        title: formData.get('title'),
        description: formData.get('description'),
        goal_amount: parseFloat(formData.get('goal_amount') as string),
        category: formData.get('category'),
        user_id: user.id,
        status: 'pending',
        current_amount: 0,
        image_url: formData.get('image_url'),
      }

      const createPromise = supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single()

      const result = await Promise.race([createPromise, timeoutPromise]) as { data: any; error: any }
      const { data, error } = result
      
      if (error) throw error
      
      toast({
        title: "Success",
        description: "Your fundraiser has been created and is pending approval",
      })

      router.push(`/fundraiser/${data.id}`)
    } catch (error) {
      console.error('Error creating fundraiser:', error)
      
      if (!navigator.onLine) {
        toast({
          title: "Network Error",
          description: "Please check your internet connection",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Error",
        description: "Failed to create fundraiser. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create a Fundraiser</h1>
      <form onSubmit={(e) => {
        e.preventDefault()
        handleCreate(new FormData(e.currentTarget))
      }} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="goal_amount" className="block text-sm font-medium mb-2">
            Goal Amount
          </label>
          <input
            type="number"
            id="goal_amount"
            name="goal_amount"
            required
            min="1"
            step="0.01"
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Category
          </label>
          <select
            id="category"
            name="category"
            required
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select a category</option>
            <option value="medical">Medical</option>
            <option value="education">Education</option>
            <option value="emergency">Emergency</option>
            <option value="community">Community</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="image_url" className="block text-sm font-medium mb-2">
            Image URL
          </label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            className="w-full p-2 border rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={isCreating}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Fundraiser'}
        </button>
      </form>
    </div>
  )
}