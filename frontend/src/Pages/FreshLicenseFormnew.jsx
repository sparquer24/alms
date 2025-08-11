import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateField, submitFreshLicense } from '../features/freshLicense/freshLicenseSlice';
import FormInput from '../components/forms/FormInput';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
} from '@mui/material';

// ... (previous imports and component setup remain the same)

const FreshLicenseForm = () => {
  // ... (previous state and handlers remain the same)

  const renderCriminalHistory = () => {
    return (
      <div style={{ padding: '20px' }}>
        {/* Criminal Case Section */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{
            fontSize: '18px',
            marginBottom: '20px',
            paddingBottom: '8px',
            borderBottom: '1px solid #e0e0e0'
          }}>
            13. Whether any criminal case is pending in any court of law against you?
          </h3>
          
          <FormControl component="fieldset" style={{ marginBottom: '20px' }}>
            <RadioGroup
              row
              aria-label="criminal-case-pending"
              name="isCriminalCasePending"
              value={formData.isCriminalCasePending || 'No'}
              onChange={handleChange}
            >
              <FormControlLabel 
                value="Yes" 
                control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }} />} 
                label="Yes" 
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '16px' } }}
              />
              <FormControlLabel 
                value="No" 
                control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }} />} 
                label="No" 
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '16px' } }}
              />
            </RadioGroup>
          </FormControl>

          {formData.isCriminalCasePending === 'Yes' && (
            <div style={{ marginLeft: '30px', marginTop: '15px' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormInput
                    label="FIR No."
                    name="firNumber"
                    value={formData.firNumber || ''}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{
                      style: { ...labelStyle, fontSize: '16px' }
                    }}
                    inputProps={{
                      style: { fontSize: '16px' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormInput
                    label="Police Station"
                    name="policeStation"
                    value={formData.policeStation || ''}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{
                      style: { ...labelStyle, fontSize: '16px' }
                    }}
                    inputProps={{
                      style: { fontSize: '16px' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormInput
                    label="Section of Law"
                    name="sectionOfLaw"
                    value={formData.sectionOfLaw || ''}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{
                      style: { ...labelStyle, fontSize: '16px' }
                    }}
                    inputProps={{
                      style: { fontSize: '16px' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormInput
                    label="Date of Offence"
                    name="dateOfOffence"
                    type="date"
                    value={formData.dateOfOffence || ''}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                      style: { ...labelStyle, fontSize: '16px' }
                    }}
                    inputProps={{
                      style: { fontSize: '16px' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormInput
                    label="Present Status"
                    name="caseStatus"
                    value={formData.caseStatus || ''}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{
                      style: { ...labelStyle, fontSize: '16px' }
                    }}
                    inputProps={{
                      style: { fontSize: '16px' }
                    }}
                  />
                </Grid>
              </Grid>
            </div>
          )}
        </div>

        {/* Previous License Section */}
        <div>
          <h3 style={{
            fontSize: '18px',
            marginBottom: '20px',
            paddingBottom: '8px',
            borderBottom: '1px solid #e0e0e0'
          }}>
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
              <FormControlLabel 
                value="Yes" 
                control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }} />} 
                label="Yes" 
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '16px' } }}
              />
              <FormControlLabel 
                value="No" 
                control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }} />} 
                label="No" 
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '16px' } }}
              />
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
                    InputLabelProps={{
                      style: { ...labelStyle, fontSize: '16px' }
                    }}
                    inputProps={{
                      style: { fontSize: '16px' }
                    }}
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
                      style: { ...labelStyle, fontSize: '16px' }
                    }}
                    inputProps={{
                      style: { fontSize: '16px' }
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
                      style: { ...labelStyle, fontSize: '16px' }
                    }}
                    inputProps={{
                      style: { fontSize: '16px' }
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
                    InputLabelProps={{
                      style: { ...labelStyle, fontSize: '16px' }
                    }}
                    inputProps={{
                      style: { fontSize: '16px' }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl component="fieldset" style={{ marginTop: '10px' }}>
                    <FormLabel component="legend" style={{ ...labelStyle, fontSize: '16px', marginBottom: '10px' }}>
                      Whether the license was renewed?
                    </FormLabel>
                    <RadioGroup
                      row
                      aria-label="license-renewed"
                      name="isLicenseRenewed"
                      value={formData.isLicenseRenewed || 'No'}
                      onChange={handleChange}
                      style={{ marginTop: '5px' }}
                    >
                      <FormControlLabel 
                        value="Yes" 
                        control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }} />} 
                        label="Yes" 
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '16px' } }}
                      />
                      <FormControlLabel 
                        value="No" 
                        control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }} />} 
                        label="No" 
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '16px' } }}
                      />
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
                          style: { ...labelStyle, fontSize: '16px' }
                        }}
                        inputProps={{
                          style: { fontSize: '16px' }
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
                        InputLabelProps={{
                          style: { ...labelStyle, fontSize: '16px' }
                        }}
                        inputProps={{
                          style: { fontSize: '16px' }
                        }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ... rest of the component code

  return (
    <div style={formContainerStyle}>
      {/* ... other form elements ... */}
      
      <div style={{ marginTop: '24px' }}>
        {activeTab === 0 && renderPersonalDetails()}
        {activeTab === 1 && renderAddressInfo()}
        {activeTab === 2 && renderOccupationBusiness()}
        {activeTab === 3 && renderCriminalHistory()}
        {activeTab > 3 && renderOtherSection()}
      </div>
      
      {/* ... navigation buttons ... */}
    </div>
  );
};

export default FreshLicenseForm;
