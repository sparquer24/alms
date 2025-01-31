import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VisibilityIcon from "@mui/icons-material/Visibility";

const getStatusChip = (status: string) => {
  switch (status) {
    case "Approved":
      return <Chip label="Approved" color="success" sx={{ fontWeight: "bold" }} />;
    case "Rejected":
      return <Chip label="Rejected" color="error" sx={{ fontWeight: "bold" }} />;
    case "Pending":
      return <Chip label="Pending" color="warning" sx={{ fontWeight: "bold" }} />;
    default:
      return <Chip label="N/A" sx={{ fontWeight: "bold", backgroundColor: "#E1D5F0" }} />;
  }
};

const CommonTable = ({ data }: { data: Array<any> }) => {

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
          <TableRow>
            <TableCell><strong>S.no</strong></TableCell>
            <TableCell><strong>ID</strong></TableCell>
            <TableCell><strong>UIN Number</strong></TableCell>
            <TableCell><strong>Applicant Name</strong></TableCell>
            <TableCell><strong>Date & Time</strong></TableCell>
            <TableCell><strong>Additional Information</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Action</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id || index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.uin}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.date}</TableCell>
              <TableCell>{row.info}</TableCell>
              <TableCell>{getStatusChip(row.status)}</TableCell>
              <TableCell>
                {row.status === "N/A" ? (
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#001678",
                      color: "#fff",
                      fontWeight: "bold",
                      textTransform: "none",
                      fontSize: "14px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      "&:hover": {
                        backgroundColor: "#001460",
                      },
                    }}
                  >
                    Forward <ArrowForwardIcon sx={{ fontSize: "18px" }} />
                  </Button>) : (
                  <IconButton color="primary" size="small">
                    <VisibilityIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CommonTable;
