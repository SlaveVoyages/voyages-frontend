import MenuIcon from '@mui/icons-material/Menu';
import { Toolbar } from '@mui/material';

import { MenuButton } from '@/styleMUI';
interface ButtonToggleProps {
  handleDrawerOpen: () => void;
}
const ButtonToggle = ({ handleDrawerOpen }: ButtonToggleProps) => {
  return (
    <Toolbar>
      <MenuButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={handleDrawerOpen}
      >
        <MenuIcon />
      </MenuButton>
    </Toolbar>
  );
};

export default ButtonToggle;
