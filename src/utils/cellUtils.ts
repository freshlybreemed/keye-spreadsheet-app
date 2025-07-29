import type { CellPosition, CellRange, SpreadsheetData } from '../types/spreadsheet';

// Generate unique key for cell position
export const getCellKey = (row: number, col: number): string => {
  return `${row}-${col}`;
};

export const getCellValue = (row: number, col: number, data: SpreadsheetData): string => {
  const item = data.items[row];
  if (!item || !data.columns[col]) return '';
  const columnKey = data.columns[col].key;
  return String(item[columnKey] || '');
};

// Parse cell key back to position
export const parseCellKey = (key: string): { row: number; col: number } => {
  const [row, col] = key.split('-').map(Number);
  return { row, col };
};

// Data type validation and formatting
export const validateCellValue = (
  value: string | number, 
  columnType: string, 
  format?: { decimals?: number; currency?: string; dateFormat?: string }
): { isValid: boolean; error?: string; formattedValue?: string } => {
  if (!value && value !== 0) {
    return { isValid: true, formattedValue: '' };
  }

  const stringValue = String(value).trim();
  
  switch (columnType) {
    case 'text':
      return { isValid: true, formattedValue: stringValue };
      
    case 'number': {
      const num = parseFloat(stringValue);
      if (isNaN(num)) {
        return { isValid: false, error: 'Must be a valid number' };
      }
      const decimals = format?.decimals || 2;
      return {
        isValid: true,
        formattedValue: num.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })
      };
    }
       
    case 'currency': {
      const currencyNum = parseFloat(stringValue.replace(/[$,]/g, ''));
      if (isNaN(currencyNum)) {
        return { isValid: false, error: 'Must be a valid currency amount' };
      }
      const currency = format?.currency || 'USD';
      return {
        isValid: true,
        formattedValue: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency
        }).format(currencyNum)
      };
    }

    case 'percentage': {
  const percentNum = parseFloat(stringValue.replace(/%/g, ''));
  if (isNaN(percentNum)) {
    return { isValid: false, error: 'Must be a valid percentage' };
  }
  return {
    isValid: true,
    formattedValue: `${percentNum.toFixed(1)}%`
  };
}
    case 'date':{
      const dateValue = new Date(stringValue);
      if (isNaN(dateValue.getTime())) {
        return { isValid: false, error: 'Must be a valid date (MM/DD/YYYY)' };
      }
      const dateFormat = format?.dateFormat || 'MM/DD/YYYY';
      return {
        isValid: true,
        formattedValue: formatDate(dateValue, dateFormat)
      };
    }
    case 'email': {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(stringValue)) {
    return { isValid: false, error: 'Must be a valid email address' };
  }
  return { isValid: true, formattedValue: stringValue.toLowerCase() };
}
    case 'url':
      try {
        new URL(stringValue.startsWith('http') ? stringValue : `https://${stringValue}`);
        return { isValid: true, formattedValue: stringValue };
      } catch {
        return { isValid: false, error: 'Must be a valid URL' };
      }
    
    case 'boolean':{
      const boolValue = stringValue.toLowerCase();
      if (['true', 'false', 'yes', 'no', '1', '0'].includes(boolValue)) {
        const formatted = ['true', 'yes', '1'].includes(boolValue) ? 'Yes' : 'No';
        return { isValid: true, formattedValue: formatted };
      }
      return { isValid: false, error: 'Must be Yes/No, True/False, or 1/0' };
    }
    default:
      return { isValid: true, formattedValue: stringValue };
  }
};

