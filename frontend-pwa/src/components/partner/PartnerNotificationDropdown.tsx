import { useState, useRef, useEffect } from 'react';
import { Bell, AlertCircle, Edit3, XCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Notification = {
  id: string;
  type: 'NEW_BOOKING' | 'CHANGE_REQUEST' | 'CHANGE_APPROVED' | 'CANCELLED';
  title: string;
  time: string;
  read: boolean;
  link: string;
};

// TODO: Fetch notifications from API when backend is ready
const MOCK_NOTIFICATIONS: Notification[] = [];

export default function PartnerNotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleNotificationClick = (notif: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setOpen(false);
    navigate(notif.link);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_BOOKING': return <AlertCircle className="h-5 w-5 text-primary" />;
      case 'CHANGE_REQUEST': return <Edit3 className="h-5 w-5 text-sun" />;
      case 'CHANGE_APPROVED': return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'CANCELLED': return <XCircle className="h-5 w-5 text-danger" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-1.5 text-ink hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-coral"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-white py-2 shadow-xl z-50">
          <div className="flex items-center justify-between border-b border-border px-4 pb-2">
            <h3 className="font-bold text-ink-deep">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="rounded-md bg-coral-light px-2 py-0.5 text-[10px] font-bold text-coral-hover">
                {unreadCount} mới
              </span>
            )}
          </div>
          
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted">Không có thông báo nào</p>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface ${!notif.read ? 'bg-primary-50/50' : ''}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div>
                    <p className={`text-sm ${!notif.read ? 'font-bold text-ink-deep' : 'text-ink'}`}>
                      {notif.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">{notif.time}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
