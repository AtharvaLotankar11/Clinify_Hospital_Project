import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchAPI } from '../services/api';
import NotificationBell from './NotificationBell';

export default function Header({ userName, userRole }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // Use context user if props not provided
    const displayName = userName || user?.name || 'User';
    const displayRole = userRole || user?.role || 'Staff';

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults(null);
            setShowResults(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await searchAPI.globalSearch(searchQuery);
                setSearchResults(response.data);
                setShowResults(true);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleResultClick = (type, item) => {
        setShowResults(false);
        setSearchQuery('');

        // Navigate based on result type
        if (type === 'patient') {
            navigate(`/doctor/patients/${item.id}`);
        } else if (type === 'visit') {
            console.log('Visit clicked:', item);
        } else if (type === 'staff') {
            console.log('Staff clicked:', item);
        }
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Search Bar */}
                    <div className="flex-1 max-w-2xl relative" ref={searchRef}>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search patients, visits, staff by name, UHID, phone..."
                                className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 input-medical"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                </div>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && searchResults && (
                            <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                                {searchResults.total === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        <p className="text-sm">No results found for "{searchQuery}"</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {/* Patients Section */}
                                        {searchResults.patients?.length > 0 && (
                                            <div className="p-2">
                                                <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Patients</h3>
                                                {searchResults.patients.map((patient) => (
                                                    <button
                                                        key={patient.id}
                                                        onClick={() => handleResultClick('patient', patient)}
                                                        className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                                                {patient.name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                                                                <p className="text-xs text-gray-500">UHID: {patient.uhid} • {patient.phone}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Visits Section */}
                                        {searchResults.visits?.length > 0 && (
                                            <div className="p-2">
                                                <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Visits</h3>
                                                {searchResults.visits.map((visit) => (
                                                    <button
                                                        key={visit.id}
                                                        onClick={() => handleResultClick('visit', visit)}
                                                        className="w-full text-left px-3 py-2 hover:bg-green-50 rounded-lg transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900">{visit.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {visit.visit_type} • {new Date(visit.visit_date).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${visit.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                                                                visit.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {visit.status}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Staff Section */}
                                        {searchResults.staff?.length > 0 && (
                                            <div className="p-2">
                                                <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Staff</h3>
                                                {searchResults.staff.map((staff) => (
                                                    <button
                                                        key={staff.id}
                                                        onClick={() => handleResultClick('staff', staff)}
                                                        className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                                                {staff.name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                                                                <p className="text-xs text-gray-500">{staff.role} • {staff.department}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4 ml-6">
                        {/* Notification Bell */}
                        <NotificationBell />

                        {/* Profile Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
                            >
                                <div className="w-10 h-10 gradient-medical-primary rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                                    {displayName.charAt(0)}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                                    <p className="text-xs text-blue-600 uppercase font-medium">{displayRole}</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Profile Dropdown */}
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                                        <p className="font-semibold text-gray-800">{displayName}</p>
                                        <p className="text-sm text-gray-600">{displayRole}</p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span className="font-medium">Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
