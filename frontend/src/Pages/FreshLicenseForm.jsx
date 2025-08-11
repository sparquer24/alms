import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateField, submitFreshLicense } from '../features/freshLicense/freshLicenseSlice';
import FormInput from '../components/forms/FormInput';
import Tabs from '../components/Tabs'; // Used in JSX
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Checkbox,
} from '@mui/material';
import backgroundIMG from '../assets/backgroundIMGALMS.jpeg';
import logo from '../assets/logo.png'; // Use your actual logo path
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const TABS = [
  'Applicant Identity',
  'Address Information',
  'Occupation & Business',
  'Criminal History',
  'License History',
  'License Details',
  'Upload Files',
  'Special Consideration, Claims & Biometric',
  'Note'
];

const sidebarWidth = 220;

const pageStyle = {
  minHeight: '100vh',
  width: '100vw',
  backgroundImage: `url(${backgroundIMG})`,
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
  display: 'flex',
  flexDirection: 'row',
};

const sidebarStyle = {
  width: sidebarWidth,
  background: 'rgba(255,255,255,0.92)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '32px 0 0 0',
  boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
  zIndex: 2,
};

const logoStyle = {
  width: 60,
  height: 60,
  marginBottom: 32,
  borderRadius: '50%',
  objectFit: 'cover',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
};

const navStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  width: '100%',
  marginTop: 24,
};

const navItemStyle = {
  padding: '12px 0 12px 32px',
  fontWeight: 500,
  fontSize: 18,
  color: '#22223b',
  cursor: 'pointer',
  borderLeft: '4px solid transparent',
  transition: 'all 0.2s',
};

const navItemActiveStyle = {
  ...navItemStyle,
  color: '#4F46E5',
  borderLeft: '4px solid #4F46E5',
  background: 'rgba(99,102,241,0.08)'
};

const mainContentStyle = {
  flex: 1,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'transparent',
};

const headerStyle = {
  height: 70,
  background: 'rgba(255,255,255,0.96)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 40px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  zIndex: 1,
};

const headerTitleStyle = {
  fontSize: 28,
  fontWeight: 700,
  color: '#22223b',
  letterSpacing: 1,
};

const profileIconStyle = {
  fontSize: 38,
  color: '#6366F1',
  cursor: 'pointer',
};

const formCardStyle = {
  maxWidth: 700,
  margin: '48px auto',
  background: 'transparent',
  borderRadius: 16,
  boxShadow: 'none',
  padding: '40px 48px',
  display: 'flex',
  flexDirection: 'column',
  gap: 32,
};

const FreshLicenseForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formData, loading } = useSelector((state) => state.freshLicense);
  const [formErrors, setFormErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);

  // Handle select field changes
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    dispatch(updateField({ field: name, value }));
  };

  // Handle field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(updateField({ field: name, value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Form validation - will be implemented per tab
  const validateCurrentTab = () => {
    const errors = {};
    
    // Personal Details Tab
    if (activeTab === 0) {
      if (!formData.fullName?.trim()) errors.fullName = 'Full name is required';
      if (!formData.fatherName?.trim()) errors.fatherName = "Father's name is required";
      if (!formData.motherName?.trim()) errors.motherName = "Mother's name is required";
      if (!formData.dob) errors.dob = 'Date of birth is required';
      if (!formData.gender) errors.gender = 'Gender is required';
      if (!formData.maritalStatus) errors.maritalStatus = 'Marital status is required';
      if (!formData.nationality) errors.nationality = 'Nationality is required';
      if (!formData.religion) errors.religion = 'Religion is required';
      if (!formData.category) errors.category = 'Category is required';
      if (!formData.bloodGroup) errors.bloodGroup = 'Blood group is required';
      if (!formData.aadharNumber) {
        errors.aadharNumber = 'Aadhar number is required';
      } else if (!/^\d{12}$/.test(formData.aadharNumber)) {
        errors.aadharNumber = 'Aadhar number must be exactly 12 digits';
      }
      if (!formData.voterId) errors.voterId = 'Voter ID is required';
      if (!formData.panNumber) errors.panNumber = 'PAN number is required';
      if (!formData.mobileNumber) {
        errors.mobileNumber = 'Mobile number is required';
      } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
        errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
      }
      if (!formData.email) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    // Add validation for other tabs as needed
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleNext = () => {
    if (validateCurrentTab()) {
      if (activeTab < TABS.length - 1) {
        setActiveTab(activeTab + 1);
      } else {
        handleSubmit();
      }
    }
  };
  
  const handlePrevious = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  // Fetch Telangana districts
  useEffect(() => {
    const telanganaDistricts = [
      'Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 
      'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 
      'Khammam', 'Komaram Bheem Asifabad', 'Mahabubabad', 'Mahabubnagar', 
      'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool', 
      'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 
      'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 
      'Warangal Rural', 'Warangal Urban', 'Yadadri Bhuvanagiri'
    ];
    setDistricts(telanganaDistricts.sort());
    setLoadingDistricts(false);
  }, []);

  // Update permanent address when same as present is toggled
  useEffect(() => {
    if (formData.sameAsPresent) {
      dispatch(updateField({ field: 'permanentAddress', value: formData.presentAddress }));
      dispatch(updateField({ field: 'permanentState', value: formData.presentState }));
      dispatch(updateField({ field: 'permanentDistrict', value: formData.presentDistrict }));
      dispatch(updateField({ field: 'permanentPoliceStation', value: formData.presentPoliceStation }));
    }
  }, [formData.sameAsPresent, dispatch, formData.presentAddress, formData.presentState, formData.presentDistrict, formData.presentPoliceStation]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (validateCurrentTab()) {
      try {
        const result = await dispatch(submitFreshLicense(formData)).unwrap();
        if (result.success) {
          navigate('/success');
        }
      } catch (error) {
        console.error('Submission failed:', error);
      }
    }
  };

  const formContainerStyle = {
    maxWidth: '1200px',
    margin: '36px auto',
    padding: '32px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const headingStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '24px',
    textAlign: 'center'
  };

  const errorStyle = {
    margin: '0 0 24px 0',
    padding: '16px',
    backgroundColor: '#fef2f2',
    borderLeft: '4px solid #ef4444',
    color: '#b91c1c',
    borderRadius: '4px'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '24px 20px',
    marginBottom: '32px',
    alignItems: 'flex-end',
    '@media (max-width: 1280px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    },
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
      gap: '20px'
    }
  };

  const buttonContainer = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '32px',
    gridColumn: '1 / -1',
    padding: '0 20px',
    width: '100%',
  };

  const sectionHeading = {
    fontSize: '18px',
    fontWeight: '600',
    margin: '24px 0 16px 0',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb',
    color: '#111827',
  };

  const renderLicenseHistory = () => {
    return (
      <div>
        <h3 style={{ ...sectionHeading, fontSize: '18px', marginBottom: '20px', paddingBottom: '8px', borderBottom: '1px solid #e0e0e0' }}>
          14. Whether you have previously held any license under Arms Act, 1959 or Arms Rules, 1962?
        </h3>
        
        <FormControl component="fieldset" style={{ marginBottom: '20px' }}>
          <RadioGroup
            row
            aria-label="previous-license"
            name="hasPreviousLicense"
            value={formData.hasPreviousLicense || 'No'}
            onChange={handleChange}
          >
            <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="No" control={<Radio />} label="No" />
          </RadioGroup>
        </FormControl>
  
        {formData.hasPreviousLicense === 'Yes' && (
          <div style={{ marginLeft: '30px', marginTop: '15px' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <FormInput
                  label="License No."
                  name="previousLicenseNumber"
                  value={formData.previousLicenseNumber || ''}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormInput
                  label="Date of Issue"
                  name="licenseIssueDate"
                  type="date"
                  value={formData.licenseIssueDate || ''}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormInput
                  label="Date of Expiry"
                  name="licenseExpiryDate"
                  type="date"
                  value={formData.licenseExpiryDate || ''}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormInput
                  label="Issuing Authority"
                  name="issuingAuthority"
                  value={formData.issuingAuthority || ''}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl component="fieldset" style={{ marginTop: '10px' }}>
                  <FormLabel component="legend">Whether the license was renewed?</FormLabel>
                  <RadioGroup
                    row
                    aria-label="license-renewed"
                    name="isLicenseRenewed"
                    value={formData.isLicenseRenewed || 'No'}
                    onChange={handleChange}
                    style={{ marginTop: '5px' }}
                  >
                    <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="No" control={<Radio />} label="No" />
                  </RadioGroup>
                </FormControl>
              </Grid>
  
              {formData.isLicenseRenewed === 'Yes' && (
                <>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormInput
                      label="Date of Renewal"
                      name="renewalDate"
                      type="date"
                      value={formData.renewalDate || ''}
                      onChange={handleChange}
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormInput
                      label="Renewing Authority"
                      name="renewingAuthority"
                      value={formData.renewingAuthority || ''}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </div>
        )}
      </div>
    );
  };

  const inputStyle = {
    '& .MuiInputBase-input': {
      fontSize: '16px',
    },
    '& .MuiInputLabel-root': {
      fontSize: '16px',
    },
    '& .MuiFormLabel-root': {
      fontSize: '16px',
    },
    '& .MuiSelect-select': {
      fontSize: '16px',
    },
  };

  // Placeholder render functions for tabs
  const renderPersonalDetails = () => <div style={{padding: '20px', border: '1px dashed #ccc', borderRadius: '4px'}}><Typography variant="h6">Applicant Identity Content</Typography><Typography>Details for applicant identity will be here.</Typography></div>;
  const renderAddressInfo = () => <div style={{padding: '20px', border: '1px dashed #ccc', borderRadius: '4px'}}><Typography variant="h6">Address Information Content</Typography><Typography>Details for address information will be here.</Typography></div>;
  const renderOccupationBusiness = () => <div style={{padding: '20px', border: '1px dashed #ccc', borderRadius: '4px'}}><Typography variant="h6">Occupation & Business Content</Typography><Typography>Details for occupation and business will be here.</Typography></div>;
  const renderCriminalHistory = () => <div style={{padding: '20px', border: '1px dashed #ccc', borderRadius: '4px'}}><Typography variant="h6">Criminal History Content</Typography><Typography>Details for criminal history will be here.</Typography></div>;
  const renderOtherSection = () => <div style={{padding: '20px', border: '1px dashed #ccc', borderRadius: '4px'}}><Typography variant="h6">Other Section Content</Typography><Typography>Content for other sections will appear here based on the active tab.</Typography></div>; // This might need to be more dynamic if it serves multiple tabs like 5, 6, 7, 8
  const renderPlaceholder = (tabName) => <div style={{padding: '20px', border: '1px dashed #ccc', borderRadius: '4px'}}><Typography variant="h6">{tabName} Content</Typography><Typography>Content for {tabName} will be here.</Typography></div>;

  const submitButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#4F46E5', // Primary color from memory
    color: 'white',
    border: '1px solid #4F46E5',
    borderRadius: '4px',
    padding: '0 16px',
    height: '48px',
    minWidth: '150px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338CA', // Darker shade of primary
      borderColor: '#4338CA'
    }
  };

  const ghostButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    color: '#FFCC00',
    border: '1px solid #FFCC00',
    borderRadius: '4px',
    padding: '0 16px',
    height: '48px',
    minWidth: '150px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 204, 0, 0.08)',
      borderColor: '#e6b800'
    }
  }; 

  return (
    <div style={pageStyle}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <img src={logo} alt="Logo" style={logoStyle} />
        <nav style={navStyle}>
          <div style={navItemActiveStyle}>Dashboard</div>
          <div style={navItemStyle}>Applications</div>
          <div style={navItemStyle}>Instructions</div>
          <div style={navItemStyle}>Profile</div>
        </nav>
      </aside>
      {/* Main Content */}
      <div style={mainContentStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <span style={headerTitleStyle}>Arms License Management System</span>
          <AccountCircleIcon style={profileIconStyle} />
        </header>
        {/* Form Card */}
        <div style={formCardStyle}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: '#4F46E5', textAlign: 'center' }}>Fresh License Application</h1>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                padding: '8px 4px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#e5e7eb #f9fafb',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': {
                  height: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f9fafb',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#e5e7eb',
                  borderRadius: '3px',
                },
              }}>
                {TABS.map((tab, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    type="button"
                    style={{
                      flex: '0 0 auto',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: activeTab === index ? '#4F46E5' : '#f9fafb',
                      color: activeTab === index ? 'white' : '#6b7280',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      minWidth: '160px',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      fontSize: '14px',
                      fontWeight: '500',
                      boxShadow: activeTab === index ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                      '&:hover': {
                        borderColor: activeTab === index ? '#4F46E5' : '#d1d5db',
                        backgroundColor: activeTab === index ? '#4338CA' : '#f3f4f6',
                      }
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: '24px' }}>
              {activeTab === 0 && renderPersonalDetails()}
              {activeTab === 1 && renderAddressInfo()}
              {activeTab === 2 && renderOccupationBusiness()}
              {activeTab === 3 && renderCriminalHistory()}
              {activeTab === 4 && renderLicenseHistory()} 
              {activeTab > 4 && renderOtherSection()} 
              {activeTab > 4 && renderPlaceholder(TABS[activeTab])}
            </div>
            
            <div style={buttonContainer}>
              <div>
                {activeTab > 0 && (
                  <button 
                    type="button" 
                    onClick={handlePrevious}
                    style={ghostButtonStyle}
                  >
                    Previous
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  type="button" 
                  style={{
                    ...ghostButtonStyle,
                    borderColor: '#FFCC00',
                    color: '#FFCC00'
                  }}
                  onClick={() => console.log('Save to draft clicked')}
                >
                  Save to draft
                </button>
                <button 
                  type="button" 
                  onClick={handleNext}
                  style={submitButtonStyle}
                  disabled={Object.keys(formErrors).length > 0 || loading}
                >
                  {activeTab === TABS.length - 1 
                    ? (loading ? 'Submitting...' : 'Submit') 
                    : 'Next'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Common styles
const labelStyle = {
  fontSize: '16px',
  fontWeight: '600',
  marginBottom: '8px',
  display: 'block',
};

const inputStyle = {
  '& .MuiInputBase-input': {
    fontSize: '16px',
  },
  '& .MuiInputLabel-root': {
    fontSize: '16px',
  },
  '& .MuiFormLabel-root': {
    fontSize: '16px',
  },
  '& .MuiSelect-select': {
    fontSize: '16px',
  },
};


const formContainerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  fontSize: '16px',
};

export default FreshLicenseForm;
