'use client';

import { useMemo } from 'react';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminBorderRadius } from '@/styles/admin-design-system';

interface WorkflowNode {
  id: number;
  name: string;
  code: string;
}

interface WorkflowGraphProps {
  currentRole: WorkflowNode | null;
  nextRoles: WorkflowNode[];
  allRoles?: WorkflowNode[];
}

export const WorkflowGraphPreview: React.FC<WorkflowGraphProps> = ({
  currentRole,
  nextRoles,
  allRoles = [],
}) => {
  const { colors } = useAdminTheme();

  if (!currentRole) {
    return (
      <div
        style={{
          padding: AdminSpacing.lg,
          textAlign: 'center',
          backgroundColor: colors.background,
          borderRadius: AdminBorderRadius.md,
          border: `1px solid ${colors.border}`,
          color: colors.text.secondary,
          fontSize: '14px',
        }}
      >
        Select a role to see the workflow diagram
      </div>
    );
  }

  // Calculate layout
  const nodesPerRow = Math.ceil(Math.sqrt(nextRoles.length)) || 1;
  const containerWidth = Math.max(900, 150 + nodesPerRow * 200);
  const containerHeight = Math.max(600, 250 + Math.ceil(nextRoles.length / nodesPerRow) * 180);

  // Position nodes
  const nodePositions = useMemo(() => {
    const positions: Record<number, { x: number; y: number }> = {};

    // Current role at top
    positions[currentRole.id] = { x: containerWidth / 2, y: 60 };

    // Next roles in grid layout below
    nextRoles.forEach((role, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
      const totalRows = Math.ceil(nextRoles.length / nodesPerRow);
      const startX = (containerWidth - (nodesPerRow - 1) * 200) / 2;

      positions[role.id] = {
        x: startX + col * 200,
        y: 200 + row * 180,
      };
    });

    return positions;
  }, [currentRole, nextRoles, nodesPerRow, containerWidth]);

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        backgroundColor: colors.background,
        borderRadius: AdminBorderRadius.md,
        border: `1px solid ${colors.border}`,
        marginTop: AdminSpacing.md,
        padding: AdminSpacing.md,
      }}
    >
      <svg
        width={containerWidth}
        height={containerHeight}
        style={{
          minWidth: containerWidth,
          backgroundColor: colors.background,
        }}
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      >
        {/* Draw connecting lines from current role to each next role */}
        {nextRoles.map(nextRole => {
          const from = nodePositions[currentRole.id];
          const to = nodePositions[nextRole.id];

          if (!from || !to) return null;

          // Draw curved connector line
          const dx = to.x - from.x;
          const dy = to.y - from.y;

          // Create curved path
          const curveFactor = 0.3;
          const controlX = from.x + dx * curveFactor;
          const controlY = from.y + dy * 0.5;

          return (
            <g key={`connector-${currentRole.id}-${nextRole.id}`}>
              {/* Curved line */}
              <path
                d={`M ${from.x} ${from.y + 50} Q ${controlX} ${controlY} ${to.x} ${to.y - 60}`}
                stroke={colors.status.info}
                strokeWidth='2.5'
                fill='none'
                strokeDasharray='5,5'
              />
              {/* Arrow marker */}
              <polygon
                points={`${to.x},${to.y - 50} ${to.x - 8},${to.y - 40} ${to.x + 8},${to.y - 40}`}
                fill={colors.status.info}
              />
            </g>
          );
        })}

        {/* Draw current role - larger */}
        {currentRole && (
          <g key={`node-current-${currentRole.id}`}>
            {/* Box background */}
            <rect
              x={nodePositions[currentRole.id]?.x - 90}
              y={nodePositions[currentRole.id]?.y - 40}
              width='180'
              height='90'
              rx='8'
              fill={colors.status.success}
              opacity='0.1'
              stroke={colors.status.success}
              strokeWidth='2.5'
            />

            {/* Content */}
            <text
              x={nodePositions[currentRole.id]?.x}
              y={nodePositions[currentRole.id]?.y - 10}
              textAnchor='middle'
              fontSize='16'
              fontWeight='700'
              fill={colors.status.success}
            >
              {currentRole.code}
            </text>
            <text
              x={nodePositions[currentRole.id]?.x}
              y={nodePositions[currentRole.id]?.y + 15}
              textAnchor='middle'
              fontSize='13'
              fontWeight='500'
              fill={colors.text.primary}
            >
              {currentRole.name}
            </text>
            <text
              x={nodePositions[currentRole.id]?.x}
              y={nodePositions[currentRole.id]?.y + 35}
              textAnchor='middle'
              fontSize='11'
              fill={colors.text.secondary}
            >
              Current Role
            </text>
          </g>
        )}

        {/* Draw next role nodes - larger */}
        {nextRoles.map(role => (
          <g key={`node-next-${role.id}`}>
            {/* Box background */}
            <rect
              x={nodePositions[role.id]?.x - 85}
              y={nodePositions[role.id]?.y - 40}
              width='170'
              height='90'
              rx='8'
              fill={colors.status.info}
              opacity='0.1'
              stroke={colors.status.info}
              strokeWidth='2'
            />

            {/* Content */}
            <text
              x={nodePositions[role.id]?.x}
              y={nodePositions[role.id]?.y - 10}
              textAnchor='middle'
              fontSize='15'
              fontWeight='700'
              fill={colors.status.info}
            >
              {role.code}
            </text>
            <text
              x={nodePositions[role.id]?.x}
              y={nodePositions[role.id]?.y + 15}
              textAnchor='middle'
              fontSize='12'
              fontWeight='500'
              fill={colors.text.primary}
              style={{ wordWrap: 'break-word' }}
            >
              {role.name}
            </text>
            <text
              x={nodePositions[role.id]?.x}
              y={nodePositions[role.id]?.y + 35}
              textAnchor='middle'
              fontSize='10'
              fill={colors.text.secondary}
            >
              Next Role
            </text>
          </g>
        ))}

        {/* Legend at bottom */}
        <g transform={`translate(20, ${containerHeight - 50})`}>
          <rect
            x='0'
            y='0'
            width={containerWidth - 40}
            height='40'
            rx='6'
            fill={colors.background}
            stroke={colors.border}
            strokeWidth='1'
          />

          <circle cx='20' cy='20' r='8' fill={colors.status.success} />
          <text x='35' y='24' fontSize='12' fontWeight='500' fill={colors.text.primary}>
            Current Role (Where application/user is now)
          </text>

          <circle cx='380' cy='20' r='8' fill={colors.status.info} />
          <text x='395' y='24' fontSize='12' fontWeight='500' fill={colors.text.primary}>
            Next Roles (Can forward to) — Select multiple for workflow
          </text>
        </g>
      </svg>

      {/* Info message */}
      <div
        style={{
          marginTop: AdminSpacing.md,
          padding: AdminSpacing.md,
          backgroundColor: colors.status.info + '15',
          borderRadius: AdminBorderRadius.sm,
          borderLeft: `4px solid ${colors.status.info}`,
          fontSize: '13px',
          color: colors.text.secondary,
        }}
      >
        💡 <strong>Workflow Hierarchy:</strong> Applications flow from the current role to selected
        next roles. You can select multiple roles to allow applications to be forwarded to different
        departments or locations.
      </div>
    </div>
  );
};
