// This utility file contains functions to generate PDF documents from application data
import { ApplicationData } from "../types";

// Function to create a PDF from application data
export const generateApplicationPDF = async (application: ApplicationData): Promise<void> => {  // Dynamically import jspdf to reduce bundle size
  // These will only be loaded when the user wants to generate a PDF
  const { default: jsPDF } = await import('jspdf');
  // Note: html2canvas import removed as it's currently not used

  try {
    // Create a new PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Add header with emblem
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('GOVERNMENT OF INDIA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(14);
    doc.text('ARMS LICENSE APPLICATION', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Application ID: ${application.id}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Add horizontal line
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Application Information
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('APPLICATION DETAILS', margin, yPosition);
    yPosition += 8;

    // Application Status
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Status: ${application.status.toUpperCase()}`, margin, yPosition);
    yPosition += 6;

    doc.text(`Date of Application: ${formatDate(application.applicationDate)}`, margin, yPosition);
    yPosition += 6;

    doc.text(`Last Updated: ${formatDate(application.lastUpdated)}`, margin, yPosition);
    yPosition += 10;

    // Applicant Information
    doc.setFont('helvetica', 'bold');
    doc.text('APPLICANT INFORMATION', margin, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${application.applicantName}`, margin, yPosition);
    yPosition += 6;

    doc.text(`Mobile: ${application.applicantMobile}`, margin, yPosition);
    yPosition += 6;

    // Application Type and Processing Details
    doc.setFont('helvetica', 'bold');
    yPosition += 4;
    doc.text('LICENSE INFORMATION', margin, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.text(`Application Type: ${application.applicationType}`, margin, yPosition);
    yPosition += 6;

    doc.text(`Assigned To: ${application.assignedTo}`, margin, yPosition);
    yPosition += 6;

    if (application.forwardedFrom) {
      doc.text(`Forwarded From: ${application.forwardedFrom}`, margin, yPosition);
      yPosition += 6;
    }

    if (application.forwardedTo) {
      doc.text(`Forwarded To: ${application.forwardedTo}`, margin, yPosition);
      yPosition += 6;
    }

    // Process-specific details
    yPosition += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('PROCESS DETAILS', margin, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    switch (application.status) {
      case 'approved':
        doc.text('This application has been APPROVED.', margin, yPosition);
        break;
      case 'rejected':
        doc.text('This application has been REJECTED.', margin, yPosition);
        break;
      case 'returned':
        doc.text('This application has been RETURNED.', margin, yPosition);
        yPosition += 6;
        doc.text(`Reason: ${application.returnReason || 'Not specified'}`, margin, yPosition);
        break;
      case 'red-flagged':
        doc.text('This application has been RED FLAGGED.', margin, yPosition);
        yPosition += 6;
        doc.text(`Reason: ${application.flagReason || 'Not specified'}`, margin, yPosition);
        break;
      case 'disposed':
        doc.text('This application has been DISPOSED.', margin, yPosition);
        yPosition += 6;
        doc.text(`Reason: ${application.disposalReason || 'Not specified'}`, margin, yPosition);
        break;
      case 'initiated':
        doc.text('This application has been INITIATED and is awaiting processing.', margin, yPosition);
        break;
      default:
        doc.text('This application is PENDING and awaiting review.', margin, yPosition);
    }

    // Footer
    yPosition = pageHeight - 20;
    doc.setFontSize(8);
    doc.text('This document was generated from Arms License Management System.', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

    // Save the PDF
    doc.save(`Application_${application.id}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Could not generate PDF');
  }
};

// Function to create a batch report PDF from multiple application data
export const generateBatchReportPDF = async (applications: ApplicationData[], reportTitle: string = "Applications Report"): Promise<void> => {
  const { default: jsPDF } = await import('jspdf');

  try {
    // Create a new PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Add header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('GOVERNMENT OF INDIA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(14);
    doc.text(reportTitle.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Applications: ${applications.length}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    doc.text(`Report Date: ${formatDate(new Date().toISOString())}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Add horizontal line
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Create a summary of applications by status
    const statusCounts: Record<string, number> = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Display summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('SUMMARY BY STATUS', margin, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    for (const [status, count] of Object.entries(statusCounts)) {
      doc.text(
        `${status.charAt(0).toUpperCase() + status.slice(1)}: ${count} application(s)`,
        margin,
        yPosition
      );
      yPosition += 6;
    }

    yPosition += 6;

    // Applications table header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('APPLICATIONS LIST', margin, yPosition);
    yPosition += 8;

    // Table headers
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, pageWidth - (margin * 2), 8, 'F');

    doc.setFontSize(9);
    doc.text("ID", margin + 2, yPosition + 5);
    doc.text("Applicant", margin + 25, yPosition + 5);
    doc.text("Type", margin + 70, yPosition + 5);
    doc.text("Date", margin + 95, yPosition + 5);
    doc.text("Status", margin + 130, yPosition + 5);
    doc.text("Assigned To", margin + 155, yPosition + 5);
    yPosition += 8;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Loop through applications and add rows to table
    for (const app of applications) {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;

        // Table headers on new page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPosition, pageWidth - (margin * 2), 8, 'F');

        doc.text("ID", margin + 2, yPosition + 5);
        doc.text("Applicant", margin + 25, yPosition + 5);
        doc.text("Type", margin + 70, yPosition + 5);
        doc.text("Date", margin + 95, yPosition + 5);
        doc.text("Status", margin + 130, yPosition + 5);
        doc.text("Assigned To", margin + 155, yPosition + 5);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      // Add alternating row background
      if ((applications.indexOf(app) % 2) === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPosition, pageWidth - (margin * 2), 6, 'F');
      }

      doc.text(app.id, margin + 2, yPosition + 4);
      doc.text(
        app.applicantName.length > 25
          ? app.applicantName.substring(0, 25) + '...'
          : app.applicantName,
        margin + 25,
        yPosition + 4
      );
      doc.text(
        app.applicationType.length > 12
          ? app.applicationType.substring(0, 12) + '...'
          : app.applicationType,
        margin + 70,
        yPosition + 4
      );
      doc.text(formatDate(app.applicationDate), margin + 95, yPosition + 4);
      doc.text(app.status.charAt(0).toUpperCase() + app.status.slice(1), margin + 130, yPosition + 4);
      doc.text(
        app.assignedTo.length > 15
          ? app.assignedTo.substring(0, 15) + '...'
          : app.assignedTo,
        margin + 155,
        yPosition + 4
      );

      yPosition += 6;
    }

    // Footer
    yPosition = pageHeight - 20;
    doc.setFontSize(8);
    doc.text('This report was generated from Arms License Management System.', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

    // Save the PDF
    const fileName = `Applications_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    return;
  } catch (error) {
    console.error('Error generating batch report PDF:', error);
    throw new Error('Could not generate batch report PDF');
  }
};

// Helper function to format dates
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Helper function to generate a print-friendly HTML view of an application
export const getApplicationPrintHTML = (application: ApplicationData): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">ARMS LICENSE APPLICATION</h2>
        <p style="margin: 5px 0;">Application ID: ${application.id}</p>
        <p style="margin: 5px 0;">Status: ${application.status.toUpperCase()}</p>
      </div>
      
      <div style="border-top: 1px solid #ccc; padding-top: 15px; margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0;">Applicant Information</h3>
        <p><strong>Name:</strong> ${application.applicantName}</p>
        <p><strong>Mobile:</strong> ${application.applicantMobile}</p>
      </div>
      
      <div style="border-top: 1px solid #ccc; padding-top: 15px; margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0;">Application Details</h3>
        <p><strong>Application Type:</strong> ${application.applicationType}</p>
        <p><strong>Date:</strong> ${formatDate(application.applicationDate)}</p>
        <p><strong>Last Updated:</strong> ${formatDate(application.lastUpdated)}</p>
        <p><strong>Assigned To:</strong> ${application.assignedTo}</p>
        ${application.forwardedFrom ? `<p><strong>Forwarded From:</strong> ${application.forwardedFrom}</p>` : ''}
        ${application.forwardedTo ? `<p><strong>Forwarded To:</strong> ${application.forwardedTo}</p>` : ''}
      </div>
      
      ${application.returnReason ? `
      <div style="border: 1px solid #f0ad4e; background-color: #fcf8e3; padding: 15px; margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; color: #8a6d3b;">Return Reason</h3>
        <p>${application.returnReason}</p>
      </div>
      ` : ''}
      
      ${application.flagReason ? `
      <div style="border: 1px solid #d9534f; background-color: #f2dede; padding: 15px; margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; color: #a94442;">Red Flag Reason</h3>
        <p>${application.flagReason}</p>
      </div>
      ` : ''}
      
      ${application.disposalReason ? `
      <div style="border: 1px solid #5bc0de; background-color: #d9edf7; padding: 15px; margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; color: #31708f;">Disposal Reason</h3>
        <p>${application.disposalReason}</p>
      </div>
      ` : ''}
      
      <div style="margin-top: 30px; font-size: 12px; text-align: center; color: #777;">
        <p>This document was generated from Arms License Management System.</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </div>
  `;
};

// Helper function to generate a print-friendly HTML view of multiple applications as a report
export const getBatchReportHTML = (applications: ApplicationData[], reportTitle: string = "Applications Report"): string => {
  // Create a summary of applications by status
  const statusCounts: Record<string, number> = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusSummaryHTML = Object.entries(statusCounts)
    .map(([status, count]) => `
      <div class="status-item">
        <span class="status-label">${status.charAt(0).toUpperCase() + status.slice(1)}:</span>
        <span class="status-count">${count} application(s)</span>
      </div>
    `)
    .join('');

  const applicationsHTML = applications.map((app, index) => `
    <tr class="${index % 2 === 0 ? 'even-row' : 'odd-row'}">
      <td>${app.id}</td>
      <td>${app.applicantName}</td>
      <td>${app.applicationType}</td>
      <td>${formatDate(app.applicationDate)}</td>
      <td>
        <span class="status-pill status-${app.status}">
          ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}
        </span>
      </td>
      <td>${app.assignedTo}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">ARMS LICENSE MANAGEMENT SYSTEM</h2>
        <h3 style="margin: 10px 0;">${reportTitle.toUpperCase()}</h3>
        <p style="margin: 5px 0;">Total Applications: ${applications.length}</p>
        <p style="margin: 5px 0;">Report Date: ${formatDate(new Date().toISOString())}</p>
      </div>
      
      <div style="border-top: 1px solid #ccc; padding-top: 15px; margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0;">Summary by Status</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
          ${statusSummaryHTML}
        </div>
      </div>
      
      <div style="border-top: 1px solid #ccc; padding-top: 15px;">
        <h3 style="margin: 0 0 10px 0;">Applications List</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">ID</th>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Applicant</th>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Type</th>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Date</th>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Status</th>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            ${applicationsHTML}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; text-align: center; color: #777;">
        <p>This report was generated from Arms License Management System.</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
      
      <style>
        .even-row {
          background-color: #f9f9f9;
        }
        .odd-row {
          background-color: #ffffff;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        .status-pill {
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        }
        .status-pending {
          background-color: #FACC15;
          color: black;
        }
        .status-approved {
          background-color: #10B981;
          color: white;
        }
        .status-rejected {
          background-color: #EF4444;
          color: white;
        }
        .status-returned {
          background-color: #F97316;
          color: white;
        }
        .status-red-flagged {
          background-color: #DC2626;
          color: white;
        }
        .status-disposed {
          background-color: #9CA3AF;
          color: white;
        }
        .status-initiated {
          background-color: #A7F3D0;
          color: #047857;
        }
        .status-item {
          background-color: #f0f0f0;
          padding: 5px 12px;
          border-radius: 5px;
        }
        .status-label {
          font-weight: 600;
          margin-right: 5px;
        }
      </style>
    </div>
  `;
};
