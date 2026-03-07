import { useState, useEffect, useRef } from 'react';
import { attendanceAPI, uploadAPI, dashboardAPI } from '../api/services';
import { useAuth } from '../context/useAuth';
import {
  MapPin, Camera, LogIn, LogOut, Upload, X,
  CheckCircle, AlertCircle, Clock, Timer, CalendarCheck,
} from 'lucide-react';

function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
}

function formatDateTime(val) {
  if (!val) return '—';
  return new Date(val).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Handles ISO-8601 durations like "PT1H23M27.915704S" and plain "1h 23m"
function formatDuration(val) {
  if (!val) return '—';
  // Already formatted like "1h 23m", just return
  if (/^\d+h \d+m/.test(val)) return val;

  const m = String(val).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  if (!m) return val;

  const hours = Number(m[1] || 0);
  const minutes = Number(m[2] || 0);
  const seconds = Math.round(Number(m[3] || 0));

  return `${hours}h ${minutes}m ${seconds}s`;
}

function formatElapsedMs(ms) {
  if (ms == null || ms < 0) return '0h 0m 0s';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function Attendance() {
  const { isAdmin, isHR, isManager } = useAuth();
  const isPrivilegedRole = isAdmin || isHR || isManager;

  // Admin/HR/Manager attendance table (uses /dashboard/attendance DTOs)
  const [adminRows, setAdminRows] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Today's record
  const [todayRecord, setTodayRecord] = useState(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [recordError, setRecordError] = useState('');
  const [supportsTodayApi, setSupportsTodayApi] = useState(true);
  const [fallbackCheckedIn, setFallbackCheckedIn] = useState(false);
  const [fallbackCheckedOut, setFallbackCheckedOut] = useState(false);

  // Location
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [geoError, setGeoError] = useState('');
  const [locating, setLocating] = useState(false);

  // Photo
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Separate loading state per button — prevents both from showing "Processing…"
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | success | error
  const [message, setMessage] = useState('');
  const [runningTick, setRunningTick] = useState(0);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const fetchToday = async () => {
    if (!supportsTodayApi) return;
    setRecordLoading(true);
    setRecordError('');
    try {
      const res = await attendanceAPI.getToday();
      // Backend returns: { status: "success", data: { found, checkInTime, ... } }
      const payload = res.data;
      const record = payload?.data ?? payload;
      const hasAttendanceData = !!(record?.checkInTime || record?.checkOutTime || record?.attendanceId || record?.id);
      const isRecordFound = record?.found === true || (record?.found === undefined && hasAttendanceData);
      if (isRecordFound) {
        setTodayRecord(record);
        setFallbackCheckedIn(!!record?.checkInTime);
        setFallbackCheckedOut(!!record?.checkOutTime);
        // Use saved check-in location so "Location" shows where user checked in, not current position
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
      const errMsg = e.response?.data?.message || e.message || 'Unknown error';
      console.warn('fetchToday failed:', httpStatus, errMsg);
      // If endpoint itself is unavailable, switch to frontend fallback mode
      if (httpStatus === 404 || httpStatus === 405) {
        setSupportsTodayApi(false);
        setTodayRecord(null);
        setRecordError('');
        return;
      }
      setTodayRecord(null);
      if (httpStatus !== 404) {
        setRecordError(`Could not load attendance status (${httpStatus || 'Network Error'}): ${errMsg}`);
      }
    } finally {
      setRecordLoading(false);
    }
  };

  useEffect(() => {
    if (isPrivilegedRole) {
      const loadAdminAttendance = async () => {
        setAdminLoading(true);
        setAdminError('');
        const todayIso = new Date().toISOString().slice(0, 10);
        try {
          const attendanceRes = await dashboardAPI.getAttendance({
            attendanceDate: todayIso,
            page: 0,
            size: 200,
            sortBy: 'createdAt',
            sortDir: 'desc',
          });
          const rows = attendanceRes?.data?.data || [];
          setAdminRows(Array.isArray(rows) ? rows : []);
        } catch (e) {
          setAdminRows([]);
          setAdminError(e.response?.data?.message || e.message || 'Failed to load attendance');
        } finally {
          setAdminLoading(false);
        }
      };
      loadAdminAttendance();
      return;
    }

    fetchToday();
    getLocation();
  }, [isPrivilegedRole]);

  // Running timer: update every second when checked in but not checked out
  const showRunningTimer = todayRecord?.checkInTime && !todayRecord?.checkOutTime;
  useEffect(() => {
    if (!showRunningTimer) return;
    const id = setInterval(() => setRunningTick((c) => c + 1), 1000);
    return () => clearInterval(id);
  }, [showRunningTimer]);

  const getLocation = () => {
    setLocating(true);
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({ lat: latitude, lng: longitude, accuracy: accuracy ?? null });
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
          const res = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Accept-Language': 'en',
              'User-Agent': 'HRMS-Attendance/1.0 (https://github.com/hrms-frontend)',
            },
          });
          const data = await res.json();
          const addr = data.address;
          const name = data.display_name;
          if (addr && typeof addr === 'object') {
            const parts = [
              addr.road,
              addr.neighbourhood || addr.suburb || addr.village,
              addr.city_district || addr.city || addr.town || addr.county,
              addr.state,
              addr.postcode,
              addr.country,
            ].filter(Boolean);
            const unique = [...new Set(parts)];
            setAddress(unique.join(', ') || name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } else {
            setAddress(name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch {
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
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
      const file = new File([blob], 'checkin.jpg', { type: 'image/jpeg' });
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setShowCamera(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleCheckIn = async () => {
    if (!location) { alert('Please allow location access first'); return; }
    if (checkInLoading || checkOutLoading) return; // guard against double-click
    setCheckInLoading(true);
    setStatus('idle');
    try {
      let photoUrl = 'no-photo';
      if (photoFile) {
        const upRes = await uploadAPI.attendancePhoto(photoFile);
        photoUrl = upRes.data?.data || upRes.data?.url || 'no-photo';
      }
      const res = await attendanceAPI.checkIn({
        loginPhotoUrl: photoUrl,
        latitude: location.lat,
        longitude: location.lng,
        address,
      });
      setStatus('success');
      setMessage(res.data?.message || 'Checked in successfully!');
      setFallbackCheckedIn(true);
      if (supportsTodayApi) {
        await fetchToday();
      }
    } catch (e) {
      const errMsg = e.response?.data?.message || e.message || 'Check-in failed';
      setStatus('error');
      setMessage(`Check-in failed: ${errMsg}`);
      if (errMsg.toLowerCase().includes('already checked in')) {
        setFallbackCheckedIn(true);
        if (supportsTodayApi) {
          await fetchToday();
        }
      }
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (checkInLoading || checkOutLoading) return; // guard against double-click
    setCheckOutLoading(true);
    setStatus('idle');
    try {
      const res = await attendanceAPI.checkOut();
      setStatus('success');
      setMessage(res.data?.message || 'Checked out successfully!');
      setFallbackCheckedIn(true);
      setFallbackCheckedOut(true);
      if (supportsTodayApi) {
        await fetchToday();
      }
    } catch (e) {
      const errMsg = e.response?.data?.message || e.message || 'Check-out failed';
      setStatus('error');
      setMessage(`Check-out failed: ${errMsg}`);
      if (errMsg.toLowerCase().includes('already checked out')) {
        setFallbackCheckedIn(true);
        setFallbackCheckedOut(true);
        if (supportsTodayApi) {
          await fetchToday();
        }
      }
    } finally {
      setCheckOutLoading(false);
    }
  };

  const alreadyCheckedIn  = supportsTodayApi ? !!todayRecord?.checkInTime : fallbackCheckedIn;
  const alreadyCheckedOut = supportsTodayApi ? !!todayRecord?.checkOutTime : fallbackCheckedOut;
  // Allow checkout even if record failed to load — backend will validate
  const eitherLoading    = checkInLoading || checkOutLoading;
  const checkOutDisabled = eitherLoading || alreadyCheckedOut;

  if (isPrivilegedRole) {
    return (
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
          <p className="text-slate-500 text-sm mt-1">{today}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Today's Employee Attendance</h2>
            <span className="text-xs text-slate-500">{adminRows.length} records</span>
          </div>

          {adminLoading ? (
            <div className="p-6 text-sm text-slate-500">Loading attendance...</div>
          ) : adminError ? (
            <div className="p-6 text-sm text-red-600 bg-red-50 border-t border-red-100">
              Failed to load attendance: {adminError}
            </div>
          ) : adminRows.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No attendance records found for today.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Employee ID</th>
                    <th className="px-6 py-3">Check In</th>
                    <th className="px-6 py-3">Check Out</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {adminRows.map((row, idx) => (
                    <tr key={`${row?.employeeCode || row?.employeeId || row?.id}-${idx}`} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {row?.employeeName || 'Employee'}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {row?.employeeCode || row?.employeeId || '—'}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {formatDateTime(row?.checkIn)}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {formatDateTime(row?.checkOut)}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                          {row?.status || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
        <p className="text-slate-500 text-sm mt-1">{today}</p>
      </div>

      {/* ── Today's timing card ─────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-700 text-sm">Today's Attendance</h2>
          </div>
          <button
            onClick={fetchToday}
            disabled={recordLoading || !supportsTodayApi}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
          >
            {supportsTodayApi ? (recordLoading ? 'Loading…' : 'Refresh Status') : 'Status API unavailable'}
          </button>
        </div>

        {recordLoading ? (
          <div className="p-5 grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="p-5 grid grid-cols-3 gap-4">
            {/* Check-in */}
            <div className={`rounded-xl p-4 text-center ${alreadyCheckedIn ? 'bg-green-50 border border-green-100' : 'bg-slate-50 border border-slate-100'}`}>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <LogIn size={14} className={alreadyCheckedIn ? 'text-green-500' : 'text-slate-400'} />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Check In</span>
              </div>
              <p className={`text-base font-bold ${alreadyCheckedIn ? 'text-green-700' : 'text-slate-400'}`}>
                {alreadyCheckedIn ? formatTime(todayRecord.checkInTime) : 'Not yet'}
              </p>
            </div>

            {/* Check-out */}
            <div className={`rounded-xl p-4 text-center ${alreadyCheckedOut ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100'}`}>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <LogOut size={14} className={alreadyCheckedOut ? 'text-red-500' : 'text-slate-400'} />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Check Out</span>
              </div>
              <p className={`text-base font-bold ${alreadyCheckedOut ? 'text-red-600' : 'text-slate-400'}`}>
                {alreadyCheckedOut ? formatTime(todayRecord.checkOutTime) : 'Not yet'}
              </p>
            </div>

            {/* Working hours */}
            {(() => {
              const hasWorkHours = !!todayRecord?.workingHours;
              const running = alreadyCheckedIn && !alreadyCheckedOut && todayRecord?.checkInTime;
              const elapsedMs = running ? Date.now() - new Date(todayRecord.checkInTime).getTime() : 0;
              const displayHours = hasWorkHours
                ? formatDuration(todayRecord.workingHours)
                : running
                  ? formatElapsedMs(elapsedMs)
                  : (alreadyCheckedIn ? 'In progress' : '—');
              const isHighlight = hasWorkHours || running;
              return (
                <div className={`rounded-xl p-4 text-center ${isHighlight ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Timer size={14} className={isHighlight ? 'text-indigo-500' : 'text-slate-400'} />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hours</span>
                  </div>
                  <p className={`text-base font-bold ${isHighlight ? 'text-indigo-700' : 'text-slate-400'}`}>
                    {displayHours}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Record fetch error */}
        {recordError && (
          <div className="mx-5 mb-3 px-3 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-xs">
            ⚠️ {recordError}
          </div>
        )}

        {/* Status badges */}
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

      {/* ── Action status ───────────────────────────────────────── */}
      {status !== 'idle' && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
          status === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {status === 'success'
            ? <CheckCircle size={18} className="mt-0.5 shrink-0" />
            : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
          {message}
        </div>
      )}

      {/* ── Location ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm"><MapPin size={15} /> Location</h2>
          <button onClick={getLocation} disabled={locating} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50">
            {locating ? 'Detecting…' : 'Refresh'}
          </button>
        </div>
        {geoError
          ? <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{geoError}</div>
          : location
            ? <div className="space-y-1">
                <p className="text-sm text-slate-600 leading-relaxed">{address || 'Fetching address…'}</p>
                <p className="text-xs text-slate-400 font-mono">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                {location.accuracy != null && (
                  <p className="text-xs text-slate-400">Accuracy: ±{Math.round(location.accuracy)} m</p>
                )}
              </div>
            : <p className="text-sm text-slate-400">{locating ? 'Getting your location…' : 'Location not available'}</p>
        }
      </div>

      {/* ── Photo ───────────────────────────────────────────────── */}
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

      {/* Camera modal */}
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

      {/* ── Action Buttons ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleCheckIn}
          disabled={eitherLoading || alreadyCheckedIn || !location}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <LogIn size={18} />
          {checkInLoading ? 'Checking In…' : alreadyCheckedIn ? 'Already Checked In' : 'Check In'}
        </button>
        <button
          onClick={handleCheckOut}
          disabled={checkOutDisabled}
          className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <LogOut size={18} />
          {checkOutLoading ? 'Checking Out…' : alreadyCheckedOut ? 'Already Checked Out' : 'Check Out'}
        </button>
      </div>
    </div>
  );
}
