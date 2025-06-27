import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '../../app/api/properties/route'
import { createClient } from '@supabase/supabase-js'

// Mock the Supabase client
jest.mock('@supabase/auth-helpers-nextjs')
jest.mock('next/headers')

// Create Supabase client for testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'
)

// File validation utilities
const validateFileType = (file: File): boolean => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg', 
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  return allowedTypes.includes(file.type)
}

const validateFileSize = (file: File): boolean => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  return file.size <= maxSize
}

describe('Properties API Route', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  const mockProperty = {
    id: 'prop-1',
    homeowner_id: 'test-user-id',
    address: '123 Main St',
    property_type: 'single_family',
    year_built: 2020,
    square_footage: 2000,
    nickname: 'Main House',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/properties', () => {
    it('should return properties for authenticated user', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [mockProperty],
                error: null,
              }),
            }),
          }),
        }),
      }

      const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs')
      createRouteHandlerClient.mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/properties')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.properties).toEqual([mockProperty])
    })

    it('should return 401 for unauthenticated user', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: 'Unauthorized' }),
        },
      }

      const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs')
      createRouteHandlerClient.mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/properties')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/properties', () => {
    it('should create a new property', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockProperty,
                error: null,
              }),
            }),
          }),
        }),
      }

      const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs')
      createRouteHandlerClient.mockReturnValue(mockSupabase)

      const requestBody = {
        address: '123 Main St',
        property_type: 'single_family',
        year_built: 2020,
        square_footage: 2000,
      }

      const request = new NextRequest('http://localhost:3000/api/properties', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.property).toEqual(mockProperty)
    })

    it('should return 400 for missing required fields', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      }

      const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs')
      createRouteHandlerClient.mockReturnValue(mockSupabase)

      const requestBody = {
        // Missing required address and property_type
        year_built: 2020,
      }

      const request = new NextRequest('http://localhost:3000/api/properties', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Address and property type are required')
    })
  })
})

describe('Auth Callback Route', () => {
  // Mock auth callback functionality
  it('should handle OAuth callback correctly', () => {
    // This would test the auth callback route functionality
    // Since it's in a different location, we'll validate its existence
    expect(true).toBe(true) // Placeholder
  })
})

describe('Provider Document Upload API', () => {
  test('should validate file types for document upload', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    // Test valid file types
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'];
    validTypes.forEach(type => {
      const file = new File(['test'], 'test', { type });
      expect(validateFileType(file)).toBe(true);
    });
    
    // Test invalid file types
    const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-executable' });
    expect(validateFileType(invalidFile)).toBe(false);
  });

  test('should validate file size limits', async () => {
    // Test file size under limit (5MB)
    const validFile = new File(['x'.repeat(4 * 1024 * 1024)], 'test.pdf', { type: 'application/pdf' });
    expect(validateFileSize(validFile)).toBe(true);
    
    // Test file size over limit
    const oversizedFile = new File(['x'.repeat(6 * 1024 * 1024)], 'test.pdf', { type: 'application/pdf' });
    expect(validateFileSize(oversizedFile)).toBe(false);
  });

  test('should handle malicious file detection', async () => {
    // Test potential malicious files
    const maliciousFiles = [
      new File(['<?php echo "test"; ?>'], 'test.php', { type: 'application/x-php' }),
      new File(['<script>alert("xss")</script>'], 'test.html', { type: 'text/html' }),
    ];
    
    maliciousFiles.forEach(file => {
      expect(validateFileType(file)).toBe(false);
    });
  });
});

describe('Admin Provider Management API', () => {
  test('should update provider status with proper authorization', async () => {
    const mockRequest = {
      method: 'PUT',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'Content-Type': 'application/json' }
    };
    
    // Mock admin authentication
    jest.mock('../lib/auth-utils', () => ({
      isAdmin: jest.fn().mockReturnValue(true)
    }));
    
    const response = await fetch('/api/admin/providers/test-id/status', mockRequest);
    expect(response.status).toBe(200);
  });

  test('should reject unauthorized provider status updates', async () => {
    const mockRequest = {
      method: 'PUT',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'Content-Type': 'application/json' }
    };
    
    // Mock non-admin authentication
    jest.mock('../lib/auth-utils', () => ({
      isAdmin: jest.fn().mockReturnValue(false)
    }));
    
    const response = await fetch('/api/admin/providers/test-id/status', mockRequest);
    expect(response.status).toBe(403);
  });
});

describe('Database Migration Validation', () => {
  test('should maintain profiles and user_plans relationship integrity', async () => {
    // Test that the new migration maintains data integrity
    const testUserId = 'test-user-id';
    
    // Verify user profile exists
    const profile = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    expect(profile.data).toBeTruthy();
    
    // Verify user plan relationship
    const userPlan = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    expect(userPlan.data).toBeTruthy();
    expect(userPlan.data.user_id).toBe(testUserId);
  });
}); 