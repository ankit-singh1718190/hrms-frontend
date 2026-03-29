import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { employeeAPI } from '../api/services';
import { Plus, Search, Eye, Edit2, Trash2, X, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react';

const unwrap = (res) => res?.data?.data;

// ─── Generic field renderer ────────────────────────────────────────────────────
function Field({ label, name, type = 'text', options, form, setForm, disabled }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {options ? (
        <select
          value={form[name] ?? ''}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          disabled={disabled}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">Select…</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[name] ?? ''}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          disabled={disabled}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
        />
      )}
    </div>
  );
}

// ─── Reporting Manager dropdown ────────────────────────────────────────────────
function ReportingManagerField({ form, setForm, managers, loadingManagers, disabled }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        <span className="flex items-center gap-1.5">
          <UserCheck size={12} className="text-indigo-500" />
          Reporting Manager
        </span>
      </label>
      <select
        value={form.reportingManager ?? ''}
        onChange={e => setForm(f => ({ ...f, reportingManager: e.target.value }))}
        disabled={disabled || loadingManagers}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">
          {loadingManagers ? 'Loading managers…' : 'No reporting manager'}
        </option>
        {managers.map(m => (
          <option key={m.id} value={m.employeeId}>
            {m.fullName} — {m.employeeId} ({m.designation || m.role})
          </option>
        ))}
      </select>
      {managers.length === 0 && !loadingManagers && (
        <p className="text-xs text-amber-600 mt-1">
          No managers found. Add an employee with role MANAGER first.
        </p>
      )}
    </div>
  );
}

// ─── Default form state ────────────────────────────────────────────────────────
const EMPTY = {
  employeeId: '', employeeType: 'FULL_TIME',
  prefix: '', firstName: '', lastName: '', emailId: '', password: '',
  contactNumber1: '', dateOfBirth: '', gender: '', department: '', designation: '',
  joiningDate: '', basicEmployeeSalary: '', role: 'EMPLOYEE', employmentStatus: 'ACTIVE',
  nationality: 'Indian', maritalStatus: '', fatherName: '', motherName: '',
  panNumber: '', aadharNumber: '', accountNo: '', bankName: '', bankBranch: '', ifscCode: '',
  houseNo: '', city: '', state: '', higherQualification: '', previousCompanyName: '',
  previousCtc: '', previousExperience: '', workEmail: '',
  reportingManager: '',   // ← new field
};

