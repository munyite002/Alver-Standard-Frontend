import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Payment } from "@/lib/types"
import { Separator } from "@/components/ui/separator"
import { Download, Printer } from "lucide-react"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Payment | null
}

export function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  if (!transaction) return null

  // Format token as 20 digits grouped in sets of 4
  const formatToken = (token: string | null | undefined) => {
    if (!token) return "N/A"

    // Ensure token is exactly 20 digits (pad or truncate if needed)
    const normalizedToken = token.replace(/\D/g, "").padEnd(20, "0").slice(0, 20)

    // Group into sets of 4
    return normalizedToken.match(/.{1,4}/g)?.join(" ") || normalizedToken
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Transaction ID</p>
              <p className="font-medium">{transaction.transId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Date & Time</p>
              <p className="font-medium">{new Date(transaction.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Transaction Type</p>
              <p className="font-medium">{transaction.transactionType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-medium text-lg">Ksh {transaction.transAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Business Code</p>
              <p className="font-medium">{transaction.businessShortCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="font-medium">{transaction.msisdn}</p>
            </div>
            {transaction.billRefNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Bill Reference</p>
                <p className="font-medium">{transaction.billRefNumber}</p>
              </div>
            )}
            {transaction.invoiceNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-medium">{transaction.invoiceNumber}</p>
              </div>
            )}
            {transaction.orgAccountBalance !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Account Balance</p>
                <p className="font-medium">Ksh {(transaction.orgAccountBalance ?? 0).toFixed(2)}</p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-2">Token</p>
            <div className="bg-gray-50 p-3 rounded-md font-mono text-lg tracking-wider">
              {formatToken(transaction.token)}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-2">Customer Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">First Name</p>
                <p className="font-medium">{transaction.firstName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Name</p>
                <p className="font-medium">{transaction.lastName || "N/A"}</p>
              </div>
              {transaction.middleName && (
                <div>
                  <p className="text-sm text-muted-foreground">Middle Name</p>
                  <p className="font-medium">{transaction.middleName}</p>
                </div>
              )}
            </div>
          </div>

          {transaction.thirdPartyTransId && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Mpesa Reference No</p>
                <p className="font-medium">{transaction.thirdPartyTransId}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
