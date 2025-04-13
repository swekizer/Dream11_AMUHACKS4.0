import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Campaign {
  id: string;
  title: string;
  image_url?: string;
  goal_amount: number;
  current_amount: number;
}

interface DonationCardProps {
  donation: {
    id: string;
    amount: number;
    created_at: string;
    campaign: Campaign | null;
  };
}

export default function DonationCard({ donation }: DonationCardProps) {
  const progress = donation.campaign ? ((donation.campaign.current_amount || 0) / donation.campaign.goal_amount) * 100 : 0;

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/3">
        <div className="aspect-video bg-muted rounded-md overflow-hidden">
          <img 
            src={donation.campaign?.image_url || '/placeholder.svg'} 
            alt={donation.campaign?.title || 'Campaign'}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="w-full md:w-2/3 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-semibold">{donation.campaign?.title || 'Deleted Campaign'}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Donated ₹{donation.amount} • {new Date(donation.created_at).toLocaleDateString()}
          </p>
          
          {donation.campaign && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>₹{donation.campaign.current_amount || 0} raised</span>
                <span>₹{donation.campaign.goal_amount} goal</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {donation.campaign && (
          <div className="flex gap-2 mt-4">
            <Button asChild variant="default" size="sm">
              <Link href={`/fundraiser/${donation.campaign.id}`}>View Campaign</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 