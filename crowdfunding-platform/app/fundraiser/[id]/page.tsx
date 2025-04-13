"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// Removed unused Checkbox import
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import Navbar from "@/components/navbar"
import CategoryIcon from "@/components/category-icon"
import ConfettiCelebration from "@/components/confetti-celebration"
import { Calendar, Heart, Share2, MessageCircle, ThumbsUp, Send, Loader2, CheckCircle2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
//import { Skeleton } from "@/components/ui/skeleton"
//import DonationSection from "@/components/donation-section"
import DonationSuccessDialog from "@/components/donation-success-dialog"
import DonationDialog from "@/components/donation-dialog"

// Interface for fundraiser data
interface FundraiserData {
  id: string;
  title: string;
  category: string;
  image: string;
  goal: number;
  raised: number;
  creator: string;
  createdAt: string;
  description: string;
  updates: {
    id: string;
    date: string;
    title: string;
    content: string;
  }[];
  donors: {
    id: string;
    name: string;
    amount: number;
    date: string;
    anonymous: boolean;
  }[];
  comments: {
    id: string;
    content: string;
    author: string;
    createdAt: string;
  }[];
}

export default function FundraiserPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [fundraiser, setFundraiser] = useState<FundraiserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [donationAmount, setDonationAmount] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [commentContent, setCommentContent] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [similarFundraisers, setSimilarFundraisers] = useState<any[]>([])
  const [loadingSimilar, setLoadingSimilar] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  // Remove this line since the state variable isn't being used
  // const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // Remove this line since the state variable isn't being used
  // const [isCreator, setIsCreator] = useState(false)
  // Remove this line since the state variable isn't being used
  // const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [donationSuccess, setDonationSuccess] = useState<{
    amount: number
    isAnonymous: boolean
  } | null>(null)
  const [showDonationDialog, setShowDonationDialog] = useState(false)

  // Fetch similar fundraisers based on category
  const fetchSimilarFundraisers = async (category: string, currentId: string) => {
    try {
      setLoadingSimilar(true)
      
      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }

      // Fetch campaigns with the same category, excluding the current one
      const { data: similarData, error: similarError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('category', category)
        .neq('id', currentId)
        .limit(3)
        .order('created_at', { ascending: false })

      if (similarError) {
        console.error('Error fetching similar fundraisers:', similarError.message)
        throw similarError
      }

      if (!similarData || similarData.length === 0) {
        setSimilarFundraisers([])
        return
      }

      // Filter approved campaigns (or all if status doesn't exist)
      const approvedSimilarData = similarData.filter(campaign => 
        !campaign.status || campaign.status === 'approved'
      )

      // Transform the data
      const transformedData = approvedSimilarData
        .filter(campaign => campaign && campaign.id) // Filter out any undefined or null campaigns
        .map(campaign => ({
          id: campaign.id ? campaign.id.toString() : '',
          title: campaign.title || 'Untitled Campaign',
          image: campaign.image_url || '/placeholder.svg?height=64&width=64',
          goal: campaign.goal_amount || 0,
          raised: campaign.current_amount || 0
        }))

      setSimilarFundraisers(transformedData)
    } catch (error) {
      console.error('Error in fetchSimilarFundraisers:', error)
      setSimilarFundraisers([])
    } finally {
      setLoadingSimilar(false)
    }
  }

  // Fetch fundraiser data
  const fetchFundraiser = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }

      // Fetch campaign data
      const { data: fundraiserData, error: fundraiserError } = await supabase
        .from('campaigns')
        .select(`
          *,
          donations:donations(
            id,
            amount,
            created_at,
            user_id,
            message
          )
        `)
        .eq('id', params.id)
        .single()

      if (fundraiserError) {
        console.error('Error fetching fundraiser:', fundraiserError.message)
        throw fundraiserError
      }

      if (!fundraiserData) {
        setError('Fundraiser not found')
        setLoading(false)
        return
      }

      // Check if the fundraiser is approved (or if status doesn't exist)
      if (fundraiserData.status && fundraiserData.status !== 'approved') {
        setError('This fundraiser is not available. It may be pending approval or has been rejected.')
        setLoading(false)
        return
      }

      // Calculate total donations and unique donors
      const donations = fundraiserData.donations || []
      const totalDonations = donations.reduce((sum: number, donation: any) => sum + (donation.amount || 0), 0)
