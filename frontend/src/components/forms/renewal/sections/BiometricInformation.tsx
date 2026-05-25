import React from 'react';
import { Select } from '../../elements/Select';
import { Button } from '../../elements/Button';
import { FileUpload } from '../../elements/FileUpload';

const BiometricInformation: React.FC<{ formData:any; onChange:(e:any)=>void; onFileChange:(name:string,file:File|null)=>void }> = ({
	formData,
	onChange,
	onFileChange,
}) => {
	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<div>
					<div className='flex items-center justify-between'>
						<p className='text-sm font-medium text-gray-700'>Signature / Thumb Impression</p>
						<Button type='button' size='sm' variant='secondary'>Settings</Button>
					</div>

					<div className='mt-2'>
						<Select
							label='Select Hand & Finger'
							name='selectedFingerprint'
							value={formData.selectedFingerprint || 'RIGHT_THUMB'}
							onChange={onChange}
							options={[
								{ value: 'RIGHT_THUMB', label: 'Right Hand Thumb' },
								{ value: 'LEFT_THUMB', label: 'Left Hand Thumb' },
							]}
						/>
						<p className='text-xs text-red-600 mt-1'>Only thumb fingers are allowed.</p>
					</div>

					<div className='mt-3 flex items-center gap-2'>
						<Button type='button' size='sm' variant='secondary'>Scan Fingerprint</Button>
						<span className='text-xs text-gray-500'>Mantra SDK not initialized</span>
					</div>
				</div>

				<div>
					<p className='text-sm font-medium text-gray-700'>Iris Scan</p>
					<div className='mt-2 flex items-center gap-2'>
						<Button type='button' size='sm' variant='secondary'>Scan Iris</Button>
						<span className='text-xs text-gray-500'>Iris scanning will be available soon</span>
					</div>
				</div>
			</div>

			<div>
				<p className='text-sm font-medium text-gray-700'>Photograph</p>
				<p className='text-xs text-gray-500 mt-1'>Capture the applicant&apos;s live photo using webcam or upload an existing photograph.</p>

				<div className='mt-2'>
					<button
						type='button'
						className='w-full rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700'
					>
						Use Webcam
					</button>
				</div>

				<FileUpload
					className='mt-2'
					label='Or upload photograph'
					name='photographUploaded'
					variant='browseCard'
					onFileSelect={(file) => onFileChange('photographUploaded', file)}
					uploaded={Boolean(formData?.photographUploaded)}
					fileName={formData?.photographUploaded?.name}
				/>
			</div>
		</div>
	);
};

export default BiometricInformation;

