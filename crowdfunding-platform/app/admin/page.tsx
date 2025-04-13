"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Navbar from "@/components/navbar"
import { Check, X, Eye, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Campaign {
  id: string
  title: string
  description: string
  category: string
  image_url: string
  goal_amount: number
  current_amount: number
  user_id: string
  created_at: string
  status: string
  creator_name: string
}

export default function AdminPage() {
  // Remove this line since it's not being used
  // const router = useRouter()
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check if admin is already logged in (from localStorage)
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (adminLoggedIn === "true") {
      setIsLoggedIn(true)
      fetchCampaigns()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple hardcoded admin credentials
    if (username === "admin" && password === "admin") {
      setIsLoggedIn(true)
      localStorage.setItem("adminLoggedIn", "true")
      fetchCampaigns()
      toast({
        title: "Login successful",
        description: "Welcome to the admin dashboard",
      })
    } else {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem("adminLoggedIn")
    setUsername("")
    setPassword("")
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin dashboard",
    })
  }

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError)
        throw campaignsError
      }

      const formattedCampaigns = campaignsData.map(campaign => ({
        ...campaign,
        creator_name: 'Unknown',
        status: campaign.status || 'pending'
      }))

      setCampaigns(formattedCampaigns)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast({
        title: "Error",
        description: "Failed to fetch campaigns. Please check your database connection.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id)
      
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'approved' })
        .eq('id', id)

      if (error) {
        console.error('Error approving campaign:', error)
        throw error
      }

      // Update local state
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === id 
            ? { ...campaign, status: 'approved' } 
            : campaign
        )
      )

      toast({
        title: "Campaign approved",
        description: "The campaign has been approved and is now visible to users.",
      })
    } catch (error) {
      console.error('Error approving campaign:', error)
      toast({
        title: "Error",
        description: "Failed to approve the campaign. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setProcessingId(id)
      
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (error) {
        console.error('Error rejecting campaign:', error)
        throw error
      }

      // Update local state
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === id 
            ? { ...campaign, status: 'rejected' } 
            : campaign
        )
      )

      toast({
        title: "Campaign rejected",
        description: "The campaign has been rejected and will not be visible to users.",
      })
    } catch (error) {
      console.error('Error rejecting campaign:', error)
      toast({
        title: "Error",
        description: "Failed to reject the campaign. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  // If not logged in, show login form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
              <CardDescription>Enter your admin credentials to access the dashboard</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter admin username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">Login</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    )
  }

  // If logged in, show admin dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {campaigns.filter(c => c.status === 'pending').length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No pending campaigns
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {campaigns
                    .filter(c => c.status === 'pending')
                    .map(campaign => (
                      <CampaignCard
                        key={campaign.id}
                        campaign={campaign}
                        onApprove={() => handleApprove(campaign.id)}
                        onReject={() => handleReject(campaign.id)}
                        processingId={processingId}
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {campaigns.filter(c => c.status === 'approved').length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No approved campaigns
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {campaigns
                    .filter(c => c.status === 'approved')
                    .map(campaign => (
                      <CampaignCard
                        key={campaign.id}
                        campaign={campaign}
                        onApprove={() => handleApprove(campaign.id)}
                        onReject={() => handleReject(campaign.id)}
                        processingId={processingId}
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {campaigns.filter(c => c.status === 'rejected').length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No rejected campaigns
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {campaigns
                    .filter(c => c.status === 'rejected')
                    .map(campaign => (
                      <CampaignCard
                        key={campaign.id}
                        campaign={campaign}
                        onApprove={() => handleApprove(campaign.id)}
                        onReject={() => handleReject(campaign.id)}
                        processingId={processingId}
                      />
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

function CampaignCard({ 
  campaign, 
  onApprove, 
  onReject, 
  processingId 
}: { 
  campaign: Campaign, 
  onApprove: (id: string) => void, 
  onReject: (id: string) => void,
  processingId: string | null
}) {
  const router = useRouter()
  
  const isProcessing = processingId === campaign.id

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }
  
  return (
    <Card>
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-32">
          <img
            src={campaign.image_url || "/placeholder.svg"}
            alt={campaign.title}
            className="h-full w-full object-cover sm:rounded-l-lg"
          />
        </div>
        <div className="flex flex-1 flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="line-clamp-1">{campaign.title}</CardTitle>
              {getStatusBadge(campaign.status)}
            </div>
            <CardDescription>
              {campaign.category} • Created by {campaign.creator_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="line-clamp-2 text-sm">{campaign.description}</p>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">
                ₹{campaign.current_amount.toLocaleString()} raised
              </span>
              <span className="font-medium">₹{campaign.goal_amount.toLocaleString()} goal</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${Math.min(100, (campaign.current_amount / campaign.goal_amount) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between gap-2 pt-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/fundraiser/${campaign.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
            <div className="flex gap-2">
              {campaign.status === 'pending' && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-green-600 hover:bg-green-50 hover:text-green-700"
                    onClick={() => onApprove(campaign.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onReject(campaign.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </>
                    )}
                  </Button>
                </>
              )}
              {campaign.status === 'rejected' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-green-600 hover:bg-green-50 hover:text-green-700"
                  onClick={() => onApprove(campaign.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
              )}
              {campaign.status === 'approved' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onReject(campaign.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  )
}
