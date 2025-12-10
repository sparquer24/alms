'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent as EditorContentComponent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableHeader } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import HardBreak from '@tiptap/extension-hard-break';
import Paragraph from '@tiptap/extension-paragraph';
import Link from '@tiptap/extension-link';

// Type fix for EditorContent JSX compatibility
const EditorContent = EditorContentComponent as any;

interface TiptapRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  maxHeight?: string;
  contentType?: 'remarks' | 'letter' | 'report' | 'armsLicense' | 'general';
  showTemplates?: boolean;
}

// Content type templates for officers - Professional website builder style
const CONTENT_TEMPLATES = {
  remarks: {
    label: '📝 Officer Remarks',
    description: 'Structured observations and case notes',
    template: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem;">
    <h1 style="margin: 0 0 0.5rem 0; font-size: 2rem;">Case Remarks & Observations</h1>
    <p style="margin: 0; opacity: 0.95;">Detailed notes and findings for case reference</p>
  </div>

  <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 0.375rem; margin-bottom: 1.5rem;">
    <p style="margin: 0;"><strong>📅 Date:</strong> ${new Date().toLocaleDateString()}</p>
    <p style="margin: 0.5rem 0 0 0;"><strong>👤 Officer Name:</strong> [Your Name]</p>
  </div>

  <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 1.5rem;">🔍 Key Observations</h2>
  <div style="background: white; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; margin-bottom: 1.5rem;">
    <ul style="margin: 0; padding-left: 1.5rem;">
      <li style="margin-bottom: 0.75rem;"><strong>Initial Observation:</strong> [Describe what you first noticed]</li>
      <li style="margin-bottom: 0.75rem;"><strong>Key Finding:</strong> [Important detail or evidence]</li>
      <li style="margin-bottom: 0.75rem;"><strong>Additional Note:</strong> [Any other relevant information]</li>
      <li style="margin-bottom: 0;"><strong>Witness Information:</strong> [If applicable, note any witnesses]</li>
    </ul>
  </div>

  <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">⚠️ Critical Points</h2>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 0.375rem;">
      <h3 style="margin: 0 0 0.5rem 0; color: #92400e;">Risks Identified</h3>
      <p style="margin: 0; color: #78350f;">List any potential risks or concerns...</p>
    </div>
    <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 1rem; border-radius: 0.375rem;">
      <h3 style="margin: 0 0 0.5rem 0; color: #15803d;">Positive Findings</h3>
      <p style="margin: 0; color: #166534;">List any positive outcomes or evidence...</p>
    </div>
  </div>

  <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">📋 Conclusion</h2>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 0.375rem; margin-bottom: 1rem;">
    <p style="margin: 0; line-height: 1.6;">[Write your conclusion here. Summarize the key findings and what they mean for the case]</p>
  </div>

  <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 1rem; border-radius: 0.375rem; margin-top: 1.5rem;">
    <p style="margin: 0; font-size: 0.875rem;"><strong>✓ Status:</strong> Ready for review</p>
  </div>
</div>`,
  },

  letter: {
    label: '💌 Official Letter',
    description: 'Professional formal correspondence',
    template: `<div style="font-family: Georgia, 'Times New Roman', serif; color: #1f2937; line-height: 1.8;">
  <div style="max-width: 8.5in; margin: 0 auto; padding: 2rem; background: white;">
    <div style="border-bottom: 3px solid #1f2937; padding-bottom: 1rem; margin-bottom: 2rem;">
      <h1 style="margin: 0; font-size: 1.5rem; color: #1f2937;">OFFICIAL LETTER</h1>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #6b7280;">Department of [Department Name]</p>
    </div>

    <div style="margin-bottom: 2rem;">
      <p style="margin: 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.375rem; margin-bottom: 2rem;">
      <p style="margin: 0; font-weight: 600;">To:</p>
      <p style="margin: 0.25rem 0 0 0;">[Recipient Full Name]</p>
      <p style="margin: 0.25rem 0 0 0;">[Designation/Title]</p>
      <p style="margin: 0.25rem 0 0 0;">[Organization Name]</p>
      <p style="margin: 0.25rem 0 0 0;">[Complete Address]</p>
    </div>

    <div style="background: #fef3c7; padding: 1rem; border-radius: 0.375rem; margin-bottom: 2rem; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-weight: 600; color: #92400e;">Subject: [Write the subject of your letter]</p>
    </div>

    <p style="margin: 0 0 1.5rem 0;">Dear [Recipient Name],</p>

    <div style="background: white; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; margin-bottom: 1.5rem;">
      <h3 style="margin: 0 0 1rem 0; color: #1f2937;">Purpose of Letter:</h3>
      <p style="margin: 0 0 1rem 0;">[Write a brief introduction explaining the purpose of this letter and any relevant background information]</p>

      <h3 style="margin: 1rem 0 0.5rem 0; color: #1f2937;">Key Points:</h3>
      <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
        <li style="margin-bottom: 0.75rem;">[Important point or detail #1]</li>
        <li style="margin-bottom: 0.75rem;">[Important point or detail #2]</li>
        <li style="margin-bottom: 0;">[Important point or detail #3]</li>
      </ul>
    </div>

    <div style="background: #e0f2fe; padding: 1rem; border-radius: 0.375rem; margin-bottom: 2rem; border-left: 4px solid #0284c7;">
      <h3 style="margin: 0 0 0.5rem 0; color: #0c4a6e;">Required Action:</h3>
      <p style="margin: 0; color: #164e63;">[What action should the recipient take? Include any deadlines]</p>
    </div>

    <p style="margin: 0 0 1.5rem 0;">Please feel free to contact me if you have any questions or require further clarification.</p>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem;">
      <p style="margin: 0 0 0.5rem 0;">Sincerely,</p>
      <p style="margin: 2rem 0 0 0; line-height: 1.5;">___________________________<br/><strong>[Officer Full Name]</strong><br/>[Badge Number]<br/>[Designation]<br/>[Contact Information]</p>
    </div>
  </div>
</div>`,
  },

  report: {
    label: '📊 Incident Report',
    description: 'Comprehensive incident documentation',
    template: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem;">
    <h1 style="margin: 0 0 0.5rem 0; font-size: 2rem;">INCIDENT REPORT</h1>
    <p style="margin: 0; opacity: 0.95;">Official documentation of incident and investigation findings</p>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
    <div style="background: #f0f9ff; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #3b82f6;">
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Incident Date</p>
      <p style="margin: 0.25rem 0 0 0; font-weight: 600; font-size: 1.125rem;">[Date of Incident]</p>
    </div>
    <div style="background: #fef3c7; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Report Date</p>
      <p style="margin: 0.25rem 0 0 0; font-weight: 600; font-size: 1.125rem;">${new Date().toLocaleDateString()}</p>
    </div>
    <div style="background: #dcfce7; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #22c55e;">
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Location</p>
      <p style="margin: 0.25rem 0 0 0; font-weight: 600; font-size: 1.125rem;">[Incident Location]</p>
    </div>
  </div>

  <h2 style="background: #1f2937; color: white; padding: 0.75rem 1rem; border-radius: 0.375rem; margin-bottom: 1rem;">📋 Case Summary</h2>
  <div style="background: white; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; margin-bottom: 1.5rem;">
    <p style="margin: 0; line-height: 1.6;">[Provide a brief but comprehensive summary of what happened. Include the incident type, when it occurred, where it occurred, and who was involved]</p>
  </div>

  <h2 style="background: #374151; color: white; padding: 0.75rem 1rem; border-radius: 0.375rem; margin-bottom: 1rem;">👥 Parties Involved</h2>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 0.375rem;">
      <h3 style="margin: 0 0 0.75rem 0; color: #1f2937;">Complainant</h3>
      <p style="margin: 0.25rem 0;"><strong>Name:</strong> [Full Name]</p>
      <p style="margin: 0.25rem 0;"><strong>Contact:</strong> [Phone/Email]</p>
      <p style="margin: 0.25rem 0;"><strong>Address:</strong> [Address]</p>
    </div>
    <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 1rem; border-radius: 0.375rem;">
      <h3 style="margin: 0 0 0.75rem 0; color: #1f2937;">Accused</h3>
      <p style="margin: 0.25rem 0;"><strong>Name:</strong> [Full Name]</p>
      <p style="margin: 0.25rem 0;"><strong>Contact:</strong> [Phone/Email]</p>
      <p style="margin: 0.25rem 0;"><strong>Address:</strong> [Address]</p>
    </div>
  </div>

  <h2 style="background: #374151; color: white; padding: 0.75rem 1rem; border-radius: 0.375rem; margin-bottom: 1rem;">📖 Detailed Account</h2>
  <div style="background: white; border: 1px solid #e5e7eb; padding: 1.5rem; border-radius: 0.375rem; margin-bottom: 1.5rem;">
    <p style="margin: 0 0 1rem 0;"><strong>Chronological Sequence of Events:</strong></p>
    <ol style="margin: 0; padding-left: 1.5rem;">
      <li style="margin-bottom: 0.75rem;">
        <strong>Initial Report:</strong> [When was the incident reported and by whom?]
      </li>
      <li style="margin-bottom: 0.75rem;">
        <strong>Arrival at Scene:</strong> [What was found upon arrival?]
      </li>
      <li style="margin-bottom: 0.75rem;">
        <strong>Initial Investigation:</strong> [What was the initial assessment?]
      </li>
      <li style="margin-bottom: 0.75rem;">
        <strong>Further Investigation:</strong> [What additional steps were taken?]
      </li>
      <li style="margin-bottom: 0;">
        <strong>Current Status:</strong> [What is the current status of the case?]
      </li>
    </ol>
  </div>

  <h2 style="background: #374151; color: white; padding: 0.75rem 1rem; border-radius: 0.375rem; margin-bottom: 1rem;">🔎 Evidence & Findings</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
    <thead>
      <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
        <th style="padding: 0.75rem; text-align: left; color: #1f2937; font-weight: 600;">Item</th>
        <th style="padding: 0.75rem; text-align: left; color: #1f2937; font-weight: 600;">Description</th>
        <th style="padding: 0.75rem; text-align: left; color: #1f2937; font-weight: 600;">Location Found</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 0.75rem;">1</td>
        <td style="padding: 0.75rem;">[Evidence description]</td>
        <td style="padding: 0.75rem;">[Where found]</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 0.75rem;">2</td>
        <td style="padding: 0.75rem;">[Evidence description]</td>
        <td style="padding: 0.75rem;">[Where found]</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 0.75rem;">3</td>
        <td style="padding: 0.75rem;">[Evidence description]</td>
        <td style="padding: 0.75rem;">[Where found]</td>
      </tr>
    </tbody>
  </table>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
    <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 1rem; border-radius: 0.375rem;">
      <h3 style="margin: 0 0 0.5rem 0; color: #15803d;">✓ Findings</h3>
      <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.9rem;">
        <li>[Finding 1]</li>
        <li>[Finding 2]</li>
      </ul>
    </div>
    <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 1rem; border-radius: 0.375rem;">
      <h3 style="margin: 0 0 0.5rem 0; color: #991b1b;">⚠️ Issues/Concerns</h3>
      <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.9rem;">
        <li>[Issue 1]</li>
        <li>[Issue 2]</li>
      </ul>
    </div>
  </div>

  <h2 style="background: #374151; color: white; padding: 0.75rem 1rem; border-radius: 0.375rem; margin-bottom: 1rem;">💼 Conclusion & Recommendations</h2>
  <div style="background: white; border: 1px solid #e5e7eb; padding: 1.5rem; border-radius: 0.375rem; margin-bottom: 1rem;">
    <p style="margin: 0 0 1rem 0;"><strong>Investigation Conclusion:</strong></p>
    <p style="margin: 0 0 1rem 0;">[Summarize your investigation findings and conclusions]</p>
    
    <p style="margin: 0 0 0.75rem 0;"><strong>Recommended Actions:</strong></p>
    <ul style="margin: 0; padding-left: 1.5rem;">
      <li style="margin-bottom: 0.5rem;">[Recommended action 1]</li>
      <li style="margin-bottom: 0.5rem;">[Recommended action 2]</li>
      <li style="margin-bottom: 0;">[Recommended action 3]</li>
    </ul>
  </div>

  <div style="border-top: 2px solid #e5e7eb; padding-top: 1rem;">
    <p style="margin: 0 0 1rem 0;"><strong>Reporting Officer:</strong></p>
    <p style="margin: 0.25rem 0;">___________________________</p>
    <p style="margin: 0.25rem 0;"><strong>[Officer Name] | Badge #[Number]</strong></p>
    <p style="margin: 0.25rem 0;">Date: ${new Date().toLocaleDateString()}</p>
  </div>
</div>`,
  },

  armsLicense: {
    label: '🔫 Arms License Verification',
    description: 'Antecedents verification letter for arms license applications',
    template: `<div style="font-family: Georgia, 'Times New Roman', serif; color: #1f2937; line-height: 1.8;">
  <div style="max-width: 8.5in; margin: 0 auto; padding: 2rem; background: white;">
    <div style="text-align: center; padding-bottom: 1.5rem; border-bottom: 2px solid #1f2937; margin-bottom: 2rem;">
      <p style="margin: 0; font-weight: bold; font-size: 0.9rem;">**[On Official Letterhead]**</p>
      <p style="margin: 0.75rem 0 0 0; font-weight: bold;">Police Station / Law Enforcement Agency</p>
      <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #6b7280;">[Station Name & Address]</p>
    </div>

    <div style="margin-bottom: 2rem;">
      <p style="margin: 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div style="background: #f3f4f6; padding: 1.5rem; border-radius: 0.375rem; margin-bottom: 2rem; border-left: 4px solid #1f2937;">
      <p style="margin: 0; font-weight: 600; margin-bottom: 0.75rem;">To,</p>
      <p style="margin: 0.25rem 0; font-weight: 600;">The Station House Officer (SHO)</p>
      <p style="margin: 0.25rem 0;">[Police Station Name]</p>
      <p style="margin: 0.25rem 0;">[Full Address]</p>
      <p style="margin: 0.25rem 0;">[City, State]</p>
    </div>

    <div style="background: #fffbeb; padding: 1rem; border-left: 4px solid #d97706; border-radius: 0.375rem; margin-bottom: 2rem;">
      <p style="margin: 0;"><strong>Subject:</strong> Verification of Antecedents and Character for Arms License Application</p>
    </div>

    <p style="margin-bottom: 1.5rem;">Respected Sir/Madam,</p>

    <p style="margin-bottom: 1.5rem; text-align: justify;">In compliance with the instructions received from the ARMS Branch, this office has undertaken a detailed verification of the antecedents, character, and background of <strong>[Applicant Name]</strong>, who has applied for issuance/renewal of an arms license.</p>

    <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 1.5rem; border-radius: 0.375rem; margin-bottom: 1.5rem;">
      <h3 style="margin: 0 0 1rem 0; color: #065f46;">📋 Verification Summary</h3>
      <ol style="margin: 0; padding-left: 1.5rem; color: #047857;">
        <li style="margin-bottom: 0.75rem;"><strong>Personal & Residential Verification</strong><br/>The applicant is a permanent resident of the given address. Enquiries confirm continuous residence at the location for the past [X years], along with family members.</li>
        <li style="margin-bottom: 0.75rem;"><strong>Criminal Record Verification</strong><br/>A comprehensive check of the police station records, crime registers, and state crime bureau records reveals [findings].</li>
        <li style="margin-bottom: 0.75rem;"><strong>Neighborhood & Local Inquiry</strong><br/>A door-to-door inquiry was conducted with neighbors, shopkeepers, and other responsible members of the locality. [findings]</li>
        <li style="margin-bottom: 0.75rem;"><strong>Financial & Social Background</strong><br/>The applicant is reported to be financially [status], engaged in [occupation/profession].</li>
        <li style="margin-bottom: 0.75rem;"><strong>Risk Assessment</strong><br/>No intelligence input, local report, or community feedback suggests any risk concerns. [additional details]</li>
        <li style="margin-bottom: 0;"><strong>General Character</strong><br/>The applicant enjoys a [reputation] reputation in the society. [character assessment]</li>
      </ol>
    </div>

    <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 1.5rem; border-radius: 0.375rem; margin-bottom: 1.5rem;">
      <h3 style="margin: 0 0 1rem 0; color: #0c4a6e;">✓ Conclusion & Recommendation</h3>
      <p style="margin: 0; text-align: justify; color: #0c4a6e;">On the basis of the above inquiries and verification conducted by this police station, it is concluded that <strong>[recommendation]</strong>.</p>
    </div>

    <p style="margin-bottom: 2rem;">Thanking you,</p>

    <div style="margin-top: 3rem;">
      <p style="margin: 0; color: #6b7280;">Yours faithfully,</p>
      <p style="margin: 2rem 0 0 0; border-top: 1px solid #1f2937; padding-top: 0.5rem;">___________________________</p>
      <p style="margin: 0.25rem 0;"><strong>[Signature & Seal]</strong></p>
      <p style="margin: 0.25rem 0;"><strong>[Name & Designation]</strong></p>
      <p style="margin: 0.25rem 0;">[Police Station/Unit]</p>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #6b7280;">Date: ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
</div>`,
  },

  general: {
    label: '✍️ Blank Document',
    description: 'Start with a clean slate',
    template: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem;">
    <h1 style="margin: 0; font-size: 2.5rem;">Your Document Title</h1>
  </div>

  <div style="background: #f8fafc; padding: 1.5rem; border-radius: 0.375rem; border-left: 4px solid #3b82f6;">
    <p style="margin: 0; line-height: 1.6;">Start writing your content here. This is a clean, professional template with helpful formatting ready to use. Click to edit this text and add your own content.</p>
  </div>
</div>`,
  },
};

const ToolbarButton = ({
  onClick,
  isActive,
  disabled,
  title,
  icon,
  shortcuts,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  icon: React.ReactNode;
  shortcuts?: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          h-8 w-8 flex items-center justify-center rounded transition-all duration-200
          ${
            isActive
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
        `}
      >
        {icon}
      </button>

      {/* Tooltip - Positioned absolutely with high z-index */}
      {showTooltip && (
        <div
          className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none'
          style={{ zIndex: 9999 }}
        >
          <div className='bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg'>
            <div className='font-medium'>{title}</div>
            {shortcuts && <div className='text-gray-300 text-xs'>{shortcuts}</div>}
            <div className='absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900'></div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TiptapRichTextEditor: React.FC<TiptapRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing... (⌘+⇧+/ for help)',
  disabled = false,
  minHeight = '200px',
  maxHeight = '600px',
  contentType = 'general',
  showTemplates = true,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        hardBreak: false,
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc ml-4',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal ml-4',
          },
        },
        listItem: {},
      }),
      Paragraph,
      HardBreak.configure({
        HTMLAttributes: {
          class: 'break',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'bulletList', 'orderedList'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !disabled,
    immediatelyRender: false,
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B = Bold
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        editor.chain().focus().toggleBold().run();
      }
      // Cmd/Ctrl + I = Italic
      else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        editor.chain().focus().toggleItalic().run();
      }
      // Cmd/Ctrl + U = Underline
      else if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
        e.preventDefault();
        editor.chain().focus().toggleUnderline().run();
      }
      // Cmd/Ctrl + ` = Code
      else if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        editor.chain().focus().toggleCodeBlock().run();
      }
      // Enter = Break line (already default in Tiptap, just ensure it works)
      else if (e.key === 'Enter') {
        // Default behavior is preserved - Enter creates a new paragraph
        // Shift+Enter creates a hard break
        if (e.shiftKey) {
          e.preventDefault();
          editor.chain().focus().setHardBreak().run();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, disabled]);

  if (!mounted || !editor) return null;

  const handleInsertTemplate = (templateKey: string) => {
    const template = CONTENT_TEMPLATES[templateKey as keyof typeof CONTENT_TEMPLATES];
    if (template && template.template) {
      editor.commands.setContent(template.template);
      onChange(template.template);
    }
    setShowTemplateMenu(false);
  };

  return (
    <div className='w-full flex flex-col border border-gray-200 rounded-lg bg-white transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 shadow-sm hover:shadow-md'>
      {/* Compact Toolbar */}
      <div className='bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-1 flex-wrap overflow-visible'>
        {/* Templates Dropdown - Only show if enabled */}
        {showTemplates && (
          <div className='relative'>
            <button
              type='button'
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              disabled={disabled}
              className='h-8 px-3 flex items-center gap-2 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-all'
            >
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z' />
              </svg>
              Templates
            </button>

            {/* Template dropdown menu */}
            {showTemplateMenu && (
              <div className='absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
                <div className='p-2'>
                  {Object.entries(CONTENT_TEMPLATES).map(([key, template]) => (
                    <button
                      key={key}
                      type='button'
                      onClick={() => handleInsertTemplate(key)}
                      className='w-full text-left px-3 py-2 rounded hover:bg-blue-50 transition-colors border-0'
                    >
                      <div className='font-medium text-gray-900 text-sm'>{template.label}</div>
                      <div className='text-xs text-gray-500'>{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        {showTemplates && <div className='w-px h-6 bg-gray-300'></div>}

        {/* Text Formatting Group */}
        <div className='flex items-center gap-0.5 px-1'>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            disabled={disabled}
            title='Bold'
            shortcuts='⌘B'
            icon={<strong className='text-sm'>B</strong>}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            disabled={disabled}
            title='Italic'
            shortcuts='⌘I'
            icon={<em className='text-sm'>I</em>}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            disabled={disabled}
            title='Underline'
            shortcuts='⌘U'
            icon={<u className='text-sm'>U</u>}
          />
        </div>

        {/* Divider */}
        <div className='w-px h-6 bg-gray-300'></div>

        {/* Headings Group */}
        <div className='flex items-center gap-0.5 px-1'>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            disabled={disabled}
            title='Heading 1'
            icon={<span className='text-xs font-bold'>H1</span>}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            disabled={disabled}
            title='Heading 2'
            icon={<span className='text-xs font-bold'>H2</span>}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            disabled={disabled}
            title='Heading 3'
            icon={<span className='text-xs font-bold'>H3</span>}
          />
        </div>

        {/* Divider */}
        <div className='w-px h-6 bg-gray-300'></div>

        {/* Lists Group */}
        <div className='flex items-center gap-0.5 px-1'>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            disabled={disabled}
            title='Bullet List'
            icon={
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <circle cx='4' cy='5' r='1' />
                <circle cx='4' cy='10' r='1' />
                <circle cx='4' cy='15' r='1' />
                <line x1='8' y1='5' x2='16' y2='5' stroke='currentColor' strokeWidth='1.5' />
                <line x1='8' y1='10' x2='16' y2='10' stroke='currentColor' strokeWidth='1.5' />
                <line x1='8' y1='15' x2='16' y2='15' stroke='currentColor' strokeWidth='1.5' />
              </svg>
            }
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            disabled={disabled}
            title='Numbered List'
            icon={
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <text x='2' y='6' fontSize='8' fontWeight='bold' fill='currentColor'>
                  1
                </text>
                <text x='2' y='11' fontSize='8' fontWeight='bold' fill='currentColor'>
                  2
                </text>
                <text x='2' y='16' fontSize='8' fontWeight='bold' fill='currentColor'>
                  3
                </text>
                <line x1='8' y1='5' x2='16' y2='5' stroke='currentColor' strokeWidth='1.5' />
                <line x1='8' y1='10' x2='16' y2='10' stroke='currentColor' strokeWidth='1.5' />
                <line x1='8' y1='15' x2='16' y2='15' stroke='currentColor' strokeWidth='1.5' />
              </svg>
            }
          />
        </div>

        {/* Divider */}
        <div className='w-px h-6 bg-gray-300'></div>

        {/* Alignment Group */}
        <div className='flex items-center gap-0.5 px-1'>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            disabled={disabled}
            title='Align Left'
            icon={
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <line x1='2' y1='4' x2='16' y2='4' stroke='currentColor' strokeWidth='1.5' />
                <line x1='2' y1='8' x2='12' y2='8' stroke='currentColor' strokeWidth='1.5' />
                <line x1='2' y1='12' x2='16' y2='12' stroke='currentColor' strokeWidth='1.5' />
                <line x1='2' y1='16' x2='10' y2='16' stroke='currentColor' strokeWidth='1.5' />
              </svg>
            }
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            disabled={disabled}
            title='Align Center'
            icon={
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <line x1='2' y1='4' x2='16' y2='4' stroke='currentColor' strokeWidth='1.5' />
                <line x1='4' y1='8' x2='14' y2='8' stroke='currentColor' strokeWidth='1.5' />
                <line x1='2' y1='12' x2='16' y2='12' stroke='currentColor' strokeWidth='1.5' />
                <line x1='5' y1='16' x2='13' y2='16' stroke='currentColor' strokeWidth='1.5' />
              </svg>
            }
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            disabled={disabled}
            title='Align Right'
            icon={
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <line x1='4' y1='4' x2='18' y2='4' stroke='currentColor' strokeWidth='1.5' />
                <line x1='8' y1='8' x2='18' y2='8' stroke='currentColor' strokeWidth='1.5' />
                <line x1='4' y1='12' x2='18' y2='12' stroke='currentColor' strokeWidth='1.5' />
                <line x1='10' y1='16' x2='18' y2='16' stroke='currentColor' strokeWidth='1.5' />
              </svg>
            }
          />
        </div>

        {/* Divider */}
        <div className='w-px h-6 bg-gray-300'></div>

        {/* Block Elements Group */}
        <div className='flex items-center gap-0.5 px-1'>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            disabled={disabled}
            title='Block Quote'
            icon={
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M4 8a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z' />
                <path d='M4 14a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z' />
              </svg>
            }
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            disabled={disabled}
            title='Code Block'
            shortcuts='⌘`'
            icon={
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M6 2a1 1 0 00-1 1v2a1 1 0 102 0V3a1 1 0 00-1-1zm8 0a1 1 0 00-1 1v2a1 1 0 102 0V3a1 1 0 00-1-1zm-5 3a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1zm2 0a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z' />
              </svg>
            }
          />
        </div>

        {/* Divider */}
        <div className='w-px h-6 bg-gray-300'></div>

        {/* Table Group */}
        <div className='flex items-center gap-0.5 px-1'>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            disabled={disabled}
            title='Insert Table'
            icon={
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <rect
                  x='2'
                  y='2'
                  width='16'
                  height='16'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                />
                <line x1='10' y1='2' x2='10' y2='18' stroke='currentColor' strokeWidth='1.5' />
                <line x1='2' y1='10' x2='18' y2='10' stroke='currentColor' strokeWidth='1.5' />
              </svg>
            }
          />
          {editor.isActive('table') && (
            <>
              <ToolbarButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                disabled={disabled}
                title='Add Row'
                icon={
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H7a1 1 0 110-2h3V6a1 1 0 011-1z' />
                  </svg>
                }
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteRow().run()}
                disabled={disabled}
                title='Delete Row'
                icon={
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z' />
                    <line x1='7' y1='4' x2='7' y2='8' stroke='currentColor' strokeWidth='1.5' />
                    <line x1='13' y1='4' x2='13' y2='8' stroke='currentColor' strokeWidth='1.5' />
                  </svg>
                }
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                disabled={disabled}
                title='Add Column'
                icon={
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M5 10a1 1 0 011-1h3V7a1 1 0 112 0v2h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 01-1-1z' />
                  </svg>
                }
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteColumn().run()}
                disabled={disabled}
                title='Delete Column'
                icon={
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M4 3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3z' />
                    <line x1='4' y1='7' x2='8' y2='7' stroke='currentColor' strokeWidth='1.5' />
                    <line x1='4' y1='13' x2='8' y2='13' stroke='currentColor' strokeWidth='1.5' />
                  </svg>
                }
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                disabled={disabled}
                title='Delete Table'
                icon={
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5 0a1 1 0 012 0v6a1 1 0 11-2 0V8z' />
                  </svg>
                }
              />
            </>
          )}
        </div>

        {/* Divider */}
        <div className='w-px h-6 bg-gray-300'></div>

        {/* History Group */}
        <div className='flex items-center gap-0.5 px-1'>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title='Undo'
            shortcuts='⌘Z'
            icon={
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M9.707 16.707a1 1 0 01-1.414-1.414L10.586 12H3a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4z' />
              </svg>
            }
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title='Redo'
            shortcuts='⌘⇧Z'
            icon={
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M10.293 3.293a1 1 0 011.414 1.414L9.414 8H17a1 1 0 110 2h-7.586l2.293 2.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4z' />
              </svg>
            }
          />
        </div>
      </div>

      {/* Editor Content Area */}
      <div
        style={{
          minHeight,
          maxHeight,
          overflow: 'auto',
        }}
        className='relative flex-1 p-4 focus:outline-none bg-white text-gray-900 text-base leading-relaxed'
      >
        {editor && <EditorContent editor={editor} />}

        {/* Character count and helper text */}
        <div className='absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none'>
          {editor?.storage.characterCount?.characters() || 0} characters
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className='bg-gray-50 border-t border-gray-200 px-3 py-2 flex items-center justify-between text-xs text-gray-500'>
        <div className='flex items-center gap-2'>
          <span>💡 Tip: Use</span>
          <code className='bg-gray-200 px-1.5 py-0.5 rounded font-mono text-xs'>**bold**</code>
          <span>for quick formatting</span>
        </div>
      </div>

      {/* Styling for editor content */}
      <style jsx>{`
        :global(.tiptap) {
          outline: none;
        }

        :global(.tiptap p) {
          margin: 0.5rem 0;
        }

        :global(.tiptap h1) {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.2;
        }

        :global(.tiptap h2) {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0.875rem 0 0.5rem 0;
          line-height: 1.3;
        }

        :global(.tiptap h3) {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem 0;
          line-height: 1.4;
        }

        :global(.tiptap table) {
          border-collapse: collapse;
          margin: 1rem 0;
          overflow: hidden;
          table-layout: fixed;
          width: 100%;
          border: 1px solid #e5e7eb;
        }

        :global(.tiptap table td),
        :global(.tiptap table th) {
          border: 1px solid #e5e7eb;
          box-sizing: border-box;
          min-width: 1em;
          padding: 0.5rem;
          position: relative;
          vertical-align: top;
        }

        :global(.tiptap table th) {
          background-color: #f9fafb;
          font-weight: 600;
          text-align: left;
          color: #111827;
        }

        :global(.tiptap table tr:nth-child(even) td) {
          background-color: #f9fafb;
        }

        :global(.tiptap table .selectedCell:after) {
          background-color: rgba(59, 130, 246, 0.1);
          content: '';
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
        }

        :global(.tiptap table .column-resize-handle) {
          background-color: #3b82f6;
          bottom: 0;
          cursor: col-resize;
          height: 100%;
          left: 100%;
          pointer-events: none;
          position: absolute;
          top: 0;
          user-select: none;
          width: 2px;
        }

        :global(.tiptap table .column-resize-handle.active) {
          background-color: #2563eb;
          opacity: 1;
        }

        :global(.tiptap ul),
        :global(.tiptap ol) {
          padding: 0.5rem 0;
          margin: 0.5rem 0;
        }

        :global(.tiptap li) {
          margin: 0.25rem 0;
        }

        :global(.tiptap li p) {
          margin: 0.25rem 0;
        }

        :global(.tiptap blockquote) {
          border-left: 4px solid #3b82f6;
          margin: 1rem 0;
          padding-left: 1rem;
          padding-right: 0;
          color: #666;
          font-style: italic;
          background-color: #eff6ff;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
        }

        :global(.tiptap code) {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
          font-size: 0.85em;
          color: #d97706;
        }

        :global(.tiptap pre) {
          background: #1f2937;
          border-radius: 0.5rem;
          color: #f3f4f6;
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
          margin: 1rem 0;
          padding: 1rem;
          overflow-x: auto;
          border: 1px solid #374151;
        }

        :global(.tiptap pre code) {
          background: none;
          color: inherit;
          font-size: 0.875rem;
          padding: 0;
        }

        :global(.is-editor-empty:before) {
          color: #d1d5db;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          font-size: 1rem;
        }

        :global(.tiptap a) {
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.2s;
        }

        :global(.tiptap a:hover) {
          color: #2563eb;
        }

        :global(.tiptap hr) {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
};