export default function Employees() {
  const { user, isAdmin, isHR, isManager } = useAuth();

  const [employees,     setEmployees]     = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(0);
  const [search,        setSearch]        = useState('');
  const [deptFilter,    setDeptFilter]    = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [departments,   setDepartments]   = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  const [showModal,  setShowModal]  = useState(false);
  const [modalMode,  setModalMode]  = useState('create');
  const [selected,   setSelected]   = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');

  // ── Reporting managers list ─────────────────────────────────────────────────
  const [managers,        setManagers]        = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const pageSize = 10;

  // ── Fetch managers (MANAGER + HR + ADMIN roles) when modal opens ────────────
  const fetchManagers = async () => {
    setLoadingManagers(true);
    try {
      const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';

      // Fetch MANAGER, HR, ADMIN roles in parallel — all can act as reporting managers
      const [mgrRes, hrRes, adminRes] = await Promise.allSettled([
        fetch(`${base}/api/employee/filter/role?role=MANAGER`,  { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/api/employee/filter/role?role=HR`,       { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/api/employee/filter/role?role=ADMIN`,    { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const extract = async (settled) => {
        if (settled.status !== 'fulfilled' || !settled.value.ok) return [];
        const json = await settled.value.json();
        return Array.isArray(json.data) ? json.data : [];
      };

      const [mgrs, hrs, admins] = await Promise.all([
        extract(mgrRes), extract(hrRes), extract(adminRes),
      ]);

      // Merge & deduplicate by employee db id
      const seen = new Set();
      const all = [...mgrs, ...hrs, ...admins].filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id); return true;
      });

      setManagers(all);
    } catch {
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  // ── Fetch employees ─────────────────────────────────────────────────────────
  const fetchEmployees = async (pg = page) => {
    setLoading(true); setError('');
    try {
      let res;
      if (isManager) {
        // Manager can only see their reportees (backend should honor this too)
        res = await employeeAPI.getAll({ reportingManager: user?.employeeId, page: pg, size: pageSize, sortBy: 'id', dir: 'asc' });
      } else if (search.trim()) {
        res = await employeeAPI.search(search.trim());
      } else if (deptFilter) {
        res = await employeeAPI.filterByDepartment(deptFilter);
      } else if (statusFilter) {
        res = await employeeAPI.filterByStatus(statusFilter);
      } else {
        res = await employeeAPI.getAll({ page: pg, size: pageSize, sortBy: 'id', dir: 'asc' });
      }
      const data = unwrap(res);
      const list = Array.isArray(data) ? data : (data?.content ?? []);
      setEmployees(list);
      setTotal(Array.isArray(data) ? data.length : (data?.totalElements ?? 0));
    } catch (e) {
      setError(`Failed to load employees: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    employeeAPI.getDepartments().then(r => {
      const d = unwrap(r);
      if (Array.isArray(d)) setDepartments(d);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchEmployees(0); setPage(0); }, [search, deptFilter, statusFilter]);
  useEffect(() => { fetchEmployees(page); }, [page]);

  const openCreate = () => {
    setForm(EMPTY); setFormError(''); setModalMode('create'); setShowModal(true);
    fetchManagers();
  };
  const openEdit = (emp) => {
    setForm({ ...EMPTY, ...emp, password: '', workEmail: emp.workEmail || emp.emailId || '', reportingManager: emp.reportingManager ?? '' });
    setFormError(''); setModalMode('edit'); setSelected(emp); setShowModal(true);
    fetchManagers();
  };
  const openView = (emp) => { setSelected(emp); setModalMode('view'); setShowModal(true); };

  // ── Payload builder ─────────────────────────────────────────────────────────
  const buildPayload = (rawForm) => {
    const f = { ...rawForm };
    if (f.workEmail?.trim()) f.emailId = f.workEmail.trim();
    if (f.basicEmployeeSalary === '' || f.basicEmployeeSalary == null) delete f.basicEmployeeSalary;
    else f.basicEmployeeSalary = Number(f.basicEmployeeSalary);
    // Keep reportingManager as-is (employeeId string like "001") or null
    if (!f.reportingManager) f.reportingManager = null;
    Object.keys(f).forEach(k => { if (f[k] === '') f[k] = null; });
    return f;
  };

  const parseError = (e) => {
    if (e.response?.status === 403) return "You don't have permission. Please log in as ADMIN or HR.";
    const data = e.response?.data;
    if (!data) return e.message || 'Something went wrong.';
    if (data.errors && typeof data.errors === 'object') {
      return Object.entries(data.errors).map(([f, m]) => `${f}: ${m}`).join('\n');
    }
    const raw = data.message || '';
    if (raw.startsWith('HV') || raw.includes('No validator')) return 'Invalid data type. Check Salary and other fields.';
    if (raw.includes('Cannot coerce') || raw.includes('JSON parse')) return 'Salary must be a valid number.';
    return raw || 'Failed to save employee.';
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setFormError('');
    if (!form.firstName?.trim())  { setFormError('First Name is required.');  setSaving(false); return; }
    if (!form.lastName?.trim())   { setFormError('Last Name is required.');   setSaving(false); return; }
    if (!form.workEmail?.trim())  { setFormError('Work Email is required.');  setSaving(false); return; }
    if (!form.department?.trim()) { setFormError('Department is required.');  setSaving(false); return; }
    if (!form.designation?.trim()){ setFormError('Designation is required.'); setSaving(false); return; }
    if (modalMode === 'create' && !form.password?.trim()) { setFormError('Password is required.'); setSaving(false); return; }
    if (form.basicEmployeeSalary !== '' && form.basicEmployeeSalary != null && isNaN(Number(form.basicEmployeeSalary))) {
      setFormError('Salary must be a valid number.'); setSaving(false); return;
    }
    try {
      const payload = buildPayload(form);
      if (modalMode === 'create') {
        await employeeAPI.register(payload);
      } else {
        const { password, ...updateData } = payload;
        await employeeAPI.update(selected.id, updateData);
      }
      setShowModal(false);
      fetchEmployees(page);
    } catch (e) {
      setFormError(parseError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp) => {
    if (!confirm(`Delete ${emp.fullName}?`)) return;
    try { await employeeAPI.delete(emp.id); fetchEmployees(page); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  // ── Resolve manager name for display ────────────────────────────────────────
  const getManagerName = (reportingManagerId) => {
    if (!reportingManagerId) return '—';
    const mgr = managers.find(m => m.employeeId === reportingManagerId);
    return mgr ? `${mgr.fullName} (${reportingManagerId})` : reportingManagerId;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} records found</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by name, email..."
              value={search} onChange={e => { setSearch(e.target.value); setDeptFilter(''); setStatusFilter(''); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setSearch(''); setStatusFilter(''); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setSearch(''); setDeptFilter(''); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">All Statuses</option>
            {['ACTIVE', 'INACTIVE', 'RESIGNED', 'TERMINATED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['EMP ID', 'Employee', 'Department', 'Designation', 'Reporting Manager', 'Salary', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="py-3 px-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-slate-400">No employees found</td></tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-indigo-600 font-medium">{emp.employeeId}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{emp.fullName}</div>
                      <div className="text-xs text-slate-400">{emp.emailId}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{emp.department}</td>
                    <td className="py-3 px-3 text-slate-600">{emp.designation}</td>
                    <td className="py-3 px-3">
                      {emp.reportingManager ? (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                          <UserCheck size={10} /> {emp.reportingManager}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {emp.basicEmployeeSalary ? `₹${Number(emp.basicEmployeeSalary).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        emp.employmentStatus === 'ACTIVE'   ? 'bg-green-100 text-green-700' :
                        emp.employmentStatus === 'INACTIVE' ? 'bg-slate-100 text-slate-600' :
                        'bg-red-100 text-red-600'
                      }`}>{emp.employmentStatus}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openView(emp)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Eye size={14} /></button>
                        <button onClick={() => openEdit(emp)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(emp)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft size={14} /></button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                {modalMode === 'create' ? 'Add Employee' : modalMode === 'edit' ? 'Edit Employee' : 'Employee Details'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
            </div>

            {/* ── View mode ── */}
            {modalMode === 'view' ? (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  ['Employee ID',      selected?.employeeId],
                  ['Full Name',        selected?.fullName],
                  ['Email',            selected?.emailId],
                  ['Work Email',       selected?.workEmail],
                  ['Contact',          selected?.contactNumber1],
                  ['Department',       selected?.department],
                  ['Designation',      selected?.designation],
                  ['Role',             selected?.role],
                  ['Status',           selected?.employmentStatus],
                  ['Reporting Manager',selected?.reportingManager || '—'],
                  ['Joining Date',     selected?.joiningDate],
                  ['Date of Birth',    selected?.dateOfBirth],
                  ['Gender',           selected?.gender],
                  ['Salary',           selected?.basicEmployeeSalary ? `₹${Number(selected.basicEmployeeSalary).toLocaleString('en-IN')}` : '—'],
                  ['Bank',             selected?.bankName],
                  ['IFSC',             selected?.ifscCode],
                  ['PAN',              selected?.maskedPan],
                  ['Aadhar',           selected?.maskedAadhar],
                  ['Account No',       selected?.maskedAccount],
                  ['City',             selected?.city],
                  ['State',            selected?.state],
                  ['Created By',       selected?.createdBy],
                ].map(([label, value]) => (
                  <div key={label} className={`bg-slate-50 rounded-lg p-3 ${label === 'Reporting Manager' ? 'border border-indigo-100' : ''}`}>
                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                    <p className={`font-medium ${label === 'Reporting Manager' && value !== '—' ? 'text-indigo-700' : 'text-slate-800'}`}>
                      {label === 'Reporting Manager' && value !== '—'
                        ? `👤 ${value}`
                        : (value || '—')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              /* ── Create / Edit form ── */
              <form onSubmit={handleSave} className="p-6 space-y-5">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm space-y-1">
                    {formError.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                )}

                {/* Basic Info */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Basic Info</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Field label="Prefix"          name="prefix"         options={['Mr', 'Ms', 'Mrs', 'Dr']} form={form} setForm={setForm} />
                    <Field label="First Name *"    name="firstName"      form={form} setForm={setForm} />
                    <Field label="Last Name *"     name="lastName"       form={form} setForm={setForm} />
                    <Field label="Contact Number *" name="contactNumber1" form={form} setForm={setForm} />
                    <Field label="Date of Birth"   name="dateOfBirth"    type="date" form={form} setForm={setForm} />
                    <Field label="Gender"          name="gender"         options={['Male', 'Female', 'Other']} form={form} setForm={setForm} />
                    <Field label="Marital Status"  name="maritalStatus"  options={['Single', 'Married', 'Divorced', 'Widowed']} form={form} setForm={setForm} />
                  </div>
                </div>

                {/* Employment */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Employment</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Field label="Employee ID *"    name="employeeId"       form={form} setForm={setForm} />
                    <Field label="Employee Type *"  name="employeeType"     options={['FULL_TIME', 'CONTRACT', 'TEMPORARY', 'INTERN']} form={form} setForm={setForm} />
                    <Field label="Department *"     name="department"       form={form} setForm={setForm} />
                    <Field label="Designation *"    name="designation"      form={form} setForm={setForm} />
                    <Field label="Role"             name="role"             options={['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']} form={form} setForm={setForm} />
                    <Field label="Status"           name="employmentStatus" options={['ACTIVE', 'INACTIVE', 'RESIGNED', 'TERMINATED']} form={form} setForm={setForm} />
                    <Field label="Joining Date"     name="joiningDate"      type="date" form={form} setForm={setForm} />
                    <Field label="Work Email *"     name="workEmail"        type="email" form={form} setForm={setForm} />
                    {modalMode === 'create' && <Field label="Password *" name="password" type="password" form={form} setForm={setForm} />}
                    <Field label="Salary (₹)"      name="basicEmployeeSalary" type="number" form={form} setForm={setForm} />

                    {/* ── Reporting Manager dropdown — full width ── */}
                    <div className="col-span-2 sm:col-span-3">
                      <div className="border border-indigo-100 rounded-xl p-3 bg-indigo-50/40">
                        <ReportingManagerField
                          form={form}
                          setForm={setForm}
                          managers={managers}
                          loadingManagers={loadingManagers}
                        />
                        {form.reportingManager && (
                          <p className="text-xs text-indigo-600 mt-2 font-medium">
                            ✓ Assigned to: {managers.find(m => m.employeeId === form.reportingManager)?.fullName || form.reportingManager}
                            {' '}-this manager will handle this employee.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Bank Details</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Field label="Bank Name"   name="bankName"   form={form} setForm={setForm} />
                    <Field label="Bank Branch" name="bankBranch" form={form} setForm={setForm} />
                    <Field label="Account No"  name="accountNo"  form={form} setForm={setForm} />
                    <Field label="IFSC Code"   name="ifscCode"   form={form} setForm={setForm} />
                  </div>
                </div>

                {/* Identity */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Identity</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Field label="PAN Number"    name="panNumber"       form={form} setForm={setForm} />
                    <Field label="Aadhar Number" name="aadharNumber"    form={form} setForm={setForm} />
                    <Field label="Passport"      name="passportNumber"  form={form} setForm={setForm} />
                    <Field label="Nationality"   name="nationality"     form={form} setForm={setForm} />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Address</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Field label="House No" name="houseNo" form={form} setForm={setForm} />
                    <Field label="City"     name="city"    form={form} setForm={setForm} />
                    <Field label="State"    name="state"   form={form} setForm={setForm} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-60">
                    {saving ? 'Saving…' : modalMode === 'create' ? 'Add Employee' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
