"use client";
import React, { useState } from 'react';
import { IoMdMale, IoMdFemale } from 'react-icons/io';
import { Input } from '../elements/Input';
import { useRouter } from 'next/router';
import FormFooter from '../elements/footer';
import DateOfBirth from '../elements/DateOfBirth';

const initialState = {
	aliceAckNumber: '',
	firstName: '',
	middleName: '',
	lastName: '',
	applicationFilledBy: '',
	parentSpouseName: '',
	sex: '',
	placeOfBirth: '',
	dobChristianEra: '',
	pan: '',
	aadhar: '',
	dobWords: '',
};

const PersonalInformation: React.FC = () => {
	const [form, setForm] = useState(initialState);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<form className="p-6">
			<h2 className="text-xl font-bold mb-4">Personal Information</h2>
			{/* <div className="grid grid-cols-2 gap-6 mb-4"> */}
				<div className='mb-12'>
					<Input
					className='w-1/3'
					label="Alice Acknowledgement Number"
					name="aliceAckNumber"
					value={form.aliceAckNumber}
					onChange={handleChange}
					//placeholder="Enter number"
				/>
				</div>
				<div className="grid  grid-cols-4 gap-10 mb-4">
				<Input
					label="1. Applicant First Name"
					name="firstName"
					value={form.firstName}
					onChange={handleChange}
					required
					//placeholder="Enter first name"
				/>
				<Input
					label="Applicant Middle Name"
					name="middleName"
					value={form.middleName}
					onChange={handleChange}
					//placeholder="Enter middle name"
				/>
				<Input
					label="Applicant Last Name"
					name="lastName"
					value={form.lastName}
					onChange={handleChange}
					//placeholder="Enter last name"
				/>
				   <div className="flex flex-col">
					   <label htmlFor="applicationFilledBy" className="block text-sm font-medium text-gray-700 mb-1">
						   Application filled by<br/>
						   <span className="text-xs text-gray-400 ml-1">(Zonal Superintendent name)</span>
					   </label>
					   <Input
						   label=""
						   name="applicationFilledBy"
						   value={form.applicationFilledBy}
						   onChange={handleChange}
						//    //placeholder="Self/Agent/Other"
					   />
				   </div>
				<Input
					label="2. Parent/ Spouse Name"
					name="parentSpouseName"
					value={form.parentSpouseName}
					onChange={handleChange}
					//placeholder="Enter parent/spouse name"
				/>
				<div className="flex flex-col">
					<span className="block text-sm font-medium text-gray-700 mb-1">3. Sex</span>
					<div className="flex items-center gap-6">
						<label className="flex items-center gap-2">
							<input
								type="radio"
								name="sex"
								value="Male"
								checked={form.sex === 'Male'}
								onChange={handleChange}
							/>
							Male
							<IoMdMale className="text-xl" /> 
						</label>
						<label className="flex items-center gap-2">
							<input
								type="radio"
								name="sex"
								value="Female"
								checked={form.sex === 'Female'}
								onChange={handleChange}
							/>
							 Female
							<IoMdFemale className="text-xl" />
						</label>
					</div>
				</div>
				<Input
					label="4. Place of Birth (Nativity)"
					name="placeOfBirth"
					value={form.placeOfBirth}
					onChange={handleChange}
					//placeholder="Enter place of birth"
				/>
				   <div className="flex flex-col">
					   <label htmlFor="dobChristianEra" className="block text-sm font-medium text-gray-700 mb-1">
						   5. Date of birth in Christian era<br/>
						   <span className="text-xs text-gray-400 ml-1">(Must be 21 years old on the date of application)</span>
					   </label>
					   <Input
						   label=""
						   name="dobChristianEra"
						   type="date"
						   value={form.dobChristianEra}
						   onChange={handleChange}
						   //placeholder="mm/dd/yyyy"
					   />
				   </div>
				<Input
					label="6. PAN"
					name="pan"
					value={form.pan}
					onChange={handleChange}
					//placeholder="10-CHARACTER PAN NUMBER"
					maxLength={10}
				/>
				<Input
					label="7. Aadhar Number"
					name="aadhar"
					value={form.aadhar}
					onChange={handleChange}
					//placeholder="12-digit Aadhar number"
					maxLength={12}
				/>
				<Input
					label="Date of Birth in Words"
					name="dobWords"
					value={form.dobWords}
					onChange={handleChange}
					//placeholder="Enter DOB in words"
				/>
			</div>
           <FormFooter/>
		</form>
	);
};

export default PersonalInformation;
