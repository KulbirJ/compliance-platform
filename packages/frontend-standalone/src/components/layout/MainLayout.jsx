import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Description as ReportsIcon,
  Folder as EvidenceIcon,
  Warning as RiskIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const navigationItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Assessments', icon: <AssessmentIcon />, path: '/assessments' },
  { text: 'Threat Models', icon: <SecurityIcon />, path: '/threat-models' },
  { text: 'Risk Register', icon: <RiskIcon />, path: '/risks' },
  { text: 'Evidence', icon: <EvidenceIcon />, path: '/evidence' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
];

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Compliance
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box 
            component="img"
            src="/logo.jpg"
            alt="Company Logo"
            sx={{ 
              height: 45,
              mr: 2,
              cursor: 'pointer',
              display: { xs: 'none', sm: 'block' }
            }}
            onClick={() => navigate('/dashboard')}
          />
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 0, mr: 4, cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            Compliance Platform
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {navigationItems.map((item) => (
              <Button
                key={item.text}
                sx={{ my: 2, color: 'white', display: 'block' }}
                onClick={() => navigate(item.path)}
              >
                {item.text}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Container
          maxWidth="xl"
          sx={{
            mt: 4,
            mb: 4,
            flexGrow: 1,
          }}
        >
          {children}
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: 'auto',
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[200]
                : theme.palette.grey[800],
          }}
        >
          <Container maxWidth="xl">
            <Typography variant="body2" color="text.secondary" align="center">
              © {new Date().getFullYear()} Compliance Platform. All rights reserved.
            </Typography>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
