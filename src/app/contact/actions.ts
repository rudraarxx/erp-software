'use server';

import { resend } from '@/lib/resend';
import { ContactInquiryEmail } from '@/components/email/ContactInquiryEmail';
import * as React from 'react';

export async function sendContactInquiry(formData: {
  fullName: string;
  email: string;
  phone: string;
  projectType: string;
  details: string;
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set. Contact inquiry email not sent.');
      return { success: true, message: 'Thank you for your inquiry! (Development Mode: Email not sent)' };
    }

    const { data, error: emailErr } = await resend.emails.send({
      from: 'SolidStonne <onboarding@resend.dev>',
      to: ['contact@solidstonne.com'], // In production, this would be an admin email
      subject: `New Project Inquiry: ${formData.projectType} from ${formData.fullName}`,
      replyTo: formData.email,
      react: ContactInquiryEmail({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        projectType: formData.projectType,
        details: formData.details
      }) as React.ReactElement,
    });

    if (emailErr) {
      console.error('Contact Inquiry Email Error:', emailErr);
      throw new Error('Failed to send email. Please try again later.');
    }

    return { 
      success: true, 
      message: 'Your inquiry has been sent successfully. Our team will get back to you soon.' 
    };
  } catch (err: any) {
    console.error('Contact Action Error:', err);
    return { 
      success: false, 
      error: err.message || 'Something went wrong. Please try again.' 
    };
  }
}
