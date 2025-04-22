'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUserId } from './auth'
import prisma from '@/prisma/PrismaClient'

// Transaction validation schema
const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  date: z.date(),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.number().int().positive('Category ID is required').optional()
})

// Get current user ID from session


// Get all transactions
export async function getTransactions() {
  try {
    const userId = await getCurrentUserId()
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId
      },
      include: {
        category: true
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    return { success: true, data: transactions }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return { success: false, error: 'Failed to fetch transactions' }
  }
}

// Get transactions by date range
export async function getTransactionsByDateRange(
  startDate: Date,
  endDate: Date
) {
  try {
    const userId = await getCurrentUserId()
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        category: true
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    return { success: true, data: transactions }
  } catch (error) {
    console.error('Error fetching transactions by date range:', error)
    return { success: false, error: 'Failed to fetch transactions' }
  }
}

// Get transaction by ID
export async function getTransactionById(id: number) {
  try {
    const userId = await getCurrentUserId()
    
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        userId: userId
      },
      include: {
        category: true
      }
    })
    
    if (!transaction) {
      return { success: false, error: 'Transaction not found' }
    }
    
    return { success: true, data: transaction }
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return { success: false, error: 'Failed to fetch transaction' }
  }
}

// Create transaction
export async function createTransaction(data: z.infer<typeof transactionSchema>) {
  try {
    const userId = await getCurrentUserId()
    
    // Validate input data
    const validatedData = transactionSchema.parse(data)
    if(data.categoryId){
      const category = await prisma.category.findFirst({
        where: {
          id: validatedData.categoryId,
          userId: userId
        }
      })
      
      if (!category) {
        return { success: false, error: 'Invalid category' }
      }
    }
    
    // Check if category exists and belongs to user

    
    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        ...validatedData,
        userId: userId
      }
    })
    
    revalidatePath('/dashboard')
    return { success: true, data: transaction }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') }
    }
    
    console.error('Error creating transaction:', error)
    return { success: false, error: 'Failed to create transaction' }
  }
}

// Update transaction
export async function updateTransaction(
  id: number,
  data: z.infer<typeof transactionSchema>
) {
  try {
    const userId = await getCurrentUserId()
    
    // Validate input data
    const validatedData = transactionSchema.parse(data)
    
    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        userId: userId
      }
    })
    
    if (!existingTransaction) {
      return { success: false, error: 'Transaction not found' }
    }
    
    // Check if category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: validatedData.categoryId,
        userId: userId
      }
    })
    
    if (!category) {
      return { success: false, error: 'Invalid category' }
    }
    
    // Update transaction
    const transaction = await prisma.transaction.update({
      where: {
        id: id
      },
      data: validatedData
    })
    
    revalidatePath('/dashboard')
    return { success: true, data: transaction }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') }
    }
    
    console.error('Error updating transaction:', error)
    return { success: false, error: 'Failed to update transaction' }
  }
}

// Delete transaction
export async function deleteTransaction(id: number) {
  try {
    const userId = await getCurrentUserId()
    
    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        userId: userId
      }
    })
    
    if (!existingTransaction) {
      return { success: false, error: 'Transaction not found' }
    }
    
    // Delete transaction
    await prisma.transaction.delete({
      where: {
        id: id
      }
    })
    
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return { success: false, error: 'Failed to delete transaction' }
  }
}

// Get summary statistics
export async function getTransactionSummary(startDate?: Date, endDate?: Date) {
  try {
    const userId = await getCurrentUserId()
    
    const dateFilter = startDate && endDate ? {
      date: {
        gte: startDate,
        lte: endDate
      }
    } : {}
    
    const [incomeTransactions, expenseTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: userId,
          type: 'INCOME',
          ...dateFilter
        }
      }),
      prisma.transaction.findMany({
        where: {
          userId: userId,
          type: 'EXPENSE',
          ...dateFilter
        }
      })
    ])
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
    const balance = totalIncome - totalExpense
    
    return { 
      success: true, 
      data: {
        totalIncome,
        totalExpense,
        balance,
        incomeCount: incomeTransactions.length,
        expenseCount: expenseTransactions.length,
        transactionCount: incomeTransactions.length + expenseTransactions.length
      }
    }
  } catch (error) {
    console.error('Error calculating transaction summary:', error)
    return { success: false, error: 'Failed to calculate summary' }
  }
}

// Get transactions by category
export async function getTransactionsByCategory(categoryId: number) {
  try {
    const userId = await getCurrentUserId()
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        categoryId: categoryId
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    return { success: true, data: transactions }
  } catch (error) {
    console.error('Error fetching transactions by category:', error)
    return { success: false, error: 'Failed to fetch transactions' }
  }
}