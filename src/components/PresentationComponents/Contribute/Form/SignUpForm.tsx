/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';

import EmailIcon from '@mui/icons-material/Email';
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
  Paper,
  Link,
  Alert,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { signUpWithEmail, signInWithOAuth } from '@/redux/getAuthUserSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  institution: string;
  description: string;
  password: string;
  passwordConfirm: string;
  agreeToTerms: boolean;
}

// Define a separate interface for error messages
interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  institution?: string;
  description?: string;
  password?: string;
  passwordConfirm?: string;
  agreeToTerms?: string;
}
interface SignUpFormProps {
  nextPath?: string;
}

const SignUpForm: React.FC<SignUpFormProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.getAuthUserSlice);
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const t = translationLanguagesContribute(languageValue);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    institution: '',
    description: '',
    password: '',
    passwordConfirm: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t.contributeSignUpEmailRequired;
    }
    if (!formData.firstName) {
      newErrors.firstName = t.contributeSignUpFirstNameRequired;
    }
    if (!formData.lastName) {
      newErrors.lastName = t.contributeSignUpLastNameRequired;
    }
    if (!formData.institution) {
      newErrors.institution = t.contributeSignUpInstitutionRequired;
    }
    if (!formData.description) {
      newErrors.description = t.contributeSignUpDescriptionRequired;
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = t.contributeSignUpPasswordRequired;
    }
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = t.contributeSignUpPasswordsDoNotMatch;
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = t.contributeSignUpAgreeRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (validateForm()) {
      try {
        await dispatch(
          signUpWithEmail({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            institution: formData.institution,
            description: formData.description,
          }),
        ).unwrap();

        setRegisteredEmail(formData.email);
        setShowConfirmModal(true);
      } catch (error: any) {
        setAuthError(error || t.contributeSignUpFailed);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleOAuthSignUp = async (provider: 'google' | 'github') => {
    setAuthError(null);
    try {
      await dispatch(signInWithOAuth(provider)).unwrap();
    } catch (error) {
      setAuthError((error as string) || t.contributeSignUpFailed);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    navigate('/accounts/signin');
  };

  return (
    <div className="contribute-sign-up-form" id="sign-in">
      <h1 className="page-title-1">{t.contributeSignUpTitle}</h1>
      <Typography sx={{ mb: 3 }}>
        {t.contributeSignUpAlreadyHaveAccount}{' '}
        <Link href="/accounts/signin" underline="hover">
          {t.contributeSignUpSignInLink}
        </Link>
      </Typography>
      {authError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          startIcon={<GoogleIcon />}
          onClick={() => handleOAuthSignUp('google')}
          disabled={loading}
          className="btn-sigup"
          variant="outlined"
          size="small"
          sx={{ textTransform: 'none' }}
        >
          {t.contributeSignUpWithGoogle}
        </Button>
        <Button
          variant="outlined"
          size="small"
          className="btn-sigup"
          startIcon={<GitHubIcon />}
          onClick={() => handleOAuthSignUp('github')}
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          {t.contributeSignUpWithGitHub}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }}>{t.contributeSignUpOrWithEmail}</Divider>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            className="label-signup"
            sx={{ width: 150 }}
            component="label"
            htmlFor="email"
          >
            {t.contributeSignUpEmailLabel}
          </Typography>
          <TextField
            required
            id="email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleInputChange}
            error={!!errors.email}
            helperText={errors.email}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            className="label-signup"
            sx={{ width: 150 }}
            component="label"
            htmlFor="email"
          >
            {t.contributeSignUpFirstNameLabel}
          </Typography>
          <TextField
            margin="normal"
            required
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            error={!!errors.firstName}
            helperText={errors.firstName}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            sx={{ width: 150 }}
            component="label"
            htmlFor="email"
            className="label-signup"
          >
            {t.contributeSignUpLastNameLabel}
          </Typography>
          <TextField
            margin="normal"
            required
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            error={!!errors.lastName}
            helperText={errors.lastName}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            sx={{ width: 150 }}
            component="label"
            htmlFor="email"
            className="label-signup"
          >
            {t.contributeSignUpInstitutionLabel}
          </Typography>

          <TextField
            margin="normal"
            required
            id="institution"
            name="institution"
            value={formData.institution}
            onChange={handleInputChange}
            error={!!errors.institution}
            helperText={errors.institution}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            sx={{ width: 150 }}
            component="label"
            htmlFor="email"
            className="label-signup"
          >
            {t.contributeSignUpDescriptionLabel}
          </Typography>

          <TextField
            margin="normal"
            required
            id="description"
            name="description"
            rows={1}
            value={formData.description}
            onChange={handleInputChange}
            error={!!errors.description}
            helperText={errors.description}
          />
        </Box>

        <Box sx={{ mt: 2, mb: 1, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
          <Typography gutterBottom className="label-signup">
            {t.contributeSignUpTermsTitle}
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              maxHeight: 100,
              overflow: 'auto',
              bgcolor: 'background.paper',
              mb: 1,
            }}
          >
            <Typography>{t.contributeTermsAndConditionsText}</Typography>
          </Paper>
          <FormControlLabel
            control={
              <Checkbox
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
              />
            }
            label={
              <span className="label-signup">
                {t.contributeSignUpAgreeToTerms}
              </span>
            }
          />
          {errors.agreeToTerms && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {errors.agreeToTerms}
            </Alert>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            sx={{ width: 150 }}
            component="label"
            htmlFor="email"
            className="label-signup"
          >
            {t.contributeSignUpPasswordLabel}
          </Typography>

          <TextField
            margin="normal"
            required
            name="password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleInputChange}
            error={!!errors.password}
            helperText={errors.password}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            sx={{ width: 150 }}
            component="label"
            htmlFor="email"
            className="label-signup"
          >
            {t.contributeSignUpPasswordAgainLabel}
          </Typography>

          <TextField
            margin="normal"
            required
            name="passwordConfirm"
            type={showPasswordConfirm ? 'text' : 'password'}
            id="passwordConfirm"
            autoComplete="new-password"
            value={formData.passwordConfirm}
            onChange={handleInputChange}
            error={!!errors.passwordConfirm}
            helperText={errors.passwordConfirm}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPasswordConfirm(!showPasswordConfirm)
                      }
                      edge="end"
                      size="small"
                    >
                      {showPasswordConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Button
          type="submit"
          disabled={loading}
          variant="outlined"
          className="btn-sigup"
          size="small"
          sx={{ textTransform: 'none' }}
        >
          {loading
            ? t.contributeSignUpCreatingAccount
            : t.contributeSignUpTitle}
        </Button>
      </Box>

      <Dialog open={showConfirmModal} onClose={handleCloseModal}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon color="primary" />
          {t.contributeSignUpCheckEmail}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>{t.contributeSignUpEmailSent}</Typography>
          <Typography sx={{ fontWeight: 'bold', mb: 2 }}>
            {registeredEmail}
          </Typography>
          <Typography>{t.contributeSignUpVerifyEmail}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} variant="contained">
            {t.contributeSignUpGoToSignIn}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SignUpForm;
