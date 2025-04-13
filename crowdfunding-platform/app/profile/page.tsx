"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import { useToast } from "@/components/ui/use-toast"
import CampaignCard from '@/components/campaign-card';
import DonationCard from '@/components/donation-card';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
}

interface Campaign {
  id: string;
  title: string;
  image_url?: string;
  goal_amount: number;
  current_amount: number;
  category: string;
  created_at: string;
  status: string;
}

interface Donation {
  id: string;
  amount: number;
  message?: string;
  created_at: string;
  campaign_id: string;
  campaign: Campaign | null;
}

interface LikedCampaign {
  id: string;
  campaign_id: string;
  campaign: Campaign | null;
}


export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [likedCampaigns, setLikedCampaigns] = useState<LikedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("fundraisers");
  
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast()
  
  // Define loadProfile function
  const loadProfile = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
          
      if (profileError) throw profileError
      
      setProfile(profileData as Profile)
      
      // Fetch user's campaigns with fresh data
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, title, image_url, goal_amount, current_amount, category, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
          
      if (campaignsError) throw campaignsError
      setCampaigns(campaignsData || [])

      // Fetch user's donations
      try {
        const { data: donationsData, error: donationsError } = await supabase
          .from('donations')
          .select('id, amount, message, created_at, campaign_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (donationsError) {
          console.error("Error fetching donations:", donationsError);
          setDonations([]);
        } else if (donationsData && donationsData.length > 0) {
          // Get campaign details for donations
          const campaignIds = donationsData
            .filter(donation => donation.campaign_id)
            .map(donation => donation.campaign_id);
            
          let campaignsMap: Record<string, Campaign> = {};
          
          if (campaignIds.length > 0) {
            const { data: campaignsData, error: campaignsError } = await supabase
              .from('campaigns')
              .select('id, title, image_url, goal_amount, current_amount')
              .in('id', campaignIds);
              
            if (campaignsError) {
              console.error("Error fetching campaigns:", campaignsError);
            } else if (campaignsData && Array.isArray(campaignsData)) {
              campaignsMap = campaignsData.reduce((acc: Record<string, Campaign>, campaign) => {
                if (campaign && campaign.id) {
                  acc[campaign.id] = {
                    ...campaign,
                    category: '',
                    created_at: new Date().toISOString(),
                    status: 'active'
                  };
                }
                return acc;
              }, {});
            }
          }
          
          const transformedDonations = donationsData.map(donation => ({
            ...donation,
            campaign: donation.campaign_id ? campaignsMap[donation.campaign_id] || null : null
          }));
          
          setDonations(transformedDonations);
        } else {
          setDonations([]);
        }
      } catch (donationErr) {
        console.error("Exception in donations fetch:", donationErr);
        setDonations([]);
      }
      
      // Fetch liked campaigns
      try {
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('id, campaign_id')
          .eq('user_id', user.id);
          
        if (likesError) {
          console.error("Error fetching likes:", likesError);
          setLikedCampaigns([]);
        } else if (likesData && likesData.length > 0) {
          const campaignIds = likesData.map(like => like.campaign_id);
          
          const { data: likedCampaignsData, error: likedCampaignsError } = await supabase
            .from('campaigns')
            .select('*')
            .in('id', campaignIds);
            
          if (likedCampaignsError) {
            console.error("Error fetching liked campaigns:", likedCampaignsError);
            setLikedCampaigns([]);
          } else {
            const campaignsMap = likedCampaignsData.reduce((acc: Record<string, Campaign>, campaign) => {
              acc[campaign.id] = campaign;
              return acc;
            }, {});
            
            const transformedLikes = likesData.map(like => ({
              ...like,
              campaign: campaignsMap[like.campaign_id] || null
            }));
            
            setLikedCampaigns(transformedLikes);
          }
        } else {
          setLikedCampaigns([]);
        }
      } catch (likesErr) {
        console.error("Exception in likes fetch:", likesErr);
        setLikedCampaigns([]);
      }
    } catch (err) {
      console.error("Error reloading profile:", err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadProfile()
  }, [user, authLoading])

  // Add real-time subscription for campaign updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('campaign-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `user_id=eq.${user.id}`
        },
        (payload: RealtimePostgresChangesPayload<Campaign>) => {
          // Update the campaigns list when changes occur
          if (payload.new && 'id' in payload.new) {
            setCampaigns(currentCampaigns => 
              currentCampaigns.map(campaign => 
                campaign.id === payload.new.id 
                  ? { ...campaign, ...payload.new }
                  : campaign
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const handleDeleteCampaign = async (campaignId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete a campaign.",
        variant: "destructive",
      })
      return
    }

    try {
      // First verify the campaign exists and belongs to the user
      const { data: campaignCheck, error: checkError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (checkError) {
        console.error("Error checking campaign:", checkError)
        throw new Error("Campaign not found")
      }

      console.log("Campaign check:", campaignCheck)
      console.log("Current user:", user.id)

      if (!campaignCheck || campaignCheck.user_id !== user.id) {
        console.error("Permission mismatch - Campaign user_id:", campaignCheck?.user_id, "Current user:", user.id)
        throw new Error("You don't have permission to delete this campaign")
      }

      // Delete related records first to avoid foreign key constraints
      try {
        // Delete all related records in a transaction
        const { error: deleteError } = await supabase.rpc('delete_campaign_cascade', {
          campaign_id_param: campaignId,
          user_id_param: user.id
        })

        if (deleteError) {
          console.error("Error in cascade delete:", deleteError)
          throw deleteError
        }

        // Delete the campaign image from storage if it exists
        if (campaignCheck.image_url) {
          try {
            const filePathMatch = campaignCheck.image_url.match(/\/([^/]+\/[^/]+)$/)
            if (filePathMatch && filePathMatch[1]) {
              const filePath = filePathMatch[1]
              const { error: storageError } = await supabase.storage
                .from('fundraiser-images')
                .remove([filePath])

              if (storageError) {
                console.error("Error deleting image:", storageError)
              }
            }
          } catch (imageError) {
            console.error("Error processing image deletion:", imageError)
          }
        }

        // Update local state to remove the deleted campaign
        setCampaigns(prev => prev.filter(c => c.id !== campaignId))
        
        toast({
          title: "Campaign deleted",
          description: "Your campaign has been successfully deleted.",
        })

        // Reload the profile data to ensure everything is in sync
        loadProfile()
      } catch (error) {
        console.error("Full error details:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete campaign. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Full error details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete campaign. Please try again.",
        variant: "destructive",
      })
    }
  }

  
  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-10">Loading profile...</div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-10">
          <h2 className="text-2xl font-bold text-red-600">Error loading profile</h2>
          <p>{error}</p>
          <Button 
            onClick={() => router.push('/login')}
            className="mt-4"
            variant="default"
          >
            Go to Login
          </Button>
        </div>
      </>
    );
  }
  
  // Safely access profile properties with optional chaining
  
  return (
    <div>
      <Navbar />
      <div className="container mx-auto py-10 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profile?.avatar_url || ""} alt={profile?.name || "User"} />
                <AvatarFallback>{profile?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{profile?.name || "User"}</h2>
              <p className="text-muted-foreground">{profile?.email}</p>
              
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                asChild
              >
                <Link href="/settings">Edit Profile</Link>
              </Button>
            </div>
            
            <div className="bg-card p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Account Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Fundraisers</span>
                  <span>{campaigns.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Donations Made</span>
                  <span>{donations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Liked Campaigns</span>
                  <span>{likedCampaigns.length}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-3">
            <Tabs defaultValue="fundraisers" className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList>
                  <TabsTrigger value="fundraisers">My Fundraisers</TabsTrigger>
                  <TabsTrigger value="donations">Donations Made</TabsTrigger>
                  <TabsTrigger value="liked">Liked Campaigns</TabsTrigger>
                </TabsList>
                
                {activeTab === "fundraisers" && (
                  <Button asChild variant="default">
                    <Link href="/create">Create New</Link>
                  </Button>
                )}
              </div>
              
              <TabsContent value="fundraisers" className="space-y-4">
                {campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <CampaignCard 
                      key={campaign.id}
                      campaign={campaign}
                      onEdit={() => router.push(`/edit/${campaign.id}`)}
                      onDelete={() => handleDeleteCampaign(campaign.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You haven't created any fundraisers yet.</p>
                    <Button asChild>
                      <Link href="/create">Start a Fundraiser</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="donations" className="space-y-4">
                {donations.length > 0 ? (
                  donations.map((donation) => (
                    <DonationCard
                      key={donation.id}
                      donation={donation}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You haven't made any donations yet.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="liked" className="space-y-4">
                {likedCampaigns.length > 0 ? (
                  likedCampaigns.map((like) => (
                    <CampaignCard
                      key={like.id}
                      campaign={like.campaign}
                      isLiked
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You haven't liked any campaigns yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}


