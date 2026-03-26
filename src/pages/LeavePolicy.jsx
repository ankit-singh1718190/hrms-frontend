import { useEffect, useState } from "react";
import { leavePolicyAPI } from "../api/services";

const employeeTypes = ["FULL_TIME", "CONTRACT", "TEMPORARY", "INTERN"];
const leaveTypes = ["Planned", "Sick"];

export default function LeavePolicy() {
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState({
    employeeType: "FULL_TIME",
    leaveType: "Planned",
    totalDays: "",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);

  // 🔥 GET ALL
  const loadData = async () => {
    try {
      const res = await leavePolicyAPI.getAll();
      setPolicies(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔥 ADD + UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await leavePolicyAPI.update(editingId, form);
        alert("✅ Updated successfully");
      } else {
        await leavePolicyAPI.create(form);
        alert("✅ Added successfully");
      }

      resetForm();
      loadData();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Error occurred";
      alert(msg);
    }
  };

  // 🔥 DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this policy?")) return;

    try {
      await leavePolicyAPI.delete(id);
      alert("Deleted successfully");
      loadData();
    } catch (err) {
      alert("Delete failed");
    }
  };

  //  EDIT (fill form)
  const handleEdit = (p) => {
    setForm({
      employeeType: p.employeeType,
      leaveType: p.leaveType,
      totalDays: p.totalDays,
      description: p.description || "",
    });
    setEditingId(p.id);
  };

  const resetForm = () => {
    setForm({
      employeeType: "FULL_TIME",
      leaveType: "Planned",
      totalDays: "",
      description: "",
    });
    setEditingId(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Leave Policy</h2>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-4 gap-4"
      >
        <select
          value={form.employeeType}
          onChange={(e) =>
            setForm({ ...form, employeeType: e.target.value })
          }
          className="border p-2 rounded"
        >
          {employeeTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <select
          value={form.leaveType}
          onChange={(e) =>
            setForm({ ...form, leaveType: e.target.value })
          }
          className="border p-2 rounded"
        >
          {leaveTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Days"
          value={form.totalDays}
          onChange={(e) =>
            setForm({ ...form, totalDays: e.target.value })
          }
          className="border p-2 rounded"
          required
        />

        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          className="border p-2 rounded"
        />

        <div className="col-span-4 flex gap-3">
          <button className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
            {editingId ? "Update Policy" : "Add Policy"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 bg-gray-200 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Employee Type</th>
              <th className="p-3 text-left">Leave Type</th>
              <th className="p-3 text-left">Days</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {policies.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4 text-gray-500">
                  No policies found
                </td>
              </tr>
            ) : (
              policies.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.employeeType}</td>
                  <td className="p-3">{p.leaveType}</td>
                  <td className="p-3">{p.totalDays}</td>
                  <td className="p-3">{p.description}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded"
                    >
                      Delete
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