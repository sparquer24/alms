"use client";
import React, { useState, useEffect } from 'react';
import { Input } from '../elements/Input';
import { Checkbox } from '../elements/Checkbox';
import FormFooter from '../elements/footer';
import { WeaponsService, Weapon } from '../../../services/weapons';

const initialState = {
	needForLicense: '',
	armsOption: '',
	armsType: '',
	areaDistrict: false,
	areaState: false,
	areaIndia: false,
};

const LicenseDetails = () => {
   const [form, setForm] = useState(initialState);
   const [weapons, setWeapons] = useState<Weapon[]>([]);
   const [loadingWeapons, setLoadingWeapons] = useState(false);
   const [weaponsError, setWeaponsError] = useState<string>('');

   // Fetch weapons on component mount
   useEffect(() => {
       const fetchWeapons = async () => {
           try {
               setLoadingWeapons(true);
               setWeaponsError('');
               const weaponsData = await WeaponsService.getAll();
               console.log('Fetched weapons for LicenseDetails:', weaponsData);
               setWeapons(weaponsData);
           } catch (error) {
               console.error('Error fetching weapons:', error);
               setWeaponsError('Failed to load weapons. Please refresh the page.');
           } finally {
               setLoadingWeapons(false);
           }
       };

       fetchWeapons();
   }, []);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
	   const { name, value, type } = e.target;
	   if (type === 'checkbox' && 'checked' in e.target) {
		   setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
	   } else {
		   setForm((prev) => ({ ...prev, [name]: value }));
	   }
   };

	return (
		<form className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
			License Details
		</h2>
		<div className="grid grid-cols-2 gap-8">
			{/* Left column: 15 above 16 */}
			<div className="flex flex-col gap-8">
				{/* 15. Need for license */}
				<div className="mb-4">
					<label className="block text-sm font-medium text-gray-700 mb-1">
						15. Need for license (see note 1 below)
					</label>
					<select
						name="needForLicense"
						value={form.needForLicense}
						onChange={handleChange}
						className="border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:ring-0 w-full py-2 bg-transparent"
					>
						<option value="">Select reason</option>
						<option value="self-protection">Self-Protection</option>
						<option value="sports">Sports</option>
						<option value="heirloom">Heirloom Policy</option>
					</select>
				</div>
				{/* 16. Description of arms */}
				<div className="mb-4">
					<div className="font-medium mb-2">16. Description of arms for which license is being sought</div>
					<div className="mb-2">(a) Select any of the options</div>
					<div className="flex gap-6 mb-2">
						<label className="flex items-center gap-2">
							<input type="radio" name="armsOption" value="restricted" checked={form.armsOption === 'restricted'} onChange={handleChange} /> Restricted
						</label>
						<label className="flex items-center gap-2">
							<input type="radio" name="armsOption" value="permissible" checked={form.armsOption === 'permissible'} onChange={handleChange} /> Permissible
						</label>
					</div>
					<div className="mb-2">(b) Select weapon type</div>
					{loadingWeapons && (
						<div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
							<div className="flex items-center">
								<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
								<span className="text-blue-600 text-sm">Loading weapons...</span>
							</div>
						</div>
					)}
					{weaponsError && (
						<div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md">
							<div className="flex items-center">
								<span className="text-red-600 text-sm">⚠️ {weaponsError}</span>
							</div>
						</div>
					)}
					<select
						name="armsType"
						value={form.armsType}
						onChange={handleChange}
						disabled={loadingWeapons}
						className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
					>
						<option value="">
							{loadingWeapons ? "Loading weapons..." : weaponsError ? "Please refresh to load weapons" : "Select weapon type"}
						</option>
						{!weaponsError && weapons.map(weapon => (
							<option key={weapon.id} value={weapon.name.toLowerCase()}>
								{weapon.name}
							</option>
						))}
						{weaponsError && (
							<option value="" disabled>Unable to load weapons</option>
						)}
					</select>
				</div>
			</div>
			{/* Right column: 17 above 18 */}
			<div className="flex flex-col gap-8">
				{/* 17. Areas within which applicant wishes to carry arms */}
				<div className="mb-4">
					<div className="font-medium mb-1">17. Areas within which applicant wishes to carry arms</div>
					<div className="text-xs text-gray-600 mb-1">Tick any of the options</div>
					<div className="flex gap-6">
						<Checkbox label="District" name="areaDistrict" checked={form.areaDistrict} onChange={(checked) => setForm((prev) => ({ ...prev, areaDistrict: checked }))} />
						<Checkbox label="State" name="areaState" checked={form.areaState} onChange={(checked) => setForm((prev) => ({ ...prev, areaState: checked }))} />
						<Checkbox label="Throughout India" name="areaIndia" checked={form.areaIndia} onChange={(checked) => setForm((prev) => ({ ...prev, areaIndia: checked }))} />
					</div>
				</div>
				{/* 18. Claims for special consideration */}
				<div className="mb-4">
					<label className="block font-medium mb-1">18. Claims for special consideration for obtaining the licence, if any</label>
					<span className="block italic text-xs text-gray-500 mb-2">(attach documentary evidence)</span>
					<textarea
						name="specialClaims"
						className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
						rows={2}
						placeholder="Enter your claim (if any)"
					/>
					<input
						type="file"
						name="specialClaimsEvidence"
						className="block w-full text-sm text-gray-700 border border-gray-300 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
					/>
				</div>
			</div>
		</div>
			<FormFooter/>

		</form>
	);
};

export default LicenseDetails;
