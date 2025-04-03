import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    // Base classes
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
    // Variant classes
    const variantClasses = {
      default: "bg-primary text-white hover:bg-primary/90",
      destructive: "bg-red-500 text-white hover:bg-red-500/90",
      outline: "border border-gray-200 hover:bg-gray-100 hover:text-gray-900",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-100/80",
      ghost: "hover:bg-gray-100 hover:text-gray-900",
      link: "underline-offset-4 hover:underline text-primary",
    };
    
    // Size classes
    const sizeClasses = {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3 rounded-md",
      lg: "h-11 px-8 rounded-md",
      icon: "h-10 w-10",
    };
    
    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    ].filter(Boolean).join(" ");
    
    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button }; 