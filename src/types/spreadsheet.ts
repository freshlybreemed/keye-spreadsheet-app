// Spreadsheet data types based on the API format
export interface SpreadsheetColumn {
  key: string;
  name: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'email' | 'url' | 'boolean';
  format?: {
    decimals?: number;
    currency?: string;
    dateFormat?: string;
    validation?: {
      required?: boolean;
      min?: number;
      max?: number;
      pattern?: string;
    };
  };
}

export interface SpreadsheetItem {
  [key: string]: string | number;
}

export interface SpreadsheetData {
  columns: SpreadsheetColumn[];
  items: SpreadsheetItem[];
}

export interface ApiResponse {
  Values: SpreadsheetData;
}

// Cell-related types for spreadsheet functionality
export interface CellPosition {
  row: number;
  col: number;
}

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
}

export interface Cell {
  value: string | number;
  displayValue?: string;
  style?: CellStyle;
  formula?: string;
}

export interface SpreadsheetState {
  data: SpreadsheetData;
  cells: { [key: string]: Cell };
  selectedCell: CellPosition | null;
  selectedRange: CellRange | null;
  editingCell: CellPosition | null;
  history: SpreadsheetState[];
  historyIndex: number;
}

// Utility type for cell operations
export type CellOperation =
  | { type: 'SET_VALUE'; position: CellPosition; value: string | number }
  | { type: 'SET_STYLE'; position: CellPosition; style: Partial<CellStyle> }
  | { type: 'SET_FORMULA'; position: CellPosition; formula: string }
  | { type: 'SELECT_CELL'; position: CellPosition }
  | { type: 'SELECT_RANGE'; range: CellRange }
  | { type: 'START_EDITING'; position: CellPosition }
  | { type: 'STOP_EDITING' }
  | { type: 'ADD_COLUMN'; index?: number; name?: string }
  | { type: 'ADD_ROW'; index?: number }
  | { type: 'DELETE_COLUMN'; index: number }
  | { type: 'DELETE_ROW'; index: number }
  | { type: 'UPDATE_COLUMN_NAME'; columnIndex: number; newName: string }
  | { type: 'UPDATE_COLUMN_TYPE'; columnIndex: number; columnType: SpreadsheetColumn['type']; format?: SpreadsheetColumn['format'] }
  | { type: 'SORT_COLUMN'; columnIndex: number; direction: 'asc' | 'desc' }
  | { type: 'UNDO' }
  | { type: 'REDO' };
