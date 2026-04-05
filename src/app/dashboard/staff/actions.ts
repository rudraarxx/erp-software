'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { resend } from '@/lib/resend';
import { StaffInviteEmail } from '@/components/email/StaffInviteEmail';
import * as React from 'react';

export async function inviteStaffAction(email: string, role: string) {
  const supabase = await createClient();

  try {
    // 1. Get current session and profile
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('company_id, companies(name)')
      .eq('id', session.user.id)
      .single();

    if (profileErr || !profile?.company_id) {
      throw new Error('You must belong to a company to invite staff.');
    }

    const companyName = (profile.companies as any)?.name || 'Your Company';

    // 2. Insert into staff_invites table
    const { error: inviteErr } = await supabase.from('staff_invites').insert({
      company_id: profile.company_id,
      email: email,
      role: role,
      invited_by: session.user.id
    });

    if (inviteErr) {
      if (inviteErr.code === '23505') throw new Error('An invite for this email already exists.');
      throw inviteErr;
    }

    // 3. Construct invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const inviteLink = `${baseUrl}/signup?email=${encodeURIComponent(email)}&role=${role}&company=${profile.company_id}`;

    // 4. Send Email via Resend
    if (process.env.RESEND_API_KEY) {
      const { data, error: emailErr } = await resend.emails.send({
        from: 'SolidStonne <onboarding@resend.dev>',
        to: [email],
        subject: `Invitation to join ${companyName} on SolidStonne`,
        react: StaffInviteEmail({
          companyName: companyName,
          role: role,
          inviteLink: inviteLink
        }) as React.ReactElement,
      });

      if (emailErr) {
        console.error('Resend Error:', emailErr);
        // We log the error but still return success if the DB record was created.
        // However, it's better to inform the user.
        return { success: true, message: `Invite recorded, but email failed to send: ${emailErr.message}` };
      }
    } else {
      console.warn('RESEND_API_KEY not set. Email not sent.');
      return { success: true, message: `Invite recorded, but email service not active.` };
    }

    revalidatePath('/dashboard/staff');
    return { success: true, message: `Invite sent to ${email}` };
  } catch (err: any) {
    console.error('Invite Action Error:', err);
    return { success: false, error: err.message || 'Failed to send invite' };
  }
}

export async function resendStaffInviteAction(email: string) {
  const supabase = await createClient();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // 1. Fetch current invite
    const { data: invite, error: inviteErr } = await supabase
      .from('staff_invites')
      .select('role, company_id, companies(name)')
      .eq('email', email)
      .single();

    if (inviteErr || !invite) {
      throw new Error('Invite not found for this email.');
    }

    const companyName = (invite.companies as any)?.name || 'Your Company';
    const role = invite.role;

    // 2. Construct invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const inviteLink = `${baseUrl}/signup?email=${encodeURIComponent(email)}&role=${role}&company=${invite.company_id}`;

    // 3. Send Email via Resend
    if (process.env.RESEND_API_KEY) {
      const { data, error: emailErr } = await resend.emails.send({
        from: 'SolidStonne <onboarding@resend.dev>',
        to: [email],
        subject: `Reminder: Invitation to join ${companyName} on SolidStonne`,
        react: StaffInviteEmail({
          companyName: companyName,
          role: role,
          inviteLink: inviteLink
        }) as React.ReactElement,
      });

      if (emailErr) {
        console.error('Resend Error:', emailErr);
        throw new Error(`Email failed to send: ${emailErr.message}`);
      }
    } else {
      console.warn('RESEND_API_KEY not set.');
      return { success: true, message: `Email service not active, but link is: ${inviteLink}` };
    }

    return { success: true, message: `Invitation resent to ${email}` };
  } catch (err: any) {
    console.error('Resend Action Error:', err);
    return { success: false, error: err.message || 'Failed to resend invite' };
  }
}
