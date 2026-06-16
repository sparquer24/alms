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

  // Dimensions
  const BOX_WIDTH = 170;
  const BOX_HEIGHT = 80;
  const RADIUS_X = 280;  // horizontal radius of the ellipse
  const RADIUS_Y = 200;  // vertical radius of the ellipse
  const CENTER_X = 460;  // SVG center X
  const CENTER_Y = 260;  // SVG center Y
  const SVG_WIDTH = 920;
  const SVG_HEIGHT = 520;

  // Position current role at center
  const currentPos = { x: CENTER_X, y: CENTER_Y };

  // Position next roles in an ellipse around the center
  const nextPositions = useMemo(() => {
    const count = nextRoles.length;
    if (count === 0) return [];

    return nextRoles.map((role, index) => {
      // Start from top (angle = -PI/2) and go clockwise
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
      // Slight offset so nodes don't overlap with lines
      const x = CENTER_X + RADIUS_X * Math.cos(angle);
      const y = CENTER_Y + RADIUS_Y * Math.sin(angle);
      return { id: role.id, x, y, angle };
    });
  }, [nextRoles]);

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

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        backgroundColor: colors.background,
        borderRadius: AdminBorderRadius.md,
        border: `1px solid ${colors.border}`,
        marginTop: AdminSpacing.md,
        padding: AdminSpacing.md,
      }}
    >
      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        style={{
          minWidth: SVG_WIDTH,
          backgroundColor: colors.background,
          display: 'block',
        }}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      >
        {/* Draw connecting arrows from center to each next role */}
        {nextPositions.map(pos => {
          const dx = pos.x - currentPos.x;
          const dy = pos.y - currentPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Start point: edge of center box (offset by BOX_HEIGHT/2 + 5)
          const startOffset = BOX_HEIGHT / 2 + 8;
          const startX = currentPos.x + (dx / dist) * startOffset;
          const startY = currentPos.y + (dy / dist) * startOffset;

          // End point: edge of outer box (offset inward by BOX_HEIGHT/2 + 5)
          const endOffset = BOX_HEIGHT / 2 + 8;
          const endX = pos.x - (dx / dist) * endOffset;
          const endY = pos.y - (dy / dist) * endOffset;

          // Arrow head
          const arrowSize = 10;
          const angle = Math.atan2(dy, dx);

          return (
            <g key={`connector-${currentRole.id}-${pos.id}`}>
              {/* Dashed line */}
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={colors.status.info}
                strokeWidth='2'
                strokeDasharray='6,4'
                opacity='0.7'
              />
              {/* Arrow head */}
              <polygon
                points={`
                  ${endX},${endY}
                  ${endX - arrowSize * Math.cos(angle - Math.PI / 6)},${endY - arrowSize * Math.sin(angle - Math.PI / 6)}
                  ${endX - arrowSize * Math.cos(angle + Math.PI / 6)},${endY - arrowSize * Math.sin(angle + Math.PI / 6)}
                `}
                fill={colors.status.info}
                opacity='0.8'
              />
              {/* Direction label - only show when few enough roles to avoid overlap */}
              {nextRoles.length <= 4 && (
                <text
                  x={(startX + endX) / 2}
                  y={(startY + endY) / 2 - 8}
                  textAnchor='middle'
                  fontSize='10'
                  fill={colors.text.tertiary}
                  fontStyle='italic'
                >
                  forwards to
                </text>
              )}
            </g>
          );
        })}

        {/* ===== CENTER NODE: Current Role ===== */}
        <g key={`node-center-${currentRole.id}`}>
          {/* Glow effect */}
          <rect
            x={currentPos.x - BOX_WIDTH / 2 - 4}
            y={currentPos.y - BOX_HEIGHT / 2 - 4}
            width={BOX_WIDTH + 8}
            height={BOX_HEIGHT + 8}
            rx='12'
            fill='none'
            stroke={colors.status.success}
            strokeWidth='3'
            opacity='0.3'
          />
          {/* Box background */}
          <rect
            x={currentPos.x - BOX_WIDTH / 2}
            y={currentPos.y - BOX_HEIGHT / 2}
            width={BOX_WIDTH}
            height={BOX_HEIGHT}
            rx='10'
            fill={colors.surface}
            stroke={colors.status.success}
            strokeWidth='2.5'
          />
          {/* Code */}
          <text
            x={currentPos.x}
            y={currentPos.y - 12}
            textAnchor='middle'
            fontSize='16'
            fontWeight='700'
            fill={colors.status.success}
          >
            {currentRole.code}
          </text>
          {/* Name */}
          <text
            x={currentPos.x}
            y={currentPos.y + 12}
            textAnchor='middle'
            fontSize='12'
            fontWeight='500'
            fill={colors.text.primary}
          >
            {currentRole.name.length > 22
              ? currentRole.name.substring(0, 20) + '...'
              : currentRole.name}
          </text>
          {/* Label */}
          <text
            x={currentPos.x}
            y={currentPos.y + 32}
            textAnchor='middle'
            fontSize='10'
            fill={colors.status.success}
            fontWeight='600'
          >
            ● CURRENT ROLE
          </text>
        </g>

        {/* ===== OUTER NODES: Next Roles ===== */}
        {nextRoles.map((role, index) => {
          const pos = nextPositions[index];
          if (!pos) return null;

          return (
            <g key={`node-outer-${role.id}`}>
              {/* Box shadow effect */}
              <rect
                x={pos.x - BOX_WIDTH / 2 - 2}
                y={pos.y - BOX_HEIGHT / 2 - 2}
                width={BOX_WIDTH + 4}
                height={BOX_HEIGHT + 4}
                rx='10'
                fill='none'
                stroke={colors.status.info}
                strokeWidth='2'
                opacity='0.2'
              />
              {/* Box background */}
              <rect
                x={pos.x - BOX_WIDTH / 2}
                y={pos.y - BOX_HEIGHT / 2}
                width={BOX_WIDTH}
                height={BOX_HEIGHT}
                rx='8'
                fill={colors.surface}
                stroke={colors.status.info}
                strokeWidth='2'
              />
              {/* Code */}
              <text
                x={pos.x}
                y={pos.y - 12}
                textAnchor='middle'
                fontSize='15'
                fontWeight='700'
                fill={colors.status.info}
              >
                {role.code}
              </text>
              {/* Name */}
              <text
                x={pos.x}
                y={pos.y + 12}
                textAnchor='middle'
                fontSize='12'
                fontWeight='500'
                fill={colors.text.primary}
              >
                {role.name.length > 22
                  ? role.name.substring(0, 20) + '...'
                  : role.name}
              </text>
              {/* Label */}
              <text
                x={pos.x}
                y={pos.y + 30}
                textAnchor='middle'
                fontSize='9'
                fill={colors.text.tertiary}
                fontStyle='italic'
              >
                Next Role
              </text>
            </g>
          );
        })}

        {/* Empty state when no next roles selected */}
        {nextRoles.length === 0 && (
          <g>
            <text
              x={CENTER_X}
              y={CENTER_Y + 90}
              textAnchor='middle'
              fontSize='13'
              fill={colors.text.tertiary}
              fontStyle='italic'
            >
              Select next roles to see them arranged here
            </text>
          </g>
        )}

        {/* Legend */}
        <g transform={`translate(20, ${SVG_HEIGHT - 70})`}>
          <rect
            x='0'
            y='0'
            width={SVG_WIDTH - 40}
            height='55'
            rx='6'
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth='1'
          />
          <circle cx='20' cy='20' r='6' fill={colors.status.success} />
          <text x='35' y='24' fontSize='11' fontWeight='500' fill={colors.text.primary}>
            Current Role
          </text>
          <circle cx='180' cy='20' r='6' fill={colors.status.info} />
          <text x='195' y='24' fontSize='11' fontWeight='500' fill={colors.text.primary}>
            Next Roles — Applications flow outward
          </text>
          <line x1='360' y1='20' x2='420' y2='20' stroke={colors.status.info} strokeWidth='2' strokeDasharray='4,3' />
          <text x='430' y='24' fontSize='11' fontWeight='500' fill={colors.text.primary}>
            Workflow Direction
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
        💡 <strong>Hub-and-Spoke Workflow:</strong> The current role is at the center.
        Applications can be forwarded outward to any of the connected next roles.
        Lines show the direction of workflow flow.
      </div>
    </div>
  );
};
