/**
 * Landing Page TypeScript Interfaces
 * All content is sourced from hardcoded JSON data — no API calls.
 */

export interface NavLink {
  label: string;
  href: string;
  badge?: string;
}

export interface PlatformInfo {
  name: string;
  hindiName?: string;
  tagline: string;
  description: string;
  governingBody: string;
  actReference?: string;
}

export interface HeroData {
  title: string;
  hindiTitle?: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  tertiaryCta: { label: string; href: string };
  workflowHierarchy: string[];
  stats?: { label: string; value: string; desc: string }[];
}

export interface ServiceCard {
  id: string;
  title: string;
  statutoryForm?: string;
  description: string;
  icon: string;
  sla?: string;
  badge?: string;
}

export interface WorkflowGovernance {
  title: string;
  hindiTitle?: string;
  description: string;
  chain: string[];
  highlights: string[];
}

export interface UserGroup {
  role: string;
  title: string;
  designation?: string;
  capabilities: string[];
}

export interface AdminFeature {
  title: string;
  description: string;
  highlights: string[];
}

export interface ComplianceItem {
  id: string;
  title: string;
  category: string;
  statutoryBasis?: string;
}

export interface LifecycleStage {
  stage: string;
  description: string;
  statutoryRef?: string;
}

export interface SecurityFeature {
  title: string;
  description: string;
  category: string;
  standard?: string;
}

export interface TechCategory {
  category: string;
  items: { name: string; description: string }[];
}

export interface FooterData {
  governingBody: string;
  systemName: string;
  links: { label: string; href: string }[];
  securityNotice: string;
  contact: string;
  helpline?: string;
  emergencyContact?: string;
}

export interface LandingPageData {
  platform: PlatformInfo;
  navigation: NavLink[];
  announcements?: string[];
  hero: HeroData;
  serviceModules: ServiceCard[];
  workflowGovernance: WorkflowGovernance;
  ecosystem: UserGroup[];
  adminControlCenter: {
    title: string;
    description: string;
    features: AdminFeature[];
    badges: string[];
  };
  compliance: {
    title: string;
    description: string;
    items: ComplianceItem[];
  };
  lifecycle: {
    title: string;
    description: string;
    stages: LifecycleStage[];
  };
  security: {
    title: string;
    description: string;
    features: SecurityFeature[];
  };
  techStack?: {
    title: string;
    description: string;
    categories: TechCategory[];
  };
  footer: FooterData;
  loginContext: { role: string; context: string }[];
}
