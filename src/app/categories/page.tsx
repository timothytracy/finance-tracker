/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/app/actions/categories'
import { Category, TransactionType } from '@prisma/client'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'EXPENSE' as TransactionType,
    color: '',
    icon: ''
  })

  const router = useRouter()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const result = await getCategories()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch categories')
      }
      setCategories(result.data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
      setError('Failed to load categories. Please try again.')
      toast.error('Failed to load categories. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCategory = async () => {
    try {
      const result = editingCategory
        ? await updateCategory(editingCategory.id, newCategory)
        : await createCategory(newCategory)

      if (!result.success) {
        throw new Error(result.error || 'Failed to save category')
      }

      toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully')
      setOpenDialog(false)
      setNewCategory({ name: '', type: 'EXPENSE', color: '', icon: '' })
      setEditingCategory(null)
      loadCategories()
    } catch (err) {
      console.error('Error saving category:', err)
      toast.error('Failed to save category. Please try again.')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const result = await deleteCategory(id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete category')
      }

      toast.success('Category deleted successfully')
      loadCategories()
    } catch (err) {
      console.error('Error deleting category:', err)
      toast.error('Failed to delete category. Please try again.')
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Categories</h1>
        <Button onClick={() => setOpenDialog(true)}>Add Category</Button>
      </div>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="text-center">No categories found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: category.color || '#9CA3AF' }}
                  />
                  <span>{category.type}</span>
                </div>
                <div className="mt-4 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingCategory(category)
                      setNewCategory({
                        name: category.name,
                        type: category.type,
                        color: category.color || '',
                        icon: category.icon || ''
                      })
                      setOpenDialog(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => handleDeleteCategory(category.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={newCategory.type}
                onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as TransactionType })}
                className="border rounded px-2 py-1"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveCategory}>{editingCategory ? 'Update' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}