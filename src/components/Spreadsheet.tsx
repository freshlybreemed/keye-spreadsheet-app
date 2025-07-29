import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSpreadsheet } from '../hooks/useSpreadsheet';
import type { SpreadsheetData, CellPosition, CellStyle } from '../types/spreadsheet';
import Cell from './Cell';
import Toolbar from './Toolbar';
import './Spreadsheet.css';

interface SpreadsheetProps {
  data: SpreadsheetData;
}

const Spreadsheet: React.FC<SpreadsheetProps> = ({ data }) => {
  const { state, dispatch, getCellDisplayValue, getCellRawValue, getCellStyle } = useSpreadsheet(data);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedCellId, setDraggedCellId] = useState<string | null>(null);
  const [draggedRange, setDraggedRange] = useState<{ start: CellPosition; end: CellPosition } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'column' | 'row'; index: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<CellPosition | null>(null);
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>(() => {
    // Load column widths from localStorage
    try {
      const stored = localStorage.getItem('keye-spreadsheet-column-widths');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load column widths:', error);
    }
    return {};
  });
  const [resizingColumn, setResizingColumn] = useState<{ index: number; startX: number; startWidth: number } | null>(null);

  // Column sorting state
  const [sortedColumn, setSortedColumn] = useState<{ index: number; direction: 'asc' | 'desc' } | null>(null);

  // Auto-save column widths when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('keye-spreadsheet-column-widths', JSON.stringify(columnWidths));
      } catch (error) {
        console.warn('Failed to save column widths:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [columnWidths]);

  // Utility functions
  const isSelected = useCallback((row: number, col: number): boolean => {
    return state.selectedCell?.row === row && state.selectedCell?.col === col;
  }, [state.selectedCell]);

  const isInRange = useCallback((row: number, col: number): boolean => {
    if (!state.selectedRange) return false;
    const { start, end } = state.selectedRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [state.selectedRange]);

  const isEditing = useCallback((row: number, col: number): boolean => {
    return state.editingCell?.row === row && state.editingCell?.col === col;
  }, [state.editingCell]);

  const isBeingDragged = useCallback((row: number, col: number): boolean => {
    if (!draggedRange) return false;
    const { start, end } = draggedRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [draggedRange]);

  const getRangeClasses = useCallback((row: number, col: number): string => {
    if (!state.selectedRange) return '';
    
    const { start, end } = state.selectedRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    
    if (row < minRow || row > maxRow || col < minCol || col > maxCol) {
      return '';
    }
    
    const classes = [];
    
    // Range position indicators
    if (row === minRow && col === minCol) classes.push('range-start');
    if (row === maxRow && col === maxCol) classes.push('range-end');
    
    // Range borders
    if (row === minRow) classes.push('range-top');
    if (row === maxRow) classes.push('range-bottom');
    if (col === minCol) classes.push('range-left');
    if (col === maxCol) classes.push('range-right');
    
    return classes.join(' ');
  }, [state.selectedRange]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.selectedCell) return;

      const { row, col } = state.selectedCell;
      let newPosition: CellPosition | null = null;

      switch (e.key) {
        case 'ArrowUp':
          if (row > 0) newPosition = { row: row - 1, col };
          break;
        case 'ArrowDown':
          if (row < state.data.items.length - 1) newPosition = { row: row + 1, col };
          break;
        case 'ArrowLeft':
          if (col > 0) newPosition = { row, col: col - 1 };
          break;
        case 'ArrowRight':
          if (col < state.data.columns.length - 1) newPosition = { row, col: col + 1 };
          break;
        case 'Enter':
          if (state.editingCell) {
            dispatch({ type: 'STOP_EDITING' });
          } else {
            dispatch({ type: 'START_EDITING', position: state.selectedCell });
          }
          break;
        case 'Escape':
          if (state.editingCell) {
            dispatch({ type: 'STOP_EDITING' });
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (!state.editingCell) {
            dispatch({ type: 'SET_VALUE', position: state.selectedCell, value: '' });
          }
          break;
      }

      // Handle Ctrl+Z (Undo) and Ctrl+Y (Redo)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          dispatch({ type: 'UNDO' });
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          dispatch({ type: 'REDO' });
        }
      }

      if (newPosition) {
        e.preventDefault();
        dispatch({ type: 'SELECT_CELL', position: newPosition });
      }
    };

    const handleClickOutside = () => {
      setContextMenu(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [state.selectedCell, state.editingCell, state.data.items.length, state.data.columns.length, dispatch]);

  // Enhanced drag functionality with move/copy
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging && dragStart) {
        e.preventDefault();
        
        // Find the drop target
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const cellElement = element?.closest('[data-row][data-col]') as HTMLElement;
        
        if (cellElement && draggedRange) {
          // This was a cell move operation
          const dropRow = parseInt(cellElement.getAttribute('data-row') || '0');
          const dropCol = parseInt(cellElement.getAttribute('data-col') || '0');
          
          const { start, end } = draggedRange;
          const minRow = Math.min(start.row, end.row);
          const maxRow = Math.max(start.row, end.row);
          const minCol = Math.min(start.col, end.col);
          const maxCol = Math.max(start.col, end.col);
          
          // Calculate the offset from the drag source to the drop target
          const [sourceRow, sourceCol] = draggedCellId!.split('-').map(Number);
          const rowOffset = dropRow - sourceRow;
          const colOffset = dropCol - sourceCol;
          
          console.log(`Moving range ${minRow}-${maxRow}, ${minCol}-${maxCol} with offset ${rowOffset},${colOffset}`);
          
          // Collect all cell data first (to avoid overwriting issues)
          const cellData: Array<{
            sourcePos: { row: number; col: number };
            targetPos: { row: number; col: number };
            value: string;
            style: CellStyle;
          }> = [];
          
          for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
              const newRow = row + rowOffset;
              const newCol = col + colOffset;
              
              // Check bounds
              if (newRow >= 0 && newRow < state.data.items.length && 
                  newCol >= 0 && newCol < state.data.columns.length) {
                
                const value = getCellDisplayValue(row, col);
                const style = getCellStyle(row, col);
                
                if (value) { // Only move cells with content
                  cellData.push({
                    sourcePos: { row, col },
                    targetPos: { row: newRow, col: newCol },
                    value,
                    style
                  });
                }
              }
            }
          }
          
          // Clear all source cells first
          for (const cell of cellData) {
            dispatch({ type: 'SET_VALUE', position: cell.sourcePos, value: '' });
          }
          
          // Then set all target cells
          for (const cell of cellData) {
            dispatch({ type: 'SET_VALUE', position: cell.targetPos, value: cell.value });
            dispatch({ type: 'SET_STYLE', position: cell.targetPos, style: cell.style });
          }
          
          // Update selection to the new range position
          const newStart = { 
            row: minRow + rowOffset, 
            col: minCol + colOffset 
          };
          const newEnd = { 
            row: maxRow + rowOffset, 
            col: maxCol + colOffset 
          };
          
          dispatch({
            type: 'SELECT_RANGE',
            range: { start: newStart, end: newEnd }
          });
        }
        
        setIsDragging(false);
        setDragStart(null);
        setDraggedRange(null);
        
        // Reset cursor completely and remove body classes
        document.body.style.cursor = '';
        document.documentElement.style.cursor = '';
        if (containerRef.current) {
          containerRef.current.style.cursor = '';
        }
        
        // Remove cursor from all cells
        const allCells = document.querySelectorAll('.spreadsheet-cell');
        allCells.forEach(cell => {
          (cell as HTMLElement).style.cursor = '';
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStart) return;

      e.preventDefault();
      
      // Find the current cell under mouse
      const element = document.elementFromPoint(e.clientX, e.clientY);
      const cellElement = element?.closest('[data-row][data-col]') as HTMLElement;
      
      if (cellElement) {
        const rowAttr = cellElement.getAttribute('data-row');
        const colAttr = cellElement.getAttribute('data-col');
        
        if (rowAttr && colAttr) {
          const rowIndex = parseInt(rowAttr);
          const colIndex = parseInt(colAttr);
          
          if (!isNaN(rowIndex) && !isNaN(colIndex)) {
            if (draggedRange) {
              // This is a move operation - we already have the range stored
              return;
            } else {
              // This is a range selection operation
              dispatch({
                type: 'SELECT_RANGE',
                range: {
                  start: dragStart,
                  end: { row: rowIndex, col: colIndex }
                }
              });
            }
          }
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp, { capture: true });
      document.addEventListener('mousemove', handleMouseMove, { capture: true });
      
      return () => {
        document.removeEventListener('mouseup', handleMouseUp, { capture: true });
        document.removeEventListener('mousemove', handleMouseMove, { capture: true });
      };
    }
  }, [isDragging, dragStart, draggedRange, draggedCellId, dispatch, getCellDisplayValue, getCellStyle, state.data.items.length, state.data.columns.length]);

  // Cell interaction handlers
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!state.editingCell) {
      // Simple click always selects single cell
      dispatch({ type: 'SELECT_CELL', position: { row, col } });
    }
  }, [dispatch, state.editingCell]);

  // Updated mouse down handler for cells
  const handleCellMouseDown = useCallback((row: number, col: number, e: React.MouseEvent) => {
    if (state.editingCell) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    
    const cellIsSelected = isSelected(row, col);
    const cellInRange = isInRange(row, col);
    
    // If clicking on an already selected cell/range, this is a move operation
    if ((cellIsSelected || cellInRange) && (getCellDisplayValue(row, col) || state.selectedRange)) {
      console.log('Starting move operation from selected cell/range');
      setIsDragging(true);
      setDragStart({ row, col });
      setDraggedCellId(`${row}-${col}`);
      
      // Store the current range for moving
      if (state.selectedRange) {
        setDraggedRange(state.selectedRange);
      } else {
        setDraggedRange(null);
      }
      
      // Set grab cursor for move
      document.body.style.cursor = 'grabbing';
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
    } else {
      // This is a new selection - start range selection
      console.log('Starting range selection from new cell');
      dispatch({ type: 'SELECT_CELL', position: { row, col } });
      setIsDragging(true);
      setDragStart({ row, col });
      setDraggedRange(null);
      
      // Set crosshair cursor for selection
      document.body.style.cursor = 'crosshair';
      if (containerRef.current) {
        containerRef.current.style.cursor = 'crosshair';
      }
    }
  }, [dispatch, state.editingCell, state.selectedRange, isSelected, isInRange, getCellDisplayValue]);

  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    dispatch({ type: 'START_EDITING', position: { row, col } });
  }, [dispatch]);

  const handleCellValueChange = useCallback((row: number, col: number, value: string | number) => {
    dispatch({ type: 'SET_VALUE', position: { row, col }, value });
  }, [dispatch]);

  // Column management handlers
  const handleColumnDoubleClick = useCallback((columnIndex: number) => {
    setEditingColumnIndex(columnIndex);
    setEditingColumnName(state.data.columns[columnIndex].name);
  }, [state.data.columns]);

  const handleColumnNameChange = useCallback((newName: string) => {
    if (editingColumnIndex !== null && newName.trim()) {
      dispatch({
        type: 'UPDATE_COLUMN_NAME',
        columnIndex: editingColumnIndex,
        newName: newName.trim()
      });
    }
    setEditingColumnIndex(null);
    setEditingColumnName('');
  }, [editingColumnIndex, dispatch]);

  const handleColumnNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleColumnNameChange(editingColumnName);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingColumnIndex(null);
      setEditingColumnName('');
    }
  }, [editingColumnName, handleColumnNameChange]);

  // Column sorting handler
  const handleColumnSort = useCallback((columnIndex: number) => {
    if (state.editingCell || editingColumnIndex === columnIndex) return;
    
    const currentDirection = sortedColumn?.index === columnIndex ? sortedColumn.direction : null;
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    
    setSortedColumn({ index: columnIndex, direction: newDirection });
    dispatch({ type: 'SORT_COLUMN', columnIndex, direction: newDirection });
  }, [dispatch, state.editingCell, editingColumnIndex, sortedColumn]);

  // Context menu handlers
  const handleColumnContextMenu = useCallback((e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'column',
      index: columnIndex
    });
  }, []);

  const handleRowContextMenu = useCallback((e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'row',
      index: rowIndex
    });
  }, []);

  const handleContextMenuAction = useCallback((action: string) => {
    if (!contextMenu) return;

    switch (action) {
      case 'add-column-left':
        dispatch({ type: 'ADD_COLUMN', index: contextMenu.index });
        break;
      case 'add-column-right':
        dispatch({ type: 'ADD_COLUMN', index: contextMenu.index + 1 });
        break;
      case 'delete-column':
        dispatch({ type: 'DELETE_COLUMN', index: contextMenu.index });
        break;
      case 'add-row-above':
        dispatch({ type: 'ADD_ROW', index: contextMenu.index });
        break;
      case 'add-row-below':
        dispatch({ type: 'ADD_ROW', index: contextMenu.index + 1 });
        break;
      case 'delete-row':
        dispatch({ type: 'DELETE_ROW', index: contextMenu.index });
        break;
    }
    
    setContextMenu(null);
  }, [contextMenu, dispatch]);

  // Column resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentWidth = columnWidths[columnIndex] || 140; // Default width
    setResizingColumn({
      index: columnIndex,
      startX: e.clientX,
      startWidth: currentWidth
    });
  }, [columnWidths]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return;
    
    const diff = e.clientX - resizingColumn.startX;
    const newWidth = Math.max(80, resizingColumn.startWidth + diff); // Minimum 80px
    
    // Simply set the new width - let the full-width header accommodate all columns
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn.index]: newWidth
    }));
  }, [resizingColumn]);

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null);
  }, []);

  // Handle column resize mouse events
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  const getColumnWidth = useCallback((columnIndex: number) => {
    return columnWidths[columnIndex] || 140; // Default width
  }, [columnWidths]);

  // Get values from selected range for calculations
  const getRangeValues = useCallback(() => {
    if (!state.selectedRange) return { values: [], columnTypes: [] };
    
    const { start, end } = state.selectedRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    
    const values: (string | number)[] = [];
    const columnTypes: string[] = [];
    
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const value = getCellDisplayValue(row, col);
        const columnType = state.data.columns[col]?.type || 'text';
        
        values.push(value);
        columnTypes.push(columnType);
      }
    }
    
    return { values, columnTypes };
  }, [state.selectedRange, getCellDisplayValue, state.data.columns]);

  const handleClearSession = useCallback(() => {
    if (confirm('⚠️ This will clear all changes and reset to original data. Continue?')) {
      // Clear localStorage
      localStorage.removeItem('keye-spreadsheet-session');
      localStorage.removeItem('keye-spreadsheet-column-widths');
      
      // Reset state - this will trigger a re-render with fresh data
      window.location.reload();
    }
  }, []);

  return (
    <div className="spreadsheet-container" ref={containerRef}>
      <Toolbar
        selectedCell={state.selectedCell}
        selectedRange={state.selectedRange}
        onStyleChange={(style: Partial<CellStyle>) => {
          if (state.selectedCell) {
            dispatch({ type: 'SET_STYLE', position: state.selectedCell, style });
          }
        }}
        canUndo={state.historyIndex > 0}
        canRedo={state.historyIndex < state.history.length - 1}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        getRangeValues={getRangeValues}
        onClearSession={handleClearSession}
      />
      
      <div className="spreadsheet-grid">
        {/* Instructions */}
        <div className="drag-instructions">
          <span>💡 Tip: Click to select • Drag to select range • Drag selected cells to move • Right-click headers to add/remove columns/rows</span>
        </div>
        
        {/* Column headers */}
        <div className="spreadsheet-header">
          <div className="corner-cell" style={{ width: 60, minWidth: 60, maxWidth: 60 }}></div>
          {state.data.columns.map((column, index) => (
            <div 
              key={column.key} 
              className="column-header"
              style={{ width: getColumnWidth(index) }}
              onContextMenu={(e) => handleColumnContextMenu(e, index)}
              onDoubleClick={() => handleColumnDoubleClick(index)}
              title={editingColumnIndex === index ? "Press Enter to save, Escape to cancel" : "Click to sort • Double-click to edit • Right-click for options"}
            >
              <div className="column-header-content" onClick={() => handleColumnSort(index)}>
                {editingColumnIndex === index ? (
                  <input
                    type="text"
                    value={editingColumnName}
                    onChange={(e) => setEditingColumnName(e.target.value)}
                    onKeyDown={handleColumnNameKeyDown}
                    onBlur={() => handleColumnNameChange(editingColumnName)}
                    className="column-name-input"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'white',
                      border: '2px solid #3b82f6',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#1e293b',
                      width: '100%',
                      textAlign: 'center',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <div className="column-name">
                    {column.name.toUpperCase()}
                    {sortedColumn?.index === index && (
                      <span className="sort-indicator">
                        {sortedColumn.direction === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Resize handle */}
              <div 
                className="column-resize-handle"
                onMouseDown={(e) => handleResizeStart(e, index)}
                title="Drag to resize column"
              />
            </div>
          ))}
          <div 
            className="add-column-button"
            onClick={() => dispatch({ type: 'ADD_COLUMN' })}
            title="Add new column"
          >
            +
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="spreadsheet-grid-content">
          {/* Data rows */}
          {state.data.items.map((_item, rowIndex) => (
            <div key={rowIndex} className="spreadsheet-row">
              {/* Row header */}
              <div 
                className="row-header"
                style={{ width: 60, minWidth: 60, maxWidth: 60 }}
                onContextMenu={(e) => handleRowContextMenu(e, rowIndex)}
                title="Right-click for options"
              >
                {rowIndex + 1}
              </div>
              
              {/* Data cells */}
              {state.data.columns.map((column, columnIndex) => {
                const cellValue = getCellDisplayValue(rowIndex, columnIndex);
                const isNumeric = column.type === 'number' || column.type === 'currency' || column.type === 'percentage';
                const cellIsSelected = isSelected(rowIndex, columnIndex);
                const cellInRange = isInRange(rowIndex, columnIndex);
                const cellBeingDragged = isBeingDragged(rowIndex, columnIndex);
                const rangeClasses = getRangeClasses(rowIndex, columnIndex);
                
                return (
                  <Cell
                    key={`${rowIndex}-${columnIndex}`}
                    id={`${rowIndex}-${columnIndex}`}
                    row={rowIndex}
                    col={columnIndex}
                    value={cellValue}
                    rawValue={getCellRawValue(rowIndex, columnIndex)}
                    style={{
                      ...getCellStyle(rowIndex, columnIndex),
                      textAlign: isNumeric ? 'right' : 'left'
                    }}
                    width={getColumnWidth(columnIndex)}
                    isSelected={cellIsSelected}
                    isInRange={cellInRange}
                    isBeingDragged={cellBeingDragged}
                    rangeClasses={rangeClasses}
                    isEditing={isEditing(rowIndex, columnIndex)}
                    onMouseDown={(e: React.MouseEvent) => handleCellMouseDown(rowIndex, columnIndex, e)}
                    onClick={() => handleCellClick(rowIndex, columnIndex)}
                    onDoubleClick={() => handleCellDoubleClick(rowIndex, columnIndex)}
                    onValueChange={(value: string | number) => handleCellValueChange(rowIndex, columnIndex, value)}
                    onEditingStop={() => dispatch({ type: 'STOP_EDITING' })}
                    isNumeric={isNumeric}
                  />
                );
              })}
            </div>
          ))}
          
          {/* Add row button */}
          <div className="add-row-container">
            <div 
              className="add-row-button"
              onClick={() => dispatch({ type: 'ADD_ROW' })}
              title="Add new row"
            >
              + Add Row
            </div>
          </div>
        </div>

        {/* Context menu */}
        {contextMenu && (
          <div 
            className="context-menu" 
            style={{ 
              position: 'fixed', 
              top: contextMenu.y, 
              left: contextMenu.x, 
              zIndex: 10000 
            }}
          >
            {contextMenu.type === 'column' ? (
              <>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('add-column-left')}>
                  Insert Column Left
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('add-column-right')}>
                  Insert Column Right
                </div>
                <div className="context-menu-divider"></div>
                <div className="context-menu-item danger" onClick={() => handleContextMenuAction('delete-column')}>
                  Delete Column
                </div>
              </>
            ) : (
              <>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('add-row-above')}>
                  Insert Row Above
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('add-row-below')}>
                  Insert Row Below
                </div>
                <div className="context-menu-divider"></div>
                <div className="context-menu-item danger" onClick={() => handleContextMenuAction('delete-row')}>
                  Delete Row
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Spreadsheet; 