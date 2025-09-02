import React, { useMemo, useEffect, useState } from "react";
import { ApplicationApi } from "../config/APIClient";

const MyReportsAnalytics: React.FC<{ userId?: string }> = ({ userId }) => {
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await ApplicationApi.getAll();
        console.log('API Response (MyReportsAnalytics):', res);
        
        // The API returns {success: true, message: '...', data: Array(1), pagination: {...}}
        // We need to access the 'data' property
        let apps: any[] = [];
        if (res && typeof res === 'object') {
          if (res.data && Array.isArray(res.data)) {
            apps = res.data;
          } else if (res.body && Array.isArray(res.body)) {
            apps = res.body;
          } else if (Array.isArray(res)) {
            apps = res;
          }
        }
        
        console.log('Extracted applications (MyReportsAnalytics):', apps);
        if (mounted) setApplications(apps);
      } catch (err) {
        if (mounted) setApplications([]);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const analytics = useMemo(() => {
    const userApps = applications.filter(
      app => app.assignedTo === userId || app.applicantEmail === userId
    );
    const statusCounts = userApps.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return {
      total: userApps.length,
      statusCounts,
    };
  }, [applications, userId]);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8" role="region" aria-labelledby="analytics-title">
      <h2 id="analytics-title" className="text-xl font-bold mb-4">
        My Application Analytics
      </h2>
      <div className="mb-2">
        Total Applications: <span className="font-semibold">{analytics.total}</span>
      </div>
      <div className="mb-2">By Status:</div>
      <ul className="ml-4 list-disc">
        {Object.entries(analytics.statusCounts).map(([status, count]) => (
          <li key={status} className="capitalize">
            {status}: <span className="font-semibold">{Number(count)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyReportsAnalytics;
