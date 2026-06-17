/**
 * Landing Page TypeScript Interfaces
 * All content is sourced from hardcoded JSON data — no API calls.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface PlatformInfo {
  name: string;
  tagline: string;
  description: string;
  governingBody: string;
}

export interface HeroData {
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  tertiaryCta: { label: string; href: string };
  workflowHierarchy: string[];
}

export interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface WorkflowStep {
  step: string;
  description: string;
}

export interface WorkflowGovernance {
  title: string;
  description: string;
  chain: string[];
  highlights: string[];
}

export interface UserGroup {
  role: string;
  title: string;
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
}

export interface LifecycleStage {
  stage: string;
  description: string;
}

export interface SecurityFeature {
  title: string;
  description: string;
  category: string;
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
}

export interface Statistics {
  applicationsProcessed: string;
  pendingReviews: string;
  licensesIssued: string;
  renewalsProcessed: string;
  districtCoverage: string;
  approvalRate: string;
}

export interface LandingPageData {
  platform: PlatformInfo;
  navigation: NavLink[];
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
