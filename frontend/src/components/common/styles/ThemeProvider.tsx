import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none", 
          fontWeight: "normal",
          fontSize: "16px",
          color: "rgba(255, 255, 255, 0.7)", 
          "&.Mui-selected": {
            color: "#ffffff", 
            fontWeight: "bold",
          },
        },
      },
    },
  },
});

export default theme;
