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
	weaponId: 0, // Add weapon ID for API integration
	areaDistrict: false,
	areaState: false,
	areaIndia: false,
};

const LicenseDetails = () => {
   const [form, setForm] = useState(initialState);
   const [weapons, setWeapons] = useState<Weapon[]>([]);
   const [loadingWeapons, setLoadingWeapons] = useState(false);

   // Fetch weapons on component mount
   useEffect(() => {
	   const loadWeapons = async () => {
		   try {
			   setLoadingWeapons(true);
			   const list = await WeaponsService.getAll();
			   const items = (list || []).map(w => ({ id: w.id, name: w.name })) as Weapon[];
			   setWeapons(items);
		   } catch (e) {
			   console.error('Error loading weapons list', e);
			   // Fallback weapons if API fails
			   setWeapons([
				   { id: 1, name: 'Revolver' },
				   { id: 2, name: 'Pistol' },
				   { id: 3, name: 'Rifle' },
				   { id: 4, name: 'Shotgun' },
				   { id: 5, name: 'Airgun' },
			   ]);
		   } finally {
			   setLoadingWeapons(false);
		   }
	   };
	   loadWeapons();
   }, []);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
	   const { name, value, type } = e.target;
	   if (type === 'checkbox' && 'checked' in e.target) {
		   setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
	   } else {
		   setForm((prev) => ({ ...prev, [name]: value }));
	   }
   };

   const handleWeaponChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
	   const weaponId = Number(e.target.value);
	   const selectedWeapon = weapons.find(w => w.id === weaponId);
	   setForm((prev) => ({ 
		   ...prev, 
		   weaponId: weaponId,
		   armsType: selectedWeapon?.name || ''
	   }));
   };

	return (
		<form className="p-6">
        <h2 className="text-xl font-bold mb-4">License Details</h2>
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
					<select
						name="weaponId"
						value={form.weaponId}
						onChange={handleWeaponChange}
						className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
						disabled={loadingWeapons}
					>
						<option value={0}>{loadingWeapons ? 'Loading weapons...' : 'Select weapon type'}</option>
						{weapons.map(weapon => (
							<option key={weapon.id} value={weapon.id}>{weapon.name}</option>
						))}
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