export const formatDate = (date: Date, format: string): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${month}/${day}/${year}`;
  }
};

export const inferColumnType = (values: (string | number)[]): string => {
  if (values.length === 0) return 'text';
  
  const nonEmptyValues = values.filter(v => v !== '' && v !== null && v !== undefined);
  if (nonEmptyValues.length === 0) return 'text';
  
  // Check for currency first (must have $ symbol)
  const currencyCount = nonEmptyValues.filter(v => 
    String(v).match(/^\$[\d,]+\.?\d*$/)
  ).length;
  if (currencyCount > nonEmptyValues.length * 0.7) {
    return 'currency';
  }
  
  // Check for percentages (must have % symbol)
  const percentCount = nonEmptyValues.filter(v => 
    String(v).includes('%')
  ).length;
  if (percentCount > nonEmptyValues.length * 0.7) {
    return 'percentage';
  }
  
  // Check if all values are pure numbers
  const numericCount = nonEmptyValues.filter(v => !isNaN(Number(v))).length;
  if (numericCount === nonEmptyValues.length) {
    return 'number';
  }
  
  // Check if they look like dates (but exclude simple numbers)
  const dateCount = nonEmptyValues.filter(v => {
    const str = String(v);
    // Don't treat pure numbers as dates
    if (/^\d+\.?\d*$/.test(str)) return false;
    const date = new Date(str);
    return !isNaN(date.getTime()) && str.length > 4; // Minimum length to avoid false positives
  }).length;
  if (dateCount > nonEmptyValues.length * 0.7) {
    return 'date';
  }
  
  // Check if they look like emails
  const emailCount = nonEmptyValues.filter(v => 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))
  ).length;
  if (emailCount > nonEmptyValues.length * 0.7) {
    return 'email';
  }
  
  // Check if they look like URLs
  const urlCount = nonEmptyValues.filter(v => {
    const str = String(v);
    // Must start with http/https OR contain a dot (for domains)
    if (str.startsWith('http://') || str.startsWith('https://')) {
      try {
        new URL(str);
        return true;
      } catch {
        return false;
      }
    }
    // Check for domain-like patterns (must have dot and valid TLD)
    if (str.includes('.') && /\.[a-z]{2,}$/i.test(str)) {
      try {
        new URL(`https://${str}`);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }).length;
  if (urlCount > nonEmptyValues.length * 0.7) {
    return 'url';
  }
  
  // Check if they look like booleans
  const boolCount = nonEmptyValues.filter(v => 
    ['true', 'false', 'yes', 'no', '1', '0'].includes(String(v).toLowerCase())
  ).length;
  if (boolCount > nonEmptyValues.length * 0.7) {
    return 'boolean';
  }
  
  return 'text';
};

export const getColumnTypeIcon = (type: string): string => {
  switch (type) {
    case 'text': return '📝';
    case 'number': return '🔢';
    case 'currency': return '💰';
    case 'percentage': return '📊';
    case 'date': return '📅';
    case 'email': return '📧';
    case 'url': return '🔗';
    case 'boolean': return '✅';
    default: return '📝';
  }
};

export const getColumnTypeLabel = (type: string): string => {
  switch (type) {
    case 'text': return 'Text';
    case 'number': return 'Number';
    case 'currency': return 'Currency';
    case 'percentage': return 'Percentage';
    case 'date': return 'Date';
    case 'email': return 'Email';
    case 'url': return 'URL';
    case 'boolean': return 'Yes/No';
    default: return 'Text';
  }
};

export const getColumnName = (index: number): string => {
  let result = '';
  while (index >= 0) {
    result = String.fromCharCode(65 + (index % 26)) + result;
    index = Math.floor(index / 26) - 1;
  }
  return result;
};

export const isInRange = (position: CellPosition, range: CellRange): boolean => {
  return (
    position.row >= Math.min(range.start.row, range.end.row) &&
    position.row <= Math.max(range.start.row, range.end.row) &&
    position.col >= Math.min(range.start.col, range.end.col) &&
    position.col <= Math.max(range.start.col, range.end.col)
  );
};

export const formatCellValue = (value: string | number): string => {
  if (typeof value === 'number') {
    // Format numbers with proper decimal places
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });
  }
  return String(value);
};

export const normalizeRange = (range: CellRange): CellRange => {
  return {
    start: {
      row: Math.min(range.start.row, range.end.row),
      col: Math.min(range.start.col, range.end.col)
    },
    end: {
      row: Math.max(range.start.row, range.end.row),
      col: Math.max(range.start.col, range.end.col)
    }
  };
};

// Simple formula evaluation (basic SUM and AVERAGE)
export const evaluateFormula = (formula: string): number | string => {
  const trimmedFormula = formula.trim().toUpperCase();
  
  if (trimmedFormula.startsWith('SUM(') && trimmedFormula.endsWith(')')) {
    // For simplicity, assume range is like "A1:A10" or similar
    // In a real implementation, this would be more sophisticated
    return 'SUM_RESULT'; // Placeholder
  }
  
  if (trimmedFormula.startsWith('AVERAGE(') && trimmedFormula.endsWith(')')) {
    return 'AVG_RESULT'; // Placeholder
  }
  
  return formula;
};

// Range calculation functions
export const calculateRangeStats = (values: (string | number)[]) => {
  const numericValues = values
    .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
    .filter(v => !isNaN(v));
  
  const sum = numericValues.reduce((acc, val) => acc + val, 0);
  const average = numericValues.length > 0 ? sum / numericValues.length : 0;
  
  return {
    sum: Math.round(sum * 100) / 100, // Round to 2 decimal places
    average: Math.round(average * 100) / 100, // Round to 2 decimal places
    numericCount: numericValues.length
  };
};

export const formatCalculatedValue = (value: number): string => {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
};
