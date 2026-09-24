'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminRole } from '@/utils/roleUtils';
import { useRouter } from 'next/navigation';
import { PageSubHeader, SubHeaderSearch, SubHeaderButton } from '@/components/common/PageSubHeader';
import { AdminTableContainer } from '@/components/admin/AdminTableContainer';
import { Download } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface License {
  id: string;
  licenseNumber: string;
  applicantName: string;
  licenseType: string;
  status: string;
  issueDate: string;
  expiryDate: string;
  zone: string;
}

export default function AdminLicenseManagement() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isAdminRole(userRole)) {
      router.push('/dashboard');
      return;
    }
    fetchLicenses();
  }, [userRole, router]);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/licenses', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLicenses(data);
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch =
      license.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.applicantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || license.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredLicenses.length / ITEMS_PER_PAGE) || 1;
  const paginatedLicenses = filteredLicenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className='flex flex-col flex-grow min-h-0'>
      <PageSubHeader
        title='License Management'
        metaBadge={`${filteredLicenses.length} License${filteredLicenses.length !== 1 ? 's' : ''}`}
        actions={
          <div className='flex items-center gap-2'>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#001F54] focus:border-transparent'
            >
              <option value='all'>All Statuses</option>
              <option value='Active'>Active</option>
              <option value='Expired'>Expired</option>
              <option value='Pending'>Pending</option>
              <option value='Revoked'>Revoked</option>
            </select>
            <SubHeaderSearch value={searchTerm} onChange={setSearchTerm} placeholder='Search licenses...' />
            <SubHeaderButton variant='primary' icon={<Download className='w-4 h-4' />}>
              Export
            </SubHeaderButton>
          </div>
        }
      />

      <div className='p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6 flex-grow'>
        <AdminTableContainer
          title='All Licenses'
          description='View and manage licenses in the system'
          subtitle={`Total: ${filteredLicenses.length} license${filteredLicenses.length !== 1 ? 's' : ''}`}
          pagination={{
            currentPage,
            totalPages,
            totalItems: filteredLicenses.length,
            itemsPerPage: ITEMS_PER_PAGE,
            onPageChange: handlePageChange,
          }}
        >
          {loading ? (
            <div className='px-6 py-8 text-center text-gray-500'>
              <div className='flex justify-center mb-3'>
                <div className='animate-spin h-5 w-5 border-2 border-gray-300 border-t-[#001F54] rounded-full'></div>
              </div>
              <p>Loading licenses...</p>
            </div>
          ) : (
            <table className='w-full border-collapse'>
              <thead className='bg-gray-50 border-b border-gray-200 sticky top-0 z-10'>
                <tr>
                  <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12'>S.No</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>License Number</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Applicant Name</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>License Type</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Status</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Issue Date</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Expiry Date</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Zone</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {paginatedLicenses.length > 0 ? (
                  paginatedLicenses.map((license, index) => (
                    <tr key={license.id} className='hover:bg-gray-50 transition-colors'>
                      <td className='px-6 py-4 text-center text-sm text-gray-600 font-medium'>
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-900'>{license.licenseNumber}</td>
                      <td className='px-6 py-4 text-sm text-gray-900'>{license.applicantName}</td>
                      <td className='px-6 py-4 text-sm text-gray-900'>{license.licenseType}</td>
                      <td className='px-6 py-4 text-sm'>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          license.status === 'Active' ? 'bg-green-100 text-green-800' :
                          license.status === 'Expired' ? 'bg-red-100 text-red-800' :
                          license.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {license.status}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-900'>{license.issueDate}</td>
                      <td className='px-6 py-4 text-sm text-gray-900'>{license.expiryDate}</td>
                      <td className='px-6 py-4 text-sm text-gray-900'>{license.zone}</td>
                      <td className='px-6 py-4 text-sm font-medium'>
                        <button
                          onClick={() => router.push(`/licenses/${license.id}`)}
                          className='text-[#001F54] hover:text-[#0A1C33] transition-colors'
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className='px-6 py-12 text-center text-gray-500'>
                      <p>No licenses found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </AdminTableContainer>

        {/* Info Banner */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex-shrink-0'>
          <p className='text-sm text-blue-800'>
            <strong>Note:</strong> Admin users can view all licenses. To create renewals or cancel licenses, use the appropriate user workflows.
          </p>
        </div>
      </div>
    </div>
  );
}
