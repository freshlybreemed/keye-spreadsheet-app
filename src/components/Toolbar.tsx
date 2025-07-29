import React, { useEffect, useState } from 'react';
import type { CellPosition, CellStyle, CellRange } from '../types/spreadsheet';
import { calculateRangeStats, formatCalculatedValue } from '../utils/cellUtils';
import './Toolbar.css';

interface ToolbarProps {
  selectedCell: CellPosition | null;
  selectedRange: CellRange | null;
  onStyleChange: (style: Partial<CellStyle>) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  // Add props for range calculations
  getRangeValues?: () => { values: (string | number)[]; columnTypes: string[] };
  onClearSession?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedCell,
  selectedRange,
  onStyleChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  getRangeValues,
  onClearSession
}) => {

   const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setPressedKeys((prevKeys) => ({ ...prevKeys, [event.key]: true }));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setPressedKeys((prevKeys) => {
        const newKeys = { ...prevKeys };
        delete newKeys[event.key]; // Remove the key when released
        return newKeys;
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    // Example: Check for 'Control' + 'm' combination
    if (pressedKeys['Control'] && pressedKeys['z']) {
      console.log('Control + z pressed!');
      onUndo();
    }
  }, [pressedKeys, onUndo]);
  
  const getColumnName = (col: number): string => {
    return String.fromCharCode(65 + col);
  };

  const formatCellReference = (pos: CellPosition): string => {
    return `${getColumnName(pos.col)}${pos.row + 1}`;
  };

  const formatRangeReference = (range: CellRange): string => {
    const startRef = formatCellReference(range.start);
    const endRef = formatCellReference(range.end);
    return `${startRef}:${endRef}`;
  };

  const getRangeSize = (range: CellRange): string => {
    const rows = Math.abs(range.end.row - range.start.row) + 1;
    const cols = Math.abs(range.end.col - range.start.col) + 1;
    return `${rows} × ${cols}`;
  };

  // Calculate range statistics
  const getRangeCalculations = () => {
    if (!selectedRange || !getRangeValues) return null;
    
    const { values } = getRangeValues();
    const stats = calculateRangeStats(values);
    
    return stats;
  };

  const calculations = getRangeCalculations();

  const handleBoldClick = () => {
    onStyleChange({ bold: true });
  };

  const handleItalicClick = () => {
    onStyleChange({ italic: true });
  };

  const handleAlignClick = (align: 'left' | 'center' | 'right') => {
    onStyleChange({ textAlign: align });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStyleChange({ backgroundColor: e.target.value });
  };

  
  return (
    <div className="toolbar">
      {/* Undo/Redo */}
      <div className="toolbar-section">
        <button
          className="toolbar-button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          className="toolbar-button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>
      </div>

      <div className="toolbar-divider"></div>

      {/* Formatting */}
      <div className="toolbar-section">
        <button
          className="toolbar-button"
          onClick={handleBoldClick}
          title="Bold Text (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          className="toolbar-button"
          onClick={handleItalicClick}
          title="Italic Text (Ctrl+I)"
        >
          <em>I</em>
        </button>
      </div>

      <div className="toolbar-divider"></div>

      {/* Alignment */}
      <div className="toolbar-section">
        <button
          className="toolbar-button"
          onClick={() => handleAlignClick('left')}
          title="Align Left"
        >
          ⇤
        </button>
        <button
          className="toolbar-button"
          onClick={() => handleAlignClick('center')}
          title="Align Center"
        >
          ≡
        </button>
        <button
          className="toolbar-button"
          onClick={() => handleAlignClick('right')}
          title="Align Right"
        >
          ⇥
        </button>
      </div>

      <div className="toolbar-divider"></div>

      {/* Color */}
      <div className="toolbar-section">
        <label className="toolbar-label">
          <span>Fill:</span>
          <input
            type="color"
            onChange={handleColorChange}
            className="color-picker"
            title="Cell Background Color"
          />
        </label>
      </div>

      <div className="toolbar-divider"></div>

      {/* Session Management */}
      <div className="toolbar-section">
        {onClearSession && (
          <button
            className="toolbar-button clear-session"
            onClick={onClearSession}
            title="Clear Session Data"
          >
            🗑️
          </button>
        )}
      </div>

      <div className="toolbar-divider"></div>

      {/* Selection Info */}
      <div className="toolbar-section">
        {selectedRange ? (
          <div className="selection-info">
            <div className="selection-details">
              <span className="selection-label">Range:</span>
              <span className="selection-value">{formatRangeReference(selectedRange)}</span>
              <span className="selection-size">({getRangeSize(selectedRange)} cells)</span>
            </div>
            {calculations && calculations.numericCount > 0 && (
              <div className="calculation-stats">
                <div className="stat-item">
                  <span className="stat-label">Sum:</span>
                  <span className="stat-value">{formatCalculatedValue(calculations.sum)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg:</span>
                  <span className="stat-value">{formatCalculatedValue(calculations.average)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Count:</span>
                  <span className="stat-value">{calculations.numericCount}</span>
                </div>
              </div>
            )}
          </div>
        ) : selectedCell ? (
          <div className="selection-info">
            <span className="selection-label">Cell:</span>
            <span className="selection-value">{formatCellReference(selectedCell)}</span>
          </div>
        ) : (
          <div className="selection-info">
            <span className="selection-label">No selection</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar; 