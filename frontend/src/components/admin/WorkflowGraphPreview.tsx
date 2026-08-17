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
  allContextMappings?: any[];
}

export const WorkflowGraphPreview: React.FC<WorkflowGraphProps> = ({
  currentRole,
  nextRoles,
  allRoles = [],
  allContextMappings = [],
}) => {
  const { colors } = useAdminTheme();

  // 1. Sanitize Data: Filter out currentRole from nextRoles to prevent duplicates/coordinates overwriting
  const filteredNextRoles = useMemo(() => {
    if (!currentRole) return [];
    return nextRoles.filter(role => role.id !== currentRole.id);
  }, [currentRole, nextRoles]);

  // Dimension Constants
  const cardWidth = 220;
  const cardHeight = 110;
  const nodesPerRow = 3;

  // Calculate layout dimensions and node positions dynamically
  const containerWidth = 900;
  
  const layout = useMemo(() => {
    if (!currentRole) {
      return { positions: {}, containerHeight: 480, previousConnectors: [], nextConnectors: [], prevLayers: [], nextLayer: [] };
    }

    const positions: Record<number, { x: number; y: number }> = {};
    const previousConnectors: { from: number; to: number }[] = [];
    const nextConnectors: { from: number; to: number }[] = [];
    
    // 1. Build reverse adjacency list from allContextMappings
    const incomingGraph = new Map<number, number[]>();
    allContextMappings.forEach(mapping => {
      mapping.nextRoleIds.forEach((nextId: number) => {
        if (!incomingGraph.has(nextId)) incomingGraph.set(nextId, []);
        incomingGraph.get(nextId)!.push(mapping.currentRoleId);
      });
    });

    // 2. BFS backwards to find previous layers
    const prevLayers: WorkflowNode[][] = [];
    const visitedPrev = new Set<number>([currentRole.id]);
    let currentPrevLayerIds = incomingGraph.get(currentRole.id) || [];
    
    while (currentPrevLayerIds.length > 0) {
      const layerNodes = currentPrevLayerIds
        .filter(id => !visitedPrev.has(id)) // avoid cycles
        .map(id => allRoles.find(r => r.id === id))
        .filter(Boolean) as WorkflowNode[];

      if (layerNodes.length === 0) break;
      prevLayers.push(layerNodes);
      layerNodes.forEach(n => visitedPrev.add(n.id));

      const nextPrevLayerIds = new Set<number>();
      layerNodes.forEach(node => {
        const incoming = incomingGraph.get(node.id) || [];
        incoming.forEach(inc => {
          if (!visitedPrev.has(inc)) nextPrevLayerIds.add(inc);
        });
      });
      currentPrevLayerIds = Array.from(nextPrevLayerIds);
    }
    prevLayers.reverse(); // Order from roots down to currentRole's immediate parents

    // Next layer
    const nextLayer = nextRoles.filter(role => role.id !== currentRole.id);

    // 3. Compute Y positions
    const startY = 75; // Top layer Y
    const verticalGap = 180;
    
    // Place previous layers
    prevLayers.forEach((layer, layerIdx) => {
      const y = startY + layerIdx * verticalGap;
      const rowWidth = (layer.length - 1) * 240;
      const startX = (containerWidth - rowWidth) / 2;
      layer.forEach((node, colIdx) => {
        positions[node.id] = { x: startX + colIdx * 240, y };
      });
    });

    // Place current role
    const currentY = startY + prevLayers.length * verticalGap;
    positions[currentRole.id] = { x: containerWidth / 2, y: currentY };

    // Place next roles (group into rows)
    const nextRows: WorkflowNode[][] = [];
    for (let i = 0; i < nextLayer.length; i += nodesPerRow) {
      nextRows.push(nextLayer.slice(i, i + nodesPerRow));
    }
    
    nextRows.forEach((layer, rowIdx) => {
      const y = currentY + (rowIdx + 1) * verticalGap;
      const rowWidth = (layer.length - 1) * 240;
      const startX = (containerWidth - rowWidth) / 2;
      layer.forEach((node, colIdx) => {
        positions[node.id] = { x: startX + colIdx * 240, y };
      });
    });

    const renderedNodeIds = new Set(Object.keys(positions).map(Number));

    // 4. Build Connectors
    // Next connectors (from current state in UI)
    nextLayer.forEach(nextRole => {
      nextConnectors.push({ from: currentRole.id, to: nextRole.id });
    });

    // Previous connectors (from saved mappings)
    allContextMappings.forEach(mapping => {
      if (renderedNodeIds.has(mapping.currentRoleId) && mapping.currentRoleId !== currentRole.id) {
        mapping.nextRoleIds.forEach((nextId: number) => {
          if (renderedNodeIds.has(nextId)) {
            previousConnectors.push({ from: mapping.currentRoleId, to: nextId });
          }
        });
      }
    });

    const totalRows = prevLayers.length + 1 + nextRows.length;
    const containerHeight = Math.max(480, 220 + (totalRows - 1) * verticalGap);

    return { positions, containerHeight, previousConnectors, nextConnectors, prevLayers, nextLayer };
  }, [currentRole, nextRoles, allRoles, allContextMappings]);

  if (!currentRole) {
    return (
      <div
        style={{
          padding: AdminSpacing.lg,
          textAlign: 'center',
          backgroundColor: colors.surface,
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
        backgroundColor: colors.background,
        borderRadius: AdminBorderRadius.lg,
        border: `1px solid ${colors.border}`,
        marginTop: AdminSpacing.md,
        padding: AdminSpacing.lg,
      }}
    >
      <svg
        width={containerWidth}
        height={layout.containerHeight}
        style={{
          minWidth: containerWidth,
          backgroundColor: colors.background,
        }}
        viewBox={`0 0 ${containerWidth} ${layout.containerHeight}`}
      >
        {/* SVG Defs for markers and filters */}
        <defs>
          {/* Arrowhead marker for next role connectors */}
          <marker
            id="arrowhead-info"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={colors.status.info} />
          </marker>
          
          {/* Arrowhead marker for previous role connectors */}
          <marker
            id="arrowhead-prev"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={colors.text.secondary} />
          </marker>
          
          {/* Drop shadow filter for cards */}
          <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="6"
              floodColor="#000000"
              floodOpacity={colors.background === '#1a1a1a' ? '0.3' : '0.08'}
            />
          </filter>
        </defs>

        {/* Draw connecting lines from previous roles */}
        {layout.previousConnectors.map(connector => {
          const from = layout.positions[connector.from];
          const to = layout.positions[connector.to];

          if (!from || !to) return null;

          const fromX = from.x;
          const fromY = from.y + cardHeight / 2;
          const toX = to.x;
          const toY = to.y - cardHeight / 2 - 6;

          const dy = toY - fromY;
          const controlY1 = fromY + dy * 0.45;
          const controlY2 = toY - dy * 0.45;

          return (
            <g key={`connector-prev-${connector.from}-${connector.to}`}>
              <path
                d={`M ${fromX} ${fromY} C ${fromX} ${controlY1}, ${toX} ${controlY2}, ${toX} ${toY}`}
                stroke={colors.text.secondary}
                strokeWidth="2"
                fill="none"
                strokeDasharray="4,4"
                markerEnd="url(#arrowhead-prev)"
                style={{ opacity: 0.6 }}
              />
            </g>
          );
        })}

        {/* Draw connecting lines from current role to each next role */}
        {layout.nextConnectors.map(connector => {
          const from = layout.positions[connector.from];
          const to = layout.positions[connector.to];

          if (!from || !to) return null;

          const fromX = from.x;
          const fromY = from.y + cardHeight / 2;
          const toX = to.x;
          const toY = to.y - cardHeight / 2 - 6;

          const dy = toY - fromY;
          const controlY1 = fromY + dy * 0.45;
          const controlY2 = toY - dy * 0.45;

          return (
            <g key={`connector-next-${connector.from}-${connector.to}`}>
              <path
                d={`M ${fromX} ${fromY} C ${fromX} ${controlY1}, ${toX} ${controlY2}, ${toX} ${toY}`}
                stroke={colors.status.info}
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="6,6"
                markerEnd="url(#arrowhead-info)"
                style={{ opacity: 0.8 }}
              />
            </g>
          );
        })}

        {/* Render Previous Role Nodes */}
        {layout.prevLayers.flat().map(prevRole => {
          const pos = layout.positions[prevRole.id];
          if (!pos) return null;

          return (
            <g key={`node-prev-${prevRole.id}`}>
              <foreignObject
                x={pos.x - cardWidth / 2}
                y={pos.y - cardHeight / 2}
                width={cardWidth}
                height={cardHeight}
                style={{ overflow: 'visible' }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    filter: 'url(#card-shadow)',
                    opacity: 0.9,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '16px',
                      backgroundColor: colors.text.secondary,
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '2px 10px',
                      borderRadius: '20px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Previous Role
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      color: colors.text.secondary,
                      marginBottom: '4px',
                    }}
                  >
                    {prevRole.code}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: colors.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                    title={prevRole.name}
                  >
                    {prevRole.name}
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Render Current Role Node */}
        {currentRole && layout.positions[currentRole.id] && (
          <g key={`node-current-${currentRole.id}`}>
            <foreignObject
              x={layout.positions[currentRole.id].x - cardWidth / 2}
              y={layout.positions[currentRole.id].y - cardHeight / 2}
              width={cardWidth}
              height={cardHeight}
              style={{ overflow: 'visible' }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: colors.surface,
                  border: `2px solid ${colors.status.success}`,
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: `0 4px 20px -2px ${colors.status.success}20`,
                  filter: 'url(#card-shadow)',
                }}
              >
                {/* Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '16px',
                    backgroundColor: colors.status.success,
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  Current Role
                </div>

                {/* Role Code */}
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: colors.status.success,
                    marginBottom: '4px',
                    letterSpacing: '0.5px',
                  }}
                >
                  {currentRole.code}
                </div>

                {/* Role Name */}
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.text.primary,
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                  title={currentRole.name}
                >
                  {currentRole.name}
                </div>
              </div>
            </foreignObject>
          </g>
        )}

        {/* Render Next Role Nodes */}
        {layout.nextLayer.map(nextRole => {
          const pos = layout.positions[nextRole.id];
          if (!pos) return null;

          return (
            <g key={`node-next-${nextRole.id}`}>
              <foreignObject
                x={pos.x - cardWidth / 2}
                y={pos.y - cardHeight / 2}
                width={cardWidth}
                height={cardHeight}
                style={{ overflow: 'visible' }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: 'url(#card-shadow)',
                  }}
                  className="hover-card"
                >
                  {/* CSS Hover Effect inject style */}
                  <style dangerouslySetInnerHTML={{__html: `
                    .hover-card:hover {
                      transform: translateY(-4px);
                      border-color: ${colors.status.info} !important;
                      box-shadow: 0 8px 24px -4px ${colors.status.info}25 !important;
                    }
                  `}} />

                  {/* Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '16px',
                      backgroundColor: colors.status.info,
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '2px 10px',
                      borderRadius: '20px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    Next Role
                  </div>

                  {/* Role Code */}
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: colors.status.info,
                      marginBottom: '4px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {nextRole.code}
                  </div>

                  {/* Role Name */}
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: colors.text.primary,
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                    title={nextRole.name}
                  >
                    {nextRole.name}
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      {/* HTML-Based Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          padding: '16px 20px',
          backgroundColor: colors.surface,
          borderRadius: AdminBorderRadius.md,
          border: `1px solid ${colors.border}`,
          marginTop: AdminSpacing.md,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: colors.text.secondary,
              boxShadow: `0 0 8px ${colors.text.secondary}80`,
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text.primary }}>
            Previous Roles
          </span>
          <span style={{ fontSize: '12px', color: colors.text.secondary }}>
            (Roles that forward the application to the current role)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: colors.status.success,
              boxShadow: `0 0 8px ${colors.status.success}80`,
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text.primary }}>
            Current Role
          </span>
          <span style={{ fontSize: '12px', color: colors.text.secondary }}>
            (Selected role)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: colors.status.info,
              boxShadow: `0 0 8px ${colors.status.info}80`,
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text.primary }}>
            Next Roles
          </span>
          <span style={{ fontSize: '12px', color: colors.text.secondary }}>
            (Destination roles that can receive the application)
          </span>
        </div>
      </div>

      {/* Info message */}
      <div
        style={{
          marginTop: AdminSpacing.md,
          padding: AdminSpacing.md,
          backgroundColor: colors.status.info + '10',
          borderRadius: AdminBorderRadius.md,
          borderLeft: `4px solid ${colors.status.info}`,
          fontSize: '13px',
          color: colors.text.secondary,
          lineHeight: '1.5',
        }}
      >
        💡 <strong>Workflow Hierarchy:</strong> Applications flow from the current role to selected
        next roles. You can select multiple roles to allow applications to be forwarded to different
        departments or locations.
      </div>
    </div>
  );
};
