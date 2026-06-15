import React from 'react';
import { truncateFilename } from '../../../utils/string';
import { openAttachment } from '../../../utils/attachmentViewer';

interface LicenseDetailsSectionProps {
  licenseDetails: any[];
}

export default function LicenseDetailsSection({ licenseDetails }: LicenseDetailsSectionProps) {
  if (!licenseDetails || licenseDetails.length === 0) return null;

  return (
    <div className='mb-8'>
      <h2 className='text-xl font-bold text-gray-900 mb-6 flex items-center'>
        <div className='w-1 h-6 bg-blue-700 rounded-full mr-3'></div>
        License Details
      </h2>

      <div className='space-y-4'>
        {licenseDetails.map((license: any, idx: number) => {
          const requestedWeapons = Array.isArray(license?.requestedWeapons)
            ? license.requestedWeapons
            : license?.requestedWeaponIds;
          const weaponsLabel = Array.isArray(requestedWeapons)
            ? requestedWeapons
                .map((w: any) =>
                  typeof w === 'object' ? w?.name || w?.type || w?.id : w
                )
                .filter(Boolean)
                .join(', ')
            : '';
          const evidenceFiles =
            license?.uploadedFiles || license?.specialClaimsEvidence || [];
          const normalizedEvidence = Array.isArray(evidenceFiles)
            ? evidenceFiles.filter(Boolean)
            : [];

          return (
            <div
              key={idx}
              className='bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {license?.needForLicense && (
                  <div className='bg-white rounded-lg p-3'>
                    <p className='text-sm text-gray-500 font-medium mb-1'>Need For License</p>
                    <p className='font-semibold text-gray-900'>{license.needForLicense}</p>
                  </div>
                )}
                {license?.armsCategory && (
                  <div className='bg-white rounded-lg p-3'>
                    <p className='text-sm text-gray-500 font-medium mb-1'>Arms Category</p>
                    <p className='font-semibold text-gray-900'>{license.armsCategory}</p>
                  </div>
                )}
                {weaponsLabel && (
                  <div className='bg-white rounded-lg p-3'>
                    <p className='text-sm text-gray-500 font-medium mb-1'>Requested Weapons</p>
                    <p className='font-semibold text-gray-900'>{weaponsLabel}</p>
                  </div>
                )}
                {license?.areaOfValidity && (
                  <div className='bg-white rounded-lg p-3'>
                    <p className='text-sm text-gray-500 font-medium mb-1'>Area of Validity</p>
                    <p className='font-semibold text-gray-900'>{license.areaOfValidity}</p>
                  </div>
                )}
                {license?.licencePlaceArea && (
                  <div className='bg-white rounded-lg p-3'>
                    <p className='text-sm text-gray-500 font-medium mb-1'>Licence Place / Area</p>
                    <p className='font-semibold text-gray-900'>{license.licencePlaceArea}</p>
                  </div>
                )}
                {license?.ammunitionDescription && (
                  <div className='bg-white rounded-lg p-3 md:col-span-2'>
                    <p className='text-sm text-gray-500 font-medium mb-1'>Ammunition Description</p>
                    <p className='font-semibold text-gray-900'>{license.ammunitionDescription}</p>
                  </div>
                )}
                {license?.specialConsiderationReason && (
                  <div className='bg-white rounded-lg p-3 md:col-span-2'>
                    <p className='text-sm text-gray-500 font-medium mb-1'>Special Consideration Reason</p>
                    <p className='font-semibold text-gray-900'>{license.specialConsiderationReason}</p>
                  </div>
                )}
                {license?.wildBeastsSpecification && (
                  <div className='bg-white rounded-lg p-3 md:col-span-2'>
                    <p className='text-sm text-gray-500 font-medium mb-1'>Wild Beasts Specification</p>
                    <p className='font-semibold text-gray-900'>{license.wildBeastsSpecification}</p>
                  </div>
                )}
              </div>

              {normalizedEvidence.length > 0 && (
                <div className='mt-4'>
                  <p className='text-sm font-semibold text-gray-800 mb-2'>Evidence / Attachments</p>
                  <div className='flex flex-wrap gap-3'>
                    {normalizedEvidence.map((file: any, fileIdx: number) => {
                      const fileLabel = truncateFilename(
                        file?.name || file?.fileName || file?.originalName || 'File',
                        10
                      );
                      return (
                        <button
                          key={fileIdx}
                          type='button'
                          onClick={() => openAttachment(file)}
                          className='inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-50'
                          title={file?.name || file?.fileName || file?.originalName}
                        >
                          <svg
                            className='w-4 h-4 text-red-500'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                            />
                          </svg>
                          <span className='truncate max-w-[120px]'>{fileLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
