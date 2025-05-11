/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Chart as BarChart } from 'react-chartjs-2'
import { Chart as PieChart } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PieController, // Import PieController
} from 'chart.js'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PieController // Register PieController
)

import { getTransactionSummary } from '@/app/actions/transactions'
import { getCategoryStatistics } from '@/app/actions/categories'
import { toast } from 'sonner'
import { TransactionType } from '@prisma/client'

export default function ReportsPage() {
  const [summary, setSummary] = useState<any | null>(null)
  const [categoryStats, setCategoryStats] = useState<any[]>([])
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [filterType])

  const loadData = async () => {
    setLoading(true)
    try {
      const [summaryResult, categoryStatsResult] = await Promise.all([
        getTransactionSummary(),
        getCategoryStatistics(filterType === 'ALL' ? undefined : filterType)
      ])

      if (!summaryResult.success) throw new Error(summaryResult.error || 'Failed to fetch summary')
      if (!categoryStatsResult.success) throw new Error(categoryStatsResult.error || 'Failed to fetch category statistics')

      setSummary(summaryResult.data)
      setCategoryStats(categoryStatsResult?.data?.categories || [])
    } catch (err) {
      console.error('Error loading data:', err)
      toast.error('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const pieChartData = {
    labels: categoryStats.map((stat) => stat.name),
    datasets: [
      {
        data: categoryStats.map((stat) => stat.totalAmount),
        backgroundColor: categoryStats.map((stat) => stat.color || '#9CA3AF'),
      },
    ],
  }

  const barChartData = {
    labels: ['Income', 'Expense', 'Balance'],
    datasets: [
      {
        label: 'Amount',
        data: [
          summary?.totalIncome || 0,
          summary?.totalExpense || 0,
          summary?.balance || 0,
        ],
        backgroundColor: ['#4CAF50', '#F44336', '#2196F3'],
      },
    ],
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Reports & Analytics</h1>

      <div className="flex gap-4 mb-6">
        {/* Filter by Type */}
        <div className="flex flex-col">
          <label htmlFor="filterType" className="text-sm font-medium mb-2">
            Filter by Type
          </label>
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
      </div>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">${summary?.totalIncome.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Expense</p>
                  <p className="text-2xl font-bold text-red-600">${summary?.totalExpense.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Balance</p>
                  <p
                    className={`text-2xl font-bold ${
                      (summary?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}
                  >
                    ${summary?.balance.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart type="pie" data={pieChartData} />
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={barChartData} type={'bar'} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}