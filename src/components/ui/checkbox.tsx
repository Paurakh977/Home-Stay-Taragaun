"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean | 'indeterminate') => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, checked, onChange, onCheckedChange, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null)
    const resolvedRef = (ref as React.MutableRefObject<HTMLInputElement>) || innerRef
    
    React.useEffect(() => {
      if (resolvedRef?.current) {
        resolvedRef.current.indeterminate = !!indeterminate
      }
    }, [resolvedRef, indeterminate])

    // Create an internal onChange handler if checked is provided but onChange is not
    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        // Call the original onChange if it exists
        onChange?.(event)
        
        // Call onCheckedChange with the new checked state
        onCheckedChange?.(
          indeterminate ? 'indeterminate' : event.target.checked
        )
      },
      [onChange, onCheckedChange, indeterminate]
    )

    return (
      <input
        type="checkbox"
        ref={resolvedRef}
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
          className
        )}
        checked={checked}
        onChange={handleChange}
        {...props}
      />
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox } 