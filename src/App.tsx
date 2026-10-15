import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Edit3,
  HeartPulse,
  House,
  MoreHorizontal,
  PartyPopper,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  Target,
  Trash2,
  Utensils,
  Wallet,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Transaction, TransactionType } from './types'
import {
  expenseCategories,
  formatDate,
  incomeCategories,
  isInMonth,
  sek,
  totals,
} from './utils/finance'
import { demoTransactions, loadState, saveState } from './utils/storage'

const categoryIcons: Record<string, typeof Wallet> = {
  Mat: Utensils,
  Boende: House,
  Transport: Car,
  Shopping: ShoppingBag,
  Nöje: PartyPopper,
  Hälsa: HeartPulse,
  Räkningar: ReceiptText,
  Lön: Banknote,
  Bidrag: CircleDollarSign,
  Övrigt: MoreHorizontal,
}

const chartColours = [
  '#1e9b6f',
  '#5fc79a',
  '#90d8ba',
  '#c3eada',
  '#f1b762',
  '#e87955',
  '#8aa4c8',
  '#c4a7d4',
]

const currentMonth = new Date().toISOString().slice(0, 7)

function monthLabel(month: string) {
  return new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(
    new Date(`${month}-01T12:00:00`),
  )
}

function shiftMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(year, monthNumber - 1 + amount, 1).toISOString().slice(0, 7)
}

