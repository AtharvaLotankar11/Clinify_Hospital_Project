import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check role-based access if allowedRoles is specified
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = user?.role;

        if (!userRole || !allowedRoles.includes(userRole)) {
            // Redirect to user's default dashboard based on their role
            const rolePathMap = {
                'lab': 'lab_tech',
                'lab_tech': 'lab_tech',
                'pharmacist': 'pharmacy',
                'pharmacy': 'pharmacy'
            };

            const redirectPath = rolePathMap[userRole] || userRole;
            return <Navigate to={`/${redirectPath}/dashboard`} replace />;
        }
    }

    // User is authenticated and has proper role
    return children;
};

export default PrivateRoute;
