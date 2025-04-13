"use client";

import { useState, useEffect } from 'react';
//import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/components/ui/use-toast";
import Navbar from '@/components/navbar';
import { formatDistanceToNow } from 'date-fns';
import { createClientSupabase } from '@/lib/supabase'

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface SocialPost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: Profile | null;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  // Use the cached client instead of creating a new one
  const supabase = createClientSupabase();

  useEffect(() => {
    // Initialize session and fetch posts
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', { 
          session: !!session, 
          error,
          user: session?.user 
        });
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (session) {
          console.log('Session found, fetching posts');
          await fetchPosts();
        } else {
          console.log('No session found');
          toast({
            title: "Session Expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [supabase]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data: posts, error } = await supabase
        .from('social_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }

      // Fetch profiles for the posts
      const userIds = [...new Set(posts.map(post => post.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Create a map of user_id to profile
      const profileMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>);

      // Transform the data to match our types
      const transformedPosts: SocialPost[] = (posts || []).map((post: any) => ({
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        created_at: post.created_at,
        updated_at: post.updated_at || post.created_at, // Fallback to created_at if updated_at is null
        profiles: profileMap[post.user_id] || null
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Post submit clicked');
    
    if (!user) {
      console.log('No user found');
      toast({
        title: "Error",
        description: "You must be logged in to post.",
        variant: "destructive",
      });
      return;
    }

    console.log('User found:', user);

    if (!newPost.trim()) {
      console.log('Empty post content');
      toast({
        title: "Error",
        description: "Post cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting post submission');
      setIsSubmitting(true);

      // Create the post
      const { data: newPostData, error: insertError } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          content: newPost.trim()
        })
        .select()
        .single();

      console.log('Post creation response:', { data: newPostData, error: insertError });

      if (insertError) {
        console.error('Insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw new Error(`Failed to create post: ${insertError.message}`);
      }

      if (!newPostData) {
        throw new Error('No data returned from post creation');
      }

      // Transform the post data to match our interface
      const transformedPost: SocialPost = {
        id: newPostData.id,
        user_id: newPostData.user_id,
        content: newPostData.content,
        created_at: newPostData.created_at,
        updated_at: newPostData.updated_at || newPostData.created_at,
        profiles: {
          id: user.id,
          name: user.name || 'Anonymous',
          avatar_url: user.profilePicture || user.user_metadata?.avatar_url || null,
          email: user.email || null
        }
      };

      setPosts(prevPosts => [transformedPost, ...prevPosts]);
      setNewPost('');
      toast({
        title: "Success",
        description: "Your post has been published!",
      });
    } catch (error) {
      console.error('Error in handlePostSubmit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }

      setPosts(posts.filter(post => post.id !== postId));
      toast({
        title: "Success",
        description: "Post deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Community Wall</h1>
        
        {/* Post Creation Form */}
        {user && (
          <form onSubmit={handlePostSubmit} className="mb-8">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10">
                {user.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={user.name || 'User'} />
                ) : null}
                <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Share your thoughts with the community..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] mb-2"
                  disabled={isSubmitting}
                />
                <Button type="submit" disabled={!newPost.trim() || isSubmitting}>
                  {isSubmitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No posts yet. Be the first to share something!
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-card rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    {post.profiles?.avatar_url ? (
                      <AvatarImage src={post.profiles.avatar_url} alt={post.profiles.name || 'User'} />
                    ) : null}
                    <AvatarFallback>{(post.profiles?.name?.[0] || 'U').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{post.profiles?.name || "Anonymous User"}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {user?.id === post.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}