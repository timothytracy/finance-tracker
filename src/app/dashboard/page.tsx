/* eslint-disable @typescript-eslint/no-unused-vars */
// app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarIcon, ArrowUpIcon, ArrowDownIcon, PlusIcon, TrashIcon, PencilIcon } from 'lucide-react'
import { TransactionType } from '@prisma/client'
import { toast } from 'sonner'

// Import server actions
import { 
  getTransactions, 
  createTransaction, 
  deleteTransaction,
  getTransactionSummary, 
  updateTransaction
} from '@/app/actions/transactions'
import { 
  getCategories, 
  getCategoriesByType, 
  createDefaultCategories 
} from '@/app/actions/categories'
import TestAuth from '@/components/auth/TestAuth'

// Types
type Transaction = {
  id: number
  amount: number
  description: string | null
  date: Date
  type: TransactionType
  userId: number
  categoryId?: number
  createdAt: Date
  updatedAt: Date
  category?: Category
}

type Category = {
  id: number
  name: string
  type: TransactionType
  color: string | null
  icon: string | null
  userId: number
  createdAt: Date
  updatedAt: Date
}

type TransactionSummary = {
  totalIncome: number
  totalExpense: number
  balance: number
  incomeCount: number
  expenseCount: number
  transactionCount: number
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([])
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([])
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [newTransaction, setNewTransaction] = useState({
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE' as TransactionType,
    categoryId: 0
  })
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])
  
  // Fetch data
  useEffect(() => {
    if (status === 'authenticated') {
      loadData()
    }
  }, [status])
  
  const loadData = async () => {
    setLoading(true)
    
    try {
      // Create default categories if none exist
      await createDefaultCategories()
      
      // Fetch all data in parallel
      const [transactionsResult, categoriesResult, incomeCategoriesResult, expenseCategoriesResult, summaryResult] = 
        await Promise.all([
          getTransactions(),
          getCategories(),
          getCategoriesByType('INCOME'),
          getCategoriesByType('EXPENSE'),
          getTransactionSummary()
        ])
      
      if (!transactionsResult.success) {
        throw new Error(transactionsResult.error || 'Failed to fetch transactions')
      }
      
      if (!categoriesResult.success) {
        throw new Error(categoriesResult.error || 'Failed to fetch categories')
      }
      
      if (!incomeCategoriesResult.success) {
        throw new Error(incomeCategoriesResult.error || 'Failed to fetch income categories')
      }
      
      if (!expenseCategoriesResult.success) {
        throw new Error(expenseCategoriesResult.error || 'Failed to fetch expense categories')
      }
      
      if (!summaryResult.success) {
        throw new Error(summaryResult.error || 'Failed to fetch transaction summary')
      }
      
      setTransactions(
        (transactionsResult.data || []).map(transaction => ({
          ...transaction,
          categoryId: transaction.categoryId ?? undefined,
          category: transaction.category ?? undefined,
        }))
      )
      setCategories(categoriesResult.data || [])
      setIncomeCategories(incomeCategoriesResult.data || [])
      setExpenseCategories(expenseCategoriesResult.data || [])
      setSummary(summaryResult.data || null)
      
      // Set default category if available
      if ((expenseCategoriesResult.data ?? []).length > 0 && newTransaction.categoryId === 0) {
        setNewTransaction(prev => ({
          ...prev,
          categoryId: (expenseCategoriesResult.data ?? [])[0]?.id || 0
        }))
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please try again.')
      toast.error('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Convert date string to Date object
      const transactionData = {
        ...newTransaction,
        date: new Date(newTransaction.date),
        amount: Number(newTransaction.amount)
      }
      
      const result = await createTransaction(transactionData)
      
      if (!result.success) {
        setError(result.error || 'Failed to add transaction')
        toast.error(result.error || 'Failed to add transaction')
        return
      }
      
      // Reset form and refresh data
      setOpenDialog(false)
      setNewTransaction({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'EXPENSE' as TransactionType,
        categoryId: 0
      })
      
      // Refresh data after adding transaction
      toast.success('Transaction added successfully')
      loadData()
    } catch (err) {
      console.error('Error adding transaction:', err)
      setError('Failed to add transaction. Please try again.')
      toast.error('Failed to add transaction. Please try again.')
    }
  }
  
  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }
    
    try {
      const result = await deleteTransaction(id)
      
      if (!result.success) {
        setError(result.error || 'Failed to delete transaction')
        toast.error(result.error || 'Failed to delete transaction')
        return
      }
      
      // Refresh data after deleting transaction
      toast.success('Transaction deleted successfully')
      loadData()
    } catch (err) {
      console.error('Error deleting transaction:', err)
      setError('Failed to delete transaction. Please try again.')
      toast.error('Failed to delete transaction. Please try again.')
    }
  }
  
  // Get recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
  
  // Handle transaction type change
  const handleTransactionTypeChange = (type: TransactionType) => {
    setNewTransaction({
      ...newTransaction,
      type,
      categoryId: type === 'INCOME' 
        ? (incomeCategories[0]?.id || 0) 
        : (expenseCategories[0]?.id || 0)
    })
  }

  // Open the dialog for editing
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setNewTransaction({
      amount: transaction.amount,
      description: transaction.description || '',
      date: transaction.date.toISOString().split('T')[0],
      type: transaction.type,
      categoryId: transaction.categoryId || 0,
    })
    setOpenDialog(true)
  }

  // Save or update transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
  
    try {
      const transactionData = {
        ...newTransaction,
        date: new Date(newTransaction.date),
        amount: Number(newTransaction.amount),
      }
  
      const result = editingTransaction
        ? await updateTransaction(editingTransaction.id, transactionData)
        : await createTransaction(transactionData)
  
      if (!result.success) {
        setError(result.error || 'Failed to save transaction')
        toast.error(result.error || 'Failed to save transaction')
        return
      }
  
      toast.success(editingTransaction ? 'Transaction updated successfully' : 'Transaction added successfully')
      setOpenDialog(false)
      setEditingTransaction(null)
      setNewTransaction({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'EXPENSE',
        categoryId: 0,
      })
      loadData()
    } catch (err) {
      console.error('Error saving transaction:', err)
      setError('Failed to save transaction. Please try again.')
      toast.error('Failed to save transaction. Please try again.')
    }
  }
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full  mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
        <TestAuth></TestAuth>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Finance Dashboard</h1>
        <Dialog open={openDialog} onOpenChange={(open) => {
          if (!open) setEditingTransaction(null)
          setOpenDialog(open)
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
              <DialogDescription>
                {editingTransaction ? 'Update the details of your transaction' : 'Enter the details of your new transaction'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveTransaction}>
              <div className="grid gap-4 py-4">
                {/* Transaction Type */}
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

                {/* Category */}
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

                {/* Other Fields */}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary?.totalIncome.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${summary?.totalExpense.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${summary?.balance.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="recent" className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your 5 most recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-8 h-8 border-2 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No transactions found. Add your first transaction!
                </div>
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
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.description || '-'}</TableCell>
                        <TableCell>{transaction.category?.name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {transaction.type === 'INCOME' ? (
                              <ArrowUpIcon className="mr-1 h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownIcon className="mr-1 h-4 w-4 text-red-600" />
                            )}
                            <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                              ${transaction.amount.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditTransaction(transaction)}>
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(transaction.id)}>
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={() => router.push('/transactions')}>
                View Transactions
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories Overview</CardTitle>
              <CardDescription>Your expense and income categories</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="expense">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="expense">Expense Categories</TabsTrigger>
                  <TabsTrigger value="income">Income Categories</TabsTrigger>
                </TabsList>
                
                <TabsContent value="expense">
                  {loading ? (
                    <div className="flex justify-center py-6">
                      <div className="w-8 h-8 border-2 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : expenseCategories.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                      No expense categories found
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {expenseCategories.map(category => (
                        <div key={category.id} className="p-4 border rounded-lg flex items-center">
                          <div 
                            className="w-6 h-6 rounded-full mr-3" 
                            style={{ backgroundColor: category.color || '#9CA3AF' }}
                          />
                          <span>{category.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="income">
                  {loading ? (
                    <div className="flex justify-center py-6">
                      <div className="w-8 h-8 border-2 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : incomeCategories.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                      No income categories found
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {incomeCategories.map(category => (
                        <div key={category.id} className="p-4 border rounded-lg flex items-center">
                          <div 
                            className="w-6 h-6 rounded-full mr-3" 
                            style={{ backgroundColor: category.color || '#9CA3AF' }}
                          />
                          <span>{category.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={() => router.push('/categories')}>
                Manage Categories
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}