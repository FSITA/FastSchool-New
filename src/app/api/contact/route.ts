import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Indirizzo email non valido' },
        { status: 400 }
      );
    }

    // Prepare email content
    const emailContent = `
Nuovo messaggio dal form di contatto FastSchool

Nome: ${name}
Email: ${email}
Oggetto: ${subject}

Messaggio:
${message}

---
Questo messaggio è stato inviato dal form di contatto del sito FastSchool.
`;

    // For now, we'll use a simple approach with nodemailer
    // You can configure SMTP settings via environment variables
    // Or use a service like Resend, SendGrid, etc.

    // Option 1: Using nodemailer (requires SMTP configuration)
    // Option 2: Using a service like Resend (recommended for production)
    // Option 3: Using Supabase Edge Functions or similar

    // For now, let's use a simple fetch to a service or log it
    // In production, you should use a proper email service

    // Example with a simple email service (you can replace this with your preferred service)
    const recipientEmail = 'fastschoolitalia@gmail.com';
    
    // Log the email (for development)
    console.log('=== CONTACT FORM SUBMISSION ===');
    console.log('To:', recipientEmail);
    console.log('From:', email);
    console.log('Subject:', subject);
    console.log('Content:', emailContent);
    console.log('==============================');

    // TODO: Implement actual email sending
    // You can use:
    // 1. Nodemailer with SMTP
    // 2. Resend API (recommended)
    // 3. SendGrid
    // 4. AWS SES
    // 5. Supabase Edge Functions

    // For now, we'll simulate success
    // Replace this with actual email sending logic
    const emailSent = await sendEmail({
      to: recipientEmail,
      from: email,
      subject: `[FastSchool Contact] ${subject}`,
      text: emailContent,
      replyTo: email,
    });

    if (emailSent) {
      return NextResponse.json(
        { message: 'Messaggio inviato con successo' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Errore nell\'invio dell\'email. Riprova più tardi.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Email sending function
// This function supports multiple email service options
async function sendEmail({
  to,
  from,
  subject,
  text,
  replyTo,
}: {
  to: string;
  from: string;
  subject: string;
  text: string;
  replyTo: string;
}): Promise<boolean> {
  try {
    // Option 1: Use Resend (recommended for production)
    // Install: npm install resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'FastSchool <noreply@fastschool.com>',
          to: [to],
          subject: subject,
          text: text,
          reply_to: replyTo,
        });
        return true;
      } catch (resendError) {
        console.error('Resend error:', resendError);
        // Fall through to next option
      }
    }

    // Only Resend is supported - removed nodemailer and SendGrid to avoid build errors

    // If no email service is configured, log the email for development
    // In production, you should configure at least one email service
    console.log('=== EMAIL NOT SENT - NO SERVICE CONFIGURED ===');
    console.log('To:', to);
    console.log('From:', from);
    console.log('Subject:', subject);
    console.log('Message:', text);
    console.log('==============================================');
    
    // Return false to indicate email was not sent
    // In development, you might want to return true for testing
    return process.env.NODE_ENV === 'development';
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

