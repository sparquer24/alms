import { formatStatusLabel } from './formatters';

/**
 * Generates a self-contained HTML string for a print-friendly application view.
 * Opened in a popup window via handleBrowserPrint().
 *
 * Key fixes:
 * - Full personal info: DOB in Words, PAN, Aadhar  (supports flat & nested personalDetails)
 * - Applicant passport photo: fixed 3.5 cm × 4.5 cm, object-fit:cover
 * - Uploaded document images: max-width:100%, max-height:240px — no overflow
 * - Auto-print deferred 1 s after load (gives images time to load)
 * - Print & Close buttons hidden during @media print
 */
export const generateApplicationPrintHtml = (
  application: any,
  applicationId: string | null,
): string => {
  /* ── Data extraction ─────────────────────────────────────── */

  // API may return personal fields flat OR nested inside personalDetails
  const pd = application?.personalDetails || application || {};

  const firstName    = pd.firstName    || application?.firstName    || '';
  const middleName   = pd.middleName   || application?.middleName   || '';
  const lastName     = pd.lastName     || application?.lastName     || '';
  const applicantName =
    [firstName, middleName, lastName].filter(Boolean).join(' ') ||
    application?.applicantName ||
    application?.fullName ||
    'N/A';

  const parentSpouse    = pd.parentOrSpouseName || application?.parentOrSpouseName || '';
  const sex             = pd.sex             || application?.sex             || '';
  const dob             = pd.dateOfBirth     || application?.dateOfBirth     || application?.dob || '';
  const dobInWords      = pd.dobInWords      || application?.dobInWords      || '';
  const placeOfBirth    = pd.placeOfBirth    || application?.placeOfBirth    || '';
  const panNumber       = pd.panNumber       || application?.panNumber       || '';
  const aadharNumber    = pd.aadharNumber    || application?.aadharNumber    || '';
  const acknowledgementNo = pd.acknowledgementNo || application?.acknowledgementNo || '';
  const filledBy        = pd.filledBy        || application?.filledBy        || '';
  const mobileNumber    =
    application?.contactInfo?.mobileNumber ||
    application?.mobileNumber ||
    application?.applicantMobile || '';
  const email =
    application?.contactInfo?.email ||
    application?.email ||
    application?.applicantEmail || '';

  const photoUrl = application?.photoUrl || application?.photo || '';

  /* ── Helpers ─────────────────────────────────────────────── */

  const esc = (s: string) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const fmtDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const fmtDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Row helper — label + value pair
  const row = (label: string, value: string, mono = false) =>
    value && value !== 'N/A'
      ? `<tr>
           <td class="lbl">${esc(label)}</td>
           <td class="val${mono ? ' mono' : ''}">${esc(value)}</td>
         </tr>`
      : `<tr>
           <td class="lbl">${esc(label)}</td>
           <td class="val na">—</td>
         </tr>`;

  /* ── Personal Information card ───────────────────────────── */
  const personalSection = `
<div class="card">
  <div class="card-header"><span class="dot blue"></span>Personal Information</div>
  <div class="pi-wrap">
    <div class="pi-table">
      <table>
        <tbody>
          ${row('Full Name', applicantName)}
          ${row('Parent / Spouse Name', parentSpouse || 'N/A')}
          ${row('Gender', sex || 'N/A')}
          ${row('Place of Birth', placeOfBirth || 'N/A')}
          ${row('Date of Birth', fmtDate(dob))}
          ${row('Date of Birth (in Words)', dobInWords || 'N/A')}
          ${row('PAN Number', panNumber || 'N/A', true)}
          ${row('Aadhar Number', aadharNumber || 'N/A', true)}
          ${filledBy ? row('Filled By', filledBy) : ''}
          ${mobileNumber ? row('Mobile', mobileNumber) : ''}
          ${email ? row('Email', email) : ''}
          ${acknowledgementNo ? row('Acknowledgement No.', acknowledgementNo, true) : ''}
        </tbody>
      </table>
    </div>
    <div class="pi-photo">
      ${
        photoUrl
          ? `<img src="${esc(photoUrl)}" alt="Applicant Photo" class="passport-photo" />`
          : `<div class="passport-photo no-photo">No Photo</div>`
      }
      <p class="photo-caption">Passport Photo</p>
    </div>
  </div>
</div>`;

  /* ── Address card ────────────────────────────────────────── */
  const presentAddr   = application?.presentAddress;
  const permanentAddr = application?.permanentAddress;

  const addrBlock = (label: string, addr: any) => {
    if (!addr) return '';
    const line       = addr.addressLine || addr.address || '';
    const state      = addr.state?.name  || addr.stateName  || '';
    const district   = addr.district?.name || addr.districtName || '';
    const ps         = addr.policeStation?.name || addr.policeStationName || '';
    const sinceWhen  = addr.sinceResiding || '';
    return `
<div class="addr-block">
  <div class="addr-label">${esc(label)}</div>
  <table>
    <tbody>
      ${line      ? row('Address',        line)      : ''}
      ${ps        ? row('Police Station', ps)        : ''}
      ${district  ? row('District',       district)  : ''}
      ${state     ? row('State',          state)     : ''}
      ${sinceWhen ? row('Residing Since', sinceWhen) : ''}
    </tbody>
  </table>
</div>`;
  };

  const addressSection =
    presentAddr || permanentAddr
      ? `<div class="card">
           <div class="card-header"><span class="dot orange"></span>Address Details</div>
           <div class="addr-grid">
             ${addrBlock('Present Address', presentAddr)}
             ${addrBlock('Permanent Address', permanentAddr)}
           </div>
         </div>`
      : '';

  /* ── Contact / Occupation card ───────────────────────────── */
  const occ = application?.occupationAndBusiness || application?.occupationInfo;
  const occupationSection = occ
    ? `<div class="card">
         <div class="card-header"><span class="dot green"></span>Occupation &amp; Business</div>
         <table>
           <tbody>
             ${occ.occupation     ? row('Occupation',       occ.occupation)     : ''}
             ${occ.officeAddress  ? row('Office Address',   occ.officeAddress)  : ''}
             ${occ.cropLocation   ? row('Crop Location',    occ.cropLocation)   : ''}
             ${occ.areaUnderCultivation != null
               ? row('Area Under Cultivation', String(occ.areaUnderCultivation))
               : ''}
           </tbody>
         </table>
       </div>`
    : '';

  /* ── License Details card ────────────────────────────────── */
  const licenseDetails = application?.licenseDetails;
  const licenseSection =
    Array.isArray(licenseDetails) && licenseDetails.length > 0
      ? `<div class="card">
           <div class="card-header"><span class="dot purple"></span>License Details</div>
           ${licenseDetails
             .map(
               (d: any, i: number) => {
                 const weapons =
                   Array.isArray(d.requestedWeapons) && d.requestedWeapons.length > 0
                     ? d.requestedWeapons.map((w: any) => esc(w.name || '')).join(', ')
                     : '—';
                 return `
<div class="license-entry${i > 0 ? ' mt-8' : ''}">
  <table>
    <tbody>
      ${d.needForLicense            ? row('Need for License',       d.needForLicense)            : ''}
      ${d.armsCategory              ? row('Arms Category',          d.armsCategory)              : ''}
      ${d.areaOfValidity            ? row('Area of Validity',       d.areaOfValidity)            : ''}
      <tr><td class="lbl">Requested Weapons</td><td class="val">${weapons}</td></tr>
      ${d.ammunitionDescription     ? row('Ammunition',             d.ammunitionDescription)     : ''}
      ${d.specialConsiderationReason ? row('Special Consideration', d.specialConsiderationReason) : ''}
    </tbody>
  </table>
</div>`;
               },
             )
             .join('')}
         </div>`
      : '';

  /* ── Documents Uploaded card ─────────────────────────────── */

  // Collect all uploaded documents (flat fileUploads OR mapped documents array)
  const rawDocs: any[] =
    (application?.documents && Array.isArray(application.documents)
      ? application.documents
      : []) ||
    (application?.fileUploads && Array.isArray(application.fileUploads)
      ? application.fileUploads.map((f: any) => ({
          name    : f.fileName || f.name || 'file',
          type    : f.fileType || f.type || '',
          url     : f.fileUrl  || f.url  || '',
          fileType: f.fileType || '',
        }))
      : []);

  // Exclude the applicant photo (PHOTOGRAPH) from document gallery — it's already in the header
  const docList = rawDocs.filter(
    (d: any) =>
      !['PHOTOGRAPH', 'PHOTO'].includes(
        String(d.fileType || d.type || '').toUpperCase(),
      ),
  );

  const isImage = (name: string, mime: string) =>
    /^image\//i.test(mime) || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name);

  const isPdf = (name: string, mime: string) =>
    /pdf/i.test(mime) || /\.pdf$/i.test(name);

  const docCards = docList
    .map((doc: any, idx: number) => {
      const name  = doc.name  || doc.fileName  || `Document ${idx + 1}`;
      const type  = doc.type  || doc.fileType  || '';
      const mime  = doc.contentType || doc.mime || type || '';
      const url   = doc.url   || doc.fileUrl   || doc.path || '';
      if (!url) return '';

      let preview = '';
      if (isImage(name, mime)) {
        preview = `<img src="${esc(url)}" alt="${esc(name)}" class="doc-img" />`;
      } else if (isPdf(name, mime)) {
        preview = `
<div class="doc-pdf-icon">
  <svg viewBox="0 0 24 24" fill="#dc2626"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9M6,20V4H12V10H18V20H6Z"/></svg>
  <span>PDF</span>
</div>`;
      } else {
        preview = `
<div class="doc-file-icon">
  <svg viewBox="0 0 24 24" fill="#6b7280"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>
  <span>File</span>
</div>`;
      }

      return `
<div class="doc-card">
  <div class="doc-preview">${preview}</div>
  <div class="doc-meta">
    ${type ? `<span class="doc-type-badge">${esc(type)}</span>` : ''}
    <a href="${esc(url)}" class="doc-link" target="_blank" rel="noopener">${esc(name.length > 36 ? name.substring(0, 34) + '…' : name)}</a>
  </div>
</div>`;
    })
    .join('');

  const documentsSection = `
<div class="card">
  <div class="card-header"><span class="dot teal"></span>Documents Uploaded</div>
  ${
    docCards.trim()
      ? `<div class="doc-grid">${docCards}</div>`
      : `<p class="muted">No documents uploaded</p>`
  }
</div>`;

  /* ── Application History card ────────────────────────────── */

  // Collect workflow histories
  const wfHistories: any[] = Array.isArray(application?.workflowHistories)
    ? application.workflowHistories
    : Array.isArray(application?.history)
    ? application.history
    : [];

  const historySection = `
<div class="card">
  <div class="card-header"><span class="dot gray"></span>Application History</div>
  ${
    wfHistories.length > 0
      ? `<ol class="history-list">
          ${wfHistories
            .map((h: any) => {
              const when    = h.createdAt  || h.date       || '';
              const who     = h.performedBy || h.by        || h.user  || h.actor || '';
              const action  = h.actionTaken || h.action    || h.status || '';
              const comment = h.remarks    || h.comments   || h.comment || h.notes || '';
              return `
<li class="history-item">
  <div class="history-meta">
    ${when   ? `<span class="h-when">${esc(fmtDateTime(when))}</span>` : ''}
    ${who    ? `<span class="h-who">${esc(who)}</span>` : ''}
    ${action ? `<span class="h-action">${esc(action)}</span>` : ''}
  </div>
  ${comment ? `<div class="h-comment">${esc(comment)}</div>` : ''}
</li>`;
            })
            .join('')}
         </ol>`
      : `<p class="muted">No history available</p>`
  }
</div>`;

  /* ── Status / App ID card ────────────────────────────────── */
  const appId = String(application?.id || applicationId || application?.applicationId || '');
  const statusLabel = formatStatusLabel(
    application?.workflowStatus || application?.status,
  );
  const applicationType =
    application?.applicationType || application?.formType || 'Fresh License';
  const submittedAt = application?.applicationDate || application?.createdAt || '';

  const overviewSection = `
<div class="card" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
  <div>
    <div class="lbl">Application ID</div>
    <div class="val mono" style="font-size:15px">${esc(appId)}</div>
    ${acknowledgementNo ? `<div class="lbl" style="margin-top:8px">Acknowledgement No.</div><div class="val mono">${esc(acknowledgementNo)}</div>` : ''}
  </div>
  <div style="text-align:right">
    <div class="lbl">Application Type</div>
    <div class="val">${esc(applicationType)}</div>
    ${submittedAt ? `<div class="lbl" style="margin-top:8px">Submitted</div><div class="val">${esc(fmtDateTime(submittedAt))}</div>` : ''}
  </div>
</div>`;

  /* ── CSS ─────────────────────────────────────────────────── */
  const css = `
/* Reset */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;font-size:13px;color:#111;background:#f3f4f6}

/* Page wrapper */
.page{max-width:860px;margin:20px auto 40px;background:#fff;border:1px solid #d1d5db;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)}

/* Print header */
.print-header{background:#001F54;color:#fff;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px}
.brand{display:flex;gap:12px;align-items:center}
.brand-icon{width:40px;height:40px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;border-radius:8px;flex-shrink:0}
.brand h1{font-size:17px;font-weight:700;margin:0}
.brand p{font-size:11px;opacity:.82;margin:0;margin-top:2px}
.status-badge{background:#fff;color:#001F54;padding:5px 14px;border-radius:999px;font-weight:700;font-size:12px;letter-spacing:.4px;white-space:nowrap}

/* Content area */
.content{padding:20px 24px}

/* Card */
.card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px}
.card-header{font-size:14px;font-weight:700;color:#001F54;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0}
.dot.blue{background:#3b82f6}
.dot.orange{background:#f97316}
.dot.green{background:#22c55e}
.dot.purple{background:#8b5cf6}
.dot.teal{background:#14b8a6}
.dot.gray{background:#9ca3af}

/* Table inside cards */
table{width:100%;border-collapse:collapse}
.lbl{font-size:11px;color:#6b7280;padding:5px 8px 5px 0;width:42%;vertical-align:top;white-space:nowrap}
.val{font-weight:600;color:#111;padding:5px 0;word-break:break-word}
.val.mono{font-family:"Courier New",Courier,monospace;font-size:12px}
.val.na{color:#9ca3af;font-weight:400;font-style:italic}

/* Personal Information layout */
.pi-wrap{display:flex;gap:20px;align-items:flex-start}
.pi-table{flex:1;min-width:0}
.pi-photo{flex-shrink:0;text-align:center}
/* Passport photo: 3.5cm × 4.5cm (≈ 132px × 170px @ 96dpi) */
.passport-photo{width:132px;height:170px;object-fit:cover;object-position:top center;border:1px solid #d1d5db;border-radius:4px;display:block}
.no-photo{display:flex;align-items:center;justify-content:center;background:#f3f4f6;color:#9ca3af;font-size:11px}
.photo-caption{font-size:10px;color:#6b7280;margin-top:4px}

/* Address grid */
.addr-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.addr-label{font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb}

/* License */
.license-entry{border:1px solid #e5e7eb;border-radius:6px;padding:12px}
.mt-8{margin-top:8px}

/* Documents grid */
.doc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
.doc-card{border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;display:flex;flex-direction:column}
.doc-preview{background:#f9fafb;display:flex;align-items:center;justify-content:center;height:140px;overflow:hidden;position:relative}

/* *** Image sizing fix: constrain to preview box *** */
.doc-img{max-width:100%;max-height:140px;width:auto;height:auto;object-fit:contain;display:block}

.doc-pdf-icon,.doc-file-icon{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px}
.doc-pdf-icon svg,.doc-file-icon svg{width:48px;height:48px}
.doc-pdf-icon span,.doc-file-icon span{font-size:11px;font-weight:700;color:#6b7280}
.doc-meta{padding:8px;background:#fff;border-top:1px solid #e5e7eb;display:flex;flex-direction:column;gap:4px}
.doc-type-badge{font-size:9px;font-weight:700;color:#065f46;background:#d1fae5;padding:2px 6px;border-radius:999px;display:inline-block;width:fit-content;text-transform:uppercase}
.doc-link{font-size:11px;color:#1d4ed8;word-break:break-all;text-decoration:none}
.doc-link:hover{text-decoration:underline}

/* History */
.history-list{list-style:none;display:flex;flex-direction:column;gap:8px}
.history-item{padding:10px 12px;border-left:3px solid #3b82f6;background:#f8fafc;border-radius:0 6px 6px 0}
.history-meta{display:flex;flex-wrap:wrap;gap:10px;font-size:11px;color:#374151}
.h-when{color:#6b7280}
.h-who{font-weight:600}
.h-action{background:#dbeafe;color:#1e40af;padding:1px 8px;border-radius:999px;font-weight:600;font-size:10px}
.h-comment{margin-top:6px;font-size:12px;color:#374151;padding-left:4px;border-left:2px solid #e5e7eb}

/* Misc */
.muted{color:#6b7280;font-style:italic;font-size:12px}
.footer-note{text-align:center;color:#9ca3af;font-size:11px;margin-top:8px;padding-bottom:12px}

/* Action buttons (hidden during print) */
.print-actions{display:flex;justify-content:center;gap:12px;padding:16px 0 20px;border-top:1px solid #e5e7eb;margin-top:4px}
.btn{padding:8px 20px;border-radius:6px;border:1px solid #d1d5db;background:#fff;color:#374151;cursor:pointer;font-size:13px;font-weight:500}
.btn:hover{background:#f9fafb}
.btn-primary{background:#001F54;color:#fff;border-color:#001F54}
.btn-primary:hover{background:#002a70}

/* ── Print Media ──────────────────────────────────────────── */
@media print{
  html,body{background:#fff;font-size:12px}
  .page{box-shadow:none;border:none;border-radius:0;margin:0;max-width:100%}
  .print-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .card{page-break-inside:avoid;border-color:#ccc}
  .history-item{page-break-inside:avoid}
  .doc-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}
  .print-actions{display:none!important}
  a{color:#1d4ed8;text-decoration:none}
}`;

  /* ── Final HTML assembly ─────────────────────────────────── */
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Application ${esc(appId)} — Official Print</title>
    <style>${css}</style>
  </head>
  <body>
    <div class="page">

      <!-- Header -->
      <div class="print-header">
        <div class="brand">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C7.03 2 3 6.03 3 11c0 5.86 5.06 10.48 9 11 3.94-.52 9-5.14 9-11 0-4.97-4.03-9-9-9z"
                stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <h1>Arms License Management System</h1>
            <p>Official Application Printout</p>
          </div>
        </div>
        <div class="status-badge">${esc(String(statusLabel).toUpperCase())}</div>
      </div>

      <!-- Body -->
      <div class="content">
        ${overviewSection}
        ${personalSection}
        ${addressSection}
        ${occupationSection}
        ${licenseSection}
        ${documentsSection}
        ${historySection}

        <p class="footer-note">Generated on ${new Date().toLocaleString('en-IN')}</p>
      </div>

      <!-- Action buttons (hidden during actual print) -->
      <div class="print-actions">
        <button class="btn btn-primary" onclick="window.print()">🖨 Print</button>
        <button class="btn" onclick="window.close()">✕ Close</button>
      </div>

    </div>
    <script>
      /* Auto-print after all images load (or 1.5 s max wait) */
      (function () {
        var printed = false;
        function doPrint() {
          if (printed) return;
          printed = true;
          try { window.focus(); window.print(); } catch (e) { /* ignore */ }
        }
        /* Wait for all images */
        var imgs = Array.prototype.slice.call(document.querySelectorAll('img'));
        if (imgs.length === 0) {
          setTimeout(doPrint, 600);
          return;
        }
        var loaded = 0;
        var total  = imgs.length;
        var timer  = setTimeout(doPrint, 1500); /* safety net */
        imgs.forEach(function (img) {
          if (img.complete) {
            loaded++;
            if (loaded >= total) { clearTimeout(timer); setTimeout(doPrint, 400); }
          } else {
            img.addEventListener('load',  function () {
              loaded++;
              if (loaded >= total) { clearTimeout(timer); setTimeout(doPrint, 400); }
            });
            img.addEventListener('error', function () {
              loaded++;
              if (loaded >= total) { clearTimeout(timer); setTimeout(doPrint, 400); }
            });
          }
        });
      })();
    </script>
  </body>
</html>`;
};
