"use client";
import React, { useState, useEffect } from 'react';
import FormFooter from '../elements/footer';
import { biometricService } from '@/services/biometricService';
import { BiometricResponse, BiometricType } from '@/types/biometric';

interface BiometricData {
	signature: BiometricResponse | null;
	iris: BiometricResponse | null;
	photograph: BiometricResponse | null;
}

const initialState: BiometricData = {
	signature: null,
	iris: null,
	photograph: null,
};

const BiometricInformation = () => {
	const [form, setForm] = useState<BiometricData>(initialState);
	const [loading, setLoading] = useState<BiometricType | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [bridgeStatus, setBridgeStatus] = useState<boolean | null>(null);
	const [showManualUpload, setShowManualUpload] = useState(false);

	// Check bridge server status on mount
	useEffect(() => {
		checkBridgeHealth();
	}, []);

	const checkBridgeHealth = async () => {
		const isHealthy = await biometricService.checkHealth();
		setBridgeStatus(isHealthy);
		
		if (!isHealthy) {
			console.warn('Bridge server not available - falling back to manual upload');
		} else {
			// Log detailed device status for debugging
			try {
				const response = await fetch('http://localhost:3030/health');
				const healthData = await response.json();
				console.log('Bridge Health Check:', {
					rdservice: healthData.rdservice,
					fingerprint: healthData.devices?.fingerprint,
					iris: healthData.devices?.iris,
					photograph: healthData.devices?.photograph
				});
			} catch (error) {
				console.error('Failed to get detailed health info:', error);
			}
		}
	};

	const handleBiometricCapture = async (type: BiometricType) => {
		setLoading(type);
		setError(null);

		try {
			let response: BiometricResponse;

			// Call appropriate capture method based on type
			switch (type) {
				case 'fingerprint':
					response = await biometricService.captureFingerprint();
					break;
				case 'iris':
					response = await biometricService.captureIris();
					break;
				case 'photograph':
					response = await biometricService.capturePhotograph();
					break;
				default:
					throw new Error('Invalid biometric type');
			}

			// Validate quality
			const validation = biometricService.validateQuality(response);

			if (!validation.valid) {
				setError(validation.message);
				setLoading(null);
				return;
			}

			// Store successful capture
			const fieldName = type === 'fingerprint' ? 'signature' : type;
			setForm((prev) => ({
				...prev,
				[fieldName]: response,
			}));

			console.log(`${type} captured successfully:`, {
				qScore: response.qScore,
				device: response.deviceInfo?.model,
				timestamp: response.timestamp,
			});

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Capture failed';
			setError(errorMessage);
			console.error(`${type} capture error:`, err);
		} finally {
			setLoading(null);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, files } = e.target;
		if (files && files[0]) {
			// Manual file upload fallback
			// You can convert file to BiometricResponse format if needed
			console.log('Manual file upload:', name, files[0]);
		}
	};

	const renderCaptureButton = (
		type: BiometricType,
		label: string,
		icon: string
	) => {
		const fieldName = type === 'fingerprint' ? 'signature' : type;
		const captured = form[fieldName as keyof BiometricData];
		const isLoading = loading === type;

		return (
			<div className="relative">
				<button
					type="button"
					onClick={() => handleBiometricCapture(type)}
					disabled={isLoading || bridgeStatus === false}
					className={`w-full border-2 border-dashed rounded-lg p-8 text-center transition-all ${
						captured
							? 'border-green-500 bg-green-50'
							: isLoading
							? 'border-blue-500 bg-blue-50'
							: bridgeStatus === false
							? 'border-gray-300 bg-gray-50 cursor-not-allowed'
							: 'border-gray-300 hover:border-blue-400 cursor-pointer'
					}`}
				>
					<div className="flex flex-col items-center gap-2">
						<span className="text-3xl">{icon}</span>
						{isLoading ? (
							<>
								<div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
								<span className="text-blue-600 font-medium">Capturing...</span>
							</>
						) : captured ? (
							<>
								<span className="text-green-600 font-medium">✓ Captured</span>
								<span className="text-xs text-gray-500">
									Quality: {captured.qScore}%
								</span>
								<span className="text-xs text-gray-400">
									{new Date(captured.timestamp).toLocaleString()}
								</span>
							</>
						) : (
							<>
								<span className="text-gray-600 font-medium">{label}</span>
								{bridgeStatus === false && (
									<span className="text-xs text-red-500">
										Device not available
									</span>
								)}
							</>
						)}
					</div>
				</button>
				
				{captured && (
					<button
						type="button"
						onClick={() => setForm((prev) => ({ ...prev, [fieldName]: null }))}
						className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-sm"
						title="Clear capture"
					>
						×
					</button>
				)}
			</div>
		);
	};

	return (
		<form className="p-6 max-w-4xl mx-auto">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-bold">Biometric Information</h2>
				
				{/* Bridge Status Indicator */}
				<div className="flex items-center gap-2">
					<div
						className={`w-3 h-3 rounded-full ${
							bridgeStatus === null
								? 'bg-gray-400'
								: bridgeStatus
								? 'bg-green-500'
								: 'bg-red-500'
						}`}
						title={
							bridgeStatus === null
								? 'Checking...'
								: bridgeStatus
								? 'Bridge connected'
								: 'Bridge disconnected'
						}
					/>
					<span className="text-sm text-gray-600">
						{bridgeStatus === null
							? 'Checking device...'
							: bridgeStatus
							? 'Device Ready'
							: 'Device Offline'}
					</span>
				</div>
			</div>

			{/* Error Alert */}
			{error && (
				<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
					<div className="flex items-start gap-2">
						<span className="text-red-500 text-xl">⚠️</span>
						<div className="flex-1">
							<p className="text-red-700 font-medium">Capture Error</p>
							<p className="text-red-600 text-sm">{error}</p>
						</div>
						<button
							onClick={() => setError(null)}
							className="text-red-500 hover:text-red-700"
						>
							×
						</button>
					</div>
				</div>
			)}

			{/* Bridge Offline Warning */}
			{bridgeStatus === false && (
				<div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
					<div className="flex items-start gap-2">
						<span className="text-yellow-500 text-xl">⚠️</span>
						<div className="flex-1">
							<p className="text-yellow-700 font-medium">
								Biometric Device Not Available
							</p>
							<p className="text-yellow-600 text-sm mb-2">
								The biometric bridge server is not running. Please ensure:
							</p>
							<ul className="text-yellow-600 text-sm list-disc list-inside space-y-1">
								<li>Bridge server is started (should start automatically with dev)</li>
								<li>RDService is installed and running</li>
								<li>Biometric devices are connected</li>
							</ul>
							<button
								type="button"
								onClick={() => setShowManualUpload(!showManualUpload)}
								className="mt-2 text-yellow-700 underline text-sm hover:text-yellow-800"
							>
								{showManualUpload ? 'Hide' : 'Show'} manual upload option
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Biometric Capture Grid */}
			<div className="grid grid-cols-2 gap-6 mb-6">
				<div>
					<div className="font-semibold mb-2">Signature/Thumb Impression</div>
					{renderCaptureButton('fingerprint', 'Capture Fingerprint', '👆')}
				</div>

				<div>
					<div className="font-semibold mb-2">Iris Scan</div>
					{renderCaptureButton('iris', 'Capture Iris', '👁️')}
				</div>
			</div>

			<div className="mb-6">
				<div className="font-semibold mb-2">Photograph</div>
				{renderCaptureButton('photograph', 'Capture Photograph', '📷')}
			</div>

			{/* Manual Upload Fallback (shown when bridge is offline) */}
			{showManualUpload && bridgeStatus === false && (
				<div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
					<h3 className="font-semibold mb-3 text-gray-700">Manual File Upload</h3>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-gray-600 mb-1">
								Signature/Fingerprint
							</label>
							<input
								type="file"
								name="signature"
								onChange={handleFileChange}
								accept="image/*"
								className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
							/>
						</div>
						<div>
							<label className="block text-sm text-gray-600 mb-1">Iris Scan</label>
							<input
								type="file"
								name="iris"
								onChange={handleFileChange}
								accept="image/*"
								className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
							/>
						</div>
					</div>
					<div className="mt-4">
						<label className="block text-sm text-gray-600 mb-1">Photograph</label>
						<input
							type="file"
							name="photograph"
							onChange={handleFileChange}
							accept="image/*"
							className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
						/>
					</div>
				</div>
			)}

			{/* Debug Info (only in development) */}
			{process.env.NODE_ENV === 'development' && (
				<details className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
					<summary className="cursor-pointer font-semibold text-gray-700">
						Debug Information
					</summary>
					<pre className="mt-2 text-xs text-gray-600 overflow-auto">
						{JSON.stringify(
							{
								bridgeStatus,
								capturedData: {
									signature: form.signature
										? {
												qScore: form.signature.qScore,
												device: form.signature.deviceInfo?.model,
												timestamp: form.signature.timestamp,
										  }
										: null,
									iris: form.iris
										? {
												qScore: form.iris.qScore,
												device: form.iris.deviceInfo?.model,
												timestamp: form.iris.timestamp,
										  }
										: null,
									photograph: form.photograph
										? {
												qScore: form.photograph.qScore,
												device: form.photograph.deviceInfo?.model,
												timestamp: form.photograph.timestamp,
										  }
										: null,
								},
							},
							null,
							2
						)}
					</pre>
				</details>
			)}

			<FormFooter />
		</form>
	);
};

export default BiometricInformation;

