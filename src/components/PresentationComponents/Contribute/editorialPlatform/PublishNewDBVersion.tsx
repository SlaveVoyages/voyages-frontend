import { Box, Typography } from '@mui/material';

import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';

const PublishNewDBVersion: React.FC = () => {
  return (
    <Box sx={{ p: 2, width: '100%' }}>
      <ListEditorialPlatForm />
      <Typography
        variant="h4"
        sx={{ mb: 3, fontSize: '24px', fontWeight: 600 }}
      >
        Publish New DB Version
      </Typography>
    </Box>
  );
};

export default PublishNewDBVersion;
