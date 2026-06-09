/// <reference types="vite/client" />

declare module "*.css";
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.JPG" {
  const src: string;
  export default src;
}
declare module "*.mp4" {
  const src: string;
  export default src;
}

interface NavigatorUAData {
  platform?: string;
  brands?: Array<{ brand: string; version: string }>;
  mobile?: boolean;
}

interface Navigator {
  userAgentData?: NavigatorUAData;
}
