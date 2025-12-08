"use client";

import * as React from "react";

type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

export function Dialog({ open = false, children }: DialogProps) {
  // Controlled-only for now: show children when open=true
  if (!open) return null;
  return <>{children}</>;
}

type BasicProps = {
  className?: string;
  children: React.ReactNode;
};

export function DialogContent({ className = "", children }: BasicProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className={
          "bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 " +
          className
        }
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className = "", children }: BasicProps) {
  return <div className={"mb-4 " + className}>{children}</div>;
}

export function DialogFooter({ className = "", children }: BasicProps) {
  return (
    <div className={"mt-4 flex justify-end gap-2 " + className}>{children}</div>
  );
}

export function DialogTitle({ className = "", children }: BasicProps) {
  return (
    <h2 className={"text-lg font-semibold leading-none " + className}>
      {children}
    </h2>
  );
}

export function DialogDescription({ className = "", children }: BasicProps) {
  return (
    <p className={"text-sm text-gray-600 mt-1 " + className}>{children}</p>
  );
}

/** No-op stubs so other imports don't break */
export function DialogOverlay({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function DialogTrigger({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function DialogClose({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
