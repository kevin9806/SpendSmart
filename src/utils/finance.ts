import type { Transaction } from '../types'

export const incomeCategories = ['Lön', 'Bidrag', 'Övrigt']
export const expenseCategories = ['Mat', 'Boende', 'Transport', 'Shopping', 'Nöje', 'Hälsa', 'Räkningar', 'Övrigt']

export const sek = (amount: number) =>
  new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(amount)

export const isInMonth = (date: string, month: string) => date.startsWith(month)

export const totals = (transactions: Transaction[], month: string) =>
  transactions
    .filter((transaction) => isInMonth(transaction.date, month))
    .reduce(
      (result, transaction) => ({
        income:
          result.income + (transaction.type === 'income' ? transaction.amount : 0),
        expense:
          result.expense + (transaction.type === 'expense' ? transaction.amount : 0),
      }),
      { income: 0, expense: 0 },
    )

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
