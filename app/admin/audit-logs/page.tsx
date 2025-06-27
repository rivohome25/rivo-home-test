"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type AuditLog = {
  id: number;
  table_name: string;
  operation: string;
  record_id: string;
  changed_by: string;
  changed_at: string;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
};

type Pagination = {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
};

export default function AdminAuditLogsPage() {
  const supabase = createClientComponentClient();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    table_name: "",
    operation: ""
  });
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const fetchLogs = async (offset: number = 0) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString()
      });

      if (filters.table_name) params.append('table_name', filters.table_name);
      if (filters.operation) params.append('operation', filters.operation);

      const res = await fetch(`/api/admin/audit-logs?${params}`, {
        method: "GET",
        credentials: 'include'
      });
      
      if (!res.ok) {
        const json = await res.json();
        setErrorMsg(json.error || "Failed to fetch audit logs");
        setLoading(false);
        return;
      }
      
      const json = await res.json();
      setLogs(json.logs || []);
      setPagination({
        ...pagination,
        ...json.pagination,
        offset
      });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setErrorMsg("Failed to fetch audit logs");
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const formatData = (data: Record<string, any> | null): string => {
    if (!data) return "-";
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return "Invalid JSON";
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const nextPage = () => {
    if (pagination.has_more) {
      fetchLogs(pagination.offset + pagination.limit);
    }
  };

  const prevPage = () => {
    if (pagination.offset > 0) {
      fetchLogs(Math.max(0, pagination.offset - pagination.limit));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Audit Logs</h1>
        <p className="text-gray-600">View system audit trail and data changes</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Name
            </label>
            <select
              value={filters.table_name}
              onChange={(e) => handleFilterChange('table_name', e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">All Tables</option>
              <option value="profiles">Profiles</option>
              <option value="user_plans">User Plans</option>
              <option value="provider_profiles">Provider Profiles</option>
              <option value="provider_applications">Provider Applications</option>
              <option value="bookings">Bookings</option>
              <option value="user_tasks">User Tasks</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operation
            </label>
            <select
              value={filters.operation}
              onChange={(e) => handleFilterChange('operation', e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">All Operations</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ table_name: "", operation: "" });
                setPagination(prev => ({ ...prev, offset: 0 }));
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : errorMsg ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-800 mb-4">{errorMsg}</div>
      ) : (
        <>
          {/* Pagination Info */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} logs
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={pagination.offset === 0}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                Previous
              </button>
              <button
                onClick={nextPage}
                disabled={!pagination.has_more}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                Next
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Table</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Operation</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Record ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Changed By</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">When</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{log.id}</td>
                      <td className="px-4 py-3 text-sm font-mono">{log.table_name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOperationColor(log.operation)}`}>
                          {log.operation}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{log.record_id}</td>
                      <td className="px-4 py-3 text-sm font-mono text-xs">{log.changed_by || 'System'}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>{new Date(log.changed_at).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.changed_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {expandedLog === log.id ? 'Hide' : 'View'} Data
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No audit logs found
              </div>
            )}
          </div>

          {/* Expanded Data Views */}
          {logs.map((log) => (
            expandedLog === log.id && (
              <div key={`expanded-${log.id}`} className="mt-4 bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">
                  Audit Log #{log.id} - {log.operation} on {log.table_name}
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {log.old_data && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Old Data</h4>
                      <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-64 border">
                        {formatData(log.old_data)}
                      </pre>
                    </div>
                  )}
                  
                  {log.new_data && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">New Data</h4>
                      <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-64 border">
                        {formatData(log.new_data)}
                      </pre>
                    </div>
                  )}
                </div>

                {!log.old_data && !log.new_data && (
                  <div className="text-gray-500 text-center py-4">
                    No data changes recorded
                  </div>
                )}
              </div>
            )
          ))}
        </>
      )}
    </div>
  );
} 