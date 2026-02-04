import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { signUpWithEmail } from '@/redux/getAuthUserSlice';
import { AppDispatch, RootState } from '@/redux/store';

import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Checkbox,
  FormControlLabel,
  Paper,
  Link,
  Alert,
} from '@mui/material';

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.institution) {
      newErrors.institution = 'Institution is required';
    }
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMessage(null);

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
          })
        ).unwrap();

        setSuccessMessage(
          'Account created! Please check your email to confirm your account.'
        );

        setTimeout(() => {
          navigate('/accounts/signin');
        }, 3000);
      } catch (error: any) {
        setAuthError(error || 'Sign up failed. Please try again.');
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

  return (
    <div className="contribute-sign-in-form" id="sign-in">
      <h1 className="page-title-1"> Sign-up</h1>
      <Typography sx={{ mb: 3 }}>
        Already have an account? Then please{' '}
        <Link href="/accounts/signin" underline="hover">
          sign in
        </Link>
      </Typography>
      {authError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            className="label-signup"
            sx={{ width: 150 }}
            component="label"
            htmlFor="email"
          >
            E-mail:
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
            First name:
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
            Last name:
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
            Institution:
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
            Brief description of new material and sources:
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
            Terms and Conditions:
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
            <Typography>
              I warrant that I have the right to contribute the following data
              to the Voyages Database and its inclusion in the Voyages Database
              will not infringe anyone's intellectual property rights. I also
              agree that this data will become part of the Voyages: The
              Trans-Atlantic Slave Trade Database website and will be governed
              by any applicable licenses.
            </Typography>
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
                Agree to the terms and conditions above
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
            Password:
          </Typography>

          <TextField
            margin="normal"
            required
            name="password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleInputChange}
            error={!!errors.password}
            helperText={errors.password}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            sx={{ width: 150 }}
            component="label"
            htmlFor="email"
            className="label-signup"
          >
            Password (again):
          </Typography>

          <TextField
            margin="normal"
            required
            name="passwordConfirm"
            type="password"
            id="passwordConfirm"
            autoComplete="new-password"
            value={formData.passwordConfirm}
            onChange={handleInputChange}
            error={!!errors.passwordConfirm}
            helperText={errors.passwordConfirm}
          />
        </Box>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign-up'}
        </button>
      </Box>
    </div>
  );
};

export default SignUpForm;
