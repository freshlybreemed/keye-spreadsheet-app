import { useState, useCallback } from 'react';
import type {
  SpreadsheetState,
  SpreadsheetData,
  CellOperation,
  CellStyle
} from '../types/spreadsheet';
import { getCellKey, parseCellKey, validateCellValue } from '../utils/cellUtils';

const initialState: SpreadsheetState = {
  data: { columns: [], items: [] },
  cells: {},
  selectedCell: null,
  selectedRange: null,
  editingCell: null,
  history: [],
  historyIndex: -1
};

export const useSpreadsheet = (initialData?: SpreadsheetData) => {
  const [state, setState] = useState<SpreadsheetState>(() => ({
    ...initialState,
    data: initialData || initialState.data
  }));

  // Save current state to history
  const saveToHistory = useCallback((currentState: SpreadsheetState) => {
    const newHistory = currentState.history.slice(0, currentState.historyIndex + 1);
    newHistory.push({ ...currentState });
    
    return {
      ...currentState,
      history: newHistory.slice(-50), // Keep last 50 states
      historyIndex: newHistory.length - 1
    };
  }, []);

  // Execute cell operations
  const dispatch = useCallback((operation: CellOperation) => {
    setState(prevState => {
      let newState = { ...prevState };
      console.log('operation', operation);
      switch (operation.type) {
        case 'SET_VALUE': {
          const key = getCellKey(operation.position.row, operation.position.col);
          
                     // Get column type for validation
           const column = newState.data.columns[operation.position.col];
           if (column && operation.value !== '') {
             const validation = validateCellValue(operation.value, column.type, column.format);
            
            if (!validation.isValid) {
              // For now, we'll still set the value but mark it as invalid
              console.warn(`Invalid value for ${column.type} column: ${validation.error}`);
            }
            
            // Use formatted value if available
            const finalValue = validation.formattedValue || operation.value;
            newState.cells = { ...newState.cells, [key]: { ...newState.cells[key], value: finalValue } };
          } else {
            newState.cells = { ...newState.cells, [key]: { ...newState.cells[key], value: operation.value } };
          }
          
          newState = saveToHistory(newState);
          break;
        }

        case 'SET_STYLE': {
          const key = getCellKey(operation.position.row, operation.position.col);
          const existingCell = newState.cells[key] || { value: '' };
          newState.cells = {
            ...newState.cells,
            [key]: {
              ...existingCell,
              style: { ...existingCell.style, ...operation.style }
            }
          };
          break;
        }

        case 'SET_FORMULA': {
          const key = getCellKey(operation.position.row, operation.position.col);
          const existingCell = newState.cells[key] || { value: '' };
          newState.cells = {
            ...newState.cells,
            [key]: { ...existingCell, formula: operation.formula }
          };
          newState = saveToHistory(newState);
          break;
        }

        case 'ADD_COLUMN': {
          const newColumnKey = `column_${Date.now()}`;
          const newColumn = {
            key: newColumnKey,
            name: operation.name || `Column ${newState.data.columns.length + 1}`,
            type: 'text' as const
          };
          
          // Add column to data structure
          const insertIndex = operation.index !== undefined ? operation.index : newState.data.columns.length;
          const newColumns = [...newState.data.columns];
          newColumns.splice(insertIndex, 0, newColumn);
          
          // Initialize all rows with empty value for new column
          const newItems = newState.data.items.map(item => ({
            ...item,
            [newColumnKey]: ''
          }));
          
          newState.data = {
            ...newState.data,
            columns: newColumns,
            items: newItems
          };
          
          newState = saveToHistory(newState);
          break;
        }

        case 'ADD_ROW': {
          const newRow: Record<string, string> = {};
          // Initialize new row with empty values for all columns
          newState.data.columns.forEach(column => {
            newRow[column.key] = '';
          });
          
          const insertIndex = operation.index !== undefined ? operation.index : newState.data.items.length;
          const newItems = [...newState.data.items];
          newItems.splice(insertIndex, 0, newRow);
          
          newState.data = {
            ...newState.data,
            items: newItems
          };
          
          newState = saveToHistory(newState);
          break;
        }

        case 'DELETE_COLUMN': {
          if (operation.index !== undefined && operation.index < newState.data.columns.length) {
            const columnToDelete = newState.data.columns[operation.index];
            const newColumns = newState.data.columns.filter((_, index) => index !== operation.index);
            
            // Remove the column data from all rows
            const newItems = newState.data.items.map(item => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { [columnToDelete.key]: _, ...rest } = item;
              return rest;
            });
            
            // Clear any cells that reference this column
            const newCells = { ...newState.cells };
            Object.keys(newCells).forEach(cellKey => {
              const { row: cellRow, col: cellCol } = parseCellKey(cellKey);
              if (cellCol === operation.index) {
                delete newCells[cellKey];
              } else if (cellCol > operation.index) {
                // Shift cells to the left
                const newKey = getCellKey(cellRow, cellCol - 1);
                newCells[newKey] = newCells[cellKey];
                delete newCells[cellKey];
              }
            });
            
            newState.data = {
              ...newState.data,
              columns: newColumns,
              items: newItems
            };
            
            newState.cells = newCells;
            newState = saveToHistory(newState);
          }
          break;
        }

        case 'DELETE_ROW': {
          if (operation.index !== undefined && operation.index < newState.data.items.length) {
            const newItems = newState.data.items.filter((_, index) => index !== operation.index);
            
            // Clear any cells that reference this row and shift others up
            const newCells = { ...newState.cells };
            Object.keys(newCells).forEach(cellKey => {
              const { row: cellRow, col: cellCol } = parseCellKey(cellKey);
              if (cellRow === operation.index) {
                delete newCells[cellKey];
              } else if (cellRow > operation.index) {
                // Shift cells up
                const newKey = getCellKey(cellRow - 1, cellCol);
                newCells[newKey] = newCells[cellKey];
                delete newCells[cellKey];
              }
            });
            
            newState.data = {
              ...newState.data,
              items: newItems
            };
            
            newState.cells = newCells;
            newState = saveToHistory(newState);
          }
          break;
        }

        case 'SELECT_CELL':
          newState.selectedCell = operation.position;
          newState.selectedRange = null;
          break;

        case 'SELECT_RANGE':
          newState.selectedRange = operation.range;
          newState.selectedCell = null;
          break;

        case 'START_EDITING':
          newState.editingCell = operation.position;
          break;

        case 'STOP_EDITING':
          newState.editingCell = null;
          break;

        case 'UPDATE_COLUMN_NAME': {
          if (operation.columnIndex >= 0 && operation.columnIndex < newState.data.columns.length) {
            const updatedColumns = [...newState.data.columns];
            updatedColumns[operation.columnIndex] = {
              ...updatedColumns[operation.columnIndex],
              name: operation.newName
            };
            newState.data = { ...newState.data, columns: updatedColumns };
            newState = saveToHistory(newState);
          }
          break;
        }

        case 'UPDATE_COLUMN_TYPE': {
          if (operation.columnIndex >= 0 && operation.columnIndex < newState.data.columns.length) {
            const updatedColumns = [...newState.data.columns];
            updatedColumns[operation.columnIndex] = {
              ...updatedColumns[operation.columnIndex],
              type: operation.columnType,
              format: operation.format || {}
            };
            newState.data = { ...newState.data, columns: updatedColumns };
            newState = saveToHistory(newState);
          }
          break;
        }

        case 'UNDO':
          if (newState.historyIndex > 0) {
            const previousState = newState.history[newState.historyIndex - 1];
            newState = {
              ...previousState,
              history: newState.history,
              historyIndex: newState.historyIndex - 1
            };
          }
          break;

        case 'REDO':
          if (newState.historyIndex < newState.history.length - 1) {
            const nextState = newState.history[newState.historyIndex + 1];
            newState = {
              ...nextState,
              history: newState.history,
              historyIndex: newState.historyIndex + 1
            };
          }
          break;
      }

      return newState;
    });
  }, [saveToHistory]);

  // Get raw cell value (for editing)
  const getCellRawValue = useCallback((row: number, col: number): string | number => {
    const key = getCellKey(row, col);
    const cell = state.cells[key];
    
    if (cell?.value !== undefined) {
      return cell.value;
    }
    
    // Get value from original data
    if (row < state.data.items.length && col < state.data.columns.length) {
      const item = state.data.items[row];
      const column = state.data.columns[col];
      return item[column.key] || '';
    }
    
    return '';
  }, [state.cells, state.data]);

  // Get formatted cell value (for display)
  const getCellDisplayValue = useCallback((row: number, col: number): string => {
    const rawValue = getCellRawValue(row, col);
    
    if (col < state.data.columns.length) {
      const column = state.data.columns[col];
      if (column && typeof rawValue === 'number' && (column.type === 'number' || column.type === 'currency')) {
        // Round numbers to 2 decimal places for display
        return rawValue.toLocaleString(undefined, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 0
        });
      }
    }
    
    return String(rawValue);
  }, [getCellRawValue, state.data.columns]);

  // Get cell style
  const getCellStyle = useCallback((row: number, col: number): CellStyle => {
    const key = getCellKey(row, col);
    return state.cells[key]?.style || {};
  }, [state.cells]);

  // Update spreadsheet data
  const updateData = useCallback((newData: SpreadsheetData) => {
    setState(prev => ({
      ...prev,
      data: newData
    }));
  }, []);

  return {
    state,
    dispatch,
    getCellDisplayValue,
    getCellRawValue,
    getCellStyle,
    updateData
  };
};
