// CommonForm.jsx
import { useState, useEffect } from "react";

export default function CommonForm({ title,  fields = [], initialData, validate, onSubmit }) {
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
        const validationErrors = validate(form);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {title && (
                <h1 className="text-xl font-semibold text-center mb-4 font-heading">
                    {title}
                </h1>
            )}

            {fields.map((field) => (
                <div key={field.name}>
                    <label className="block mb-1">{field.label}</label>
                    <input
                        name={field.name}
                        type={field.type || "text"}
                        value={form[field.name] || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded bg-gray-800 text-white"
                    />
                    {errors[field.name] && (
                        <p className="text-red-500">{errors[field.name]}</p>
                    )}
                </div>
            ))}

            <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Save
            </button>
        </form>
    );
}
