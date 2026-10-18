import React, { useState } from 'react';
import { db } from '../services/dbStore';
import { ShieldCheck, Search } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const dbState = db.getState();
  const logs = dbState.auditLogs;
  const users = dbState.users;

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('All');

  const filtered = logs.filter((l) => {
    if (actionFilter !== 'All' && l.ActionType !== actionFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchDetails = l.Details.toLowerCase().includes(term);
      const matchTable = l.TableName.toLowerCase().includes(term);
      if (!matchDetails && !matchTable) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">الرقابة والتدقيق الأمني (tblAuditLog)</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            سجل التدقيق والحركات الإدارية
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>السجل مشفر ومحمي من التعديل</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في تفاصيل السجل..."
            className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          {['All', 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'RESTORE'].map((action) => (
            <button
              key={action}
              onClick={() => setActionFilter(action)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                actionFilter === action ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {action === 'All' ? 'كافة العمليات' : action}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Data (Mobile Cards + Desktop Table) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((log) => {
            const user = users.find((u) => u.UserID === log.UserID);
            const badgeColor =
              log.ActionType === 'INSERT'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : log.ActionType === 'UPDATE'
                ? 'text-blue-700 bg-blue-50 border-blue-200'
                : log.ActionType === 'DELETE'
                ? 'text-red-700 bg-red-50 border-red-200'
                : log.ActionType === 'LOGIN'
                ? 'text-slate-700 bg-slate-100 border-slate-200'
                : 'text-amber-700 bg-amber-50 border-amber-200';

            return (
              <div key={log.LogID} className="p-4 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">
                      {user ? user.FullName : `مستخدم #${log.UserID}`}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      #{log.LogID} • {log.LogDate}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor}`}>
                    {log.ActionType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
                  <span>الجدول: <strong className="font-mono text-slate-800">{log.TableName}</strong></span>
                  <span className="font-mono">{log.RecordID ? `سجل #${log.RecordID}` : ''}</span>
                </div>
                <div className="text-slate-800 font-medium break-words">
                  {log.Details}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              لا توجد حركات مسجلة في سجل التدقيق
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">المعرف</th>
                <th className="py-3 px-4 font-semibold">المستخدم المنفذ</th>
                <th className="py-3 px-4 font-semibold text-center">نوع العملية</th>
                <th className="py-3 px-4 font-semibold">الجدول المستهدف</th>
                <th className="py-3 px-4 font-semibold">رقم السجل</th>
                <th className="py-3 px-4 font-semibold">التاريخ والوقت</th>
                <th className="py-3 px-4 font-semibold">تفاصيل الحركة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => {
                const user = users.find((u) => u.UserID === log.UserID);
                const badgeColor =
                  log.ActionType === 'INSERT'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : log.ActionType === 'UPDATE'
                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                    : log.ActionType === 'DELETE'
                    ? 'text-red-700 bg-red-50 border-red-200'
                    : log.ActionType === 'LOGIN'
                    ? 'text-slate-700 bg-slate-100 border-slate-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200';

                return (
                  <tr key={log.LogID} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-500 font-medium">#{log.LogID}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {user ? user.FullName : `مستخدم #${log.UserID}`}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor}`}>
                        {log.ActionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{log.TableName}</td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-500">
                      {log.RecordID ? `#${log.RecordID}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">{log.LogDate}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{log.Details}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا توجد حركات مسجلة في سجل التدقيق
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
