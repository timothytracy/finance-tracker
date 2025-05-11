/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '@/app/actions/transactions'
import { getCategoriesByType } from '@/app/actions/categories'
import { Category, Transaction, TransactionType } from '@prisma/client'

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([])
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [newTransaction, setNewTransaction] = useState({
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE' as TransactionType,
    categoryId: 0
  })
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL')
  const [filterCategory, setFilterCategory] = useState<number | 'ALL'>('ALL')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [transactionsResult, incomeCategoriesResult, expenseCategoriesResult] = await Promise.all([
        getTransactions(),
        getCategoriesByType('INCOME'),
        getCategoriesByType('EXPENSE')
      ])

      if (!transactionsResult.success) throw new Error(transactionsResult.error || 'Failed to fetch transactions')
      if (!incomeCategoriesResult.success) throw new Error(incomeCategoriesResult.error || 'Failed to fetch income categories')
      if (!expenseCategoriesResult.success) throw new Error(expenseCategoriesResult.error || 'Failed to fetch expense categories')

      setTransactions(transactionsResult.data || [])
      setIncomeCategories(incomeCategoriesResult.data || [])
      setExpenseCategories(expenseCategoriesResult.data || [])
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please try again.')
      toast.error('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const transactionData = {
        ...newTransaction,
        date: new Date(newTransaction.date),
        amount: Number(newTransaction.amount)
      }

      const result = editingTransaction
        ? await updateTransaction(editingTransaction.id, transactionData)
        : await createTransaction(transactionData)

      if (!result.success) throw new Error(result.error || 'Failed to save transaction')

      toast.success(editingTransaction ? 'Transaction updated successfully' : 'Transaction added successfully')
      setOpenDialog(false)
      setEditingTransaction(null)
      setNewTransaction({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'EXPENSE',
        categoryId: 0
      })
      loadData()
    } catch (err) {
      console.error('Error saving transaction:', err)
      toast.error('Failed to save transaction. Please try again.')
    }
  }

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return
    try {
      const result = await deleteTransaction(id)
      if (!result.success) throw new Error(result.error || 'Failed to delete transaction')

      toast.success('Transaction deleted successfully')
      loadData()
    } catch (err) {
      console.error('Error deleting transaction:', err)
      toast.error('Failed to delete transaction. Please try again.')
    }
  }

  const handleTransactionTypeChange = (type: TransactionType) => {
    setNewTransaction({
      ...newTransaction,
      type,
      categoryId: type === 'INCOME' ? (incomeCategories[0]?.id || 0) : (expenseCategories[0]?.id || 0)
    })
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setNewTransaction({
      amount: transaction.amount,
      description: transaction.description || '',
      date: transaction.date.toISOString().split('T')[0],
      type: transaction.type,
      categoryId: transaction.categoryId || 0
    })
    setOpenDialog(true)
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesType = filterType === 'ALL' || transaction.type === filterType
    const matchesCategory = filterCategory === 'ALL' || transaction.categoryId === filterCategory
    return matchesType && matchesCategory
  })

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Button onClick={() => setOpenDialog(true)}>Add Transaction</Button>
      </div>

      <div className="flex gap-4 mb-6">
        {/* Filter by Type */}
        <div className="flex flex-col">
          <Label htmlFor="filterType">Filter by Type</Label>
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as TransactionType | 'ALL')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter by Category */}
        <div className="flex flex-col">
          <Label htmlFor="filterCategory">Filter by Category</Label>
          <Select
            value={String(filterCategory)}
            onValueChange={(value) => setFilterCategory(value === 'ALL' ? 'ALL' : parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {filterType === 'INCOME' || filterType === 'ALL'
                ? incomeCategories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))
                : null}
              {filterType === 'EXPENSE' || filterType === 'ALL'
                ? expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))
                : null}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center">No transactions found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                <TableCell>{transaction.description || '-'}</TableCell>
                <TableCell>
                  {transaction.categoryId
                    ? (transaction.type === 'INCOME'
                        ? incomeCategories.find((cat) => cat.id === transaction.categoryId)?.name
                        : expenseCategories.find((cat) => cat.id === transaction.categoryId)?.name) || '-'
                    : '-'}
                </TableCell>
                <TableCell>
                  <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                    ${transaction.amount.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditTransaction(transaction)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(transaction.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTransaction}>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="type">Type</Label>
                <div className="flex gap-4">
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newTransaction.type === 'EXPENSE'}
                      onChange={() => handleTransactionTypeChange('EXPENSE')}
                      className="h-4 w-4"
                    />
                    <span>Expense</span>
                  </Label>
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newTransaction.type === 'INCOME'}
                      onChange={() => handleTransactionTypeChange('INCOME')}
                      className="h-4 w-4"
                    />
                    <span>Income</span>
                  </Label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={String(newTransaction.categoryId)}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, categoryId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{newTransaction.type === 'INCOME' ? 'Income Categories' : 'Expense Categories'}</SelectLabel>
                      {(newTransaction.type === 'INCOME' ? incomeCategories : expenseCategories).map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  placeholder="What was this for?"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingTransaction ? 'Update Transaction' : 'Save Transaction'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}