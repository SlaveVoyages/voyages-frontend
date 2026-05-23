// SignInForm.tsx
import React, { useState } from 'react';

import '@/style/contributeContent.scss';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Box,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Alert,
  Button,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useNavigation } from '@/hooks/useNavigation';
import { signInWithEmail, signInWithOAuth } from '@/redux/getAuthUserSlice';
import { RootState, AppDispatch } from '@/redux/store';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

interface SignInFormProps {
  nextPath?: string;
}

const SignInForm: React.FC<SignInFormProps> = ({
  nextPath = '/contribute/legal',
}) => {
  const { handleSignUpClick, handleResetPasswordClick } = useNavigation();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedContribute = translationLanguagesContribute(languageValue);

  const onSignUpClick = () => {
    handleSignUpClick();
  };

  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.getAuthUserSlice);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setAuthError(null);

    try {
      await dispatch(
        signInWithEmail({
          email: formValues.email,
          password: formValues.password,
        }),
      ).unwrap();
      navigate(nextPath);
    } catch (error: any) {
      setAuthError(error || 'Invalid email or password');
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await dispatch(signInWithOAuth('google')).unwrap();
    } catch (error: any) {
      setAuthError(error || 'Google sign in failed');
    }
  };

  const handleGitHubSignIn = async () => {
    setAuthError(null);
    try {
      await dispatch(signInWithOAuth('github')).unwrap();
    } catch (error: any) {
      setAuthError(error || 'GitHub sign in failed');
    }
  };

  return (
    <Box
      className="contribute-sign-in-form"
      id="sign-in"
      sx={{
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 500,
        mx: 'auto',
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 1, fontWeight: 600, textAlign: 'center' }}
      >
        {translatedContribute.contributeSignInButton}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, textAlign: 'center' }}
      >
        {translatedContribute.contributeInOrderToAccess}
      </Typography>

      {authError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {authError}
        </Alert>
      )}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Button
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          disabled={loading}
          variant="outlined"
          className="btn-sigin"
          sx={{
            textTransform: 'none',
            px: 3,
            py: 1,
            borderRadius: 1,
          }}
        >
          {translatedContribute.contributeSignInWithGoogle}
        </Button>
        <Button
          variant="outlined"
          className="btn-sigin"
          startIcon={<GitHubIcon />}
          onClick={handleGitHubSignIn}
          disabled={loading}
          sx={{
            textTransform: 'none',
            px: 3,
            py: 1,
            borderRadius: 1,
          }}
        >
          {translatedContribute.contributeSignInWithGithub}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          or sign in with email
        </Typography>
      </Divider>

      <Box
        component="form"
        onSubmit={handleFormSubmit}
        noValidate
        sx={{ width: '100%' }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography
            component="label"
            htmlFor="email"
            sx={{ display: 'block', mb: 1, fontWeight: 500 }}
          >
            {translatedContribute.contributeEmail}
          </Typography>
          <TextField
            required
            fullWidth
            id="email"
            name="email"
            autoComplete="email"
            placeholder="Enter your email address"
            value={formValues.email}
            onChange={handleInputChange}
            size="small"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography
            component="label"
            htmlFor="password"
            sx={{ display: 'block', mb: 1, fontWeight: 500 }}
          >
            {translatedContribute.contributePassword}
          </Typography>
          <TextField
            required
            fullWidth
            name="password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={formValues.password}
            onChange={handleInputChange}
            size="small"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <FormControlLabel
            sx={{ m: 0 }}
            control={
              <Checkbox
                name="remember"
                checked={formValues.remember}
                onChange={handleInputChange}
                size="small"
                sx={{ py: 0 }}
              />
            }
            label={
              <Typography variant="body2" sx={{ lineHeight: 1 }}>
                {translatedContribute.contributeRememberMe}
              </Typography>
            }
          />
          <Button
            variant="text"
            size="small"
            onClick={handleResetPasswordClick}
            sx={{
              textTransform: 'none',
              p: 0,
              minWidth: 'auto',
              fontSize: '0.875rem',
              lineHeight: 1,
              '&:hover': { textDecoration: 'underline', background: 'none' },
            }}
          >
            {translatedContribute.contributeRetrievePassword}
          </Button>
        </Box>

        <Button
          type="submit"
          fullWidth
          disabled={loading}
          variant="contained"
          className="btn-sigin"
          sx={{
            textTransform: 'none',
            py: 1,
            mb: 3,
            fontWeight: 500,
          }}
        >
          {loading
            ? 'Signing in...'
            : translatedContribute.contributeSignInButton}
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {translatedContribute.contributeCreateAnAccountText}{' '}
            <Button
              variant="text"
              size="small"
              onClick={onSignUpClick}
              sx={{
                textTransform: 'none',
                p: 0,
                minWidth: 'auto',
                fontSize: '0.875rem',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline', background: 'none' },
              }}
            >
              {translatedContribute.contributeCreateAnAccount}
            </Button>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SignInForm;
