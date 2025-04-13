import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Download } from "lucide-react"
import { motion } from "framer-motion"

interface DonationSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  fundraiserTitle: string
  isAnonymous: boolean
  donorName: string
}

export default function DonationSuccessDialog({
  isOpen,
  onClose,
  amount,
  fundraiserTitle,
  isAnonymous,
  donorName,
}: DonationSuccessDialogProps) {
  const handleDownloadReceipt = () => {
    const receipt = `
Donation Receipt
----------------
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Amount: ₹${amount.toFixed(2)}
Fundraiser: ${fundraiserTitle}
Donor: ${isAnonymous ? "Anonymous" : donorName}
Transaction ID: ${Math.random().toString(36).substring(2, 15)}

Thank you for your generous donation!
    `

    const blob = new Blob([receipt], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `donation-receipt-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Donation Successful</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="mt-2 text-muted-foreground">
              Your donation of ₹{amount.toFixed(2)} has been received.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-2"
          >
            <Button onClick={handleDownloadReceipt} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            <Button onClick={onClose}>Close</Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 