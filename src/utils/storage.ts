import type { StoredState, Transaction } from '../types'
import { expenseCategories, incomeCategories } from './finance'

const key = 'spendsmart-state'
const current = new Date()

const date = (offset: number) => {
  const value = new Date(current.getFullYear(), current.getMonth(), offset)
  return value.toISOString().slice(0, 10)
}

export const demoTransactions: Transaction[] = [
  { id: '1', type: 'income', amount: 32500, description: 'Lön', category: 'Lön', date: date(25) },
  { id: '2', type: 'expense', amount: 7900, description: 'Hyra', category: 'Boende', date: date(1) },
  { id: '3', type: 'expense', amount: 845, description: 'Matbutiken', category: 'Mat', date: date(5) },
  { id: '4', type: 'expense', amount: 449, description: 'SL-kort', category: 'Transport', date: date(7) },
  { id: '5', type: 'expense', amount: 299, description: 'Mobilabonnemang', category: 'Räkningar', date: date(12) },
  { id: '6', type: 'expense', amount: 650, description: 'Middag med vänner', category: 'Nöje', date: date(16) },
  { id: '7', type: 'expense', amount: 1200, description: 'Matbutiken', category: 'Mat', date: date(19) },
]

const initialState: StoredState = { transactions: demoTransactions, budget: 15000 }

const isValidDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsedDate = new Date(year, month - 1, day)
  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  )
}

const isTransaction = (value: unknown): value is Transaction => {
  if (!value || typeof value !== 'object') return false
  const transaction = value as Partial<Transaction>
  const categories = transaction.type === 'income' ? incomeCategories : expenseCategories
  return (
    typeof transaction.id === 'string'
    && (transaction.type === 'income' || transaction.type === 'expense')
    && typeof transaction.description === 'string'
    && transaction.description.trim().length > 0
    && typeof transaction.amount === 'number'
    && Number.isFinite(transaction.amount)
    && transaction.amount > 0
    && typeof transaction.category === 'string'
    && categories.includes(transaction.category)
    && isValidDate(transaction.date)
  )
}

export const loadState = (): StoredState => {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>
      if (
        Array.isArray(parsed.transactions) &&
        parsed.transactions.every(isTransaction) &&
        typeof parsed.budget === 'number' &&
        Number.isFinite(parsed.budget) &&
        parsed.budget >= 0
      ) {
        return { transactions: parsed.transactions, budget: parsed.budget }
      }
    }
  } catch {
    return initialState
  }
  return initialState
}

export const saveState = (state: StoredState) =>
  localStorage.setItem(key, JSON.stringify(state))
