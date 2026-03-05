import api from './axios';

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
};

// Admin
export const adminAPI = {
  register: (data) => api.post('/admin/register', data),
  getAll: (params) => api.get('/admin/all', { params }),
  getById: (id) => api.get(`/admin/${id}`),
  update: (id, data) => api.put(`/admin/${id}`, data),
  toggleActive: (id) => api.patch(`/admin/${id}/toggle-active`),
  delete: (id) => api.delete(`/admin/${id}`),
  getStats: () => api.get('/admin/stats'),
};

// Employee
export const employeeAPI = {
  register: (data) => api.post('/employee/register', data),
  getById: (id) => api.get(`/employee/${id}`),
  getAll: (params) => api.get('/employee', { params }),
  search: (q) => api.get('/employee/search', { params: { q } }),
  filterByDepartment: (dept) => api.get('/employee/filter/department', { params: { dept } }),
  filterByStatus: (status) => api.get('/employee/filter/status', { params: { status } }),
  update: (id, data) => api.put(`/employee/${id}`, data),
  delete: (id) => api.delete(`/employee/${id}`),
  getDepartments: () => api.get('/employee/departments'),
  getDashboard: () => api.get('/employee/dashboard'),
};

// Attendance
export const attendanceAPI = {
  checkIn: (data) => api.post('/attendance/checkin', data),
  checkOut: () => api.post('/attendance/checkout'),
  getToday: () => api.get('/attendance/today'),
};

// Leave
export const leaveAPI = {
  apply: (data) => api.post('/leaves/apply', data),
  approve: (id) => api.patch(`/leaves/${id}/approve`),
  reject: (id, reason) => api.patch(`/leaves/${id}/reject`, null, { params: { reason } }),
  getByEmployee: (empId, params) => api.get(`/leaves/employee/${empId}`, { params }),
  getPending: (params) => api.get('/leaves/pending', { params }),
};

// Payroll
export const payrollAPI = {
  generate: (month) => api.post('/payroll/generate', null, { params: { month } }),
  approve: (id) => api.put(`/payroll/${id}/approve`),
  processPayment: (id) => api.post(`/payroll/${id}/process-payment`),
  getByMonth: (month, params) => api.get('/payroll/month', { params: { month, ...params } }),
  getByEmployee: (employeeId) => api.get(`/payroll/employee/${employeeId}`),
  getMyPayslips: () => api.get('/payroll/my-payslips'),
  getSummary: (month) => api.get('/payroll/summary', { params: { month } }),
};

// Dashboard
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getEmployees: (params) => api.get('/dashboard/employees', { params }),
  getAttendance: (params) => api.get('/dashboard/attendance', { params }),
  getDepartments: () => api.get('/dashboard/departments'),
  getPayroll: (params) => api.get('/dashboard/payroll', { params }),
  getAdminStats: () => api.get('/dashboard/admin-stats'),
};

// Email
export const emailAPI = {
  broadcast: (data) => api.post('/emails/broadcast', data),
  getLogs: () => api.get('/emails/logs'),
  getFailedLogs: () => api.get('/emails/logs/failed'),
  searchLogs: (email) => api.get('/emails/logs/search', { params: { email } }),
};

// Upload
export const uploadAPI = {
  attendancePhoto: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload/attendance-photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  profilePhoto: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload/profile-photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  document: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload/document', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
