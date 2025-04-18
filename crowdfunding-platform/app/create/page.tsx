"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import Navbar from "@/components/navbar"
import CategoryIcon from "@/components/category-icon"
import ConfettiCelebration from "@/components/confetti-celebration"
import { Info, AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fundraiserSchema, type FundraiserFormData } from "@/lib/validations/fundraiser"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { supabase } from "@/lib/supabase"

const categories = [
  "Education",
  "Healthcare",
  "Animals",
  "Environment",
  "Arts & Culture",
  "Emergency",
  "Community",
  "Sports",
  "Technology",
  "Other",
] as const

export default function CreateFundraiserPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const form = useForm<FundraiserFormData>({
    resolver: zodResolver(fundraiserSchema),
    defaultValues: {
      title: "",
      category: "",
      goal: 0,
      description: "",
      images: [],
      // endDate field removed as requested
    },
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + previewUrls.length > 5) {
      form.setError("images", {
        type: "manual",
        message: "Maximum 5 images allowed",
      })
      return
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Please upload only image files",
          variant: "destructive",
        })
      }
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        })
      }
      
      return isValidType && isValidSize
    })

    const imageUrls: string[] = []
    validFiles.forEach((file: File) => {
      try {
        const url = URL.createObjectURL(file) as string
        imageUrls.push(url)
      } catch (error) {
        console.error("Error creating object URL:", error)
      }
    })
    
    if (imageUrls.length > 0) {
      setPreviewUrls((prev: string[]) => [...prev, ...imageUrls])
      setValue("images", [...(watch("images") || []), ...validFiles])
    }
  }

  const removeImage = (index: number) => {
    const currentImages = watch("images")
    setValue(
      "images",
      (currentImages ?? []).filter((_, i: number) => i !== index)
    )
    const urlToRevoke = previewUrls[index]
    if (urlToRevoke) {
      URL.revokeObjectURL(urlToRevoke)
    }
    setPreviewUrls((prev: string[]) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: FundraiserFormData) => {
    setIsSubmitting(true)
    try {
      if (!user) {
        setIsSubmitting(false)
        throw new Error("You must be logged in to create a fundraiser")
      }

      // Validate required fields
      if (!data.title || !data.category || !data.description || data.goal <= 0) {
        throw new Error("Please fill in all required fields")
      }

      let imageUrl = null
      
      // Upload image first if exists
      if (data.images && data.images.length > 0) {
        const file = data.images[0]
        const fileExt = file?.name.split('.').pop() ?? 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        try {
          const { error: uploadError } = await supabase.storage
            .from('fundraiser-images')
            .upload(fileName, file as File)

          if (uploadError) {
            console.error('Upload error:', uploadError)
            throw new Error(`Image upload failed: ${uploadError.message}`)
          }

          const { data: { publicUrl } } = supabase.storage
            .from('fundraiser-images')
            .getPublicUrl(fileName)

          imageUrl = publicUrl
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr)
          // Continue with form submission even if image upload fails
          toast({
            title: "Warning",
            description: "Image upload failed, but your fundraiser will be created without images.",
            variant: "destructive",
          })
        }
      }

      console.log('Submitting to database with data:', {
        user_id: user.id,
        title: data.title,
        description: data.description,
        goal_amount: data.goal,
        category: data.category,
        image_url: imageUrl
      })

      // Create fundraiser with image URL
      const { data: fundraiser, error: dbError } = await supabase
        .from('campaigns')
        .insert([{
          user_id: user.id,
          title: data.title,
          description: data.description,
          goal_amount: data.goal,
          category: data.category,
          status: 'pending',
          current_amount: 0,
          image_url: imageUrl,
          end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString()
        }])
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        throw new Error(`Database error: ${dbError.message}`)
      }

      if (!fundraiser) {
        throw new Error("Failed to create fundraiser")
      }

      setShowCelebration(true)
      toast({
        title: "Success!",
        description: "Your fundraiser has been created and is pending approval.",
      })
      
      // Short delay before redirecting to ensure toast is seen
      setTimeout(() => {
        router.push(`/fundraiser/${fundraiser.id}`)
      }, 1500)
    } catch (error) {
      console.error('Error creating fundraiser:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create fundraiser. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url: string) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  return (
    <>
      <Navbar />
      <main className="container max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Create a Fundraiser</h1>
          <p className="mt-1 text-muted-foreground">Fill out the form below to create your fundraiser.</p>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Important Information</AlertTitle>
          <AlertDescription>
            Your fundraiser will be submitted for review. Once approved by our admin team, it will be published and visible to donors. Make sure all information is accurate and complete.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Basic Information</h2>

            <div className="grid gap-2">
              <Label htmlFor="title" className="flex items-center gap-1">
                Title {errors.title && <AlertCircle className="h-4 w-4 text-destructive" />}
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Give your fundraiser a clear, specific title"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message || "Title is required"}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category" className="flex items-center gap-1">
                Category {errors.category && <AlertCircle className="h-4 w-4 text-destructive" />}
              </Label>
              <Select onValueChange={(value) => setValue("category", value)}>
                <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={category} size={16} />
                        {category}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category.message || "Category is required"}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">
                Goal Amount (₹) {errors.goal && <AlertCircle className="h-4 w-4 text-destructive" />}
              </Label>
              <Input
                id="goal"
                type="number"
                min="1"
                placeholder="Enter your fundraising goal"
                {...register("goal", { 
                  valueAsNumber: true,
                  validate: (value) => value > 0 || "Goal amount must be greater than 0"
                })}
              />
              {errors.goal && (
                <p className="text-sm text-destructive">{errors.goal.message}</p>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Your fundraiser will automatically close after 3 months.</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Description</h2>
            <div className="grid gap-2">
              <Label htmlFor="description" className="flex items-center gap-1">
                Tell your story and explain why you're raising funds{" "}
                {errors.description && <AlertCircle className="h-4 w-4 text-destructive" />}
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Provide details about your fundraiser, why it matters, and how the funds will be used..."
                rows={8}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message || "Description is required"}</p>}
              <p className="text-xs text-muted-foreground">
                Tip: A detailed and compelling story increases your chances of reaching your goal.
              </p>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Images</h2>
            <div className="grid gap-2">
              <Label htmlFor="images" className="flex items-center gap-1">
                Upload Images {errors.images && <AlertCircle className="h-4 w-4 text-destructive" />}
              </Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              {errors.images && <p className="text-xs text-destructive">{errors.images.message}</p>}
              <p className="text-xs text-muted-foreground">
                Upload up to 5 images. The first image will be used as the main image.
              </p>
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {previewUrls.map((url, index) => (
                    <div key={url} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Fundraiser"}
          </Button>
        </form>
      </main>
      <ConfettiCelebration show={showCelebration} onComplete={() => setShowCelebration(false)} />
    </>
  )
}
