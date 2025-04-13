"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import DonationSuccessDialog from "./donation-success-dialog"

interface DonationDialogProps {
  isOpen: boolean
  onClose: () => void
  fundraiserTitle: string
  onDonationSuccess?: (amount: number) => void
}

export default function DonationDialog({
  isOpen,
  onClose,
  fundraiserTitle,
  onDonationSuccess,
}: DonationDialogProps) {
  const [amount, setAmount] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const handleDonate = () => {
    const donationAmount = parseFloat(amount)
    if (!amount || isNaN(donationAmount) || donationAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid donation amount",
        variant: "destructive",
      })
      return
    }

    // Here you would typically handle the actual donation logic
    // For now, we'll just show the success dialog
    setShowSuccess(true)
    if (onDonationSuccess) {
      onDonationSuccess(donationAmount)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccess(false)
    setAmount("")
    onClose()
  }

  if (showSuccess) {
    return (
      <DonationSuccessDialog
        isOpen={true}
        onClose={handleSuccessClose}
        amount={parseFloat(amount)}
        fundraiserTitle={fundraiserTitle}
        isAnonymous={false}
        donorName="Donor" // You can replace this with actual donor name if available
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make a Donation</DialogTitle>
          <DialogDescription>
            Enter the amount you would like to donate
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              placeholder="Enter amount in rupees"
              value={amount}
              onChange={(e) => {
                const value = e.target.value
                if (value === "" || parseFloat(value) >= 1) {
                  setAmount(value)
                }
              }}
              className="appearance-none"
            />
            {amount && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) && (
              <p className="text-sm text-destructive">
                Please enter a valid donation amount
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleDonate}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            Donate Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 