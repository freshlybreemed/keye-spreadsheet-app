import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { CellStyle } from '../types/spreadsheet';
import './Cell.css';

interface CellProps {
  id: string;
  row: number;
  col: number;
  value: string;
  rawValue?: string | number;
  style?: CellStyle;
  width?: number;
  isSelected: boolean;
  isInRange?: boolean;
  isBeingDragged?: boolean;
  rangeClasses?: string;
  isEditing: boolean;
  isNumeric?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: (e?: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onValueChange: (value: string | number) => void;
  onEditingStop: () => void;
}

const Cell: React.FC<CellProps> = ({
  id,
  row,
  col,
  value,
  rawValue,
  style = {},
  width,
  isSelected,
  isInRange = false,
  isBeingDragged = false,
  rangeClasses = '',
  isEditing,
  isNumeric = false,
  onMouseDown,
  onClick,
  onDoubleClick,
  onValueChange,
  onEditingStop
}) => {
  const [editValue, setEditValue] = useState(value);
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simplified drag logic - let parent handle everything
  const {
    setNodeRef: setDroppableRef,
    isOver,
  } = useDroppable({
    id,
  });

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      // When starting to edit, use raw value to show full precision
      setEditValue(String(rawValue !== undefined ? rawValue : value));
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing, rawValue, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const numericValue = parseFloat(editValue);
      onValueChange(isNaN(numericValue) ? editValue : numericValue);
      onEditingStop();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(value);
      onEditingStop();
    }
  }, [editValue, value, onValueChange, onEditingStop]);

  const handleBlur = useCallback(() => {
    const numericValue = parseFloat(editValue);
    onValueChange(isNaN(numericValue) ? editValue : numericValue);
    onEditingStop();
  }, [editValue, onValueChange, onEditingStop]);

  // Handle mouse enter/leave for hover state
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  // Dynamic cursor based on state
  const getCursor = () => {
    if (isEditing) return 'text';
    if (isSelected || isInRange) {
      if (value && isHovering) return 'grab'; // Show grab when hovering over selected cells with content
    }
    return 'cell';
  };

  const cellStyle: React.CSSProperties = {
    fontWeight: style.bold ? 'bold' : isNumeric ? '500' : 'normal',
    fontStyle: style.italic ? 'italic' : 'normal',
    textAlign: style.textAlign || (isNumeric ? 'right' : 'left'),
    backgroundColor: style.backgroundColor || 'transparent',
    fontFamily: isNumeric ? 
      "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace" : 
      'inherit',
    fontVariantNumeric: isNumeric ? 'tabular-nums' : 'normal',
    cursor: getCursor(),
    opacity: isBeingDragged ? 0.3 : 1,
    zIndex: isBeingDragged ? 1000 : 'auto',
    width: width || 140,
    minWidth: width || 140,
  };

  const className = [
    'spreadsheet-cell',
    isSelected ? 'selected' : '',
    isInRange ? 'in-range' : '',
    isEditing ? 'editing' : '',
    isNumeric ? 'numeric' : '',
    value ? 'has-content' : 'empty',
    isBeingDragged ? 'dragging' : '',
    isOver ? 'drop-target' : '',
    isHovering && (isSelected || isInRange) && value ? 'hover-draggable' : '',
    rangeClasses
  ].filter(Boolean).join(' ');

  if (isEditing) {
    return (
      <div 
        className={className} 
        style={cellStyle}
        data-row={row}
        data-col={col}
      >
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="cell-input"
          style={{
            textAlign: style.textAlign || (isNumeric ? 'right' : 'left'),
            fontFamily: isNumeric ? 
              "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace" : 
              'inherit'
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={setDroppableRef}
      className={className}
      style={cellStyle}
      data-row={row}
      data-col={col}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <span 
        className="cell-content" 
        data-type={isNumeric ? 'number' : 'text'}
      >
        {value}
      </span>
    </div>
  );
};

export default Cell; 