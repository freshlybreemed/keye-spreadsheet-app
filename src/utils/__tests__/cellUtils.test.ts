import { describe, it, expect } from 'vitest'
import {
  getCellKey,
  parseCellKey,
  validateCellValue,
  formatDate,
  inferColumnType,
  getColumnName,
  calculateRangeStats,
  formatCalculatedValue
} from '../cellUtils'

describe('cellUtils', () => {
  describe('getCellKey', () => {
    it('should generate correct cell key', () => {
      expect(getCellKey(0, 0)).toBe('0-0')
      expect(getCellKey(5, 3)).toBe('5-3')
    })
  })

  describe('parseCellKey', () => {
    it('should parse cell key correctly', () => {
      expect(parseCellKey('0-0')).toEqual({ row: 0, col: 0 })
      expect(parseCellKey('5-3')).toEqual({ row: 5, col: 3 })
    })
  })

  describe('validateCellValue', () => {
    it('should validate text values', () => {
      const result = validateCellValue('hello', 'text')
      expect(result.isValid).toBe(true)
      expect(result.formattedValue).toBe('hello')
    })

    it('should validate number values', () => {
      const result = validateCellValue('123.45', 'number')
      expect(result.isValid).toBe(true)
      expect(result.formattedValue).toBe('123.45')
    })

    it('should reject invalid numbers', () => {
      const result = validateCellValue('not a number', 'number')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be a valid number')
    })

    it('should validate currency values', () => {
      const result = validateCellValue('$123.45', 'currency')
      expect(result.isValid).toBe(true)
      expect(result.formattedValue).toBe('$123.45')
    })

    it('should validate percentage values', () => {
      const result = validateCellValue('50%', 'percentage')
      expect(result.isValid).toBe(true)
      expect(result.formattedValue).toBe('50.0%')
    })

    it('should validate email addresses', () => {
      const result = validateCellValue('test@example.com', 'email')
      expect(result.isValid).toBe(true)
      expect(result.formattedValue).toBe('test@example.com')
    })

    it('should reject invalid email addresses', () => {
      const result = validateCellValue('invalid-email', 'email')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be a valid email address')
    })

    it('should validate URLs', () => {
      const result = validateCellValue('https://example.com', 'url')
      expect(result.isValid).toBe(true)
      expect(result.formattedValue).toBe('https://example.com')
    })

    it('should validate boolean values', () => {
      const result = validateCellValue('true', 'boolean')
      expect(result.isValid).toBe(true)
      expect(result.formattedValue).toBe('Yes')
    })
  })

  describe('formatDate', () => {
    const testDate = new Date(2024, 0, 15) // January 15, 2024 (month is 0-indexed)

    it('should format date in MM/DD/YYYY format', () => {
      expect(formatDate(testDate, 'MM/DD/YYYY')).toBe('01/15/2024')
    })

    it('should format date in DD/MM/YYYY format', () => {
      expect(formatDate(testDate, 'DD/MM/YYYY')).toBe('15/01/2024')
    })

    it('should format date in YYYY-MM-DD format', () => {
      expect(formatDate(testDate, 'YYYY-MM-DD')).toBe('2024-01-15')
    })
  })

  describe('inferColumnType', () => {
    it('should detect currency type from string numbers', () => {
      expect(inferColumnType(['$100', '$200', '$300'])).toBe('currency')
    })

    it('should detect percentage type', () => {
      expect(inferColumnType(['50%', '75%', '100%'])).toBe('percentage')
    })

    it('should detect email type', () => {
      expect(inferColumnType(['test1@example.com', 'test2@example.com'])).toBe('email')
    })

    it('should detect plain number type', () => {
      expect(inferColumnType(['123', '456', '789'])).toBe('number')
    })

    it('should default to text type for mixed content', () => {
      expect(inferColumnType(['hello', 'world', 'test'])).toBe('text')
    })

    it('should handle empty arrays', () => {
      expect(inferColumnType([])).toBe('text')
    })
  })

  describe('getColumnName', () => {
    it('should generate correct column names', () => {
      expect(getColumnName(0)).toBe('A')
      expect(getColumnName(1)).toBe('B')
      expect(getColumnName(25)).toBe('Z')
      expect(getColumnName(26)).toBe('AA')
    })
  })

  describe('calculateRangeStats', () => {
    it('should calculate statistics for numeric values', () => {
      const values = [1, 2, 3, 4, 5]
      const stats = calculateRangeStats(values)
      
      expect(stats.sum).toBe(15)
      expect(stats.average).toBe(3)
      expect(stats.numericCount).toBe(5)
    })

    it('should handle mixed value types', () => {
      const values = [1, 'text', 3, 'more text', 5]
      const stats = calculateRangeStats(values)
      
      expect(stats.sum).toBe(9)
      expect(stats.average).toBe(3)
      expect(stats.numericCount).toBe(3)
    })

    it('should handle empty values', () => {
      const values: (string | number)[] = []
      const stats = calculateRangeStats(values)
      
      expect(stats.sum).toBe(0)
      expect(stats.average).toBe(0)
      expect(stats.numericCount).toBe(0)
    })
  })

  describe('formatCalculatedValue', () => {
    it('should format numbers with proper decimals', () => {
      expect(formatCalculatedValue(1234.567)).toBe('1,234.57')
      expect(formatCalculatedValue(100)).toBe('100.00')
      expect(formatCalculatedValue(0.5)).toBe('0.50')
    })
  })
}) 