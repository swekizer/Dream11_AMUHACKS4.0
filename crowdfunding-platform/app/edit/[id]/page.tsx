"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import Navbar from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function EditCampaignPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [campaign, setCampaign] = useState({
    title: "",
    description: "",
    goal_amount: 0,
    category: "",
  })

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error

        // Check if user owns this campaign
        if (data.user_id !== user?.id) {
          toast({
            title: "Access denied",
            description: "You don't have permission to edit this campaign.",
            variant: "destructive",
          })
          router.push('/profile')
          return
        }

        setCampaign({
          title: data.title,
          description: data.description || "",
          goal_amount: data.goal_amount,
          category: data.category,
        })
      } catch (error) {
        console.error("Error fetching campaign:", error)
        toast({
          title: "Error",
          description: "Failed to load campaign. Please try again.",
          variant: "destructive",
        })
        router.push('/profile')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchCampaign()
    }
  }, [params.id, user, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          title: campaign.title,
          description: campaign.description,
          goal_amount: campaign.goal_amount,
          category: campaign.category,
        })
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: "Campaign updated",
        description: "Your campaign has been successfully updated.",
      })
      router.push('/profile')
    } catch (error) {
      console.error("Error updating campaign:", error)
      toast({
        title: "Error",
        description: "Failed to update campaign. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-10">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Edit Campaign</CardTitle>
            <CardDescription>Update your campaign details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={campaign.title}
                  onChange={(e) => setCampaign({ ...campaign, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={campaign.description}
                  onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                  required
                  className="min-h-[200px] whitespace-pre-wrap"
                  placeholder="Enter your campaign description here..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Goal Amount (₹)</Label>
                <Input
                  id="goal"
                  type="number"
                  value={campaign.goal_amount}
                  onChange={(e) => setCampaign({ ...campaign, goal_amount: Number(e.target.value) })}
                  required
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={campaign.category}
                  onChange={(e) => setCampaign({ ...campaign, category: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/profile')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
} 