import React, { useState, useEffect } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import ApplicantIdentity from "../../components/forms/applicationForms/ApplicantIdentity";
import AddressInformation from "../../components/forms/applicationForms/AddressInformationComponent";
import OccupationBusiness from "../../components/forms/applicationForms/OccupationBusiness";
import CriminalHistory from "../../components/forms/applicationForms/CriminalHistory";
import LicenseHistory from "../../components/forms/applicationForms/LicenseHistory";
import LicenseDetails from "../../components/forms/applicationForms/LicenseDetails";
import UploadFiles from "../../components/forms/applicationForms/FileUploader";
import SpecialConsiderations from "../../components/forms/applicationForms/SpecialConsiderations";

const tabs = {
  "Applicant Identity": <ApplicantIdentity />,
  "Address Information": <AddressInformation />,
  "Occupation & Business": <OccupationBusiness />,
  "Criminal History": <CriminalHistory />,
  "License History": <LicenseHistory />,
  "License Details": <LicenseDetails />,
  "Upload Files": <UploadFiles />,
  "Special Considerations & Claims": <SpecialConsiderations />,
};

const NewApplicationForm = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return Number(localStorage.getItem("activeTab")) || 0;
  });

  useEffect(() => {
    localStorage.setItem("activeTab", String(activeTab));
  }, [activeTab]);

  const handleTabChange = (event: any, newValue: React.SetStateAction<number>) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      sx={{
        backgroundImage: "url('/assets/backgroundIMGALMS.jpeg')",
        backgroundSize: "cover",
        minHeight: "100vh",
        padding: 4,
      }}
      className="new-application-form-container"
    >
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Application Form Tabs"
        sx={{
          backgroundColor: "#003366",
          "& .MuiTab-root": {
            color: "rgba(255, 255, 255, 0.7)",
            textTransform: "none",
            fontSize: "16px",
            fontWeight: "normal",
            transition: "color 0.3s ease",
          },
          "& .Mui-selected": {
            color: "#ffffff",
            fontWeight: "bold",
          },
          "& .MuiTabs-scrollButtons": {
            color: "#ffffff",
          },
        }}
      >
        {Object.keys(tabs).map((label, index) => (
          <Tab key={index} label={label} />
        ))}
      </Tabs>

      <Box
        sx={{
          backgroundColor: "#ffffff",
          borderRadius: 2,
          padding: 3,
          marginTop: 4,
        }}
      >
        {Object.values(tabs)[activeTab]}
      </Box>
    </Box>
  );
};

export default NewApplicationForm;
