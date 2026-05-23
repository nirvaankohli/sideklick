import type { HTMLAttributes } from "react";

import logoImage from "../../../assets/logo.png";
import { cn } from "@/lib/utils";

const Logo = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("flex items-center gap-3 text-white", className)}
      {...props}
    >
      <img
        alt="SideKlick logo"
        className="size-10 object-contain"
        src={logoImage}
      />
      <span className="text-base font-semibold tracking-[-0.04em]">
        SideKlick
      </span>
    </div>
  );
};

export default Logo;
