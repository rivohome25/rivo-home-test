/**
 * @file BookingImageUpload.tsx
 * @description Image upload component for booking requests
 */

'use client'

import { useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { validateUploadedFile } from '@/lib/secure-file-validation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { X, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react'

interface BookingImageUploadProps {
  onImagesChange: (images: File[]) => void
  maxImages?: number
  maxSizePerImage?: number
  disabled?: boolean
}

interface ImagePreview {
  file: File
  url: string
  id: string
}

export default function BookingImageUpload({
  onImagesChange,
  maxImages = 5,
  maxSizePerImage = 10 * 1024 * 1024, // 10MB per image
  disabled = false
}: BookingImageUploadProps) {
  const [images, setImages] = useState<ImagePreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  const acceptedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

  const validateImage = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return { isValid: false, error: 'Only JPG, PNG, WebP, and GIF images are allowed' }
    }

    // Check file size
    if (file.size > maxSizePerImage) {
      return { 
        isValid: false, 
        error: `Image size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds limit (${(maxSizePerImage / 1024 / 1024).toFixed(1)}MB)` 
      }
    }

    // Use existing validation
    try {
      const validation = await validateUploadedFile(file, maxSizePerImage)
      if (!validation.isValid) {
        return { isValid: false, error: validation.errors.join(', ') }
      }
    } catch (error) {
      return { isValid: false, error: 'Failed to validate image' }
    }

    return { isValid: true }
  }

  const addImages = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const remainingSlots = maxImages - images.length

    if (fileArray.length > remainingSlots) {
      toast({
        title: 'Too many images',
        description: `You can only upload ${remainingSlots} more image(s). Maximum ${maxImages} images allowed.`,
        variant: 'destructive'
      })
      return
    }

    setUploading(true)
    const newImages: ImagePreview[] = []
    const errors: string[] = []

    for (const file of fileArray) {
      const validation = await validateImage(file)
      
      if (validation.isValid) {
        const preview: ImagePreview = {
          file,
          url: URL.createObjectURL(file),
          id: Math.random().toString(36).substr(2, 9)
        }
        newImages.push(preview)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    }

    if (errors.length > 0) {
      toast({
        title: 'Some images were rejected',
        description: errors.join('\n'),
        variant: 'destructive'
      })
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages]
      setImages(updatedImages)
      onImagesChange(updatedImages.map(img => img.file))
      
      toast({
        title: 'Images added',
        description: `${newImages.length} image(s) ready to upload`,
      })
    }

    setUploading(false)
  }

  const removeImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id)
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url)
    }
    
    const updatedImages = images.filter(img => img.id !== id)
    setImages(updatedImages)
    onImagesChange(updatedImages.map(img => img.file))
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addImages(e.target.files)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addImages(e.dataTransfer.files)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  // Calculate total size
  const totalSize = images.reduce((sum, img) => sum + img.file.size, 0)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1)

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedExtensions.join(',')}
          onChange={handleFileInput}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        <div className="space-y-2">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-sm text-gray-600">
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Validating images...
              </span>
            ) : (
              <>
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                <br />
                JPG, PNG, WebP, GIF up to {(maxSizePerImage / 1024 / 1024).toFixed(0)}MB each
                <br />
                Maximum {maxImages} images ({images.length} selected)
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Selected Images ({images.length}/{maxImages})
            </h4>
            <span className="text-xs text-gray-500">
              Total size: {totalSizeMB}MB
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(image.id)
                  }}
                  disabled={disabled}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                </button>
                
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {image.file.name}
                </div>
                <div className="text-xs text-gray-400">
                  {(image.file.size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info/Warning */}
      {images.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <div className="font-medium">Ready to upload</div>
              <div>Images will be uploaded when you submit your booking request. You can add more images or remove unwanted ones before submitting.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 