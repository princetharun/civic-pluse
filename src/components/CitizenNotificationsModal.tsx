import React from 'react';
import { X, Bell, CheckCircle2, Clock, CheckCheck } from 'lucide-react';
import { CitizenNotification } from '../types';

interface CitizenNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: CitizenNotification[];
  onMarkAllAsRead: () => void;
  onSelectRequest?: (requestId: string) => void;
}

export const CitizenNotificationsModal: React.FC<CitizenNotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onSelectRequest,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Bell className="w-5 h-5 text-cyan-300" />
            <div>
              <h3 className="font-bold text-base">Citizen Petition Updates</h3>
              <p className="text-xs text-blue-200">
                Government action tracking & status progress alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {notifications.length} Total Alerts ({notifications.filter((n) => !n.read).length} unread)
          </span>
          <button
            onClick={onMarkAllAsRead}
            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No alerts yet</p>
              <p className="text-xs text-slate-400 mt-1">
                You will receive alerts here as municipal authorities verify and schedule your requests.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (onSelectRequest) {
                    onSelectRequest(notif.requestId);
                    onClose();
                  }
                }}
                className={`p-4 rounded-xl transition-all cursor-pointer ${
                  notif.read ? 'hover:bg-slate-50 opacity-80' : 'bg-blue-50/60 hover:bg-blue-50 border-l-4 border-blue-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-800 rounded-md">
                      {notif.requestId}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{notif.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{notif.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
