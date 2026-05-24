import { Box } from '@mui/material';

import { footerStyle } from '@/styleMUI';
interface FooterModalProps {
  content?: string;
  height?: number;
}

const FooterModal: React.FC<FooterModalProps> = ({
  content = '...',
  height,
}) => {
  return (
    <Box sx={footerStyle} style={{ height: height }}>
      {content}
    </Box>
  );
};

export default FooterModal;
