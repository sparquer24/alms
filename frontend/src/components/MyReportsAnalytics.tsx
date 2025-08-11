import React, { useMemo } from "react";
import { mockApplications } from "../config/mockData";

const getUserAnalytics = (userId?: string) => {
  const userApps = mockApplications.filter(
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
};

const MyReportsAnalytics: React.FC<{ userId?: string }> = ({ userId }) => {
  const analytics = useMemo(() => getUserAnalytics(userId), [userId]);

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
            {status}: <span className="font-semibold">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyReportsAnalytics;
