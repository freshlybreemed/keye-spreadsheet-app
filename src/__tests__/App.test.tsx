import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { fetchSpreadsheetData } from '../services/api'

// Mock the API service
vi.mock('../services/api', () => ({
  fetchSpreadsheetData: vi.fn(),
  saveSpreadsheetData: vi.fn(),
}))

const mockFetchSpreadsheetData = vi.mocked(fetchSpreadsheetData)

const mockData = {
  columns: [
    { name: 'product', key: 'product', type: 'text' as const },
    { name: '2020', key: '2020', type: 'currency' as const },
    { name: '2021', key: '2021', type: 'currency' as const }
  ],
  items: [
    { product: 'Widget A', '2020': 100, '2021': 150 },
    { product: 'Widget B', '2020': 200, '2021': 250 }
  ]
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state initially', () => {
    mockFetchSpreadsheetData.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<App />)
    
    expect(screen.getByText('Loading financial data...')).toBeInTheDocument()
  })

  it('should load and display spreadsheet data', async () => {
    mockFetchSpreadsheetData.mockResolvedValue(mockData)
    
    render(<App />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading financial data...')).not.toBeInTheDocument()
    })
    
    // Check if header is displayed
    expect(screen.getByText('Interactive Business Intelligence Spreadsheet')).toBeInTheDocument()
    
    // Check if spreadsheet is rendered
    expect(screen.getByText('PRODUCT')).toBeInTheDocument()
    expect(screen.getByText('2020')).toBeInTheDocument()
    expect(screen.getByText('2021')).toBeInTheDocument()
  })

  it('should show error state when data loading fails', async () => {
    mockFetchSpreadsheetData.mockRejectedValue(new Error('Network error'))
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load spreadsheet data')).toBeInTheDocument()
    })
  })

  it('should display header with logo and description', async () => {
    mockFetchSpreadsheetData.mockResolvedValue(mockData)
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading financial data...')).not.toBeInTheDocument()
    })
    
    expect(screen.getByText('Interactive Business Intelligence Spreadsheet')).toBeInTheDocument()
    expect(screen.getByText(/Interactive business intelligence spreadsheet/)).toBeInTheDocument()
    expect(screen.getByAltText('Keye')).toBeInTheDocument()
  })

  it('should render toolbar and spreadsheet components', async () => {
    mockFetchSpreadsheetData.mockResolvedValue(mockData)
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading financial data...')).not.toBeInTheDocument()
    })
    
    // Check for toolbar elements
    expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument()
    expect(screen.getByTitle('Bold Text (Ctrl+B)')).toBeInTheDocument()
    
    // Check for spreadsheet elements
    expect(screen.getByText('Widget A')).toBeInTheDocument()
    expect(screen.getByText('Widget B')).toBeInTheDocument()
  })

  it('should handle API call on mount', async () => {
    mockFetchSpreadsheetData.mockResolvedValue(mockData)
    
    render(<App />)
    
    expect(mockFetchSpreadsheetData).toHaveBeenCalledTimes(1)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading financial data...')).not.toBeInTheDocument()
    })
  })

  it('should display data values in cells', async () => {
    mockFetchSpreadsheetData.mockResolvedValue(mockData)
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading financial data...')).not.toBeInTheDocument()
    })
    
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('250')).toBeInTheDocument()
  })
}) 