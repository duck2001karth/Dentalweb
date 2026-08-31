import { type LucideIcon } from "lucide-react";

export type StatusConfig = {
  value: string;
  label: string;
  description?: string;
  color: string; 
  bg: string;
  icon: LucideIcon | React.ComponentType<any>;
};