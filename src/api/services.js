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
  uploadForm16Bulk: (financialYear, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/admin/form16/upload-bulk', form, {
      params: { fy: financialYear },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadForm16Single: (employeeId, financialYear, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/admin/form16/upload/${employeeId}`, form, {
      params: { fy: financialYear },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getForm16List: (financialYear) =>
    api.get('/admin/form16/list', { params: { fy: financialYear } }),
  getForm16Status: (financialYear) =>
    api.get('/admin/form16/status', { params: { fy: financialYear } }),
  deleteForm16: (id) => api.delete(`/admin/form16/${id}`),
};

// Employee
export const employeeAPI = {
  register: (data) => api.post('/employee/register', data),
  getById: (id) => api.get(`/employee/${id}`),
  getAll: (params) => api.get('/employee', { params }),
  search: (q, params = {}) => api.get('/employee/search', { params: { q, page: 0, size: 20, ...params } }),
  filterByDepartment: (dept) => api.get('/employee/filter/department', { params: { dept } }),
  filterByStatus: (status) => api.get('/employee/filter/status', { params: { status } }),
  update: (id, data) => api.put(`/employee/${id}`, data),
  delete: (id) => api.delete(`/employee/${id}`),
  getDepartments: () => api.get('/employee/departments'),
  getDashboard: () => api.get('/employee/dashboard'),
  getMyForm16List: () => api.get('/employee/form16/my-list'),
  downloadMyForm16: (fy) =>
    api.get('/employee/form16/download', {
      params: { fy },
      responseType: 'blob',
    }),
};

// Attendance
export const attendanceAPI = {
  checkIn: (data) => api.post('/attendance/checkin', data),
  checkOut: () => api.post('/attendance/checkout'),
  getToday: () => api.get('/attendance/today'),
  getByDate: (date) => api.get('/attendance/date', { params: { date } }),
  manual: (data) => api.post('/attendance/manual', data),
  reportDaily: (params) => api.get('/attendance/report/daily', { params }),
  reportMonthly: (params) => api.get('/attendance/report/monthly', { params }),
  exportDaily: (date) =>
    api.get('/attendance/export/daily', {
      params: date ? { date } : {},
      responseType: 'blob',
    }),
  exportMonthly: (month) =>
    api.get('/attendance/export/monthly', {
      params: { month },
      responseType: 'blob',
    }),
  exportYearly: (year) =>
    api.get('/attendance/export/yearly', {
      params: { year },
      responseType: 'blob',
    }),
};

// Leave
export const leaveAPI = {
  apply: (data) => api.post('/leaves/apply', data),
  approve: (id) => api.patch(`/leaves/${id}/approve`),
  reject: (id, reason) => api.patch(`/leaves/${id}/reject`, null, { params: { reason } }),
  getByEmployee: (empId, params) => api.get(`/leaves/employee/${empId}`, { params }),
  getPending: (params) => api.get('/leaves/pending', { params }),
  getReportBalance: () => api.get('/leaves/report/balance'),
};

// Payroll
export const payrollAPI = {
  generate: (month) => api.post('/payroll/generate', null, { params: { month } }),
  approve: (id) => api.put(`/payroll/${id}/approve`),
  processPayment: (id) => api.post(`/payroll/${id}/process-payment`),
  save: (payload) => api.post('/payroll/save', payload),
  getByMonth: (month, params) => api.get('/payroll/month', { params: { month, ...params } }),
  getByEmployee: (employeeId) => api.get(`/payroll/employee/${employeeId}`),
  getMyPayslips: () => api.get('/payroll/my-payslips'),
  getSummary: (month) => api.get('/payroll/summary', { params: { month } }),
  getReport: (month) => api.get('/payroll/report', { params: { month } }),
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

// Calendar
export const calendarAPI = {
  getEmployeeCalendar: (employeeId, year, month) =>
    api.get(`/calendar/employee/${employeeId}`, { params: { year, month } }),
  getAdminCalendar: (year, month) =>
    api.get('/calendar/admin', { params: { year, month } }),
  getHolidays: (year) => api.get('/calendar/holidays', { params: { year } }),
  addHoliday: (data) => api.post('/calendar/holidays', data),
  updateHoliday: (id, data) => api.put(`/calendar/holidays/${id}`, data),
  deleteHoliday: (id) => api.delete(`/calendar/holidays/${id}`),
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
