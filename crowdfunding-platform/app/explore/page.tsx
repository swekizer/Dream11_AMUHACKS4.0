"use client"

import { useState, useEffect } from "react"
// Remove the unused Button import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import Navbar from "@/components/navbar"
import CategoryIcon from "@/components/category-icon"
import { Search, Filter } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Campaign {
  id: string
  title: string
  description: string
  category: string
  image_url: string
  goal_amount: number
  current_amount: number
  created_at: string
  user_id: string
  status: string
  creator_name: string
}

export default function ExplorePage() {
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  const categories = [
    "Medical",
    "Education",
    "Emergency",
    "Community",
    "Creative",
    "Environment",
    "Other"
  ]

  useEffect(() => {
    fetchCampaigns()
  }, [selectedCategory, sortBy])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      console.log('Starting fetchCampaigns with params:', { selectedCategory, sortBy })

      // First try a simple query without joins
      let query = supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedCategory !== "all") {
        query = query.eq('category', selectedCategory)
      }

      if (sortBy === "newest") {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === "goal") {
        query = query.order('goal_amount', { ascending: false })
      } else if (sortBy === "progress") {
        query = query.order('current_amount', { ascending: false })
      }

      console.log('Executing Supabase query...')
      const { data, error } = await query

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          error: JSON.stringify(error, null, 2)
        })
        toast({
          title: "Error fetching campaigns",
          description: error.message || "Failed to load campaigns. Please try again later.",
          variant: "destructive",
        })
        return
      }

      console.log('Query successful, data:', data)

      if (!data) {
        console.error('No data returned from Supabase')
        toast({
          title: "Error",
          description: "No campaigns found",
          variant: "destructive",
        })
        return
      }

      // For now, set creator_name to a default value
      const formattedCampaigns = data.map((campaign: any) => ({
        ...campaign,
        creator_name: 'Anonymous'
      }))

      setCampaigns(formattedCampaigns)
    } catch (err) {
      console.error('Unexpected error:', err)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Navbar />
      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Explore Campaigns</h1>
              <p className="mt-1 text-muted-foreground">
                Discover and support meaningful causes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64 sm:flex-none">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="goal">Highest Goal</SelectItem>
                  <SelectItem value="progress">Most Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Card key={n} className="overflow-hidden">
                  <div className="aspect-video animate-pulse bg-muted" />
                  <CardHeader>
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-2 w-full animate-pulse rounded bg-muted" />
                      <div className="h-2 w-4/5 animate-pulse rounded bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((campaign) => {
                const percentRaised = Math.min(100, (campaign.current_amount / campaign.goal_amount) * 100)
                return (
                  <Card key={campaign.id} className="overflow-hidden transition-all hover:shadow-lg">
                    <a href={`/fundraiser/${campaign.id}`} className="block">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={campaign.image_url || "/placeholder.svg"}
                          alt={campaign.title}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <CategoryIcon category={campaign.category} className="h-4 w-4 text-primary" />
                          <div className="rounded-full bg-muted px-2 py-0.5 text-xs">
                            {campaign.category}
                          </div>
                        </div>
                        <CardTitle className="line-clamp-1">{campaign.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {campaign.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-primary">₹{campaign.current_amount.toLocaleString()}</span>
                            <span className="text-muted-foreground">{Math.round(percentRaised)}% of ₹{campaign.goal_amount.toLocaleString()}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${percentRaised}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>By {campaign.creator_name}</span>
                            <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </a>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Filter className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-xl font-semibold">No campaigns found</h2>
              <p className="mt-2 text-center text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Check back later for new campaigns"}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}