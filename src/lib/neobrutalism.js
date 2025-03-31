import { cva } from 'class-variance-authority';

// Neobrutalism button styles
export const neoBrutalButton = cva(
  "relative inline-flex items-center justify-center font-bold border-3 border-black shadow-brutal transition-all duration-150 active:translate-y-1 active:shadow-none",
  {
    variants: {
      variant: {
        primary: "bg-yellow-400 hover:bg-yellow-300",
        secondary: "bg-pink-400 hover:bg-pink-300",
        success: "bg-green-400 hover:bg-green-300",
        danger: "bg-red-400 hover:bg-red-300",
        info: "bg-blue-400 hover:bg-blue-300",
      },
      size: {
        sm: "text-sm py-1 px-2",
        md: "text-base py-2 px-4",
        lg: "text-lg py-3 px-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// Neobrutalism card styles
export const neoBrutalCard = cva(
  "bg-white border-3 border-black shadow-brutal p-4",
  {
    variants: {
      color: {
        white: "bg-white",
        yellow: "bg-yellow-200",
        pink: "bg-pink-200",
        blue: "bg-blue-200",
        green: "bg-green-200",
      },
      hoverable: {
        true: "transition-all duration-150 hover:-translate-y-1 hover:shadow-brutal-lg",
      }
    },
    defaultVariants: {
      color: "white",
      hoverable: false,
    },
  }
);

// Neobrutalism input styles
export const neoBrutalInput = cva(
  "w-full border-3 border-black px-3 py-2 focus:outline-none focus:ring-4 focus:ring-yellow-200",
  {
    variants: {
      variant: {
        default: "bg-white",
        colored: "bg-yellow-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);