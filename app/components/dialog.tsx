// app/components/ui/dialog.tsx
import React, { ReactNode } from 'react';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
}

interface DialogOverlayProps {
   className?:string;
   children?:ReactNode;
}

interface DialogContentProps {
   className?:string;
    children?:ReactNode;
}

const DialogOverlay: React.FC<DialogOverlayProps> = ({className, children}) => {
  return (
     <div className={className}>{children}</div>
    )
};

const DialogContent: React.FC<DialogContentProps> = ({className, children}) => {
 return (
     <div className={className}>{children}</div>
    )
}


const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
    if (!open) return null;
    return (
        <>
          {children}
        </>
    );
};

export { Dialog, DialogOverlay, DialogContent };