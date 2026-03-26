import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const defaultNotifications = [
  { id: 'n1', message: 'New screening completed', timestamp: new Date().toISOString() },
  { id: 'n2', message: 'Therapy session added', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'n3', message: 'Report generated', timestamp: new Date(Date.now() - 7200000).toISOString() }
];

const Notifications = () => {
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((item, index) => ({
            id: item._id || item.id || `api-${index}`,
            message: item.message || 'Notification',
            timestamp: item.timestamp || item.date || new Date().toISOString()
          }));
          setNotifications(normalized);
        }
      } catch (error) {
        console.warn('Using static notifications fallback:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <div style={{ padding: '16px', maxWidth: '640px' }}>
      <h2 style={{ marginBottom: '12px' }}>Notifications</h2>

      {loading && <p style={{ marginBottom: '10px' }}>Loading notifications...</p>}

      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                background: '#f9fafb'
              }}
            >
              <p style={{ margin: 0, color: '#111827' }}>{notification.message}</p>
              <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
                {new Date(notification.timestamp).toLocaleString()}
              </small>
              <button
                type="button"
                onClick={() => markAsRead(notification.id)}
                style={{
                  marginTop: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Mark as read
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
