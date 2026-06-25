import React from 'react';

interface OccupationSectionProps {
  application: any;
}

export default function OccupationSection({ application }: OccupationSectionProps) {
  if (!application?.occupationAndBusiness) return null;

  return (
    <div className='mb-8'>
      <h2 className='text-xl font-bold text-gray-900 mb-6 flex items-center'>
        <div className='w-1 h-6 bg-teal-600 rounded-full mr-3'></div>
        Occupation & Business Details
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {application.occupationAndBusiness.occupation && (
          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
            <p className='text-sm text-gray-500 font-medium mb-1'>Occupation</p>
            <p className='font-semibold text-gray-900'>
              {application.occupationAndBusiness.occupation}
            </p>
          </div>
        )}

        {application.occupationAndBusiness.officeAddress && (
          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
            <p className='text-sm text-gray-500 font-medium mb-1'>Office Address</p>
            <p className='font-semibold text-gray-900'>
              {application.occupationAndBusiness.officeAddress}
            </p>
          </div>
        )}

        {application.occupationAndBusiness.state && (
          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
            <p className='text-sm text-gray-500 font-medium mb-1'>State</p>
            <p className='font-semibold text-gray-900'>
              {application.occupationAndBusiness.state.name}
            </p>
          </div>
        )}

        {application.occupationAndBusiness.district && (
          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
            <p className='text-sm text-gray-500 font-medium mb-1'>District</p>
            <p className='font-semibold text-gray-900'>
              {application.occupationAndBusiness.district.name}
            </p>
          </div>
        )}

        {application.occupationAndBusiness.cropLocation && (
          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
            <p className='text-sm text-gray-500 font-medium mb-1'>Crop Location</p>
            <p className='font-semibold text-gray-900'>
              {application.occupationAndBusiness.cropLocation}
            </p>
          </div>
        )}

        {application.occupationAndBusiness.areaUnderCultivation && (
          <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
            <p className='text-sm text-gray-500 font-medium mb-1'>
              Area Under Cultivation
            </p>
            <p className='font-semibold text-gray-900'>
              {application.occupationAndBusiness.areaUnderCultivation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
