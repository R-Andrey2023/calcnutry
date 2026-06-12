import * as React from "react"

export interface ToastActionElement {
  element: React.ReactNode
}

export interface ToastProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

export function Toast({ children, ...props }: React.ComponentPropsWithoutRef<"div"> & ToastProps) {
  return (
    <div {...props}>
      {children}
    </div>
  )
}

export function ToastTitle({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function ToastDescription({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function ToastClose() {
  return <button type="button">Close</button>
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function ToastViewport() {
  return <div />
}
