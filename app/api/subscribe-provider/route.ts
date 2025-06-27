import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

// Replace with your Mailchimp API key and list ID
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || '';
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID || '';
const MAILCHIMP_SERVER = process.env.MAILCHIMP_SERVER || ''; // e.g., "us1"

// Simple validator functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>&'"]/g, (match) => {
      switch (match) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return match;
      }
    });
};

export async function POST(request: NextRequest) {
  // Apply rate limiting: 10 requests per minute per IP
  const rateLimitResult = rateLimit(request, { 
    limit: 10, 
    windowMs: 60 * 1000,
    message: 'Too many subscription attempts. Please try again later.'
  });
  
  // If rate limit is exceeded, return the error response
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const { email, name, phone, company, serviceType } = await request.json();

    // Input validation
    if (!email || !name || !serviceType) {
      return NextResponse.json(
        { error: 'Email, name, and service type are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedPhone = phone ? sanitizeInput(phone) : '';
    const sanitizedCompany = company ? sanitizeInput(company) : '';
    const sanitizedServiceType = sanitizeInput(serviceType);

    // Parse first and last name
    const nameParts = sanitizedName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Prepare data for Mailchimp
    const data = {
      email_address: email.toLowerCase().trim(), // Normalize email
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
        PHONE: sanitizedPhone,
        COMPANY: sanitizedCompany,
        SERVICE: sanitizedServiceType,
      },
    };

    // Check if Mailchimp credentials are configured
    if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID || !MAILCHIMP_SERVER) {
      console.error('Mailchimp API credentials not configured');
      return NextResponse.json(
        { error: 'Subscription service is not properly configured' },
        { status: 500 }
      );
    }

    // Call Mailchimp API
    const response = await fetch(
      `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        },
        body: JSON.stringify(data),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      // Handle existing subscriber or other error
      if (response.status === 400 && responseData.title === 'Member Exists') {
        // Update the existing subscriber instead
        const subscriberHash = crypto
          .createHash('md5')
          .update(email.toLowerCase())
          .digest('hex');

        const updateResponse = await fetch(
          `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `apikey ${MAILCHIMP_API_KEY}`,
            },
            body: JSON.stringify({
              merge_fields: {
                FNAME: firstName,
                LNAME: lastName,
                PHONE: sanitizedPhone,
                COMPANY: sanitizedCompany,
                SERVICE: sanitizedServiceType,
              },
            }),
          }
        );

        if (!updateResponse.ok) {
          throw new Error('Failed to update existing subscriber');
        }

        return NextResponse.json({ success: true, status: 'updated' });
      }

      console.error('Mailchimp error:', responseData);
      return NextResponse.json(
        { error: responseData.title || 'Failed to subscribe' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 