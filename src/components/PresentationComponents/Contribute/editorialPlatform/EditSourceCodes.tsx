import { Box, Button, Typography } from '@mui/material';

import { BASEURL } from '@/share/AUTH_BASEURL';

import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';

// Source codes are managed in the Django admin (same as the legacy Contribute
// site), so this page links out to it. Opens in a new tab; the editor
// authenticates there.
const EditSourceCodes: React.FC = () => {
  return (
    <Box sx={{ pr: 4, pl: 2, pb: 4, width: '100%' }}>
      <ListEditorialPlatForm />

      <Box
        sx={{
          mt: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontSize: '24px', fontWeight: 600 }}>
          Source Codes
        </Typography>

        <Typography sx={{ color: '#6b7280' }}>
          Sources and short references are managed in the Django admin.
        </Typography>

        <Button
          variant="contained"
          href={`${BASEURL}/admin/document/source/`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            backgroundColor: 'rgb(55, 148, 141)',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            px: 3,
            py: 1,
            '&:hover': { backgroundColor: 'rgb(1, 136, 125)' },
          }}
        >
          Source Codes on Live Admin
        </Button>
      </Box>
    </Box>
  );
};

export default EditSourceCodes;
