import { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, LogOut } from 'lucide-react';
import { attendanceAPI, dashboardAPI } from '../api/services';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { statusBadge } from '../components/ui/Badge';
import Table from '../components/ui/Table';
import { useAuth } from '../context/useAuth';

export default function Attendance() {
  const { user, isEmployee } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetchAttendance();
    getLocation();
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 0, lng: 0 })
      );
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getAttendance({});
      setRecords(Array.isArray(res.data) ? res.data : res.data?.content || []);
    } catch { setRecords([]); } finally { setLoading(false); }
  };

  const handleCheckIn = async () => {
    setCheckinLoading(true);
    setMessage(''); setError('');
    try {
      await attendanceAPI.checkIn({
        latitude: location?.lat || 0,
        longitude: location?.lng || 0,
        address: address || 'Office',
      });
      setMessage('Checked in successfully!');
      fetchAttendance();
    } catch (e) {
      setError(e.response?.data?.message || 'Check-in failed');
    } finally { setCheckinLoading(false); }
  };

  const handleCheckOut = async () => {
    setCheckoutLoading(true);
    setMessage(''); setError('');
    try {
      await attendanceAPI.checkOut({});
      setMessage('Checked out successfully!');
      fetchAttendance();
    } catch (e) {
      setError(e.response?.data?.message || 'Check-out failed');
    } finally { setCheckoutLoading(false); }
  };

  const columns = [
    { key: 'employeeName', label: 'Employee', render: (v, r) => v || `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim() || '—' },
    { key: 'attendanceDate', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'checkInTime', label: 'Check In', render: (v) => v ? new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—' },
    { key: 'checkOutTime', label: 'Check Out', render: (v) => v ? new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—' },
    { key: 'workingHours', label: 'Hours', render: (v) => v ? `${v}h` : '—' },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={statusBadge(v)}>{v?.replace(/_/g, ' ') || '—'}</Badge>,
    },
    {
      key: 'address', label: 'Location',
      render: (v) => v ? (
        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <MapPin size={12} /> {v.length > 30 ? v.slice(0, 30) + '...' : v}
        </div>
      ) : '—',
    },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Attendance Management</h2>

      {/* Check In/Out Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200">
          <CardBody className="flex flex-col items-center text-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Mark Check-In</h3>
              <p className="text-sm text-slate-500 mt-1">Record your attendance for today</p>
            </div>
            <input
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your location / address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            {location && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin size={11} /> GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            )}
            <Button variant="success" onClick={handleCheckIn} loading={checkinLoading} className="w-full">
              <Clock size={16} /> Check In Now
            </Button>
          </CardBody>
        </Card>

        <Card className="border-red-200">
          <CardBody className="flex flex-col items-center text-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <LogOut size={32} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Mark Check-Out</h3>
              <p className="text-sm text-slate-500 mt-1">End your workday and record hours</p>
            </div>
            <div className="w-full bg-slate-50 rounded-lg p-4">
              <p className="text-3xl font-bold text-slate-800">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-slate-400 mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <Button variant="danger" onClick={handleCheckOut} loading={checkoutLoading} className="w-full">
              <LogOut size={16} /> Check Out Now
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Message */}
      {message && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{message}</div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Attendance Records */}
      <Card>
        <CardHeader title="Attendance Records" subtitle="All employee attendance logs" />
        <Table columns={columns} data={records} loading={loading} emptyMessage="No attendance records found" />
      </Card>
    </div>
  );
}
