// SignInForm.tsx
import React, { useState } from 'react';
import '@/style/contributeContent.scss';
import { useDispatch, useSelector } from 'react-redux';
import { signInWithEmail, signInWithOAuth } from '@/redux/getAuthUserSlice';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '@/hooks/useNavigation';
import { RootState } from '@/redux/store';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';
import { AppDispatch } from '@/redux/store';

// Define types for form values
interface SignInFormProps {
  nextPath?: string;
}
const SignInForm: React.FC<SignInFormProps> = ({
  nextPath = '/contribute/legal',
}) => {
  const { handleSignUpClick, handleResetPasswordClick } = useNavigation();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages
  );
  const translatedContribute = translationLanguagesContribute(languageValue);

  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [authError, setAuthError] = useState<string | null>(null);

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
        })
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
    <div className="contribute-sign-in-form" id="sign-in">
      <h2>{translatedContribute.contributeSignInButton}</h2>
      <div className="form-inorder">
        {translatedContribute.contributeInOrderToAccess}
      </div>
      {authError && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {authError}
        </div>
      )}
      <div className="sign-in-form-submit">
        <form
          onSubmit={handleFormSubmit}
          className="sign-in-form"
        >

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
                    value={formValues.email}
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
                    value={formValues.password}
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
                    checked={formValues.remember}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <button type="submit" className="local_account_login_btn" disabled={loading}>
            {loading ? 'Signing in...' : translatedContribute.contributeSignInButton}
          </button>
        </form>
        <button onClick={handleGoogleSignIn} disabled={loading}>
          <img
            src="https://www.slavevoyages.org/static/images/site/google_logo.png"
            width="16px"
            height="16px"
          />
          {translatedContribute.contributeSignInWithGoogle}
        </button>
        <button onClick={handleGitHubSignIn} disabled={loading}>
          <img
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            width="16px"
            height="16px"
            alt="GitHub"
          />
          Sign in with GitHub
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
