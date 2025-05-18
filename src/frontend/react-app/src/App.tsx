import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import DemoPage from './components/DemoPage';
import ErrorPage from './components/ErrorPage';
import { configureAmplify } from './utils/auth';
import './styles/global.css';

function App() {
  // Initialize Amplify when the app loads
  useEffect(() => {
    // Configure Amplify with default settings
    configureAmplify();
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
