import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, X } from 'lucide-react';
import { employeeAPI } from '../api/services';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { statusBadge } from '../components/ui/Badge';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';

const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Sales', 'Marketing', 'Operations', 'IT', 'Legal', 'Admin'];
const STATUSES = ['ACTIVE', 'RESIGNATION_SUBMITTED', 'NOTICE_PERIOD', 'EXITED', 'TERMINATED'];
const ROLES = ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'];

const emptyForm = {
  firstName: '', lastName: '', emailId: '', contactNumber1: '', department: '', designation: '',
  basicEmployeeSalary: '', role: 'EMPLOYEE', joiningDate: '',
  gender: '', dateOfBirth: '', city: '', state: '', houseNo: '',
  panNumber: '', accountNo: '', ifscCode: '', bankName: '', bankBranch: '',
  password: '',
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (search) {
        res = await employeeAPI.search(search);
        setEmployees(Array.isArray(res.data) ? res.data : res.data?.content || []);
        setTotalPages(0);
      } else if (filterDept) {
        res = await employeeAPI.filterByDepartment(filterDept);
        setEmployees(Array.isArray(res.data) ? res.data : res.data?.content || []);
        setTotalPages(0);
      } else if (filterStatus) {
        res = await employeeAPI.filterByStatus(filterStatus);
        setEmployees(Array.isArray(res.data) ? res.data : res.data?.content || []);
        setTotalPages(0);
      } else {
        res = await employeeAPI.getAll({ page, size: 15 });
        const data = res.data;
        setEmployees(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      }
    } catch { setEmployees([]); } finally { setLoading(false); }
  }, [search, filterDept, filterStatus, page]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const openEdit = (emp) => { setSelected(emp); setForm({ ...emptyForm, ...emp }); setShowModal(true); };
  const openCreate = () => { setSelected(null); setForm(emptyForm); setShowModal(true); };
  const openView = (emp) => { setSelected(emp); setViewModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (selected?.id) {
        await employeeAPI.update(selected.id, form);
      } else {
        await employeeAPI.register(form);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this employee?')) return;
    await employeeAPI.delete(id);
    fetchEmployees();
  };

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const columns = [
    { key: 'id', label: '#', render: (_, r) => <span className="text-slate-400 text-xs">{r.id}</span> },
    {
      key: 'name', label: 'Employee', render: (_, r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold shrink-0">
            {((r.firstName || r.name || '?')[0]).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-800">{r.firstName} {r.lastName}</p>
            <p className="text-xs text-slate-400">{r.emailId}</p>
          </div>
        </div>
      ),
    },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'basicEmployeeSalary', label: 'Salary', render: (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—' },
    {
      key: 'employmentStatus', label: 'Status',
      render: (v) => <Badge variant={statusBadge(v)}>{v?.replace(/_/g, ' ') || '—'}</Badge>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openView(r)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Eye size={15} /></button>
          <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"><Edit2 size={15} /></button>
          <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employees</h2>
          <p className="text-sm text-slate-500">{employees.length} records found</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Add Employee</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="flex flex-wrap gap-3 py-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by name, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setFilterDept(''); setFilterStatus(''); }}
            />
          </div>
          <select
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterDept}
            onChange={(e) => { setFilterDept(e.target.value); setSearch(''); setFilterStatus(''); }}
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setSearch(''); setFilterDept(''); }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {(search || filterDept || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterDept(''); setFilterStatus(''); }} className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-red-500">
              <X size={14} /> Clear
            </button>
          )}
        </CardBody>
      </Card>

      <Card>
        <Table columns={columns} data={employees} loading={loading} emptyMessage="No employees found" />
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100">
            <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="text-sm text-slate-600">Page {page + 1} of {totalPages}</span>
            <Button size="sm" variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selected?.id ? 'Edit Employee' : 'Add New Employee'} size="xl">
        <form onSubmit={handleSave} className="space-y-5">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" required value={form.firstName} onChange={(e) => f('firstName', e.target.value)} />
            <Input label="Last Name" required value={form.lastName} onChange={(e) => f('lastName', e.target.value)} />
            <Input label="Email ID" type="email" required value={form.emailId} onChange={(e) => f('emailId', e.target.value)} />
            <Input label="Mobile Number" value={form.contactNumber1} onChange={(e) => f('contactNumber1', e.target.value)} placeholder="6-9 followed by 9 digits" />
            <Select label="Department" required value={form.department} onChange={(e) => f('department', e.target.value)}>
              <option value="">Select Department</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </Select>
            <Input label="Designation" required value={form.designation} onChange={(e) => f('designation', e.target.value)} />
            <Input label="Basic Salary (₹)" type="number" min="0" value={form.basicEmployeeSalary} onChange={(e) => f('basicEmployeeSalary', e.target.value)} />
            <Select label="Role" required value={form.role} onChange={(e) => f('role', e.target.value)}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </Select>
            <Input label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => f('joiningDate', e.target.value)} />
            <Select label="Gender" value={form.gender} onChange={(e) => f('gender', e.target.value)}>
              <option value="">Select</option>
              <option>MALE</option><option>FEMALE</option><option>OTHER</option>
            </Select>
            <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => f('dateOfBirth', e.target.value)} />
            {!selected?.id && (
              <Input label="Password" type="password" required value={form.password} onChange={(e) => f('password', e.target.value)} placeholder="Min 8 characters" />
            )}
          </div>
          <hr className="border-slate-200" />
          <p className="text-sm font-semibold text-slate-600">Address</p>
          <div className="grid grid-cols-3 gap-4">
            <Input label="House No / Street" value={form.houseNo} onChange={(e) => f('houseNo', e.target.value)} />
            <Input label="City" value={form.city} onChange={(e) => f('city', e.target.value)} />
            <Input label="State" value={form.state} onChange={(e) => f('state', e.target.value)} />
          </div>
          <hr className="border-slate-200" />
          <p className="text-sm font-semibold text-slate-600">Banking & Identification</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="PAN Number" value={form.panNumber} onChange={(e) => f('panNumber', e.target.value)} />
            <Input label="Bank Account No" value={form.accountNo} onChange={(e) => f('accountNo', e.target.value)} />
            <Input label="IFSC Code" value={form.ifscCode} onChange={(e) => f('ifscCode', e.target.value)} placeholder="e.g. SBIN0001234" />
            <Input label="Bank Name" value={form.bankName} onChange={(e) => f('bankName', e.target.value)} />
            <Input label="Bank Branch" value={form.bankBranch} onChange={(e) => f('bankBranch', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{selected?.id ? 'Update Employee' : 'Create Employee'}</Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Employee Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold">
                {((selected.firstName || '?')[0]).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selected.firstName} {selected.lastName}</h3>
                <p className="text-sm text-slate-500">{selected.designation} · {selected.department}</p>
                <Badge variant={statusBadge(selected.employmentStatus)}>{selected.employmentStatus?.replace(/_/g, ' ')}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Email', selected.emailId], ['Mobile', selected.contactNumber1],
                ['Salary', selected.basicEmployeeSalary ? `₹${Number(selected.basicEmployeeSalary).toLocaleString('en-IN')}` : '—'],
                ['Joining Date', selected.joiningDate ? new Date(selected.joiningDate).toLocaleDateString('en-IN') : '—'],
                ['Role', selected.role], ['Gender', selected.gender],
                ['City', selected.city], ['State', selected.state],
                ['PAN', selected.panNumber], ['Bank Acc', selected.accountNo],
                ['IFSC', selected.ifscCode], ['Bank', selected.bankName],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 font-medium">{k}</p>
                  <p className="text-slate-700 mt-0.5">{v || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
