import { useState, useCallback } from 'react';

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<(() => void | Promise<void>) | null>(null);
  const [options, setOptions] = useState<ConfirmOptions>({});

  const confirm = useCallback((
    onConfirm: () => void | Promise<void>,
    options?: ConfirmOptions
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingConfirm(() => async () => {
        try {
          await onConfirm();
          resolve(true);
        } catch (error) {
          console.error('Confirm action failed:', error);
          resolve(false);
        } finally {
          setPendingConfirm(null);
          setOptions({});
        }
      });
      setOptions(options || {});
      setIsOpen(true);
    });
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setIsOpen(false);
      setPendingConfirm(null);
      setOptions({});
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (pendingConfirm) {
      await pendingConfirm();
    }
  }, [pendingConfirm]);

  return {
    isOpen,
    setIsOpen: handleOpenChange,
    confirm,
    pendingConfirm,
    options,
    handleConfirm,
  };
};
