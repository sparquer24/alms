// ─── app/admin/revertAuditLogs/loading.tsx ─────────────────────────────────
export default function Loading() {
  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: '#e5e7eb' }} />
        <div>
          <div style={{ width: 180, height: 18, background: '#e5e7eb', borderRadius: 4, marginBottom: 6 }} />
          <div style={{ width: 120, height: 12, background: '#f3f4f6', borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 12 }}>
            {[60, 140, 80, 100, 100, 80, 180, 100].map((w, j) => (
              <div key={j} style={{ width: w, height: 14, background: i % 2 === 0 ? '#f3f4f6' : '#f9fafb', borderRadius: 4 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
