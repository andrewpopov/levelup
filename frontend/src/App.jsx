import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Journaling from './components/Journaling';
import Journal from './components/Journal';
import Memories from './components/Memories';
import Gratitude from './components/Gratitude';
import Goals from './components/Goals';
import Questions from './components/Questions';
import DailyQuestion from './components/DailyQuestion';
import JourneyBook from './components/JourneyBook';
import JourneyLibrary from './components/JourneyLibrary';
import JourneyDashboard from './components/JourneyDashboard';
import JourneyReader from './components/JourneyReader';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import StorySlotDashboard from './components/behavioral/StorySlotDashboard';
import StoryBuilder from './components/behavioral/StoryBuilder';

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
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Register onRegister={handleLogin} />}
        />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Dashboard user={user} />
          </ProtectedRoute>
        } />
        <Route path="/journaling" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Journaling />
          </ProtectedRoute>
        } />
        <Route path="/journal" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Journal />
          </ProtectedRoute>
        } />
        <Route path="/memories" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Memories />
          </ProtectedRoute>
        } />
        <Route path="/gratitude" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Gratitude />
          </ProtectedRoute>
        } />
        <Route path="/goals" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Goals />
          </ProtectedRoute>
        } />
        <Route path="/questions" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Questions />
          </ProtectedRoute>
        } />
        <Route path="/daily-question" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <DailyQuestion user={user} />
          </ProtectedRoute>
        } />
        <Route path="/journey-book" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <JourneyBook user={user} />
          </ProtectedRoute>
        } />
        <Route path="/journeys" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <JourneyLibrary />
          </ProtectedRoute>
        } />
        <Route path="/my-journeys" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <JourneyDashboard user={user} />
          </ProtectedRoute>
        } />
        <Route path="/journey/:journeyId" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <JourneyReader user={user} />
          </ProtectedRoute>
        } />
        <Route path="/journey/:journeyId/story-slots" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <StorySlotDashboard />
          </ProtectedRoute>
        } />
        <Route path="/journey/:journeyId/story/:slotId" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <StoryBuilder />
          </ProtectedRoute>
        } />

        {/* Admin route */}
        <Route path="/admin" element={
          <AdminProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            <AdminDashboard user={user} />
          </AdminProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
