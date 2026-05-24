import { useState } from 'react';

export interface SignInFormData {
  email: string;
  password: string;
  remember: boolean;
}

export interface SignInFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const useSignInForm = () => {
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
    remember: false,
  });

  const [errors, setErrors] = useState<SignInFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: SignInFormErrors = {};

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof SignInFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    onSubmit?: (data: SignInFormData) => Promise<void> | void,
  ) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    if (validateForm()) {
      try {
        if (onSubmit) {
          await onSubmit(formData);
        }
      } catch (error) {
        console.error('Form submission error:', error);
        setErrors({ general: 'Sign in failed. Please try again.' });
      }
    }

    setIsSubmitting(false);
  };

  const setAuthError = (message: string) => {
    setErrors({ general: message });
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      remember: false,
    });
    setErrors({});
    setIsSubmitting(false);
  };

  return {
    formData,
    errors,
    isSubmitting,
    handleInputChange,
    handleSubmit,
    validateForm,
    setAuthError,
    resetForm,
  };
};
