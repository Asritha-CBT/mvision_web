import { useState } from "react";

export default function Form({ initialData, onSubmit }) {
  const [form, setForm] = useState(initialData);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1">Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded bg-gray-800 text-white"
        />
      </div>
      <div>
        <label className="block mb-1">Department</label>
        <input
          name="department"
          value={form.department}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded bg-gray-800 text-white"
        />
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
