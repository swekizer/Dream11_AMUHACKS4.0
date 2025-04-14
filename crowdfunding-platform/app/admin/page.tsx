"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface Campaign {
  id: string
  title: string
  description: string
  goal_amount: number
  current_amount: number
  category: string
  image_url: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user_id: string
}

export default function AdminPage() {
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (campaignsError) {
        throw campaignsError
      }

      setCampaigns(campaignsData || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast({
        title: "Error",
        description: "Failed to fetch campaigns",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (campaignId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId)

      if (error) throw error

      setCampaigns(campaigns.map(campaign =>
        campaign.id === campaignId
          ? { ...campaign, status: newStatus }
          : campaign
      ))

      toast({
        title: "Success",
        description: `Campaign ${newStatus} successfully`,
      })
    } catch (error) {
      console.error('Error updating campaign status:', error)
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Navbar />
      <main className="container max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and moderate fundraisers
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <div>Loading...</div>
            ) : campaigns.filter(c => c.status === 'pending').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending campaigns
              </div>
            ) : (
              campaigns
                .filter(c => c.status === 'pending')
                .map(campaign => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <CardTitle>{campaign.title}</CardTitle>
                      <CardDescription>
                        Goal: ${campaign.goal_amount}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p>{campaign.description}</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleStatusChange(campaign.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleStatusChange(campaign.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {loading ? (
              <div>Loading...</div>
            ) : campaigns.filter(c => c.status === 'approved').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No approved campaigns
              </div>
            ) : (
              campaigns
                .filter(c => c.status === 'approved')
                .map(campaign => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <CardTitle>{campaign.title}</CardTitle>
                      <CardDescription>
                        Goal: ${campaign.goal_amount}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{campaign.description}</p>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {loading ? (
              <div>Loading...</div>
            ) : campaigns.filter(c => c.status === 'rejected').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No rejected campaigns
              </div>
            ) : (
              campaigns
                .filter(c => c.status === 'rejected')
                .map(campaign => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <CardTitle>{campaign.title}</CardTitle>
                      <CardDescription>
                        Goal: ${campaign.goal_amount}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{campaign.description}</p>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
