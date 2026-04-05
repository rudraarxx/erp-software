import * as React from 'react';

interface ContactInquiryEmailProps {
  fullName: string;
  email: string;
  phone: string;
  projectType: string;
  details: string;
}

export const ContactInquiryEmail: React.FC<ContactInquiryEmailProps> = ({
  fullName,
  email,
  phone,
  projectType,
  details,
}) => (
  <div style={{
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#f9fafb',
    padding: '40px 20px',
    color: '#111827'
  }}>
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#111827',
        padding: '32px',
        textAlign: 'center'
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '24px',
          fontWeight: '800',
          margin: '0',
          letterSpacing: '-0.025em'
        }}>
          SOLID<span style={{ color: '#facc15' }}>STONNE</span>
        </h1>
      </div>

      {/* Body */}
      <div style={{ padding: '40px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          marginBottom: '24px',
          color: '#111827'
        }}>
          New Project Inquiry
        </h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '26px',
          color: '#4b5563',
          marginBottom: '24px'
        }}>
          You have received a new inquiry from the SolidStonne website.
        </p>

        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>From</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{fullName}</div>
            <div style={{ fontSize: '14px', color: '#4b5563' }}>{email} | {phone}</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Project Type</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>{projectType}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Details</div>
            <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: '22px' }}>{details}</div>
          </div>
        </div>

        <a
          href={`mailto:${email}`}
          style={{
            display: 'block',
            backgroundColor: '#111827',
            color: '#ffffff',
            textAlign: 'center',
            padding: '16px 32px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            textDecoration: 'none',
            transition: 'background-color 0.2s'
          }}
        >
          Reply to Inquiry
        </a>
      </div>

      {/* Footer */}
      <div style={{
        padding: '32px',
        borderTop: '1px solid #f3f4f6',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>
          &copy; {new Date().getFullYear()} SolidStonne Technologies. This message was sent via the website contact form.
        </p>
      </div>
    </div>
  </div>
);
