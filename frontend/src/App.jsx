import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Memories from './components/Memories';
import Gratitude from './components/Gratitude';
import Goals from './components/Goals';
import Questions from './components/Questions';
import Header from './components/Header';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      {isAuthenticated && <Header user={user} onLogout={handleLogout} />}

      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Register onRegister={handleLogin} />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Dashboard user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/journal"
          element={
            isAuthenticated ? (
              <Journal />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/memories"
          element={
            isAuthenticated ? (
              <Memories />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/gratitude"
          element={
            isAuthenticated ? (
              <Gratitude />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/goals"
          element={
            isAuthenticated ? (
              <Goals />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/questions"
          element={
            isAuthenticated ? (
              <Questions />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
