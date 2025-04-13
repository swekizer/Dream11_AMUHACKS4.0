"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import Navbar from "@/components/navbar"
import CategoryIcon from "@/components/category-icon"
import { Heart, Share2, TrendingUp, Clock, Target, Award } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Donation {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

interface Campaign {
  id: string;
  title: string;
  category: string;
  image_url?: string;
  goal_amount: number;
  current_amount: number;
  user_id: string;
  created_at: string;
  status?: string;
  donations?: Donation[];
}

interface Fundraiser {
  id: string;
  title: string;
  category: string;
  image: string;
  goal: number;
  raised: number;
  creator: string;
  createdAt: string;
  featured: boolean;
  trending: boolean;
  donors?: number;
}

// Categories with counts
const categoryNames = [
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
]

export default function HomePage() {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([])
  // Remove this line since the state variable isn't being used
  // const [loading, setLoading] = useState(true)
  const [featuredFundraisers, setFeaturedFundraisers] = useState<Fundraiser[]>([])  
  const [trendingFundraisers, setTrendingFundraisers] = useState<Fundraiser[]>([])  
  // Remove this line since the state variable isn't being used
  // const [recentFundraisers, setRecentFundraisers] = useState<Fundraiser[]>([])
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])

  useEffect(() => {
    async function fetchFundraisers() {
      try {
        if (!supabase) {
          throw new Error('Supabase client is not initialized')
        }

        // First, fetch all campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select(`
            *,
            donations(
              id,
              amount,
              user_id,
              created_at
            )
          `)
          .order('created_at', { ascending: false })

        if (campaignsError) {
          console.error('Error fetching campaigns:', campaignsError.message)
          throw campaignsError
        }

        if (!campaignsData || campaignsData.length === 0) {
          console.warn('No campaigns found')
          setFundraisers([])
          setFeaturedFundraisers([])
          setTrendingFundraisers([])
          // Remove this line since setRecentFundraisers no longer exists
          // setRecentFundraisers([])
          return
        }

        // Filter approved campaigns (or all if status doesn't exist)
        const approvedCampaigns = campaignsData.filter(campaign => 
          !campaign.status || campaign.status === 'approved'
        )

        // Then, fetch all profiles for the campaign creators
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
        const transformedData: Fundraiser[] = approvedCampaigns.map((campaign: Campaign) => {
          const profile = profilesMap.get(campaign.user_id)
          const donations = campaign.donations || []
          const totalRaised = donations.reduce((sum, donation: Donation) => sum + (donation.amount || 0), 0)
          const uniqueDonors = new Set(donations.map((d: Donation) => d.user_id)).size
          return {
            id: campaign.id.toString(),
            title: campaign.title,
            category: campaign.category,
            image: campaign.image_url || '/placeholder.svg',
            goal: campaign.goal_amount,
            raised: totalRaised,
            creator: profile?.name || 'Anonymous',
            createdAt: campaign.created_at,
            featured: false,
            trending: false,
            donors: uniqueDonors
          }
        })

        setFundraisers(transformedData)
        
        // Set featured fundraisers (first 3)
        setFeaturedFundraisers(transformedData.slice(0, 3).map(f => ({ ...f, featured: true })))
        
        // Set trending fundraisers (next 4)
        setTrendingFundraisers(transformedData.slice(3, 7).map(f => ({ ...f, trending: true })))
        
        // Set recent fundraisers (all)
        // Set recent fundraisers (all)
        // Remove this line since setRecentFundraisers no longer exists
        // setRecentFundraisers(transformedData)
        
        // Calculate category counts
        const categoryCounts = categoryNames.map(name => {
          const count = transformedData.filter(f => f.category === name).length
          return { name, count }
        })
        setCategories(categoryCounts)
      } catch (error) {
        console.error('Error in fetchFundraisers:', error)
        // Set empty arrays to prevent undefined errors in the UI
        setFundraisers([])
        setFeaturedFundraisers([])
        setTrendingFundraisers([])
        // Remove this line
        // setRecentFundraisers([])
      } finally {
        // Remove this line since setLoading no longer exists
        // setLoading(false)
      }
    }

    fetchFundraisers()
  }, [])

  return (
    <>
      <Navbar />
      <main className="container px-4 py-6 md:px-6 md:py-8 lg:py-12">
        {/* Hero Section */}
        <section className="mx-auto max-w-5xl py-6 text-center md:py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="gradient-text">Make a Difference Today</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
            Support causes you care about and help create positive change in the world.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              <Link href="/create">Start a Fundraiser</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#explore">Explore Campaigns</Link>
            </Button>
          </div>
        </section>

        {/* Featured Section */}
        <section className="py-8 md:py-12">
          <div className="flex flex-col items-center justify-between gap-4 pb-6 md:flex-row">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Featured Fundraisers</h2>
              <p className="text-muted-foreground">Campaigns making a big impact right now</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredFundraisers.map((fundraiser) => (
              <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} featured />
            ))}
          </div>
        </section>

        {/* Explore Section */}
        <section id="explore" className="py-8 md:py-12">
          <div className="flex flex-col items-center justify-between gap-4 pb-6 md:flex-row">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Explore Fundraisers</h2>
              <p className="text-muted-foreground">Discover campaigns that need your support</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/explore">View All</Link>
            </Button>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-6 flex flex-wrap">
              <TabsTrigger value="all" className="flex items-center gap-1">
                All
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="newest" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Newest
              </TabsTrigger>
              <TabsTrigger value="nearingGoal" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Nearing Goal
              </TabsTrigger>
              <TabsTrigger value="mostFunded" className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                Most Funded
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {fundraisers.map((fundraiser) => (
                  <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="trending" className="space-y-4">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {trendingFundraisers.map((fundraiser) => (
                  <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="newest" className="space-y-4">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {fundraisers
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 6)
                  .map((fundraiser) => (
                    <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
                  ))}
              </div>
            </TabsContent>
            <TabsContent value="nearingGoal" className="space-y-4">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {fundraisers
                  .filter((f) => f.raised / f.goal >= 0.7 && f.raised / f.goal < 1)
                  .slice(0, 6)
                  .map((fundraiser) => (
                    <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
                  ))}
              </div>
            </TabsContent>
            <TabsContent value="mostFunded" className="space-y-4">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {fundraisers
                  .sort((a, b) => b.raised - a.raised)
                  .slice(0, 6)
                  .map((fundraiser) => (
                    <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Categories Section */}
        <section className="py-8 md:py-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">Browse by Category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/category/${category.name.toLowerCase().replace(" & ", "-")}`}
                className="flex flex-col items-center justify-center rounded-lg border bg-card p-4 text-center shadow-sm transition-all hover:scale-105 hover:bg-accent hover:text-accent-foreground"
              >
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CategoryIcon category={category.name} size={24} className="text-primary" />
                </div>
                <span className="font-medium">{category.name}</span>
                <span className="text-xs text-muted-foreground">{category.count} campaigns</span>
              </Link>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-8 md:py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">How It Works</h2>
            <p className="mx-auto mt-2 max-w-[700px] text-muted-foreground">
              Creating and supporting fundraisers is quick and easy
            </p>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="mt-4 text-xl font-bold">Create</h3>
              <p className="mt-2 text-muted-foreground">
                Start your fundraiser in minutes. Add a compelling story, photos, and set your goal.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                <span className="text-2xl font-bold text-secondary">2</span>
              </div>
              <h3 className="mt-4 text-xl font-bold">Share</h3>
              <p className="mt-2 text-muted-foreground">
                Spread the word through social media, email, and messaging to reach potential donors.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <span className="text-2xl font-bold text-accent">3</span>
              </div>
              <h3 className="mt-4 text-xl font-bold">Manage</h3>
              <p className="mt-2 text-muted-foreground">
                Track donations, post updates, and thank your supporters as you reach your goal.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              <Link href="/create">Start Your Fundraiser</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  )
}

interface FundraiserCardProps {
  fundraiser: Fundraiser;
  featured?: boolean;
}

function FundraiserCard({ fundraiser, featured = false }: FundraiserCardProps) {
  const progress = (fundraiser.raised / fundraiser.goal) * 100
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    // Check if the fundraiser is liked by the current user
    async function checkIfLiked() {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('likes')
          .select('*')
          .eq('user_id', user.id)
          .eq('campaign_id', fundraiser.id)
          .single()

        if (!error && data) {
          setIsLiked(true)
        }
      } catch (error) {
        console.error('Error checking like status:', error)
      }
    }

    checkIfLiked()
  }, [user, fundraiser.id])

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to like campaigns",
        variant: "destructive",
      })
      return
    }

    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('campaign_id', fundraiser.id)

        if (error) throw error

        setIsLiked(false)
        toast({
          title: "Campaign unliked",
          description: "Campaign has been removed from your liked list",
        })
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            campaign_id: fundraiser.id,
            created_at: new Date().toISOString(),
          })

        if (error) throw error

        setIsLiked(true)
        toast({
          title: "Campaign liked",
          description: "Campaign has been added to your liked list",
        })
      }
    } catch (error) {
      console.error('Error liking campaign:', error)
      toast({
        title: "Error",
        description: "Failed to like campaign. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    try {
      const shareData = {
        title: fundraiser.title,
        text: `Support ${fundraiser.title} on our crowdfunding platform`,
        url: `${window.location.origin}/fundraiser/${fundraiser.id}`,
      }

      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareData.url)
        toast({
          title: "Link copied",
          description: "Campaign link has been copied to your clipboard",
        })
      }
    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: "Error",
        description: "Failed to share campaign. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className={`overflow-hidden ${featured ? 'border-primary' : ''}`}>
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={fundraiser.image}
            alt={fundraiser.title}
            className="aspect-video w-full object-cover"
          />
          <div className="absolute bottom-2 left-2 flex gap-2">
            <Badge variant="secondary" className="bg-white/90">
              <CategoryIcon category={fundraiser.category} className="mr-1 h-3 w-3" />
              {fundraiser.category}
            </Badge>
            {featured && (
              <Badge variant="secondary" className="bg-white/90">
                <Award className="mr-1 h-3 w-3" />
                Featured
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2.5 p-4">
        <CardTitle className="line-clamp-1">{fundraiser.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          by {fundraiser.creator}
        </CardDescription>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">₹{fundraiser.raised.toLocaleString()}</span>
            <span className="text-gray-500">raised of ₹{fundraiser.goal.toLocaleString()}</span>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress)}% Complete</span>
              <span>{fundraiser.donors ? `${fundraiser.donors} donors` : ''}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={isLiked ? "default" : "ghost"}
            onClick={handleLike}
            className={isLiked ? "bg-primary text-primary-foreground" : ""}
          >
            <Heart className={`mr-1 h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            {isLiked ? "Liked" : "Like"}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleShare}>
            <Share2 className="mr-1 h-4 w-4" />
            Share
          </Button>
        </div>
        <Link href={`/fundraiser/${fundraiser.id}`}>
          <Button size="sm">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
