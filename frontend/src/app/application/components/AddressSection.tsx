import React from 'react';

interface AddressSectionProps {
  application: any;
}

export default function AddressSection({ application }: AddressSectionProps) {
  if (!application?.presentAddress && !application?.permanentAddress) return null;

  return (
    <>
      {/* Present Address Section */}
      {application?.presentAddress && (
        <div className='mb-8'>
          <h2 className='text-xl font-bold text-gray-900 mb-6 flex items-center'>
            <div className='w-1 h-6 bg-purple-600 rounded-full mr-3'></div>
            Present Address
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {application.presentAddress.addressLine && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2 lg:col-span-4'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Address</p>
                <p className='font-semibold text-gray-900'>{application.presentAddress.addressLine}</p>
              </div>
            )}

            {application.presentAddress.state && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                <p className='text-sm text-gray-500 font-medium mb-1'>State</p>
                <p className='font-semibold text-gray-900'>
                  {typeof application.presentAddress.state === 'object'
                    ? (application.presentAddress.state as any).name
                    : application.presentAddress.state}
                </p>
              </div>
            )}

            {application.presentAddress.district && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                <p className='text-sm text-gray-500 font-medium mb-1'>District</p>
                <p className='font-semibold text-gray-900'>
                  {typeof application.presentAddress.district === 'object'
                    ? (application.presentAddress.district as any).name
                    : application.presentAddress.district}
                </p>
              </div>
            )}

            {application.presentAddress.zone && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Zone</p>
                <p className='font-semibold text-gray-900'>{application.presentAddress.zone.name}</p>
              </div>
            )}

            {application.presentAddress.division && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Division</p>
                <p className='font-semibold text-gray-900'>{application.presentAddress.division.name}</p>
              </div>
            )}

            {application.presentAddress.policeStation && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Police Station</p>
                <p className='font-semibold text-gray-900'>{application.presentAddress.policeStation.name}</p>
              </div>
            )}

            {application.presentAddress.rangeOffice && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Range Office</p>
                <p className='font-semibold text-gray-900'>{application.presentAddress.rangeOffice.name}</p>
              </div>
            )}

            {application.presentAddress.sinceResiding && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Residing Since</p>
                <p className='font-semibold text-gray-900'>
                  {new Date(application.presentAddress.sinceResiding).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permanent Address Section */}
      {application?.permanentAddress && (
        <div className='mb-8'>
          <h2 className='text-xl font-bold text-gray-900 mb-6 flex items-center'>
            <div className='w-1 h-6 bg-indigo-600 rounded-full mr-3'></div>
            Permanent Address
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {application.permanentAddress.addressLine && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2 lg:col-span-4'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Address</p>
                <p className='font-semibold text-gray-900'>{application.permanentAddress.addressLine}</p>
              </div>
            )}

            {application.permanentAddress.state && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                <p className='text-sm text-gray-500 font-medium mb-1'>State</p>
                <p className='font-semibold text-gray-900'>
                  {typeof application.permanentAddress.state === 'object'
                    ? (application.permanentAddress.state as any).name
                    : application.permanentAddress.state}
                </p>
              </div>
            )}

            {application.permanentAddress.district && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                <p className='text-sm text-gray-500 font-medium mb-1'>District</p>
                <p className='font-semibold text-gray-900'>
                  {typeof application.permanentAddress.district === 'object'
                    ? (application.permanentAddress.district as any).name
                    : application.permanentAddress.district}
                </p>
              </div>
            )}

            {application.permanentAddress.zone && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Zone</p>
                <p className='font-semibold text-gray-900'>{application.permanentAddress.zone.name}</p>
              </div>
            )}

            {application.permanentAddress.division && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Division</p>
                <p className='font-semibold text-gray-900'>{application.permanentAddress.division.name}</p>
              </div>
            )}

            {application.permanentAddress.policeStation && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Police Station</p>
                <p className='font-semibold text-gray-900'>{application.permanentAddress.policeStation.name}</p>
              </div>
            )}

            {application.permanentAddress.rangeOffice && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Range Office</p>
                <p className='font-semibold text-gray-900'>{application.permanentAddress.rangeOffice.name}</p>
              </div>
            )}

            {application.permanentAddress.sinceResiding && (
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Residing Since</p>
                <p className='font-semibold text-gray-900'>
                  {new Date(application.permanentAddress.sinceResiding).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
