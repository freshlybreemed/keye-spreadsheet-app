# Excel-like Spreadsheet Component

A comprehensive React-based spreadsheet component that mimics the core functionality of Microsoft Excel or Google Sheets. Built with TypeScript, modern React patterns, and responsive design principles.

![Spreadsheet Demo](https://via.placeholder.com/800x400?text=Excel-like+Spreadsheet+Demo)

## 🚀 Features

### Core Functionality
- ✅ **Data Display**: Renders tabular data in a professional grid format with column headers and row indices
- ✅ **Cell Selection**: Click to select individual cells with visual feedback
- ✅ **Range Selection**: Click and drag to select multiple cells (framework in place)
- ✅ **In-cell Editing**: Double-click or press Enter to edit cell content directly
- ✅ **Cell Formatting**: Bold, italic, text alignment, and background color options
- ✅ **Data Persistence**: Changes persist throughout the user session

### Advanced Features
- ✅ **Keyboard Navigation**: Arrow keys, Enter, Escape, Delete/Backspace support
- ✅ **Undo/Redo**: Full history management with Ctrl+Z / Ctrl+Y shortcuts
- ✅ **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- ✅ **Performance Optimized**: Handles large datasets efficiently with React optimization patterns
- ✅ **Type Safety**: Full TypeScript implementation with comprehensive type definitions

### UI/UX Enhancements
- Modern, clean interface inspired by Microsoft Excel
- Hover effects and smooth transitions
- Loading states and error handling
- Professional toolbar with intuitive controls
- Cell position indicator (e.g., "Selected: A1")

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 with CSS Grid and Flexbox
- **State Management**: Custom React hooks with reducer pattern
- **Performance**: React.memo, useCallback, useMemo optimizations

## 📦 Installation & Setup

### Prerequisites
- Node.js 16+ and npm

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spreadsheet-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in your browser**
   Navigate to `http://localhost:5173`

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm type-check       # Run TypeScript compiler check
```

## 🏗️ Architecture & Implementation

### Project Structure

```
src/
├── components/
│   ├── Spreadsheet.tsx    # Main spreadsheet container
│   ├── Cell.tsx           # Individual cell component
│   ├── Toolbar.tsx        # Formatting toolbar
│   └── *.css             # Component-specific styles
├── hooks/
│   └── useSpreadsheet.ts  # Main spreadsheet logic hook
├── types/
│   └── spreadsheet.ts     # TypeScript type definitions
├── utils/
│   └── cellUtils.ts       # Cell manipulation utilities
├── services/
│   └── api.ts             # API service layer
└── App.tsx                # Main application component
```

### Key Design Decisions

#### 1. **State Management**
- **Custom Hook Pattern**: `useSpreadsheet` encapsulates all spreadsheet logic
- **Reducer-like Dispatch**: Uses operation-based actions for predictable state updates
- **Immutable Updates**: All state changes create new objects for React optimization
- **History Management**: Implements undo/redo with a history array (max 50 states)

#### 2. **Performance Optimizations**
- **React.memo**: Prevents unnecessary cell re-renders
- **useCallback**: Memoizes event handlers to prevent child re-renders
- **Virtualization Ready**: Architecture supports virtual scrolling for large datasets
- **Efficient Lookups**: Cell data stored in hash maps for O(1) access

#### 3. **Type Safety**
- **Comprehensive Types**: Full TypeScript coverage for all components and data structures
- **API Integration**: Strongly typed API responses and data transformations
- **Component Props**: All component interfaces are strictly typed

#### 4. **User Experience**
- **Keyboard Shortcuts**: Excel-like navigation (arrows, Enter, Escape, Ctrl+Z/Y)
- **Visual Feedback**: Clear selection states, hover effects, editing indicators
- **Error Handling**: Graceful loading states and error recovery
- **Responsive Design**: Mobile-first approach with progressive enhancement

### Component Architecture

```typescript
// Main data flow
API Service → App Component → Spreadsheet → Cell Components
     ↓              ↓            ↓             ↓
  Raw Data → Loading State → useSpreadsheet → Individual Cells
```

#### **Spreadsheet Component**
- Manages overall grid layout and rendering
- Handles keyboard navigation and global event listeners
- Coordinates between toolbar and individual cells
- Implements selection logic and editing states

#### **Cell Component**
- Handles individual cell rendering and editing
- Manages input focus and blur events
- Applies formatting styles dynamically
- Supports both display and edit modes

#### **Toolbar Component**
- Provides formatting controls (bold, italic, alignment, colors)
- Shows undo/redo buttons with enabled/disabled states
- Displays current cell selection information
- Applies formatting to selected cells

### State Management Details

The spreadsheet state includes:
- **Original Data**: The base dataset from the API
- **Cell Overrides**: User modifications stored separately
- **Selection State**: Currently selected cell or range
- **Editing State**: Which cell is currently being edited
- **History**: Array of previous states for undo/redo
- **Formatting**: Per-cell styling information

## 🎯 API Integration

The application fetches data from a mock API service that returns the specified format:

```typescript
interface ApiResponse {
  Values: {
    columns: Array<{ name: string; key: string }>;
    items: Array<{ [key: string]: string | number }>;
  };
}
```

The sample data includes financial information across multiple years with products like:
- Insight Advisory
- OperateX Staffing
- CoreSoft Suite
- And more...

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Cell selection and navigation
- [ ] In-cell editing with Enter/Escape
- [ ] Keyboard shortcuts (arrows, Ctrl+Z/Y)
- [ ] Formatting options (bold, italic, alignment, colors)
- [ ] Responsive design on different screen sizes
- [ ] Data persistence during session
- [ ] Error handling and loading states

### Automated Testing (Future Enhancement)
- Unit tests for utility functions
- Component testing for Cell and Toolbar
- Integration tests for the complete spreadsheet workflow
- Performance testing with large datasets

## 📱 Responsive Design

The spreadsheet adapts to different screen sizes:

- **Desktop** (>768px): Full feature set with optimal column widths
- **Tablet** (<=768px): Reduced padding and font sizes, maintained functionality
- **Mobile** (<=480px): Compressed layout while preserving core features

## 🚦 Performance Considerations

### Current Optimizations
- Efficient re-rendering with React.memo and useCallback
- Hash-based cell lookups for O(1) performance
- Minimal state updates using immutable patterns
- CSS-based styling for smooth animations

### Future Enhancements
- Virtual scrolling for datasets with 10,000+ rows
- Web Workers for complex formula calculations
- Lazy loading of non-visible cells
- Debounced input handling for rapid typing

## 🔮 Future Improvements

Given more time, I would enhance the following areas:

### 1. **Enhanced Formula Support**
- Complete Excel-like formula engine (SUM, AVERAGE, COUNT, etc.)
- Cross-cell references (e.g., =A1+B1)
- Formula validation and error handling
- Auto-completion for formula inputs

### 2. **Advanced Selection Features**
- Multiple range selection with Ctrl+click
- Row/column selection by clicking headers
- Drag-to-fill functionality (like Excel's fill handle)
- Copy/paste functionality with clipboard integration

### 3. **Data Management**
- Column sorting and filtering
- Data validation rules
- Import/export functionality (CSV, Excel)
- Real-time collaboration features

### 4. **UI/UX Enhancements**
- Context menus (right-click options)
- Freeze panes functionality
- Row/column resizing with drag handles
- Custom number formatting options

### 5. **Performance & Scalability**
- Virtual scrolling implementation
- Web Workers for background calculations
- Progressive loading for large datasets
- Memory optimization techniques

## 🎨 Design Philosophy

This implementation follows modern web development best practices:

- **Component Composition**: Small, reusable components with single responsibilities
- **Separation of Concerns**: Business logic separated from presentation
- **Type Safety**: Comprehensive TypeScript usage prevents runtime errors
- **User-Centric Design**: Prioritizes user experience and accessibility
- **Performance First**: Optimized for smooth interactions even with large datasets

## 📄 License

This project is part of a technical assessment and is not intended for commercial use.

---

**Assessment Completion Time**: Approximately 6 hours
**Key Focus Areas**: React proficiency, TypeScript usage, performance optimization, and user experience design.

For questions or clarifications, please contact the development team.
