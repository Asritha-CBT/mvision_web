// Form.jsx
import { useState, useEffect } from "react";

export default function Form({ initialData, onSubmit }) {
  const [form, setForm] = useState(initialData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let tempErrors = {};

    if (!form.name.trim()) tempErrors.name = "Name is required";
    if (!form.department.trim()) tempErrors.department = "Department is required";

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* NAME */}
      <div>
        <label className="block mb-1">Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded bg-gray-800 text-white"
        />
        {errors.name && <p className="text-red-500">{errors.name}</p>}
      </div>

      {/* DEPARTMENT */}
      <div>
        <label className="block mb-1">Department</label>
        <input
          name="department"
          value={form.department}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded bg-gray-800 text-white"
        />
        {errors.department && <p className="text-red-500">{errors.department}</p>}
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save
      </button>
    </form>
  );
}
