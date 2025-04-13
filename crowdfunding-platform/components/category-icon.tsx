import { BookOpen, HeartPulse, Leaf, Music, AlertTriangle, Users, Trophy, Cpu, Cat, HelpCircle } from "lucide-react"

type CategoryIconProps = {
  category: string
  size?: number
  className?: string
}

export default function CategoryIcon({ category, size = 20, className = "" }: CategoryIconProps) {
  const getIcon = () => {
    switch (category.toLowerCase()) {
      case "education":
        return <BookOpen size={size} className={className} />
      case "healthcare":
        return <HeartPulse size={size} className={className} />
      case "animals":
        return <Cat size={size} className={className} />
      case "environment":
        return <Leaf size={size} className={className} />
      case "arts & culture":
        return <Music size={size} className={className} />
      case "emergency":
        return <AlertTriangle size={size} className={className} />
      case "community":
        return <Users size={size} className={className} />
      case "sports":
        return <Trophy size={size} className={className} />
      case "technology":
        return <Cpu size={size} className={className} />
      case "other":
      default:
        return <HelpCircle size={size} className={className} />
    }
  }

  return getIcon()
}
