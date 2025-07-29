import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpreadsheet } from '../useSpreadsheet'
import type { SpreadsheetData } from '../../types/spreadsheet'

const mockData: SpreadsheetData = {
  columns: [
    { name: 'product', key: 'product', type: 'text' },
    { name: '2020', key: '2020', type: 'currency' },
    { name: '2021', key: '2021', type: 'currency' }
  ],
  items: [
    { product: 'Widget A', '2020': 100, '2021': 150 },
    { product: 'Widget B', '2020': 200, '2021': 250 }
  ]
}

describe('useSpreadsheet', () => {
  it('should initialize with provided data', () => {
    const { result } = renderHook(() => useSpreadsheet(mockData))
    
    expect(result.current.state.data).toEqual(mockData)
    expect(result.current.state.selectedCell).toBeNull()
    expect(result.current.state.selectedRange).toBeNull()
    expect(result.current.state.editingCell).toBeNull()
  })

  it('should handle cell selection', () => {
    const { result } = renderHook(() => useSpreadsheet(mockData))
    
    act(() => {
      result.current.dispatch({
        type: 'SELECT_CELL',
        position: { row: 0, col: 1 }
      })
    })
    
    expect(result.current.state.selectedCell).toEqual({ row: 0, col: 1 })
    expect(result.current.state.selectedRange).toBeNull()
  })

  it('should handle range selection', () => {
    const { result } = renderHook(() => useSpreadsheet(mockData))
    
    act(() => {
      result.current.dispatch({
        type: 'SELECT_RANGE',
        range: {
          start: { row: 0, col: 0 },
          end: { row: 1, col: 1 }
        }
      })
    })
    
    expect(result.current.state.selectedRange).toEqual({
      start: { row: 0, col: 0 },
      end: { row: 1, col: 1 }
    })
    expect(result.current.state.selectedCell).toBeNull()
  })

  it('should handle cell value changes', () => {
    const { result } = renderHook(() => useSpreadsheet(mockData))
    
    act(() => {
      result.current.dispatch({
        type: 'SET_VALUE',
        position: { row: 0, col: 0 },
        value: 'Updated Value'
      })
    })
    
    const cellValue = result.current.getCellDisplayValue(0, 0)
    expect(cellValue).toBe('Updated Value')
  })

  it('should handle cell styling', () => {
    const { result } = renderHook(() => useSpreadsheet(mockData))
    
    act(() => {
      result.current.dispatch({
        type: 'SET_STYLE',
        position: { row: 0, col: 0 },
        style: { bold: true, backgroundColor: '#ff0000' }
      })
    })
    
    const cellStyle = result.current.getCellStyle(0, 0)
    expect(cellStyle).toEqual({ bold: true, backgroundColor: '#ff0000' })
  })

  it('should handle editing state', () => {
    const { result } = renderHook(() => useSpreadsheet(mockData))
    
    act(() => {
      result.current.dispatch({
        type: 'START_EDITING',
        position: { row: 0, col: 0 }
      })
    })
    
    expect(result.current.state.editingCell).toEqual({ row: 0, col: 0 })
    
    act(() => {
      result.current.dispatch({ type: 'STOP_EDITING' })
    })
    
    expect(result.current.state.editingCell).toBeNull()
  })

  it('should handle adding columns', () => {
    const { result } = renderHook(() => useSpreadsheet(mockData))
    
    act(() => {
      result.current.dispatch({
        type: 'ADD_COLUMN',
        name: 'New Column'
      })
    })
    
    expect(result.current.state.data.columns).toHaveLength(4)
    expect(result.current.state.data.columns[3].name).toBe('New Column')
  })

  it('should handle adding rows', () => {
    const { result } = renderHook(() => useSpreadsheet(mockData))
    
    act(() => {
      result.current.dispatch({ type: 'ADD_ROW' })
    })
    
    expect(result.current.state.data.items).toHaveLength(3)
  })

  it('should handle undo functionality', () => {
    const { result } = renderHook(() => useSpreadsheet(mockData))
    
    // Check initial state
    expect(result.current.getCellDisplayValue(0, 0)).toBe('Widget A')
    
    // Make a change
    act(() => {
      result.current.dispatch({
        type: 'SET_VALUE',
        position: { row: 0, col: 0 },
        value: 'Changed Value'
      })
    })
    
    expect(result.current.getCellDisplayValue(0, 0)).toBe('Changed Value')
    expect(result.current.state.historyIndex).toBeGreaterThan(0)
    
    // Undo the change
    act(() => {
      result.current.dispatch({ type: 'UNDO' })
    })
    
    // After undo, should show the original value
    expect(result.current.getCellDisplayValue(0, 0)).toBe('Widget A')
  })

  it('should handle redo functionality', () => {
    const { result } = renderHook(() => useSpreadsheet(mockData))
    
    // Check initial state
    expect(result.current.getCellDisplayValue(0, 0)).toBe('Widget A')
    
    // Make a change
    act(() => {
      result.current.dispatch({
        type: 'SET_VALUE',
        position: { row: 0, col: 0 },
        value: 'Changed Value'
      })
    })
    
    expect(result.current.getCellDisplayValue(0, 0)).toBe('Changed Value')
    
    // Undo the change
    act(() => {
      result.current.dispatch({ type: 'UNDO' })
    })
    
    expect(result.current.getCellDisplayValue(0, 0)).toBe('Widget A')
    
    // Redo the change
    act(() => {
      result.current.dispatch({ type: 'REDO' })
    })
    
    expect(result.current.getCellDisplayValue(0, 0)).toBe('Changed Value')
  })

  it('should get original data values when no overrides exist', () => {
    const { result } = renderHook(() => useSpreadsheet(mockData))
    
    expect(result.current.getCellDisplayValue(0, 0)).toBe('Widget A')
    expect(result.current.getCellDisplayValue(0, 1)).toBe('100')
    expect(result.current.getCellDisplayValue(1, 0)).toBe('Widget B')
  })

  it('should return empty string for out-of-bounds cells', () => {
    const { result } = renderHook(() => useSpreadsheet(mockData))
    
    expect(result.current.getCellDisplayValue(10, 10)).toBe('')
  })
}) 