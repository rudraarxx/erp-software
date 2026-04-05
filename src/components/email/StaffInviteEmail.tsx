import * as React from 'react';

interface StaffInviteEmailProps {
  companyName: string;
  role: string;
  inviteLink: string;
}

export const StaffInviteEmail: React.FC<StaffInviteEmailProps> = ({
  companyName,
  role,
  inviteLink,
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
          Join the Team
        </h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '26px',
          color: '#4b5563',
          marginBottom: '24px'
        }}>
          You have been invited to join <strong>{companyName}</strong> on the SolidStonne ERP platform.
        </p>

        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Assigned Role</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
            {role.replace('_', ' ')}
          </div>
        </div>

        <p style={{
          fontSize: '16px',
          lineHeight: '26px',
          color: '#4b5563',
          marginBottom: '32px'
        }}>
          As a {role.replace('_', ' ')}, you will have access to the necessary modules to manage site activities, inventory, and reports.
        </p>

        <a
          href={inviteLink}
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
          Accept Invitation & Join Now
        </a>

        <p style={{
          fontSize: '14px',
          color: '#9ca3af',
          textAlign: 'center',
          marginTop: '32px',
          lineHeight: '20px'
        }}>
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>

      {/* Footer */}
      <div style={{
        padding: '32px',
        borderTop: '1px solid #f3f4f6',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>
          &copy; {new Date().getFullYear()} SolidStonne Technologies. All rights reserved.
        </p>
      </div>
    </div>
  </div>
);
