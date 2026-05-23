import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';

const EditUser: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 2, width: '100%' }}>
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
          Edit Users
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate('/admin/auth/user/')}
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
          Users on Live Admin
        </Button>
      </Box>
    </Box>
  );
};

export default EditUser;
