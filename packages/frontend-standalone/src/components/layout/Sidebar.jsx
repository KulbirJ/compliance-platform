import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Dashboard,
  Assessment,
  Security,
  Description,
  Folder,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Assessments', icon: <Assessment />, path: '/assessments' },
  { text: 'Threat Models', icon: <Security />, path: '/threats' },
  { text: 'Risk Register', icon: <Warning />, path: '/risks' },
  { text: 'Evidence', icon: <Folder />, path: '/evidence' },
  { text: 'Reports', icon: <Description />, path: '/reports' },
];

const Sidebar = ({ open }) => {
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.text} onClick={() => navigate(item.path)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