export default function App() {
  const [state, setState] = useState(loadState)
  const [month, setMonth] = useState(currentMonth)
  const [isFormOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => saveState(state), [state])

  const summary = useMemo(
    () => totals(state.transactions, month),
    [state.transactions, month],
  )
  const remaining = summary.income - summary.expense
  const saving = summary.income
    ? Math.max(0, (remaining / summary.income) * 100)
    : 0

  const monthTransactions = state.transactions.filter((transaction) =>
    isInMonth(transaction.date, month),
  )
  const filteredTransactions = monthTransactions
    .filter(
      (transaction) =>
        (typeFilter === 'all' || transaction.type === typeFilter) &&
        (categoryFilter === 'all' || transaction.category === categoryFilter) &&
        transaction.description.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date))

  const pieData = expenseCategories
    .map((category) => ({
      name: category,
      value: monthTransactions
        .filter(
          (transaction) =>
            transaction.type === 'expense' && transaction.category === category,
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    }))
    .filter((category) => category.value > 0)

  const chartData = Array.from({ length: 6 }, (_, index) => {
    const chartMonth = shiftMonth(month, index - 5)
    const monthTotals = totals(state.transactions, chartMonth)

    return {
      name: new Intl.DateTimeFormat('sv-SE', { month: 'short' }).format(
        new Date(`${chartMonth}-01T12:00:00`),
      ),
      Inkomster: monthTotals.income,
      Utgifter: monthTotals.expense,
    }
  })

  const updateTransactions = (transactions: Transaction[]) => {
    setState((current) => ({ ...current, transactions }))
  }

  const deleteTransaction = (id: string) => {
    if (confirm('Vill du verkligen ta bort transaktionen?')) {
      updateTransactions(state.transactions.filter((transaction) => transaction.id !== id))
    }
  }

  const clearTransactions = () => {
    if (confirm('Vill du rensa alla transaktioner och budgeten?')) {
      setState({ transactions: [], budget: 0 })
    }
  }

  const resetDemo = () => {
    if (confirm('Vill du återställa demodata?')) {
      setState({ transactions: demoTransactions, budget: 15000 })
    }
  }

  const openNewTransaction = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEditTransaction = (transaction: Transaction) => {
    setEditing(transaction)
    setFormOpen(true)
  }

  const saveTransaction = (transaction: Transaction) => {
    const transactions = editing
      ? state.transactions.map((current) =>
          current.id === transaction.id ? transaction : current,
        )
      : [...state.transactions, transaction]

    updateTransactions(transactions)
    setFormOpen(false)
  }

  const changeBudget = () => {
    const value = prompt('Ange månadsbudget i SEK', String(state.budget))

    if (value === null) return

    const budget = Number(value)
    if (Number.isFinite(budget) && budget >= 0) {
      setState((current) => ({ ...current, budget }))
    }
  }

  const expenseCount = monthTransactions.filter(
    (transaction) => transaction.type === 'expense',
  ).length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Wallet size={22} />
          </span>
          <span>
            Spend<span>Smart</span>
          </span>
        </div>
        <div className="top-actions">
          <button className="ghost-button" onClick={resetDemo}>
            Återställ demo
          </button>
          <button className="primary-button" onClick={openNewTransaction}>
            <Plus size={18} /> Lägg till transaktion
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">Översikt</p>
            <h1>Din ekonomi i fokus</h1>
            <p className="subtle">Följ dina pengar och fatta smartare beslut.</p>
          </div>
          <div className="month-picker">
            <button
              aria-label="Föregående månad"
              onClick={() => setMonth(shiftMonth(month, -1))}
            >
              <ChevronLeft />
            </button>
            <span>
              <CalendarDays size={17} />
              {monthLabel(month)}
            </span>
            <button
              aria-label="Nästa månad"
              onClick={() => setMonth(shiftMonth(month, 1))}
            >
              <ChevronRight />
            </button>
          </div>
        </section>

        <section className="summary-grid">
          <Metric
            icon={<ArrowUpRight />}
            label="Totala inkomster"
            value={sek(summary.income)}
            tone="green"
          />
          <Metric
            icon={<ArrowDownRight />}
            label="Totala utgifter"
            value={sek(summary.expense)}
            tone="red"
          />
          <Metric
            icon={<Wallet />}
            label="Kvar att använda"
            value={sek(remaining)}
            tone="blue"
          />
          <Metric
            icon={<Target />}
            label="Sparande"
            value={`${saving.toFixed(0)} %`}
            tone="gold"
            detail={summary.income ? 'av dina inkomster' : 'Lägg till en inkomst'}
          />
        </section>

        <section className="dashboard-grid">
          <Card className="chart-card">
            <div className="section-heading">
              <div>
                <h2>Månadsöversikt</h2>
                <p>Inkomster jämfört med utgifter</p>
              </div>
            </div>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={5}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip formatter={(value: number) => sek(value)} />
                  <Legend />
                  <Bar dataKey="Inkomster" fill="#1e9b6f" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="Utgifter" fill="#e78970" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="budget-card">
            <div className="section-heading">
              <div>
                <h2>Månadsbudget</h2>
                <p>Håll koll på dina utgifter</p>
              </div>
              <button className="text-button" onClick={changeBudget}>
                Ändra
              </button>
            </div>
            <div className="budget-numbers">
              <strong>{sek(summary.expense)}</strong>
              <span> av {sek(state.budget)}</span>
            </div>
            <div className="progress" aria-label="Budgetförbrukning">
              <span
                style={{
                  width: `${Math.min(
                    state.budget ? (summary.expense / state.budget) * 100 : 0,
                    100,
                  )}%`,
                }}
                className={summary.expense > state.budget ? 'over' : ''}
              />
            </div>
            <div
              className={
                summary.expense > state.budget ? 'budget-warning' : 'budget-status'
              }
            >
              {state.budget ? (
                summary.expense > state.budget ? (
                  <>
                    Du har överskridit budgeten med{' '}
                    <b>{sek(summary.expense - state.budget)}</b>
                  </>
                ) : (
                  <>
                    Du har <b>{sek(state.budget - summary.expense)}</b> kvar av budgeten
                  </>
                )
              ) : (
                'Sätt en budget för att följa dina utgifter.'
              )}
            </div>
          </Card>
        </section>

        <section className="dashboard-grid lower">
          <Card className="chart-card">
            <div className="section-heading">
              <div>
                <h2>Utgifter per kategori</h2>
                <p>Fördelning under {monthLabel(month)}</p>
              </div>
            </div>
            {pieData.length ? (
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={3}
                    >
                      {pieData.map((category, index) => (
                        <Cell key={category.name} fill={chartColours[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => sek(value)} />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty text="Inga utgifter att visa för denna månad." />
            )}
          </Card>

          <Card className="insight-card">
            <p className="eyebrow">SNABB INSYN</p>
            <h2>
              {summary.expense
                ? `${Math.round(summary.expense / Math.max(expenseCount, 1))} kr`
                : 'Börja enkelt'}
            </h2>
            <p>
              {summary.expense
                ? 'är din genomsnittliga utgift per köp denna månad.'
                : 'Lägg till en transaktion för att se dina ekonomiska insikter.'}
            </p>
            <div className="insight-line" />
          </Card>
        </section>

        <section className="transactions-section">
          <div className="section-heading transaction-title">
            <div>
              <p className="eyebrow">TRANSAKTIONER</p>
              <h2>Senaste händelser</h2>
            </div>
            <button className="primary-button desktop-add" onClick={openNewTransaction}>
              <Plus size={18} /> Ny transaktion
            </button>
          </div>
          <div className="filters">
            <label className="search">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sök transaktion..."
              />
            </label>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as typeof typeFilter)
              }
            >
              <option value="all">Alla typer</option>
              <option value="income">Inkomster</option>
              <option value="expense">Utgifter</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">Alla kategorier</option>
              {[...incomeCategories, ...expenseCategories.filter(
                (category) => !incomeCategories.includes(category),
              )].map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="transaction-list">
            {filteredTransactions.length ? (
              filteredTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={() => openEditTransaction(transaction)}
                  onDelete={() => deleteTransaction(transaction.id)}
                />
              ))
            ) : (
              <Empty text="Inga transaktioner matchar dina filter." />
            )}
          </div>
          <div className="list-footer">
            <span>
              {filteredTransactions.length} av {monthTransactions.length} transaktioner
            </span>
            <button className="danger-link" onClick={clearTransactions}>
              Rensa alla
            </button>
          </div>
        </section>
      </main>

      {isFormOpen && (
        <TransactionModal
          transaction={editing}
          onClose={() => setFormOpen(false)}
          onSave={saveTransaction}
        />
      )}
    </div>
  )
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}

