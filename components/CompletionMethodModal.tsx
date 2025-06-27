'use client';
import { useState } from 'react';
import { X, User, Crown, CheckCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
}

interface CompletionMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onComplete: (taskId: string, method: 'diy' | 'professional') => Promise<void>;
}

export default function CompletionMethodModal({
  isOpen,
  onClose,
  task,
  onComplete
}: CompletionMethodModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !task) return null;

  const handleComplete = async (method: 'diy' | 'professional') => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onComplete(task.id, method);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Task Completion</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Task Info */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
          <p className="text-sm text-gray-600">{task.description}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">How was this task completed?</h3>
            <p className="text-sm text-gray-600">
              This helps us track your maintenance habits and provide better recommendations.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Completion Options */}
          <div className="space-y-3 mb-6">
            {/* DIY Option */}
            <button
              onClick={() => handleComplete('diy')}
              disabled={isSubmitting}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">I did it myself</h4>
                  <p className="text-sm text-gray-600">DIY completion</p>
                </div>
              </div>
            </button>

            {/* Professional Option */}
            <button
              onClick={() => handleComplete('professional')}
              disabled={isSubmitting}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Crown className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">RivoHome certified professional</h4>
                  <p className="text-sm text-gray-600">Professional service</p>
                </div>
              </div>
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Completing task...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 