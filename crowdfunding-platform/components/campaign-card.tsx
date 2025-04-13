import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  goal_amount: number;
  current_amount: number;
  created_at: string;
  user_id: string;
  status: string;
  creator_name: string;
}

interface CampaignCardProps {
  campaign: Campaign | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function CampaignCard({ campaign, onEdit, onDelete }: CampaignCardProps) {
  if (!campaign) return null;

  const progress = ((campaign.current_amount || 0) / campaign.goal_amount) * 100;

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/3">
        <div className="aspect-video bg-muted rounded-md overflow-hidden">
          <img 
            src={campaign.image_url || '/placeholder.svg'} 
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="w-full md:w-2/3 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-semibold">{campaign.title}</h3>
            {campaign.status && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                campaign.status === 'approved' ? 'bg-green-100 text-green-800' : 
                campaign.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'
              }`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {campaign.category} • {new Date(campaign.created_at).toLocaleDateString()}
          </p>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>₹{campaign.current_amount || 0} raised</span>
              <span>₹{campaign.goal_amount} goal</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button asChild variant="default" size="sm">
            <Link href={`/fundraiser/${campaign.id}`}>View</Link>
          </Button>
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 text-red-500 hover:text-red-700"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}