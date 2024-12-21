import React from "react";

// TextInput Component
interface TextInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: "text" | "email" | "password";
}

const TextInput: React.FC<TextInputProps> = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block mb-1 font-medium">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

// RadioGroup Component
interface RadioGroupProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  selected: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ label, name, options, selected, onChange }) => (
  <div>
    <label className="block mb-1 font-medium">{label}</label>
    <div className="space-x-4">
      {options.map((option) => (
        <label key={option.value} className="inline-flex items-center space-x-2">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selected === option.value}
            onChange={onChange}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  </div>
);

// CheckboxGroup Component
interface CheckboxGroupProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ label, name, options, selected, onChange }) => (
  <div>
    <label className="block mb-1 font-medium">{label}</label>
    <div className="space-y-1">
      {options.map((option) => (
        <label key={option.value} className="inline-flex items-center space-x-2">
          <input
            type="checkbox"
            name={name}
            value={option.value}
            checked={selected.includes(option.value)}
            onChange={onChange}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  </div>
);

// FileInput Component
interface FileInputProps {
  label: string;
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileInput: React.FC<FileInputProps> = ({ label, name, onChange }) => (
  <div>
    <label className="block mb-1 font-medium">{label}</label>
    <input type="file" name={name} onChange={onChange} className="block" />
  </div>
);

// TextArea Component
interface TextAreaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextArea: React.FC<TextAreaProps> = ({ label, name, value, onChange }) => (
  <div>
    <label className="block mb-1 font-medium">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

// DateInput Component
interface DateInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DateInput: React.FC<DateInputProps> = ({ label, name, value, onChange }) => (
  <div>
    <label className="block mb-1 font-medium">{label}</label>
    <input
      type="date"
      name={name}
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

// Exporting Components
export { TextInput, RadioGroup, CheckboxGroup, FileInput, TextArea, DateInput };
