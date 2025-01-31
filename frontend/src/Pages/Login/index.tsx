import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import jsCookie from "js-cookie";
import { toast } from "react-toastify";
import { postData, setAuthToken } from "../../api/axiosConfig";
import armsLogo from "@assets/ARMS_&_AMMUNITAION_LICENSE_LOGO.svg";
import { LABELS } from "../../constants";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [loading, setLoading] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await postData(`/login`, { username, password });
      if (!response.isSuccess) {
        toast.error("Invalid credentials!");
        return;
      }

      const data_res = JSON.parse(response.body);
      jsCookie.set("user", JSON.stringify(data_res?.data), { expires: 1 });
      const accessToken = data_res?.data.accessToken;
      jsCookie.set("token", accessToken, { expires: 1 });
      setAuthToken(accessToken);
      toast.success("Successfully logged in!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundImage: "url('/assets/backgroundIMGALMS.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        gap: "163px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          flexBasis: "30%",
        }}
      >
        <img
          src={armsLogo}
          alt="Arms State Police Badge"
          style={{
            width: "100%",
            maxWidth: "300px",
            height: "auto",
            borderRadius: "10px",
          }}
        />
      </Box>

      <Card
        sx={{
          width: "100%",
          maxWidth: "480px",
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: "#fff",
        }}
      >
        <CardContent sx={{ padding: "35px 40px" }}>
          <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
            <img
              src={armsLogo}
              alt="Arms Police Logo"
              style={{
                height: "50px",
                marginRight: "10px",
              }}
            />
            <Typography variant="h5" fontWeight="bold" color="#31208A">
              Telangana Police
            </Typography>
          </Box>

          <Typography
            variant="h6"
            color="#001678"
            textAlign="center"
            fontFamily="Inter"
            fontWeight="700"
            mb={4}
          >
            Login
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box mb={3}>
              <Typography
                variant="body1"
                fontWeight="bold"
                color="#001678"
                mb={1}
                fontSize="16px"
              >
                {LABELS.USER_ID}
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                margin="none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                sx={{
                  "& .MuiInputBase-input": {
                    padding: "10px 12px",
                    fontSize: "14px",
                  },
                }}
              />
            </Box>
            <Box mb={4}>
              <Typography
                variant="body1"
                fontWeight="bold"
                color="#001678"
                mb={1}
                fontSize="16px"
              >
                {LABELS.PASSWORD}
                </Typography>
              <TextField
                variant="outlined"
                fullWidth
                margin="none"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePassword}
                          edge="end"
                          aria-label="toggle password visibility"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  "& .MuiInputBase-input": {
                    padding: "10px 12px",
                    fontSize: "14px",
                  },
                }}
              />
            </Box>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                height: "50px",
                mt: 3,
                backgroundColor: "#31208A",
                color: "#fff",
                fontSize: "16px",
                "&:hover": {
                  backgroundColor: "#31208A",
                },
                "&:disabled": {
                  backgroundColor: "#31208A",
                  color: "#fff",
                  opacity: 0.8,
                },
              }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                <>
                {LABELS.LOGIN}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
