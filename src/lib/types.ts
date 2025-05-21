export interface Payment {
  id: string
  transactionType: string
  transId: string
  transTime: string | Date
  transAmount: number
  businessShortCode: string
  billRefNumber?: string | null
  invoiceNumber?: string | null
  orgAccountBalance?: number | null
  thirdPartyTransId?: string | null
  msisdn: string
  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
  token?: string | null
  createdAt: string | Date
  updatedAt: string | Date
}
