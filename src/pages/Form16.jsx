import { useEffect, useState } from 'react';
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

      <div className="bg-white rounded-xl border p-6">
        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : form16List.length === 0 ? (
          <div className="text-center text-gray-500">
            <Inbox className="mx-auto mb-2" />
            No Form16 available
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>FY</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form16List.map((f) => (
                <tr key={f.id}>
                  <td>{f.financialYear}</td>
                  <td>{formatDate(f.uploadedAt)}</td>
                  <td>{f.downloaded ? 'Downloaded' : 'New'}</td>
                  <td>
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
        )}
      </div>
    </div>
  );
}