function Metric({
  icon,
  label,
  value,
  tone,
  detail,
}: {
  icon: ReactNode
  label: string
  value: string
  tone: string
  detail?: string
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <p>{label}</p>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Wallet size={28} />
      <p>{text}</p>
    </div>
  )
}

function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction
  onEdit: () => void
  onDelete: () => void
}) {
  const Icon = categoryIcons[transaction.category] ?? MoreHorizontal

  return (
    <article className="transaction">
      <div className="category-icon">
        <Icon size={19} />
      </div>
      <div className="transaction-main">
        <strong>{transaction.description}</strong>
        <span>
          {transaction.category} · {formatDate(transaction.date)}
        </span>
      </div>
      <div className={`amount ${transaction.type}`}>
        {transaction.type === 'income' ? '+' : '−'} {sek(transaction.amount)}
      </div>
      <button
        className="icon-button"
        aria-label={`Redigera ${transaction.description}`}
        onClick={onEdit}
      >
        <Edit3 size={17} />
      </button>
      <button
        className="icon-button delete"
        aria-label={`Ta bort ${transaction.description}`}
        onClick={onDelete}
      >
        <Trash2 size={17} />
      </button>
    </article>
  )
}

function TransactionModal({
  transaction,
  onClose,
  onSave,
}: {
  transaction: Transaction | null
  onClose: () => void
  onSave: (transaction: Transaction) => void
}) {
  const [type, setType] = useState<TransactionType>(transaction?.type || 'expense')
  const [description, setDescription] = useState(transaction?.description || '')
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '')
  const [category, setCategory] = useState(transaction?.category || '')
  const [date, setDate] = useState(
    transaction?.date || new Date().toISOString().slice(0, 10),
  )
  const [error, setError] = useState('')
  const categories = type === 'income' ? incomeCategories : expenseCategories

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory('')
    }
  }, [categories, category])

  const submit = (event: FormEvent) => {
    event.preventDefault()

    const numericAmount = Number(amount)
    const validDate =
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(new Date(`${date}T12:00:00`).getTime())

    if (
      !description.trim() ||
      !category ||
      !validDate ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError('Fyll i alla fält med ett giltigt belopp och datum.')
      return
    }

    onSave({
      id: transaction?.id || crypto.randomUUID(),
      type,
      description: description.trim(),
      amount: numericAmount,
      category,
      date,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">TRANSAKTION</p>
            <h2>{transaction ? 'Redigera transaktion' : 'Ny transaktion'}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Stäng"
          >
            <X />
          </button>
        </div>
        <div className="type-toggle">
          <button
            type="button"
            className={type === 'expense' ? 'active expense-toggle' : ''}
            onClick={() => setType('expense')}
          >
            Utgift
          </button>
          <button
            type="button"
            className={type === 'income' ? 'active income-toggle' : ''}
            onClick={() => setType('income')}
          >
            Inkomst
          </button>
        </div>
        <label>
          Beskrivning
          <input
            autoFocus
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Till exempel Matbutiken"
          />
        </label>
        <label>
          Belopp (SEK)
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
          />
        </label>
        <div className="field-row">
          <label>
            Kategori
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Välj kategori</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Datum
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Avbryt
          </button>
          <button className="primary-button">
            {transaction ? 'Spara ändringar' : 'Lägg till transaktion'}
          </button>
        </div>
      </form>
    </div>
  )
}
