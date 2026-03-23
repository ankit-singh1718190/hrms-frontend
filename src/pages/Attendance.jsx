import { useState, useEffect, useRef } from 'react';
import { attendanceAPI, uploadAPI, dashboardAPI } from '../api/services';
import { useAuth } from '../context/useAuth';
import {
  MapPin, Camera, LogIn, LogOut, Upload, X,
  CheckCircle, AlertCircle, Clock, Timer, CalendarCheck,
  Pencil, History, ShieldAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
}

function formatDateTime(val) {
  if (!val) return '—';
  return new Date(val).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDuration(val) {
  if (!val) return '—';
  if (/^\d+h \d+m/.test(val)) return val;
  const m = String(val).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  if (!m) return val;
  return `${Number(m[1] || 0)}h ${Number(m[2] || 0)}m ${Math.round(Number(m[3] || 0))}s`;
}

function formatElapsedMs(ms) {
  if (ms == null || ms < 0) return '0h 0m 0s';
  const t = Math.floor(ms / 1000);
  return `${Math.floor(t / 3600)}h ${Math.floor((t % 3600) / 60)}m ${t % 60}s`;
}

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'WORK_FROM_HOME', 'HOLIDAY'];

const STATUS_COLORS = {
  PRESENT:        'bg-green-100 text-green-700',
  ABSENT:         'bg-red-100 text-red-700',
  HALF_DAY:       'bg-yellow-100 text-yellow-700',
  ON_LEAVE:       'bg-blue-100 text-blue-700',
  WORK_FROM_HOME: 'bg-purple-100 text-purple-700',
  HOLIDAY:        'bg-orange-100 text-orange-700',
  NOT_MARKED:     'bg-slate-100 text-slate-500',
};

