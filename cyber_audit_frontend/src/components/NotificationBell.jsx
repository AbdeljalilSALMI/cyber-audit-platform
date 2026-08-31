import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../lib/api.js";

export default function NotificationBell({ accessToken }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  async function load() {
    try {
      const data = await fetchNotifications(accessToken);
      setNotifications(data);
    } catch {
      // silencieux : la cloche n'est pas critique pour l'usage de la page
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function handleMarkRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await markNotificationRead(accessToken, id);
    } catch {
      load();
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead(accessToken);
    } catch {
      load();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-sm text-ink-secondary hover:bg-bg hover:text-ink-primary"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-20 w-80 rounded border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-[13px] font-medium text-ink-primary">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[12px] font-medium text-accent hover:text-brand-700"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-ink-muted">
                Aucune notification.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.slice(0, 15).map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 ${!n.is_read ? "bg-accent/[0.04]" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => !n.is_read && handleMarkRead(n.id)}
                      className="block w-full text-left"
                    >
                      <p className="text-[13px] text-ink-primary">{n.title}</p>
                      {n.message && (
                        <p className="mt-0.5 text-[12px] text-ink-secondary line-clamp-2">
                          {n.message}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
