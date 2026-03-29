import { useEffect, useMemo, useState } from 'react';
import { employeeAPI } from '../api/services';
import { FileText, Download, Loader2, Inbox } from 'lucide-react';

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function Form16() {
  const [form16List, setForm16List] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchYear, setSearchYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredList = useMemo(() => {
    return form16List.filter((f) => {
      const matchesYear = !searchYear || String(f.financialYear).includes(searchYear);
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'DOWNLOADED' && f.downloaded) ||
        (filterStatus === 'NEW' && !f.downloaded);
      return matchesYear && matchesStatus;
    });
  }, [form16List, searchYear, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchYear, filterStatus, pageSize]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  useEffect(() => {
    const fetchForm16 = async () => {
      setLoading(true);
      try {
        const res = await employeeAPI.getMyForm16List();
        const data = res?.data?.data ?? [];
        setForm16List(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load Form16');
      } finally {
        setLoading(false);
      }
    };
    fetchForm16();
  }, []);

  const handleDownload = async (fy) => {
    try {
      const res = await employeeAPI.downloadMyForm16(fy);
      downloadBlob(res.data, `Form16_FY${fy}.pdf`);
    } catch (e) {
      alert('Download failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Form 16</h1>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search financial year..."
            value={searchYear}
            onChange={(e) => setSearchYear(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">All status</option>
            <option value="NEW">New</option>
            <option value="DOWNLOADED">Downloaded</option>
          </select>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value={5}>5 rows</option>
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredList.length === 0 ? (
          <div className="text-center text-gray-500">
            <Inbox className="mx-auto mb-2" />
            No Form16 available
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left uppercase tracking-wide text-xs font-semibold text-slate-600">
                    <th className="p-3">FY</th>
                    <th className="p-3">Uploaded</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((f) => (
                    <tr key={f.id} className="border-t hover:bg-slate-50">
                      <td className="p-3">{f.financialYear}</td>
                      <td className="p-3">{formatDate(f.uploadedAt)}</td>
                      <td className="p-3">{f.downloaded ? 'Downloaded' : 'New'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDownload(f.financialYear)}
                          className="bg-indigo-600 text-white px-3 py-1 rounded"
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm mt-3">
              <p className="text-slate-500">
                Showing {paginatedList.length} of {filteredList.length} records
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-2">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}