import { cn } from "@/lib/utils";
import type { SVGProps } from 'react';

const CraneHookIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
    id="crane-logo"
  >
    <path d="M14 5a2 2 0 1 0-4 0v9.5a5.5 5.5 0 1 0 11 0" />
    <path d="M9 5V2" />
    <path d="M6 5H4" />
    <path d="M14 2h2" />
  </svg>
);


const Logo = ({ className }: { className?: string }) => {
  return (
    <div className="flex items-center justify-center gap-2 text-primary">
       <CraneHookIcon className={cn("h-8 w-8", className)} />
    </div>
  );
};

export default Logo;