// Removed unused uniqueDonors calculation

      // Fetch creator profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', fundraiserData.user_id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError.message)
        // Continue with anonymous creator if profile fetch fails
      }

      // Transform the data
      const transformedData: FundraiserData = {
        id: fundraiserData.id.toString(),
        title: fundraiserData.title,
        category: fundraiserData.category,
        image: fundraiserData.image_url || '/placeholder.svg',
        goal: fundraiserData.goal_amount,
        raised: totalDonations,
        creator: profileData?.name || 'Anonymous',
        createdAt: fundraiserData.created_at,
        description: fundraiserData.description || '',
        updates: [],
        donors: donations.map((d: any) => ({
          id: d.id.toString(),
          name: d.message === "Anonymous donation" ? "Anonymous" : "Anonymous Donor",
          amount: d.amount,
          date: d.created_at,
          anonymous: d.message === "Anonymous donation"
        })),
        comments: []
      }

      setFundraiser(transformedData)

      // Fetch similar fundraisers if category is available
      if (fundraiserData.category) {
        fetchSimilarFundraisers(fundraiserData.category, fundraiserData.id)
      }

      // Check if user has liked this fundraiser
      if (user && user.id) {
        const { data: likeData, error: likeError } = await supabase
          .from('likes')
          .select('*')
          .eq('user_id', user.id)
          .eq('campaign_id', params.id)
          .single()

        if (!likeError && likeData) {
          setIsLiked(true)
        }
      }
    } catch (error) {
      console.error('Error in fetchFundraiser:', error)
      setError('Failed to load fundraiser. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFundraiser()
  }, [params.id])

  // If loading, show loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container flex min-h-[60vh] items-center justify-center px-4 py-6 md:px-6 md:py-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading fundraiser...</p>
          </div>
        </main>
      </>
    )
  }

  // If error, show error state
  if (error || !fundraiser) {
    return (
      <>
        <Navbar />
        <main className="container flex min-h-[60vh] items-center justify-center px-4 py-6 md:px-6 md:py-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-destructive">{error || "Fundraiser not found"}</p>
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </div>
        </main>
      </>
    )
  }

  const percentRaised = Math.min(100, (fundraiser.raised / fundraiser.goal) * 100)
  const isNearGoal = percentRaised >= 70 && percentRaised < 100
  const isGoalReached = percentRaised >= 100

  const handleProceedToPayment = () => {
    if (!donationAmount || isNaN(parseFloat(donationAmount)) || parseFloat(donationAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      })
      return
    }
    setShowPaymentDialog(true)
  }

  const handleDonation = async () => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to make a donation",
          variant: "destructive",
        })
        return
      }

      // Create donation record
      const { data: donation, error: donationError } = await supabase
        .from('donations')
        .insert({
          campaign_id: params.id,
          user_id: user.id,
          amount: parseFloat(donationAmount),
          message: isAnonymous ? "Anonymous donation" : null
        })
        .select()
        .single()

      if (donationError) throw donationError

      const newAmount = fundraiser.raised + parseFloat(donationAmount);

      // Update campaign's current amount
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ 
          current_amount: newAmount
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      // Fetch updated campaign data to ensure we have the latest state
      const { data: updatedCampaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', params.id)
        .single()

      if (fetchError) throw fetchError

      // Update local state with fresh data
      setFundraiser(prev => prev ? {
        ...prev,
        ...updatedCampaign,
        raised: newAmount,
        donors: [
          {
            id: donation.id.toString(),
            name: isAnonymous ? "Anonymous" : user.name || "Anonymous",
            amount: parseFloat(donationAmount),
            date: new Date().toISOString(),
            anonymous: isAnonymous,
          },
          ...prev.donors,
        ],
      } : null)

      setShowPaymentDialog(false)
      setDonationSuccess({
        amount: parseFloat(donationAmount),
        isAnonymous: isAnonymous
      })
      setShowSuccessDialog(true)
      setDonationAmount("")
      setIsAnonymous(false)

      toast({
        title: "Thank you for your donation!",
        description: "Your contribution has been recorded.",
      })
    } catch (error) {
      console.error('Error processing donation:', error)
      toast({
        title: "Error",
        description: "Failed to process donation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleComment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post a comment.",
        variant: "destructive",
      })
      return
    }

    if (!commentContent.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment.",
        variant: "destructive",
      })
      return
    }

    try {
      // First, insert the comment without trying to select related data
      const { data, error } = await supabase
        .from('comments')
        .insert({
          campaign_id: params.id,
          user_id: user.id,
          content: commentContent,
        })
        .select()
        .single()

      if (error) {
        console.error('Comment error details:', error)
        throw error
      }

      if (!data) {
        throw new Error('No comment data returned')
      }

      // Create a simplified comment object for local state
      const newComment = {
        id: data.id.toString(),
        user: {
          name: user && user.name ? user.name : "Anonymous",
          image: user && user.profilePicture ? user.profilePicture : "/placeholder.svg?height=40&width=40",
        },
        content: data.content,
        date: data.created_at,
        likes: 0,
      }

      setComments(prev => [newComment, ...prev])
      setCommentContent("")
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully.",
      })
    } catch (error) {
      console.error("Error posting comment:", error)
      toast({
        title: "Error",
        description: "There was a problem posting your comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like comments.",
        variant: "destructive",
      })
      return
    }

    try {
      // Check if user has already liked this comment
      const { data: existingLike, error: checkError } = await supabase
        .from('comment_likes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw checkError
      }

      if (existingLike) {
        // User has already liked the comment, so unlike it
        const { error: unlikeError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)

        if (unlikeError) throw unlikeError

        // Update comment likes count in the database
        const currentLikes = comments.find(c => c.id === commentId)?.likes || 0
        const { error: updateError } = await supabase
          .from('comments')
          .update({ likes: Math.max(0, currentLikes - 1) })
          .eq('id', commentId)

        if (updateError) throw updateError

        // Update local state
        setComments(prev =>
          prev.map(comment =>
            comment.id === commentId
              ? { ...comment, likes: Math.max(0, comment.likes - 1) }
              : comment
          )
        )
      } else {
        // User hasn't liked the comment yet, so add the like
        const { error: likeError } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          })

        if (likeError) throw likeError

        // Update comment likes count in the database
        const currentLikes = comments.find(c => c.id === commentId)?.likes || 0
        const { error: updateError } = await supabase
          .from('comments')
          .update({ likes: currentLikes + 1 })
          .eq('id', commentId)

        if (updateError) throw updateError

        // Update local state
        setComments(prev =>
          prev.map(comment =>
            comment.id === commentId
              ? { ...comment, likes: comment.likes + 1 }
              : comment
          )
        )
      }
    } catch (error) {
      console.error("Error handling comment like:", error)
      toast({
        title: "Error",
        description: "There was a problem liking the comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link copied",
      description: "Fundraiser link copied to clipboard.",
    })
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleDonationSuccess = async (amount: number) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to make a donation",
          variant: "destructive",
        })
        return
      }

      // Create donation record
      const { data: donation, error: donationError } = await supabase
        .from('donations')
        .insert({
          campaign_id: params.id,
          user_id: user.id,
          amount: amount,
          message: null
        })
        .select()
        .single()

      if (donationError) throw donationError

      const newAmount = fundraiser.raised + amount;

      // Update campaign's current amount
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ 
          current_amount: newAmount
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      // Update local state with fresh data
      setFundraiser(prev => prev ? {
        ...prev,
        raised: newAmount,
        donors: [
          {
            id: donation.id.toString(),
            name: user.name || "Anonymous",
            amount: amount,
            date: new Date().toISOString(),
            anonymous: false,
          },
          ...prev.donors,
        ],
      } : null)

      toast({
        title: "Thank you for your donation!",
        description: "Your contribution has been recorded.",
      })
    } catch (error) {
      console.error('Error processing donation:', error)
      toast({
        title: "Error",
        description: "Failed to process donation. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Navbar />
      <main className="container px-4 py-6 md:px-6 md:py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Cover Image */}
              <div className="overflow-hidden rounded-lg">
                <img
                  src={fundraiser.image || "/placeholder.svg"}
                  alt={fundraiser.title}
                  className="aspect-video w-full object-cover"
                />
              </div>

              {/* Title and Actions */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <CategoryIcon category={fundraiser.category} className="text-primary" />
                    <div className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {fundraiser.category}
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">{fundraiser.title}</h1>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleLike}
                    className={isLiked ? "text-secondary border-secondary" : ""}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? "fill-secondary" : ""}`} />
                    <span className="sr-only">Like</span>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-5 w-5" />
                        <span className="sr-only">Share</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share this fundraiser</DialogTitle>
                        <DialogDescription>
                          Help spread the word by sharing this fundraiser with your network.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-3">
                        <Button
                          variant="outline"
                          className="flex flex-col gap-2 p-4"
                          onClick={handleShare}
                        >
                          <span>Twitter</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col gap-2 p-4"
                          onClick={handleShare}
                        >
                          <span>Facebook</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col gap-2 p-4"
                          onClick={handleShare}
                        >
                          <span>WhatsApp</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col gap-2 p-4 sm:col-span-3"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href)
                            toast({
                              title: "Link copied",
                              description: "Fundraiser link copied to clipboard.",
                            })
                          }}
                        >
                          <span>Copy Link</span>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Creator Info */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full">
                  <img
                    src={"/placeholder.svg"}
                    alt={fundraiser.creator}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created by</p>
                  <p className="font-medium">{fundraiser.creator}</p>
                </div>
                <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(fundraiser.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="about">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                  <TabsTrigger value="donors">Donors</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="mt-4 space-y-4">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{fundraiser.description}</p>
                  </div>
                </TabsContent>
                <TabsContent value="comments" className="mt-4 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Join the Conversation</CardTitle>
                      <CardDescription>Share your thoughts or words of encouragement.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user?.profilePicture || ""} alt={user?.name || "User"} />
                            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="relative">
                              <Textarea
                                placeholder="Write a comment..."
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                className="min-h-[80px] pr-12"
                              />
                              <Button
                                size="icon"
                                className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary"
                                onClick={handleComment}
                                disabled={!commentContent.trim()}
                              >
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg border bg-card p-4">
                          <div className="flex gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={comment.user && comment.user.image ? comment.user.image : "/placeholder.svg"}
                                alt={comment.user && comment.user.name ? comment.user.name : "User"}
                              />
                              <AvatarFallback>
                                {comment.user && comment.user.name ? comment.user.name.charAt(0) : "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{comment.user && comment.user.name ? comment.user.name : "Anonymous User"}</h4>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <p className="mt-1 text-sm">{comment.content}</p>
                              <div className="mt-2 flex items-center gap-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0 text-muted-foreground"
                                  onClick={() => handleLikeComment(comment.id)}
                                >
                                  <ThumbsUp className="mr-1 h-4 w-4" /> {comment.likes}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground">
                                  <MessageCircle className="mr-1 h-4 w-4" /> Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <h3 className="text-lg font-medium">No Comments Yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Be the first to leave a comment on this fundraiser.
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="donors" className="mt-4">
                  <div className="space-y-4">
                    {fundraiser.donors && fundraiser.donors.length > 0 ? (
                      fundraiser.donors.map((donor) => (
                        <div key={donor.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{donor.anonymous ? "A" : donor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{donor.anonymous ? "Anonymous" : donor.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(donor.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm font-medium">₹{donor.amount.toLocaleString()}</div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border p-4 text-center text-muted-foreground">
                        No donations yet. Be the first to donate!
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span>{fundraiser.donors.length} donors</span>
                    <span>{Math.round(percentRaised)}% of goal</span>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">₹{fundraiser.raised.toLocaleString()}</h3>
                    <p className="text-sm text-muted-foreground">
                      raised of ₹{fundraiser.goal.toLocaleString()} goal
                    </p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isGoalReached
                          ? "bg-gradient-to-r from-primary to-accent"
                          : isNearGoal
                            ? "bg-gradient-to-r from-primary to-secondary"
                            : "bg-primary"
                      }`}
                      style={{
                        width: `${percentRaised}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{fundraiser.donors.length} donors</span>
                    <span>{Math.round(percentRaised)}% of goal</span>
                  </div>

                  {isNearGoal && (
                    <div className="rounded-md bg-secondary/10 p-3 text-center text-sm">
                      <Badge variant="secondary" className="mb-1">
                        Almost There!
                      </Badge>
                      <p>This fundraiser is close to reaching its goal. Your donation can make a big difference!</p>
                    </div>
                  )}

                  {isGoalReached && (
                    <div className="rounded-md bg-accent/10 p-3 text-center text-sm">
                      <Badge variant="accent" className="mb-1">
                        Goal Reached!
                      </Badge>
                      <p>This fundraiser has reached its goal, but you can still contribute to help them exceed it!</p>
                    </div>
                  )}

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={() => setShowDonationDialog(true)}
                  >
                    Donate Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Similar Fundraisers</CardTitle>
                <CardDescription>Other campaigns you might be interested in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingSimilar ? (
                  <div className="flex min-h-[100px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : similarFundraisers.length > 0 ? (
                  similarFundraisers.map((similar) => {
                    if (!similar) return null;

                    return (
                      <div key={similar.id} className="flex gap-4 rounded-md">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                          <img
                            src={similar.image || "/placeholder.svg"}
                            alt={similar.title || "Similar fundraiser"}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium line-clamp-1">{similar.title || "Untitled Campaign"}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            ₹{similar.raised ? similar.raised.toLocaleString() : "0"} raised of ₹{similar.goal ? similar.goal.toLocaleString() : "0"} goal
                          </p>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary" asChild>
                            <a href={`/fundraiser/${similar.id || ""}`}>View Campaign</a>
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-muted-foreground">
                    No similar fundraisers found.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <ConfettiCelebration 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />
      <DonationSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        amount={donationSuccess?.amount || 0}
        fundraiserTitle={fundraiser?.title || ""}
        isAnonymous={donationSuccess?.isAnonymous || false}
        donorName={user?.name || "Anonymous"}
      />
      <DonationDialog
        isOpen={showDonationDialog}
        onClose={() => setShowDonationDialog(false)}
        fundraiserTitle={fundraiser.title}
        onDonationSuccess={handleDonationSuccess}
      />
    </>
  )
}
