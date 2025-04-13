"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// Remove this line since these components aren't being used
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import CategoryIcon from "@/components/category-icon"
import { ArrowLeft, Search } from "lucide-react"
import Link from "next/link"

interface Fundraiser {
  id: string
  title: string
  description: string
  category: string
  image: string
  goal: number
  raised: number
  creator: string
  creatorImage: string
  createdAt: string
  endDate: string
  status: string
}

export default function CategoryPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "ending-soon" | "most-funded">("newest")
  const [categoryName, setCategoryName] = useState("")

  // Convert slug to category name (e.g., "arts-culture" -> "Arts & Culture")
  useEffect(() => {
    if (params.slug) {
      const slug = params.slug as string
      let name = slug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
      
      // Special case for "Arts & Culture"
      if (name === "Arts Culture") {
        name = "Arts & Culture"
      }
      
      setCategoryName(name)
    }
  }, [params.slug])

  useEffect(() => {
    async function fetchFundraisers() {
      try {
        setLoading(true)
        
        if (!supabase) {
          throw new Error('Supabase client is not initialized')
        }

        // Fetch campaigns by category
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('category', categoryName)
          .order('created_at', { ascending: false })

        if (campaignsError) {
          console.error('Error fetching campaigns:', campaignsError.message)
          throw campaignsError
        }

        if (!campaignsData || campaignsData.length === 0) {
          console.warn('No campaigns found for category:', categoryName)
          setFundraisers([])
          return
        }

        // Filter approved campaigns (or all if status doesn't exist)
        const approvedCampaigns = campaignsData.filter(campaign => 
          !campaign.status || campaign.status === 'approved'
        )

        // Fetch profiles for the campaign creators
        const userIds = approvedCampaigns.map(campaign => campaign.user_id)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url')
          .in('id', userIds)

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError.message)
          // Continue with anonymous creators if profile fetch fails
        }

        // Create a map of user IDs to profile data for easy lookup
        const profilesMap = new Map()
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.id, profile)
          })
        }

        // Transform the data to match our component's expectations
        const transformedData: Fundraiser[] = approvedCampaigns.map(campaign => {
          const profile = profilesMap.get(campaign.user_id)
          return {
            id: campaign.id.toString(),
            title: campaign.title,
            description: campaign.description || "",
            category: campaign.category,
            image: campaign.image_url || '/placeholder.svg?height=200&width=400',
            goal: campaign.goal_amount,
            raised: campaign.current_amount || 0,
            creator: profile?.name || 'Anonymous',
            creatorImage: profile?.avatar_url || "",
            createdAt: campaign.created_at,
            endDate: campaign.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: campaign.status || "active"
          }
        })

        // Sort the data based on the selected sort option
        let sortedData = [...transformedData]
        if (sortBy === "newest") {
          sortedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        } else if (sortBy === "ending-soon") {
          sortedData.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
        } else if (sortBy === "most-funded") {
          sortedData.sort((a, b) => b.raised - a.raised)
        }

        setFundraisers(sortedData)
      } catch (error) {
        console.error('Error in fetchFundraisers:', error)
        toast({
          title: "Error",
          description: "Failed to load fundraisers. Please try again.",
          variant: "destructive",
        })
        setFundraisers([])
      } finally {
        setLoading(false)
      }
    }

    if (categoryName) {
      fetchFundraisers()
    }
  }, [categoryName, sortBy, toast])

  // Filter fundraisers based on search term
  const filteredFundraisers = fundraisers.filter(fundraiser => 
    fundraiser.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fundraiser.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <Navbar />
      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <div className="flex items-center">
            <CategoryIcon category={categoryName} size={24} className="mr-2 text-primary" />
            <h1 className="text-2xl font-bold">{categoryName} Fundraisers</h1>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search fundraisers..."
              className="w-full rounded-md bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort" className="whitespace-nowrap">Sort by:</Label>
            <select
              id="sort"
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "ending-soon" | "most-funded")}
            >
              <option value="newest">Newest</option>
              <option value="ending-soon">Ending Soon</option>
              <option value="most-funded">Most Funded</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredFundraisers.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFundraisers.map((fundraiser) => (
              <Card key={fundraiser.id} className="overflow-hidden">
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={fundraiser.image}
                    alt={fundraiser.title}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardHeader className="p-4">
                  <div className="mb-2 flex items-center text-xs text-muted-foreground">
                    <CategoryIcon category={fundraiser.category} className="mr-1 h-3 w-3" />
                    {fundraiser.category}
                  </div>
                  <CardTitle className="line-clamp-2">{fundraiser.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{fundraiser.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="mb-2 flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={fundraiser.creatorImage} alt={fundraiser.creator} />
                      <AvatarFallback>{fundraiser.creator.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">by {fundraiser.creator}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        ₹{fundraiser.raised.toLocaleString()} raised
                      </span>
                      <span className="font-medium">₹{fundraiser.goal.toLocaleString()} goal</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(100, (fundraiser.raised / fundraiser.goal) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button asChild className="w-full">
                    <Link href={`/fundraiser/${fundraiser.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-medium">No fundraisers found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm
                ? `No fundraisers match your search "${searchTerm}". Try a different search term.`
                : `There are no fundraisers in the ${categoryName} category yet.`}
            </p>
            {user && (
              <Button asChild className="mt-4">
                <Link href="/create">Start a Fundraiser</Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </>
  )
}