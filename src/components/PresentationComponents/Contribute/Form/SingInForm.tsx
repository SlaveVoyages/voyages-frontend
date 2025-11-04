// SignInForm.tsx
import React from 'react';

import '@/style/contributeContent.scss';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useNavigation } from '@/hooks/useNavigation';
import { useSignInForm, SignInFormData } from '@/hooks/useSignInForm';
import { login } from '@/redux/getAuthUserSlice';
import { RootState } from '@/redux/store';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

// Define types for form values
interface SignInFormProps {
  nextPath?: string;
  onSubmit?: (data: SignInFormData) => Promise<void> | void;
}
const SignInForm: React.FC<SignInFormProps> = ({
  nextPath = '/contribute/legal',
  onSubmit,
}) => {
  const { handleSignUpClick, handleResetPasswordClick } = useNavigation();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedContribute = translationLanguagesContribute(languageValue);

  const {
    formData,
    errors,
    isSubmitting,
    handleInputChange,
    handleSubmit,
    setAuthError,
  } = useSignInForm();

  const mockUser = {
    email: 'meow@test.com',
    username: 'Thasanee',
    name: 'Thasanee',
    token: '$12345',
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleFormSubmit = async (data: SignInFormData) => {
    if (onSubmit) {
      await onSubmit(data);
    } else {
      if (data.email === mockUser.email && data.password === mockUser.token) {
        dispatch(
          login({
            email: mockUser.email,
            username: mockUser.username,
            token: mockUser.token,
            name: mockUser.name,
          }),
        );
        navigate(nextPath);
      } else {
        setAuthError('Invalid email or password');
      }
    }
  };

  const handleGoogleSignIn = () => {
    // Simulate Google Sign-In
    alert('Signing in with Google...');
  };

  return (
    <div className="contribute-sign-in-form" id="sign-in">
      <h2>{translatedContribute.contributeSignInButton}</h2>
      <div className="form-inorder">
        {translatedContribute.contributeInOrderToAccess}
      </div>
      <div className="sign-in-form-submit">
        <form
          method="post"
          action="/accounts/login/"
          onSubmit={(e) => handleSubmit(e, handleFormSubmit)}
          className="sign-in-form"
        >
          {/* CSRF Token */}
          <input
            type="hidden"
            name="csrfmiddlewaretoken"
            value="0vije7yXjc0TqC3CqWZ4qHPfMiCd2MSbCdZgAlJHuwnmaeKIz9Ix8iDzfdQ7Ugvn"
          />

          <table>
            <tbody>
              {/* Email Field */}
              <tr>
                <th>
                  <label htmlFor="id_email">
                    {translatedContribute.contributeEmail}
                  </label>
                </th>
                <td>
                  <input
                    type="email"
                    name="email"
                    id="id_email"
                    placeholder="E-mail address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    autoFocus
                  />
                </td>
              </tr>

              {/* Password Field */}
              <tr>
                <th>
                  <label htmlFor="id_password">
                    {translatedContribute.contributePassword}
                  </label>
                </th>
                <td>
                  <input
                    type="password"
                    name="password"
                    id="id_password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </td>
              </tr>

              {/* Remember Me Checkbox */}
              <tr>
                <th>
                  <label htmlFor="id_remember">
                    {translatedContribute.contributeRememberMe}
                  </label>
                </th>
                <td>
                  <input
                    className="checkbox"
                    type="checkbox"
                    name="remember"
                    id="id_remember"
                    checked={formData.remember}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <input type="hidden" name="next" value={nextPath} />

          {errors.general && (
            <div style={{ color: 'red', marginBottom: '1rem' }}>
              {errors.general}
            </div>
          )}
          <button
            type="submit"
            className="local_account_login_btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Signing in...'
              : translatedContribute.contributeSignInButton}
          </button>
        </form>
        <button onClick={handleGoogleSignIn}>
          <img
            src="https://www.slavevoyages.org/static/images/site/google_logo.png"
            width="16px"
            height="16px"
          />
          {translatedContribute.contributeSignInWithGoogle}
        </button>
        <span>
          <span>
            {translatedContribute.contributeCreateAnAccountText}{' '}
            <span className="create-account" onClick={handleSignUpClick}>
              {translatedContribute.contributeCreateAnAccount}
            </span>
          </span>{' '}
          <span>
            {translatedContribute.contributeIfYouHaveForgottenYourPassword}{' '}
            <span className="create-account" onClick={handleResetPasswordClick}>
              {translatedContribute.contributeRetrievePassword}
            </span>
          </span>
        </span>
      </div>
    </div>
  );
};

export default SignInForm;
