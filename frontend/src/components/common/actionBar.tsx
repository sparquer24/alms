import React, { useState } from "react";
import { Box, Button, TextField, InputAdornment, Menu, MenuItem } from "@mui/material";
import searchIcon from "@assets/search.svg";
import "../common/styles/commonStyles.css";
import { useNavigate } from "react-router-dom";

interface HeaderActionsProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({ searchTerm, onSearchChange }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
        width: "100%",
        maxWidth: "1300px",
        margin: "0 auto",
      }}
    >
      <Button
        className="common-button"
        sx={{
          width: "200px",
          fontWeight: "bold",
          textTransform: "none",
          fontSize: "14px",
        }}
      >
        New Applications ▼
      </Button>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        <TextField
          variant="outlined"
          placeholder="Search by number"
          size="small"
          value={searchTerm}
          onChange={onSearchChange}
          sx={{
            width: "300px",
            "& .MuiInputBase-root": {
              borderRadius: "8px",
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <img src={searchIcon} alt="Search" />
              </InputAdornment>
            ),
          }}
        />

        <Button
          className="common-button"
          sx={{
            width: "200px",
            fontWeight: "bold",
            textTransform: "none",
            fontSize: "14px",
          }}
          onClick={handleMenuOpen}
        >
          Application Form ▼
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleMenuClick("/new-application-form")}>
            New Application Form +
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick("/renewal-application-form")}>
            Renewal Application Form +
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default HeaderActions;
