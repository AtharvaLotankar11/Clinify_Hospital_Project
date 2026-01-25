
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications/'); // Assuming registered as /api/notifications/
            const data = response.data.results || response.data; // Handle pagination if any

            // Sort by createdAt desc
            const sorted = Array.isArray(data) ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];
            setNotifications(sorted);

            setUnreadCount(sorted.filter(n => !n.is_read).length);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/mark_read/`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark read", error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.post(`/notifications/mark_all_read/`);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all read", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden text-left animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                <p>No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50/40' : ''}`}
                                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                                    >
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 pt-0.5">
                                                {!notification.is_read ? (
                                                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5"></div>
                                                ) : (
                                                    <div className="h-2 w-2 rounded-full bg-gray-200 mt-1.5"></div>
                                                )}
                                            </div>
                                            <div className="ml-3 w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {notification.title}
                                                </p>
                                                <p className="mt-1 text-sm text-gray-500 line-clamp-3">
                                                    {notification.message}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
