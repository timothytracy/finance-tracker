'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { TransactionType } from '@prisma/client'
import { getCurrentUserId } from './auth'
import prisma from '@/prisma/PrismaClient'

// Category validation schema
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().optional(),
  icon: z.string().optional()
})



// Get all categories
export async function getCategories() {
  try {
    const userId = await getCurrentUserId()
    
    const categories = await prisma.category.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return { success: true, data: categories }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { success: false, error: 'Failed to fetch categories' }
  }
}

// Get categories by type (INCOME or EXPENSE)
export async function getCategoriesByType(type: TransactionType) {
  try {
    const userId = await getCurrentUserId()
    
    const categories = await prisma.category.findMany({
      where: {
        userId: userId,
        type: type
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return { success: true, data: categories }
  } catch (error) {
    console.error('Error fetching categories by type:', error)
    return { success: false, error: 'Failed to fetch categories' }
  }
}

// Get category by ID
export async function getCategoryById(id: number) {
  try {
    const userId = await getCurrentUserId()
    
    const category = await prisma.category.findFirst({
      where: {
        id: id,
        userId: userId
      }
    })
    
    if (!category) {
      return { success: false, error: 'Category not found' }
    }
    
    return { success: true, data: category }
  } catch (error) {
    console.error('Error fetching category:', error)
    return { success: false, error: 'Failed to fetch category' }
  }
}

// Create category
export async function createCategory(data: z.infer<typeof categorySchema>) {
  try {
    const userId = await getCurrentUserId()
    
    // Validate input data
    const validatedData = categorySchema.parse(data)
    
    // Check if category with same name and type already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: userId,
        name: validatedData.name,
        type: validatedData.type
      }
    })
    
    if (existingCategory) {
      return { success: false, error: 'A category with this name and type already exists' }
    }
    
    // Create category
    const category = await prisma.category.create({
      data: {
        ...validatedData,
        userId: userId
      }
    })
    
    revalidatePath('/dashboard')
    return { success: true, data: category }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') }
    }
    
    console.error('Error creating category:', error)
    return { success: false, error: 'Failed to create category' }
  }
}

// Update category
export async function updateCategory(
  id: number,
  data: z.infer<typeof categorySchema>
) {
  try {
    const userId = await getCurrentUserId()
    
    // Validate input data
    const validatedData = categorySchema.parse(data)
    
    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: id,
        userId: userId
      }
    })
    
    if (!existingCategory) {
      return { success: false, error: 'Category not found' }
    }
    
    // Check if another category with same name and type already exists
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        userId: userId,
        name: validatedData.name,
        type: validatedData.type,
        id: { not: id }
      }
    })
    
    if (duplicateCategory) {
      return { success: false, error: 'A category with this name and type already exists' }
    }
    
    // Update category
    const category = await prisma.category.update({
      where: {
        id: id
      },
      data: validatedData
    })
    
    revalidatePath('/dashboard')
    return { success: true, data: category }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') }
    }
    
    console.error('Error updating category:', error)
    return { success: false, error: 'Failed to update category' }
  }
}

// Delete category
export async function deleteCategory(id: number) {
  try {
    const userId = await getCurrentUserId()
    
    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: id,
        userId: userId
      }
    })
    
    if (!existingCategory) {
      return { success: false, error: 'Category not found' }
    }
    
    // Check if category is being used in transactions
    const transactionsUsingCategory = await prisma.transaction.findFirst({
      where: {
        categoryId: id
      }
    })
    
    if (transactionsUsingCategory) {
      return { 
        success: false, 
        error: 'This category cannot be deleted because it is being used in transactions',
        hasTransactions: true
      }
    }
    
    // Delete category
    await prisma.category.delete({
      where: {
        id: id
      }
    })
    
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error deleting category:', error)
    return { success: false, error: 'Failed to delete category' }
  }
}

