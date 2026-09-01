import React from 'react';
import DateOfBirth from './DateOfBirth';
interface DobProps {
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	name?: string;
	error?: string;
	required?: boolean;
}

const Dob: React.FC<DobProps> = ({ value, onChange, name = 'dob', error, required }) => {
	return (
		<div className="flex flex-col w-full max-w-xs">
			{/* <label htmlFor={name} className="text-sm font-medium text-gray-700">
				Date of birth in Christian era
			</label>
			<span className="text-xs text-gray-500 mb-1">(Must be 21 years old on the date of application)</span>
			<div className="relative">
				<input
					type="date"
					id={name}
					name={name}
					value={value}
					onChange={onChange}
					required={required}
					className="block w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-2 pl-3 pr-10 text-sm outline-none"
				/>
			</div> */}
			<DateOfBirth
				value={value}
				onChange={onChange}
				name={name}
				error={error}
				required={required}
			/>
			{error && <span className="text-xs text-red-500 mt-1">{error}</span>}
		</div>
	);
};

export default Dob;
