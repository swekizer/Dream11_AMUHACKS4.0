"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/components/ui/use-toast";
import Navbar from '@/components/navbar';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase'

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
  profile: Profile;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          profile:profiles(id, name, avatar_url, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('social_posts')
        .insert([{ content: newPost, user_id: user.id }]);

      if (error) throw error;

      setNewPost('');
      await fetchPosts();
      toast({
        title: "Success",
        description: "Your post has been published.",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="container max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Community</h1>
          <p className="mt-1 text-muted-foreground">Share updates and connect with others.</p>
        </div>

        {user && (
          <form onSubmit={handleSubmit} className="mb-8">
            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your thoughts..."
              className="mb-4"
              rows={3}
            />
            <Button type="submit" disabled={isSubmitting || !newPost.trim()}>
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </form>
        )}

        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="rounded-lg border bg-card p-6">
              <div className="mb-4 flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={post.profile.avatar_url || undefined} />
                  <AvatarFallback>
                    {post.profile.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{post.profile.name || 'Anonymous'}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}