// Get category statistics
export async function getCategoryStatistics(type: TransactionType, startDate?: Date, endDate?: Date) {
  try {
    const userId = await getCurrentUserId()
    
    const dateFilter = startDate && endDate ? {
      date: {
        gte: startDate,
        lte: endDate
      }
    } : {}
    
    // Get all categories of the specified type
    const categories = await prisma.category.findMany({
      where: {
        userId: userId,
        type: type
      },
      include: {
        transactions: {
          where: {
            ...dateFilter
          }
        }
      }
    })
    
    // Calculate total amount and count for each category
    const categoryStats = categories.map(category => {
      const totalAmount = category.transactions.reduce((sum, t) => sum + t.amount, 0)
      const transactionCount = category.transactions.length
      
      return {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        totalAmount,
        transactionCount
      }
    })
    
    // Calculate overall total
    const overallTotal = categoryStats.reduce((sum, cat) => sum + cat.totalAmount, 0)
    
    // Add percentage to each category
    const categoryStatsWithPercentage = categoryStats.map(cat => ({
      ...cat,
      percentage: overallTotal > 0 ? (cat.totalAmount / overallTotal) * 100 : 0
    }))
    
    return { 
      success: true, 
      data: {
        categories: categoryStatsWithPercentage,
        total: overallTotal
      }
    }
  } catch (error) {
    console.error('Error calculating category statistics:', error)
    return { success: false, error: 'Failed to calculate category statistics' }
  }
}

// Create default categories for new users
export async function createDefaultCategories() {
  try {
    const userId = await getCurrentUserId()
    
    // Check if user already has categories
    const existingCategories = await prisma.category.findMany({
      where: {
        userId: userId
      }
    })
    
    if (existingCategories.length > 0) {
      return { success: true, message: 'User already has categories' }
    }
    
    // Define default categories
    const defaultCategories = [
      // Income categories
      { name: 'Salary', type: 'INCOME' as TransactionType, color: '#4CAF50', icon: 'wallet' },
      { name: 'Investments', type: 'INCOME' as TransactionType, color: '#2196F3', icon: 'trending-up' },
      { name: 'Gifts', type: 'INCOME' as TransactionType, color: '#9C27B0', icon: 'gift' },
      { name: 'Other Income', type: 'INCOME' as TransactionType, color: '#607D8B', icon: 'plus-circle' },
      
      // Expense categories
      { name: 'Food & Dining', type: 'EXPENSE' as TransactionType, color: '#FF9800', icon: 'utensils' },
      { name: 'Housing', type: 'EXPENSE' as TransactionType, color: '#795548', icon: 'home' },
      { name: 'Transportation', type: 'EXPENSE' as TransactionType, color: '#F44336', icon: 'car' },
      { name: 'Entertainment', type: 'EXPENSE' as TransactionType, color: '#673AB7', icon: 'film' },
      { name: 'Shopping', type: 'EXPENSE' as TransactionType, color: '#E91E63', icon: 'shopping-bag' },
      { name: 'Utilities', type: 'EXPENSE' as TransactionType, color: '#00BCD4', icon: 'power' },
      { name: 'Healthcare', type: 'EXPENSE' as TransactionType, color: '#8BC34A', icon: 'activity' },
      { name: 'Personal', type: 'EXPENSE' as TransactionType, color: '#3F51B5', icon: 'user' },
      { name: 'Education', type: 'EXPENSE' as TransactionType, color: '#009688', icon: 'book' },
      { name: 'Other Expenses', type: 'EXPENSE' as TransactionType, color: '#9E9E9E', icon: 'more-horizontal' }
    ]
    
    // Create all default categories in a single transaction
    await prisma.$transaction(
      defaultCategories.map(category => 
        prisma.category.create({
          data: {
            ...category,
            userId: userId
          }
        })
      )
    )
    
    return { success: true, message: 'Default categories created successfully' }
  } catch (error) {
    console.error('Error creating default categories:', error)
    return { success: false, error: 'Failed to create default categories' }
  }
}