import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Cell from '../Cell'
import type { CellStyle } from '../../types/spreadsheet'

const defaultProps = {
  id: '0-0',
  row: 0,
  col: 0,
  value: 'Test Value',
  style: {} as CellStyle,
  isSelected: false,
  isInRange: false,
  isEditing: false,
  isBeingDragged: false,
  onClick: vi.fn(),
  onDoubleClick: vi.fn(),
  onMouseDown: vi.fn(),
  onValueChange: vi.fn(),
  onEditingStop: vi.fn(),
}

describe('Cell', () => {
  it('should render cell with value', () => {
    render(<Cell {...defaultProps} />)
    expect(screen.getByText('Test Value')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const onClick = vi.fn()
    render(<Cell {...defaultProps} onClick={onClick} />)
    
    fireEvent.click(screen.getByText('Test Value'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should handle double click events', () => {
    const onDoubleClick = vi.fn()
    render(<Cell {...defaultProps} onDoubleClick={onDoubleClick} />)
    
    fireEvent.doubleClick(screen.getByText('Test Value'))
    expect(onDoubleClick).toHaveBeenCalledTimes(1)
  })

  it('should handle mouse down events', () => {
    const onMouseDown = vi.fn()
    render(<Cell {...defaultProps} onMouseDown={onMouseDown} />)
    
    fireEvent.mouseDown(screen.getByText('Test Value'))
    expect(onMouseDown).toHaveBeenCalledTimes(1)
  })

  it('should apply selected styling', () => {
    const { container } = render(<Cell {...defaultProps} isSelected={true} />)
    expect(container.firstChild).toHaveClass('selected')
  })

  it('should apply in-range styling', () => {
    const { container } = render(<Cell {...defaultProps} isInRange={true} />)
    expect(container.firstChild).toHaveClass('in-range')
  })

  it('should apply base cell classes', () => {
    const { container } = render(<Cell {...defaultProps} />)
    expect(container.firstChild).toHaveClass('spreadsheet-cell')
  })

  it('should apply custom styles', () => {
    const style: CellStyle = {
      bold: true,
      backgroundColor: '#ff0000',
      textAlign: 'center',
      width: 200
    }
    
    const { container } = render(<Cell {...defaultProps} style={style} />)
    const cellElement = container.firstChild as HTMLElement
    
    expect(cellElement.style.fontWeight).toBe('bold')
    expect(cellElement.style.backgroundColor).toBe('rgb(255, 0, 0)')
    expect(cellElement.style.textAlign).toBe('center')
    expect(cellElement.style.width).toBe('200px')
  })

  it('should show editing state', () => {
    const { container } = render(<Cell {...defaultProps} isEditing={true} />)
    const cellElement = container.firstChild as HTMLElement
    expect(cellElement.style.cursor).toBe('text')
  })

  it('should show dragging state', () => {
    const { container } = render(<Cell {...defaultProps} isBeingDragged={true} />)
    const cellElement = container.firstChild as HTMLElement
    expect(cellElement.style.opacity).toBe('0.3')
  })

  it('should handle empty values', () => {
    const { container } = render(<Cell {...defaultProps} value="" />)
    const cellElement = container.firstChild as HTMLElement
    expect(cellElement).toBeInTheDocument()
    expect(cellElement.textContent).toBe('')
  })

  it('should handle numeric values', () => {
    render(<Cell {...defaultProps} value="123.45" />)
    expect(screen.getByText('123.45')).toBeInTheDocument()
  })

  it('should format currency values with proper alignment', () => {
    const style: CellStyle = { textAlign: 'right' }
    render(<Cell {...defaultProps} value="$1,234.56" style={style} />)
    
    const cellElement = screen.getByText('$1,234.56')
    expect(cellElement).toBeInTheDocument()
    
    const { container } = render(<Cell {...defaultProps} value="$1,234.56" style={style} />)
    const cellDiv = container.firstChild as HTMLElement
    expect(cellDiv.style.textAlign).toBe('right')
  })
}) 