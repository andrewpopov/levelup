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
import StorySlotDashboard from './components/behavioral/StorySlotDashboard';
import StoryBuilder from './components/behavioral/StoryBuilder';
import AdminJourneyList from './components/admin/AdminJourneyList';
import JourneyBuilder from './components/admin/JourneyBuilder';

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
          path="/journaling"
          element={
            isAuthenticated ? (
              <Journaling />
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
        <Route
          path="/daily-question"
          element={
            isAuthenticated ? (
              <DailyQuestion user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/journey-book"
          element={
            isAuthenticated ? (
              <JourneyBook user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/journeys"
          element={
            isAuthenticated ? (
              <JourneyLibrary />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/my-journeys"
          element={
            isAuthenticated ? (
              <JourneyDashboard user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/journey/:journeyId"
          element={
            isAuthenticated ? (
              <JourneyReader user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/journey/:journeyId/story-slots"
          element={
            isAuthenticated ? (
              <StorySlotDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/journey/:journeyId/story/:slotId"
          element={
            isAuthenticated ? (
              <StoryBuilder />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/journeys"
          element={
            isAuthenticated ? (
              <AdminJourneyList />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/journeys/new"
          element={
            isAuthenticated ? (
              <JourneyBuilder />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/journeys/:id/edit"
          element={
            isAuthenticated ? (
              <JourneyBuilder />
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
