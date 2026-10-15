export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  category: string
  date: string
}

export interface StoredState {
  transactions: Transaction[]
  budget: number
}
