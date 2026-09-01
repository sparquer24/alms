import { formatStatusLabel } from './formatters';

export const generateApplicationPrintHtml = (application: any, applicationId: string | null): string => {
  // Collect attachments from top-level `documents` (UI) and workflow histories
  const attachments: Array<any> = [];
  if (application?.documents && Array.isArray(application.documents)) {
    attachments.push(...application.documents);
  }
  // Backwards-compat: accept `attachments` field if present
  if (application?.attachments && Array.isArray(application.attachments)) {
    attachments.push(...application.attachments);
  }
  if (application?.workflowHistories && Array.isArray(application.workflowHistories)) {
    application.workflowHistories.forEach((h: any) => {
      if (h.attachments && Array.isArray(h.attachments)) attachments.push(...h.attachments);
    });
  }

  // Build application header
  const appTitle = `Application ${String(application?.id)}`;
  const applicantName = application?.applicantName || application?.fullName || '';

  // Build history HTML
  let historyHtml = '';
  if (application?.workflowHistories && Array.isArray(application.workflowHistories)) {
    historyHtml += `<section class="history"><h2>Application History</h2>`;
    historyHtml += `<ol class="history-list">`;
    application.workflowHistories.forEach((h: any) => {
      const when = h?.createdAt || h?.date || '';
      const who = h?.performedBy || h?.user || h?.actor || '';
      const action = h?.action || h?.status || '';
      const comment = h?.comments || h?.comment || h?.notes || '';
      historyHtml += `<li class="history-item"><div class="meta"><div class="when">${String(when)}</div><div class="who">${String(who)}</div><div class="action">${String(action)}</div></div>`;
      if (comment) historyHtml += `<div class="comment">${String(comment)}</div>`;
      historyHtml += `</li>`;
    });
    historyHtml += `</ol></section>`;
  }

  // Build attachments HTML — each attachment on its own page-break block
  let attachmentsHtml = '';
  attachments.forEach((att: any, idx: number) => {
    const name = att?.name || att?.fileName || `attachment-${idx + 1}`;
    const url = att?.url || att?.path || att?.downloadUrl;
    const type = att?.contentType || att?.mime || '';
    if (!url) return;

    // Normalize a human friendly label for the document type/category
    const label = (att?.type || att?.category || '').toString();
    attachmentsHtml += `<section class="doc-block" data-attachment-index="${idx}">
        <h3 class="doc-title">${String(name)}</h3>
        ${label ? `<div class="doc-label" style="font-size:12px;color:#374151;margin-bottom:6px;">${label.toUpperCase()}</div>` : ''}`;

    // Embed PDFs and other embeddable types using object/iframe; images with img tag
    if (/pdf/i.test(type) || name.toLowerCase().endsWith('.pdf')) {
      attachmentsHtml += `<object data="${url}" type="application/pdf" class="embedded-doc">`;
      attachmentsHtml += `<p>Unable to display PDF. <a href="${url}" target="_blank" rel="noopener">Open or download</a></p>`;
      attachmentsHtml += `</object>`;
    } else if (/^image\//i.test(type) || /\.(png|jpe?g|gif|svg)$/i.test(name)) {
      attachmentsHtml += `<img src="${url}" alt="${String(name)}" class="embedded-image" />`;
    } else {
      // Fallback: provide a download link and attempt iframe
      attachmentsHtml += `<iframe src="${url}" class="embedded-doc-iframe"></iframe>`;
      attachmentsHtml += `<p><a href="${url}" target="_blank" rel="noopener">Open ${String(name)}</a></p>`;
    }

    attachmentsHtml += `</section>`;
  });

  // Compose full HTML for the print window
  const statusLabel = formatStatusLabel(application?.workflowStatus || application?.status);
  
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${appTitle} - Documents</title>
      <style>
        html,body{height:100%;}
        body{font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#111; margin:0; background:#f8fafc}
        .page{max-width:900px;margin:24px auto;background:#fff;border:1px solid #e6eef8;border-radius:10px;overflow:hidden}
        .print-header{background:#001F54;color:#fff;padding:20px 24px;display:flex;justify-content:space-between;align-items:center}
        .brand{display:flex;gap:12px;align-items:center}
        .brand .logo{width:44px;height:44px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;border-radius:8px}
        .brand h1{margin:0;font-size:18px}
        .brand p{margin:0;font-size:12px;opacity:0.9}
        .status-badge{background:#fff;color:#001F54;padding:6px 12px;border-radius:999px;font-weight:600;font-size:13px}
        .content{padding:20px 28px}
        .card{background:#fff;padding:18px;border-radius:8px;border:1px solid #eef2f7;margin-bottom:18px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .photo{width:140px;height:180px;object-fit:cover;border:1px solid #e6eef8;border-radius:6px}
        h2{font-size:16px;margin:0 0 8px}
        .muted{color:#6b7280;font-size:13px}
        .label{font-size:12px;color:#6b7280}
        .value{font-weight:600;color:#111}
        .documents{margin-top:8px}
        .doc-item{padding:12px;border:1px solid #eef2f7;border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}
        .doc-meta{display:flex;gap:12px;align-items:center}
        .doc-type{font-size:12px;color:#065f46;font-weight:700}
        .doc-name{font-size:13px;color:#0f172a}
        .doc-actions button{margin-left:8px;padding:8px 12px;border-radius:6px;border:1px solid #e6eef8;background:#fff;cursor:pointer}
        .history{margin-top:12px}
        .history-item{padding:12px;border-left:4px solid #e6eef8;background:#fbfdff;margin-bottom:8px;border-radius:4px}
        .history-meta{display:flex;gap:12px;color:#374151;font-size:13px}
        @media print{ body{background:#fff} .print-header{page-break-after:avoid} .doc-item{page-break-inside:avoid} .history-item{page-break-inside:avoid} }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="print-header">
          <div class="brand">
            <div class="logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C7.03 2 3 6.03 3 11c0 5.86 5.06 10.48 9 11 3.94-.52 9-5.14 9-11 0-4.97-4.03-9-9-9z" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div>
              <h1>Arms License Application</h1>
              <p>Public / Official Printout</p>
            </div>
          </div>
          <div class="status-badge">${String(statusLabel).toUpperCase()}</div>
        </div>

        <div class="content">
          <div class="card">
            <div style="display:flex;gap:18px;align-items:flex-start">
              <div style="flex:1">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <div class="label">Application ID</div>
                    <div class="value">${String(application?.id || applicationId || application?.applicationId || '')}</div>
                  </div>
                  <div style="text-align:right">
                    ${application?.acknowledgementNo || application?.acknowledgement_no ? `<div class="label">Acknowledgement No.</div><div class="value">${String(application.acknowledgementNo || application.acknowledgement_no)}</div>` : ''}
                  </div>
                </div>

                <h2 style="margin-top:12px">Applicant Information</h2>
                <div class="grid" style="grid-template-columns:2fr 140px;">
                  <div>
                    <div class="label">Full Name</div>
                    <div class="value">${String(applicantName || application?.applicantName || '')}</div>
                    <div style="height:8px"></div>
                    <div class="label">Date of Birth</div>
                    <div class="value">${String(application?.dateOfBirth || application?.dob || '')}</div>
                    <div style="height:8px"></div>
                    <div class="label">Gender</div>
                    <div class="value">${String(application?.sex || application?.gender || '')}</div>
                  </div>
                  <div style="text-align:right">
                    ${application?.photoUrl || application?.photo ? `<img src="${application.photoUrl || application.photo}" class="photo"/>` : `<div class="photo" style="display:flex;align-items:center;justify-content:center;color:#9ca3af;background:#f3f4f6">No Photo</div>`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h2>Documents Uploaded</h2>
            <div class="documents">
              ${attachmentsHtml || '<div class="muted">No documents uploaded</div>'}
            </div>
          </div>

          <div class="card">
            <h2>Application History</h2>
            <div class="history">
              ${historyHtml || '<div class="muted">No history available</div>'}
            </div>
          </div>

          <div style="text-align:center;margin-top:12px;color:#6b7280;font-size:12px">Generated: ${new Date().toLocaleString()}</div>

          <div style="margin-top:18px;text-align:center;">
            <button onclick="window.print();" style="padding:8px 14px;margin-right:8px;border-radius:6px;border:1px solid #e6eef8;background:#fff">Print</button>
            <button onclick="window.close();" style="padding:8px 14px;border-radius:6px;border:1px solid #e6eef8;background:#fff">Close</button>
          </div>
        </div>
      </div>
      <script>
        function tryPrint(){ try{ window.focus(); window.print(); }catch(e){} }
        window.addEventListener('load', function(){ setTimeout(tryPrint, 500); });
      </script>
    </body>
  </html>`;
};
