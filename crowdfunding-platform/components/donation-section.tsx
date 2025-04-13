"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Heart, MessageCircle, Share2 } from "lucide-react"

interface DonationSectionProps {
  campaignId: string
  campaignTitle: string
  currentAmount: number
  goalAmount: number
  onDonationSuccess?: () => void
}

export default function DonationSection({
  campaignId,
  // Remove campaignTitle if you're not using it
  // campaignTitle,
  currentAmount,
  goalAmount,
  //onDonationSuccess
}: DonationSectionProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("donate")
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [hasLiked, setHasLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        
        // Check if user has liked this campaign
        const { data: likeData } = await supabase
          .from("likes")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("campaign_id", campaignId)
          .single()
        
        if (likeData) {
          setHasLiked(true)
        }
      }
    }
    
    checkUser()
    
    // Fetch comments
    fetchComments()
    
    // Fetch likes count
    fetchLikesCount()
  }, [campaignId])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user:profiles(id, full_name, avatar_url)
        `)
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      
      setComments(data || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const fetchLikesCount = async () => {
    try {
      const { count, error } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
      
      if (error) throw error
      
      setLikesCount(count || 0)
    } catch (error) {
      console.error("Error fetching likes count:", error)
    }
  }

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like this campaign",
        variant: "destructive",
      })
      return
    }
    
    try {
      setLoading(true)
      
      if (hasLiked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("campaign_id", campaignId)
        
        if (error) throw error
        
        setHasLiked(false)
        setLikesCount(prev => Math.max(0, prev - 1))
        
        toast({
          title: "Campaign unliked",
        })
      } else {
        // Like
        const { error } = await supabase
          .from("likes")
          .insert({
            user_id: user.id,
            campaign_id: campaignId,
          })
        
        if (error) throw error
        
        setHasLiked(true)
        setLikesCount(prev => prev + 1)
        
        toast({
          title: "Campaign liked!",
        })
      }
    } catch (error: any) {
      console.error("Error toggling like:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update like status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleComment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment",
        variant: "destructive",
      })
      return
    }
    
    if (!comment.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment",
        variant: "destructive",
      })
      return
    }
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          campaign_id: campaignId,
          content: comment.trim(),
        })
      
      if (error) throw error
      
      setComment("")
      fetchComments()
      
      toast({
        title: "Comment added",
      })
    } catch (error: any) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: "Link copied",
          description: "Campaign link copied to clipboard",
        })
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        })
      })
  }

  const progressPercentage = Math.min(100, (currentAmount / goalAmount) * 100)

  return (
    <Card className="w-full card-hover">
      <CardHeader className="space-y-4">
        <CardTitle className="text-3xl font-display font-bold text-primary">
          Support this Campaign
        </CardTitle>
        <CardDescription className="text-lg font-sans">
          Help reach the goal of ₹{goalAmount.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-primary">₹{currentAmount.toLocaleString()} raised</span>
            <span className="text-secondary">{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground font-sans">
            Goal: ₹{goalAmount.toLocaleString()}
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            variant={hasLiked ? "default" : "outline"} 
            size="lg" 
            onClick={handleLike}
            disabled={loading}
            className={`flex-1 ${hasLiked ? 'btn-primary' : ''}`}
          >
            <Heart className={`mr-2 h-5 w-5 ${hasLiked ? "fill-current" : ""}`} />
            {likesCount} {likesCount === 1 ? "Like" : "Likes"}
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => setActiveTab("comments")}
            className="flex-1"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Comments
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={handleShare}
            className="flex-1"
          >
            <Share2 className="mr-2 h-5 w-5" />
            Share
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="donate" className="font-medium">Donate</TabsTrigger>
            <TabsTrigger value="comments" className="font-medium">Comments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="donate" className="mt-4">
            <Card className="card-hover">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-3xl font-display font-bold text-primary">
                      ₹{currentAmount.toLocaleString()}
                    </h3>
                    <p className="text-sm text-muted-foreground font-sans">
                      raised of ₹{goalAmount.toLocaleString()} goal
                    </p>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <Button 
                    className="w-full btn-primary text-lg py-6"
                    onClick={() => {}}
                  >
                    Donate Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comments" className="mt-4 space-y-4">
            {user ? (
              <div className="space-y-4">
                <Textarea
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="font-sans"
                />
                <Button 
                  onClick={handleComment} 
                  disabled={loading || !comment.trim()}
                  className="w-full btn-secondary"
                >
                  Post Comment
                </Button>
              </div>
            ) : (
              <div className="text-center p-4 bg-muted rounded-md">
                <p className="font-sans">Please log in to leave a comment</p>
              </div>
            )}
            
            <div className="space-y-4 mt-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium font-display">{comment.user.full_name}</span>
                      <span className="text-xs text-muted-foreground font-sans">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-sans">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground font-sans">No comments yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}