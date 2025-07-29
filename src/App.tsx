import { useState, useEffect } from 'react';
import Spreadsheet from './components/Spreadsheet';
import { fetchSpreadsheetData } from './services/api';
import type { SpreadsheetData } from './types/spreadsheet';
import keyeLogo from './assets/keye.png';
import './App.css';

function App() {
  const [data, setData] = useState<SpreadsheetData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const spreadsheetData = await fetchSpreadsheetData();
        setData(spreadsheetData);
      } catch (err) {
        setError('Failed to load spreadsheet data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Data Load Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry Loading
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app-error">
        <h2>No Data Available</h2>
        <p>Financial dataset could not be loaded</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-nav">
          <div className="header-logo">
            <img src={keyeLogo} alt="Keye" className="logo-image" />
          </div>
          <nav className="header-navigation">
            <a href="#" className="nav-link">Diligence Platform</a>
            <a href="#" className="nav-link">Company</a>
            <a href="#" className="nav-link">Blog</a>
            <button className="cta-button">LET'S TALK</button>
          </nav>
        </div>
        <div className="header-content">
          <h1>Interactive Business Intelligence Spreadsheet</h1>
          <p>Interactive business intelligence spreadsheet with advanced data manipulation</p>
        </div>
      </header>
      <main className="app-main">
        <Spreadsheet data={data} />
      </main>
    </div>
  );
}

export default App;
