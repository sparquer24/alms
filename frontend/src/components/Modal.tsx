import React, { useState, useEffect } from "react";

interface ModalProps<T> {
  data: T | null;
  onClose: () => void;
  onSave: (data: T) => void;
  title: string;
  fields: Array<{
    name: keyof T;
    label: string;
    type: "text" | "textarea";
    required?: boolean;
  }>;
}

const Modal = <T extends Record<string, any>>({ data, onClose, onSave, title, fields }: ModalProps<T>) => {
  const [formData, setFormData] = useState<T>(data || ({} as T));

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 id="modal-title" className="text-xl font-bold mb-4">
          {title}
        </h2>
        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.name as string} className="mb-4">
              <label
                htmlFor={field.name as string}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {field.label}
              </label>
              {field.type === "text" ? (
                <input
                  id={field.name as string}
                  type="text"
                  name={field.name as string}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={field.required}
                />
              ) : (
                <textarea
                  id={field.name as string}
                  name={field.name as string}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={field.required}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;
