'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SignInForm } from './sign-in-form';
import { SignUpForm } from './sign-up-form';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleSuccess = () => {
    onOpenChange(false);
    window.location.reload(); // Refresh to update auth state
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
          <div className="relative">
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 z-10"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>

            {mode === 'signin' ? (
              <>
                <SignInForm onSuccess={handleSuccess} />
                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </>
            ) : (
              <>
                <SignUpForm onSuccess={handleSuccess} />
                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}