// ── Edit Attendance Modal ─────────────────────────────────────────────────────
function EditModal({ row, onClose, onSaved }) {
  const [form, setForm] = useState({
    status: row.status || 'PRESENT',
    checkIn: row.checkIn ? row.checkIn.slice(0, 16) : '',
    checkOut: row.checkOut ? row.checkOut.slice(0, 16) : '',
    reason: '',
    remarks: row.remarks || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.reason.trim()) { setError('Please provide a reason for the edit'); return; }
    setLoading(true);
    try {
      const payload = {
        status: form.status,
        reason: form.reason,
        remarks: form.remarks || null,
        checkIn:  form.checkIn  ? form.checkIn  + ':00' : null,
        checkOut: form.checkOut ? form.checkOut + ':00' : null,
      };
      const res = await attendanceAPI.editAttendance(row.attendanceId, payload);
      onSaved(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Edit Attendance</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {row.employeeName} · {row.date}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Original status badge */}
          {row.originalStatus && row.originalStatus !== 'N/A' && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              <ShieldAlert size={13} />
              Original status: <span className="font-semibold text-slate-700">{row.originalStatus}</span>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Check In */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Check In Time</label>
            <input
              type="datetime-local"
              value={form.checkIn}
              onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* Check Out */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Check Out Time</label>
            <input
              type="datetime-local"
              value={form.checkOut}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks (optional)</label>
            <input
              type="text"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="e.g. WFH approved"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Reason — required */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Reason for Edit <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Explain why you are editing this record..."
              rows={3}
              required
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Audit Badge ───────────────────────────────────────────────────────────────
function AuditBadge({ row }) {
  if (!row.isEdited && !row.editedByName) return null;
  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
        <Pencil size={9} />
        Edited by {row.editedByName} ({row.editedByRole}) · {new Date(row.editedAt).toLocaleDateString('en-IN')}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Attendance() {
  const { isAdmin, isHR, isManager } = useAuth();
  const navigate = useNavigate();
  const isPrivilegedRole = isAdmin || isHR || isManager;

  const [adminRows, setAdminRows] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  const [todayRecord, setTodayRecord] = useState(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [recordError, setRecordError] = useState('');
  const [supportsTodayApi, setSupportsTodayApi] = useState(true);
  const [fallbackCheckedIn, setFallbackCheckedIn] = useState(false);
  const [fallbackCheckedOut, setFallbackCheckedOut] = useState(false);

  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [geoError, setGeoError] = useState('');
  const [locating, setLocating] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [runningTick, setRunningTick] = useState(0);

  // Edit modal state
  const [editRow, setEditRow] = useState(null);
  const [editSuccess, setEditSuccess] = useState('');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const fetchToday = async () => {
    if (!supportsTodayApi) return;
    setRecordLoading(true);
    setRecordError('');
    try {
      const res = await attendanceAPI.getToday();
      const payload = res.data;
      const record = payload?.data ?? payload;
      const hasAttendanceData = !!(record?.checkInTime || record?.checkOutTime || record?.attendanceId || record?.id);
      const isRecordFound = record?.found === true || (record?.found === undefined && hasAttendanceData);
      if (isRecordFound) {
        setTodayRecord(record);
        setFallbackCheckedIn(!!record?.checkInTime);
        setFallbackCheckedOut(!!record?.checkOutTime);
        const lat = record?.latitude != null ? Number(record.latitude) : null;
        const lng = record?.longitude != null ? Number(record.longitude) : null;
        if (lat != null && lng != null) {
          setLocation({ lat, lng, accuracy: record?.accuracy ?? null });
          if (record?.address) setAddress(record.address);
        }
      } else {
        setTodayRecord(null);
        setFallbackCheckedIn(false);
        setFallbackCheckedOut(false);
      }
    } catch (e) {
      const httpStatus = e.response?.status;
      if (httpStatus === 404 || httpStatus === 405) {
        setSupportsTodayApi(false);
        setTodayRecord(null);
        return;
      }
      setTodayRecord(null);
      if (httpStatus !== 404) {
        setRecordError(`Could not load attendance status (${httpStatus || 'Network Error'})`);
      }
    } finally {
      setRecordLoading(false);
    }
  };

  const loadAdminAttendance = async () => {
    setAdminLoading(true);
    setAdminError('');
    const todayIso = new Date().toISOString().slice(0, 10);
    try {
      // Use /attendance/date which now returns attendanceId + audit fields
      const res = await attendanceAPI.getByDate(todayIso);
      const rows = res?.data?.data || [];
      setAdminRows(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setAdminRows([]);
      setAdminError(e.response?.data?.message || e.message || 'Failed to load attendance');
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (isPrivilegedRole) {
      loadAdminAttendance();
      return;
    }
    fetchToday();
    getLocation();
  }, [isPrivilegedRole]);

  const showRunningTimer = todayRecord?.checkInTime && !todayRecord?.checkOutTime;
  useEffect(() => {
    if (!showRunningTimer) return;
    const id = setInterval(() => setRunningTick((c) => c + 1), 1000);
    return () => clearInterval(id);
  }, [showRunningTimer]);

  const getLocation = () => {
    setLocating(true);
    setGeoError('');
    if (!navigator.geolocation) { setGeoError('Geolocation not supported'); setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({ lat: latitude, lng: longitude, accuracy: accuracy ?? null });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept': 'application/json', 'Accept-Language': 'en', 'User-Agent': 'HRMS-Attendance/1.0' } }
          );
          const data = await res.json();
          const addr = data.address;
          if (addr && typeof addr === 'object') {
            const parts = [addr.road, addr.neighbourhood || addr.suburb, addr.city || addr.town, addr.state, addr.postcode, addr.country].filter(Boolean);
            setAddress([...new Set(parts)].join(', ') || data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } else {
            setAddress(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch { setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`); }
        setLocating(false);
      },
      (err) => { setGeoError(`Location error: ${err.message}`); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { alert('Cannot access camera'); }
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      setPhotoFile(new File([blob], 'checkin.jpg', { type: 'image/jpeg' }));
      setPhotoPreview(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); setShowCamera(false); };
  const handleFileChange = (e) => { const f = e.target.files[0]; if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); } };

  const handleCheckIn = async () => {
    if (!location) { alert('Please allow location access first'); return; }
    if (checkInLoading || checkOutLoading) return;
    setCheckInLoading(true); setStatus('idle');
    try {
      let photoUrl = 'no-photo';
      if (photoFile) { const upRes = await uploadAPI.attendancePhoto(photoFile); photoUrl = upRes.data?.data || upRes.data?.url || 'no-photo'; }
      const res = await attendanceAPI.checkIn({ loginPhotoUrl: photoUrl, latitude: location.lat, longitude: location.lng, address });
      setStatus('success'); setMessage(res.data?.message || 'Checked in successfully!');
      setFallbackCheckedIn(true);
      if (supportsTodayApi) await fetchToday();
    } catch (e) {
      const errMsg = e.response?.data?.message || e.message || 'Check-in failed';
      setStatus('error'); setMessage(`Check-in failed: ${errMsg}`);
      if (errMsg.toLowerCase().includes('already checked in')) { setFallbackCheckedIn(true); if (supportsTodayApi) await fetchToday(); }
    } finally { setCheckInLoading(false); }
  };

  const handleCheckOut = async () => {
    if (checkInLoading || checkOutLoading) return;
    setCheckOutLoading(true); setStatus('idle');
    try {
      const res = await attendanceAPI.checkOut();
      setStatus('success'); setMessage(res.data?.message || 'Checked out successfully!');
      setFallbackCheckedIn(true); setFallbackCheckedOut(true);
      if (supportsTodayApi) await fetchToday();
    } catch (e) {
      const errMsg = e.response?.data?.message || e.message || 'Check-out failed';
      setStatus('error'); setMessage(`Check-out failed: ${errMsg}`);
      if (errMsg.toLowerCase().includes('already checked out')) { setFallbackCheckedIn(true); setFallbackCheckedOut(true); if (supportsTodayApi) await fetchToday(); }
    } finally { setCheckOutLoading(false); }
  };

  // Handle edit save
  const handleEditSaved = (updatedData) => {
    setEditRow(null);
    setEditSuccess(`Attendance updated successfully! Edited by ${updatedData?.editedBy || 'you'}`);
    setTimeout(() => setEditSuccess(''), 4000);
    loadAdminAttendance(); // refresh table
  };

  const alreadyCheckedIn  = supportsTodayApi ? !!todayRecord?.checkInTime : fallbackCheckedIn;
  const alreadyCheckedOut = supportsTodayApi ? !!todayRecord?.checkOutTime : fallbackCheckedOut;
  const eitherLoading     = checkInLoading || checkOutLoading;
  const checkOutDisabled  = eitherLoading || alreadyCheckedOut;

  // ── ADMIN / HR / MANAGER VIEW ─────────────────────────────────────────────
  if (isPrivilegedRole) {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
            <p className="text-slate-500 text-sm mt-1">{today}</p>
          </div>
          {/* Edit History button — Admin/HR only */}
          {(isAdmin || isHR) && (
            <button
              onClick={() => navigate('/attendance/edit-history')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <History size={15} />
              Edit History
            </button>
          )}
        </div>

        {/* Edit success banner */}
        {editSuccess && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
            <CheckCircle size={16} className="shrink-0" />
            {editSuccess}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Today's Employee Attendance</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{adminRows.length} records</span>
              <button
                onClick={loadAdminAttendance}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Refresh
              </button>
            </div>
          </div>

          {adminLoading ? (
            <div className="p-6 text-sm text-slate-500">Loading attendance...</div>
          ) : adminError ? (
            <div className="p-6 text-sm text-red-600 bg-red-50">Failed to load: {adminError}</div>
          ) : adminRows.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No attendance records found for today.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Employee ID</th>
                    <th className="px-6 py-3">Check In</th>
                    <th className="px-6 py-3">Check Out</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Edit Info</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {adminRows.map((row, idx) => (
                    <tr key={`${row?.employeeId}-${idx}`} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {row?.employeeName || 'Employee'}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {row?.employeeId || '—'}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {row?.checkIn ? formatDateTime(row.checkIn) : '—'}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {row?.checkOut ? formatDateTime(row.checkOut) : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[row?.status] || STATUS_COLORS.NOT_MARKED}`}>
                          {row?.status || 'NOT_MARKED'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {row?.isEdited ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                              <Pencil size={9} /> Edited
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              by {row.editedByName} ({row.editedByRole})
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {row.editedAt ? new Date(row.editedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {/* Only show edit button if attendance record exists */}
                        {row?.attendanceId ? (
                          <button
                            onClick={() => setEditRow(row)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">No record</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editRow && (
          <EditModal
            row={editRow}
            onClose={() => setEditRow(null)}
            onSaved={handleEditSaved}
          />
        )}
      </div>
    );
  }

  // ── EMPLOYEE VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
        <p className="text-slate-500 text-sm mt-1">{today}</p>
      </div>

      {/* Today's timing card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-700 text-sm">Today's Attendance</h2>
          </div>
          <button onClick={fetchToday} disabled={recordLoading || !supportsTodayApi}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50">
            {supportsTodayApi ? (recordLoading ? 'Loading…' : 'Refresh Status') : 'Status API unavailable'}
          </button>
        </div>

        {recordLoading ? (
          <div className="p-5 grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="p-5 grid grid-cols-3 gap-4">
            <div className={`rounded-xl p-4 text-center ${alreadyCheckedIn ? 'bg-green-50 border border-green-100' : 'bg-slate-50 border border-slate-100'}`}>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <LogIn size={14} className={alreadyCheckedIn ? 'text-green-500' : 'text-slate-400'} />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Check In</span>
              </div>
              <p className={`text-base font-bold ${alreadyCheckedIn ? 'text-green-700' : 'text-slate-400'}`}>
                {alreadyCheckedIn ? formatTime(todayRecord.checkInTime) : 'Not yet'}
              </p>
            </div>
            <div className={`rounded-xl p-4 text-center ${alreadyCheckedOut ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100'}`}>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <LogOut size={14} className={alreadyCheckedOut ? 'text-red-500' : 'text-slate-400'} />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Check Out</span>
              </div>
              <p className={`text-base font-bold ${alreadyCheckedOut ? 'text-red-600' : 'text-slate-400'}`}>
                {alreadyCheckedOut ? formatTime(todayRecord.checkOutTime) : 'Not yet'}
              </p>
            </div>
            {(() => {
              const hasWorkHours = !!todayRecord?.workingHours;
              const running = alreadyCheckedIn && !alreadyCheckedOut && todayRecord?.checkInTime;
              const elapsedMs = running ? Date.now() - new Date(todayRecord.checkInTime).getTime() : 0;
              const displayHours = hasWorkHours ? formatDuration(todayRecord.workingHours)
                : running ? formatElapsedMs(elapsedMs)
                : (alreadyCheckedIn ? 'In progress' : '—');
              const isHighlight = hasWorkHours || running;
              return (
                <div className={`rounded-xl p-4 text-center ${isHighlight ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Timer size={14} className={isHighlight ? 'text-indigo-500' : 'text-slate-400'} />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hours</span>
                  </div>
                  <p className={`text-base font-bold ${isHighlight ? 'text-indigo-700' : 'text-slate-400'}`}>{displayHours}</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Show edited badge on employee view too */}
        {todayRecord?.isEdited && (
          <div className="px-5 pb-3">
            <AuditBadge row={todayRecord} />
          </div>
        )}

        {recordError && (
          <div className="mx-5 mb-3 px-3 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-xs">⚠️ {recordError}</div>
        )}

        {!recordLoading && (
          <div className="px-5 pb-4 flex gap-2">
            {alreadyCheckedIn && (
              <span className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                <CheckCircle size={11} /> Checked in today
              </span>
            )}
            {alreadyCheckedOut && (
              <span className="flex items-center gap-1.5 text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-medium">
                <CheckCircle size={11} /> Checked out
              </span>
            )}
            {!alreadyCheckedIn && (
              <span className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-medium">
                <Clock size={11} /> Not checked in yet
              </span>
            )}
          </div>
        )}
      </div>

      {status !== 'idle' && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
          status === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {status === 'success' ? <CheckCircle size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm"><MapPin size={15} /> Location</h2>
          <button onClick={getLocation} disabled={locating} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50">
            {locating ? 'Detecting…' : 'Refresh'}
          </button>
        </div>
        {geoError ? <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{geoError}</div>
          : location ? (
            <div className="space-y-1">
              <p className="text-sm text-slate-600 leading-relaxed">{address || 'Fetching address…'}</p>
              <p className="text-xs text-slate-400 font-mono">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
              {location.accuracy != null && <p className="text-xs text-slate-400">Accuracy: ±{Math.round(location.accuracy)} m</p>}
            </div>
          ) : <p className="text-sm text-slate-400">{locating ? 'Getting your location…' : 'Location not available'}</p>
        }
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm mb-3"><Camera size={15} /> Photo (optional)</h2>
        {photoPreview ? (
          <div className="relative inline-block">
            <img src={photoPreview} alt="Preview" className="w-40 h-32 object-cover rounded-lg border border-slate-200" />
            <button onClick={() => { setPhotoFile(null); setPhotoPreview(''); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"><X size={14} /></button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={startCamera} className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
              <Camera size={14} /> Use Camera
            </button>
            <label className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors">
              <Upload size={14} /> Upload File
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {showCamera && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-5 space-y-3 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Take Photo</h3>
              <button onClick={stopCamera} className="p-1 hover:bg-slate-100 rounded"><X size={18} /></button>
            </div>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
            <button onClick={capturePhoto} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium">Capture Photo</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <button onClick={handleCheckIn} disabled={eitherLoading || alreadyCheckedIn || !location}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
          <LogIn size={18} />
          {checkInLoading ? 'Checking In…' : alreadyCheckedIn ? 'Already Checked In' : 'Check In'}
        </button>
        <button onClick={handleCheckOut} disabled={checkOutDisabled}
          className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
          <LogOut size={18} />
          {checkOutLoading ? 'Checking Out…' : alreadyCheckedOut ? 'Already Checked Out' : 'Check Out'}
        </button>
      </div>
    </div>
  );
}
