'use client';
import { useState, useEffect } from 'react';
import { useToast } from './ui/use-toast';
import CompletionMethodModal from './CompletionMethodModal';

interface Task {
  id: string;
  title: string;
  description: string;
}

interface HomeownerDashboardClientProps {
  children: React.ReactNode;
}

export default function HomeownerDashboardClient({ children }: HomeownerDashboardClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for modal open events from child components
    const handleOpenModal = (event: CustomEvent) => {
      const task = event.detail;
      setSelectedTask(task);
      setModalOpen(true);
    };

    // Listen for modal close events
    const handleCloseModal = () => {
      setModalOpen(false);
      setSelectedTask(null);
    };

    // Add event listeners
    window.addEventListener('openCompletionModal', handleOpenModal as EventListener);
    window.addEventListener('closeCompletionModal', handleCloseModal);

    // Cleanup
    return () => {
      window.removeEventListener('openCompletionModal', handleOpenModal as EventListener);
      window.removeEventListener('closeCompletionModal', handleCloseModal);
    };
  }, []);

  const handleTaskComplete = async (taskId: string, method: 'diy' | 'professional') => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed_by: method }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete task');
      }

      toast({
        title: "Task completed",
        description: `Task marked as complete via ${method === 'diy' ? 'DIY' : 'professional service'}.`,
      });

      // Notify other components that the task was completed
      window.dispatchEvent(new CustomEvent('taskCompleted', { 
        detail: { taskId, method } 
      }));

    } catch (error: any) {
      console.error('Error completing task:', error);
      throw error; // Re-throw so the modal can handle it
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <>
      {children}
      
      {/* Global Completion Method Modal */}
      <CompletionMethodModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        task={selectedTask}
        onComplete={handleTaskComplete}
      />
    </>
  );
} 