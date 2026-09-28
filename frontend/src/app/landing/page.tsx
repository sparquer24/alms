"use client";

import landingData from "@/data/landingData.json";
import type { LandingPageData } from "@/types/landing";

import LandingHeader from "./components/Header";
import HeroSection from "./components/HeroSection";
import ServicesSection from "./components/ServicesSection";
import WorkflowSection from "./components/WorkflowSection";
import LifecycleSection from "./components/LifecycleSection";

import EcosystemSection from "./components/EcosystemSection";
import AdminCenter from "./components/AdminCenter";
import ComplianceSection from "./components/ComplianceSection";

import SecuritySection from "./components/SecuritySection";
import LandingFooter from "./components/Footer";

const data = landingData as unknown as LandingPageData;

export default function LandingPage() {
  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Sticky Header */}
      <LandingHeader navLinks={data.navigation} />

      {/* Hero Section */}
      <HeroSection hero={data.hero} />

      {/* Core Service Modules */}
      <ServicesSection services={data.serviceModules} />

      {/* Workflow Governance / Approval Chain */}
      <WorkflowSection workflow={data.workflowGovernance} />

      {/* Complete License Lifecycle */}
      <LifecycleSection
        title={data.lifecycle.title}
        description={data.lifecycle.description}
        stages={data.lifecycle.stages}
      />

      {/* ALMS Ecosystem */}
      <EcosystemSection groups={data.ecosystem} />

      {/* Administrative Control Center */}
      <AdminCenter
        title={data.adminControlCenter.title}
        description={data.adminControlCenter.description}
        features={data.adminControlCenter.features}
        badges={data.adminControlCenter.badges}
      />

      {/* Compliance & Verification */}
      <ComplianceSection
        title={data.compliance.title}
        description={data.compliance.description}
        items={data.compliance.items}
      />



      {/* Security & Governance */}
      <SecuritySection
        title={data.security.title}
        description={data.security.description}
        features={data.security.features}
      />

      {/* Footer */}
      <LandingFooter footer={data.footer} />
    </div>
  );
}
