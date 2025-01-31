import React from "react";
import {
  TextField,
  Box,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Button,
} from "@mui/material";

const ApplicantIdentity = () => {
  return (
    <Box sx={{ padding: 3, backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        Applicant Identity
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="Applicant First Name" variant="outlined" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="Applicant Middle Name" variant="outlined" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="Applicant Last Name" variant="outlined" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="Application Filled By" variant="outlined" />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="UIN Number" variant="outlined" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="Parent/Spouse Name" variant="outlined" />
        </Grid>

        <Grid item xs={12} sm={3}>
          <Typography variant="body1">Sex</Typography>
          <RadioGroup row>
            <FormControlLabel value="male" control={<Radio />} label="Male" />
            <FormControlLabel value="female" control={<Radio />} label="Female" />
          </RadioGroup>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="PAN" variant="outlined" />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="Aadhar Number" variant="outlined" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Date of Birth in Christian Era (DD/MM/YYYY)"
            variant="outlined"
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="Date of Birth in Words" variant="outlined" />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="Place of Birth (Nativity)" variant="outlined" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Mobile Number (Office)" variant="outlined" />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Telephone Number (Residence)" variant="outlined" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Telephone Number (Office)" variant="outlined" />
        </Grid>
       

        <Grid item xs={12}>
          <Typography variant="body2" color="textSecondary">
            SCHEDULE-III Part – II | Application Form | Form A-1 (for individuals) | Form of
            application for an arms license In Form II, III, and IV
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2" color="error">
            NOTE: Please review the data before submitting your Arms License application.
          </Typography>
        </Grid>

        <Grid item xs={12} sx={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          <Button variant="contained" color="secondary">
            Save to Draft
          </Button>
          <Button variant="contained" color="primary">
            Next
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApplicantIdentity;
