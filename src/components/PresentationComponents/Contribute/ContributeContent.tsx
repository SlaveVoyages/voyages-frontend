import React from 'react';

import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';

// Form Components
import EditExistingVoyage from '@/components/PresentationComponents/Contribute/Form/EditExistingVoyage';
import MergeVoyages from '@/components/PresentationComponents/Contribute/Form/MergeVoyages';
import NewVoyage from '@/components/PresentationComponents/Contribute/Form/NewVoyage';
import PasswordChangeForm from '@/components/PresentationComponents/Contribute/Form/PasswordChangeForm';
import RecommendVoyageDeletion from '@/components/PresentationComponents/Contribute/Form/RecommendVoyageDeletion';
import SignUpForm from '@/components/PresentationComponents/Contribute/Form/SignUpForm';
import SignInForm from '@/components/PresentationComponents/Contribute/Form/SingInForm';
// Editorial Platform Components
import { useNavigation } from '@/hooks/useNavigation';
import { usePageRouter } from '@/hooks/usePageRouter';
import { RootState } from '@/redux/store';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

import ContributeHomeWelcome from './ContributeHomeWelcome';
import DownloadVoyages from './editorialPlatform/DownloadVoyages';
import EditEnslaved from './editorialPlatform/EditEnslaved';
import EditEnslavers from './editorialPlatform/EditEnslavers';
import EditorialPlatformTable from './editorialPlatform/EditorialPlatformTable';
import EditSourceCodes from './editorialPlatform/EditSourceCodes';
import EditUser from './editorialPlatform/EditUser';
import EditVoyages from './editorialPlatform/EditVoyages';
import PublishNewDBVersion from './editorialPlatform/PublishNewDBVersion';
import PasswordResetForm from './Form/PasswordResetForm';
import SignOut from './Form/SignOut';
import TermsAndConditions from './Form/TermsAndConditions';
import Guidelines from './Guidelines';
import '@/style/contributeContent.scss';

interface ContributeContentProps {
  openSideBar: boolean;
}

type RouteKey = string;
type ComponentRenderer = () => JSX.Element;

const ContributeContent: React.FC<ContributeContentProps> = ({
  openSideBar,
}) => {
  const location = useLocation();
  const { handleClickGuidelines, handleResetPasswordClick } = useNavigation();
  const { contributePath, endpointPath, contributePathEditorial } =
    usePageRouter();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedContribute = translationLanguagesContribute(languageValue);

  // Route configuration object
  const routeComponents: Record<RouteKey, ComponentRenderer> = {
    // Main contribute routes
    signin: () => (
      <SignInPage
        translatedContribute={translatedContribute}
        handleClickGuidelines={handleClickGuidelines}
      />
    ),
    signup: () => <SignUpForm />,
    guidelines: () => <Guidelines />,
    password: () => (
      <PasswordResetForm handleResetPassword={handleResetPasswordClick} />
    ),
    legal: () => <TermsAndConditions />,
    logout: () => <SignOut />,
    password_change: () => <PasswordChangeForm />,

    interim: () => <NewVoyage />,
    edit_voyage: () => <EditExistingVoyage openSideBar={openSideBar} />,
    merge_voyages: () => <MergeVoyages />,
    delete_voyage: () => <RecommendVoyageDeletion />,

    // Editorial platform routes
    'editor_main/pending': () => <EditVoyages />,
    'editor_main/enslavers_contrib': () => <EditEnslavers />,
    'editor_main/enslaved_contrib': () => <EditEnslaved />,
    'editor_main/users': () => <EditUser />,
    'editor_main/sources': () => <EditSourceCodes />,
    'editor_main/publish': () => <PublishNewDBVersion />,
    'editor_main/downloads': () => <DownloadVoyages />,
  };

  const getDisplayContent = (): JSX.Element => {
    // FIXED: Check actual URL pathname for requests routes
    // This handles both /editor_main/requests and /editor_main/requests/:id
    if (location.pathname.includes('/contribute/editor_main/requests')) {
      return <EditorialPlatformTable openSideBar={openSideBar} />;
    }

    // Check editorial path from hook
    if (contributePathEditorial) {
      // Check if it matches any route in our config
      if (routeComponents[contributePathEditorial]) {
        return routeComponents[contributePathEditorial]();
      }
    }

    // Check contribute path
    if (contributePath && routeComponents[contributePath]) {
      return routeComponents[contributePath]();
    }

    // Default to home page
    if (endpointPath === 'contribute') {
      return <ContributeHomeWelcome />;
    }

    // Fallback
    return <ContributeHomeWelcome />;
  };

  return getDisplayContent();
};

// Extracted SignIn page component for better organization
const SignInPage: React.FC<{
  translatedContribute: Record<string, string>;
  handleClickGuidelines: () => void;
}> = ({ translatedContribute, handleClickGuidelines }) => (
  <div className="contribute-content">
    <h1 className="page-title-1">{translatedContribute.contribute}</h1>
    <p>{translatedContribute.contributeText1}</p>
    <p>{translatedContribute.contributeText2}</p>
    <p>
      {translatedContribute.contributeText3}{' '}
      <Link to="#" className="contribute-link">
        {translatedContribute.contributeText3Link1}
      </Link>{' '}
      {translatedContribute.contributeText4}{' '}
      <button
        onClick={handleClickGuidelines}
        className="contribute-link-button"
        type="button"
        aria-label="View guidelines"
      >
        {translatedContribute.contributeText3Link2}
      </button>
    </p>
    <p>{translatedContribute.contributeText5}</p>
    <SignInForm />
  </div>
);

export default ContributeContent;
