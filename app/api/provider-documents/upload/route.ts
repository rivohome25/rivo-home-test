import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Create a service role client for admin operations (bypasses RLS)
    const supabaseAdmin = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    }, {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    })
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const docType = formData.get('docType') as string
    const licenseNumber = formData.get('licenseNumber') as string | null
    const issuingState = formData.get('issuingState') as string | null
    const documentTitle = formData.get('documentTitle') as string | null

    if (!file || !docType) {
      console.error('Missing required fields:', { file: !!file, docType })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Security: Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      console.error('File too large:', file.size)
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Security: Validate file extensions
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      console.error('Invalid file extension:', fileExtension)
      return NextResponse.json({ error: 'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX' }, { status: 400 })
    }

    // Security: Sanitize filename
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')

    // Validate doc type
    if (!['license', 'insurance', 'other', 'logo'].includes(docType)) {
      console.error('Invalid document type:', docType)
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    // Additional validation for logo
    if (docType === 'logo' && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Logo must be an image file' }, { status: 400 })
    }

    // Log file details for debugging
    console.log('File details:', { 
      name: file.name, 
      size: file.size, 
      type: file.type,
      docType,
      licenseNumber: licenseNumber ? 'provided' : 'not provided',
      issuingState: issuingState ? 'provided' : 'not provided'
    })

    // Generate unique file path
    const timestamp = Date.now()
    const filePath = `providers/${user.id}/${docType}/${timestamp}_${sanitizedFileName}`
    
    console.log('Generated file path:', filePath)

    // Try uploading with regular client first
    let uploadResult = await supabase
      .storage
      .from('provider-documents')
      .upload(filePath, file, {
        metadata: { provider_id: user.id }
      })

    // If there's an error, try with service role client
    if (uploadResult.error) {
      console.log('Regular client upload failed, trying with service role client')
      uploadResult = await supabaseAdmin
        .storage
        .from('provider-documents')
        .upload(filePath, file, {
          metadata: { provider_id: user.id }
        })
    }

    if (uploadResult.error) {
      console.error('Upload error details:', { 
        message: uploadResult.error.message,
        code: uploadResult.error.code,
        details: uploadResult.error.details,
        hint: uploadResult.error.hint,
        status: uploadResult.error.status
      })
      return NextResponse.json({ 
        error: 'Failed to upload file', 
        details: uploadResult.error.message 
      }, { status: 500 })
    }

    // For logo type, update the provider_profiles table directly
    if (docType === 'logo') {
      // Get public URL for the uploaded logo
      const { data: publicUrlData } = await supabaseAdmin
        .storage
        .from('provider-documents')
        .getPublicUrl(filePath)
      
      if (publicUrlData?.publicUrl) {
        // Update the provider's profile with the logo URL
        const { error: updateError } = await supabaseAdmin
          .from('provider_profiles')
          .update({ logo_url: publicUrlData.publicUrl })
          .eq('user_id', user.id)
          
        if (updateError) {
          console.error('Failed to update profile with logo URL:', updateError)
          // Don't fail the request, but log the error
        }
      }
      
      // Return success without inserting into provider_documents table
      return NextResponse.json({ 
        success: true, 
        message: 'Logo uploaded successfully',
        filePath 
      })
    }

    // Insert metadata into database using service role client to bypass RLS
    const insertData: any = {
      provider_id: user.id,
      doc_type: docType,
      file_path: filePath,
      file_name: sanitizedFileName
    }

    // Add type-specific fields
    if (docType === 'license' && licenseNumber && issuingState) {
      insertData.license_number = licenseNumber
      insertData.issuing_state = issuingState
    }
    
    if (docType === 'other' && documentTitle) {
      insertData.document_title = documentTitle
    }

    // Use service role client for database operations to ensure success
    const { error: dbError } = await supabaseAdmin
      .from('provider_documents')
      .insert(insertData)

    if (dbError) {
      console.error('Database error details:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint
      })
      
      // Clean up uploaded file if database insert fails
      await supabaseAdmin
        .storage
        .from('provider-documents')
        .remove([filePath])
        
      return NextResponse.json({ 
        error: 'Failed to save document metadata',
        details: dbError.message
      }, { status: 500 })
    }

    console.log('Document uploaded successfully:', filePath)
    return NextResponse.json({ 
      success: true, 
      message: 'Document uploaded successfully',
      filePath 
    })

  } catch (error) {
    console.error('Server error details:', error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 