import { Navigate } from 'react-router-dom';

function AdminProtectedRoute({ isAuthenticated, user, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!user?.roles?.includes('admin')) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default AdminProtectedRoute;
