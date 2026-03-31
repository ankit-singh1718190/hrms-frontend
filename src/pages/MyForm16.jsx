import { useEffect, useState } from 'react';
import { employeeAPI } from '../api/services';

export default function MyForm16() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await employeeAPI.getMyForm16List();
      setData(res?.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = async (fy) => {
    try {
      const res = await employeeAPI.downloadMyForm16(fy);

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `Form16_${fy}.pdf`;
      a.click();
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Form 16</h1>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-3">Financial Year</th>
              <th className="p-3">File Name</th>
              <th className="p-3">Uploaded</th>
              <th className="p-3">Download</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-6 text-center">
                  No Form 16 available yet
                </td>
              </tr>
            ) : (
              data.map((f) => (
                <tr key={f.id} className="border-t">
                  <td className="p-3">{f.financialYear}</td>
                  <td className="p-3">{f.fileName}</td>
                  <td className="p-3">{f.uploadedAt}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDownload(f.financialYear)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}