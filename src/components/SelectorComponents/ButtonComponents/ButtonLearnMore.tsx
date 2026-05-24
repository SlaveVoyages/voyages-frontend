import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { setStyleName } from '@/redux/getDataSetCollectionSlice';
import { setPeopleEnslavedStyleName } from '@/redux/getPeopleEnslavedDataSetCollectionSlice';
import { resetAll } from '@/redux/resetAllSlice';
import { AppDispatch, RootState } from '@/redux/store';
import '@/style/landing.scss';
import { translationHomepage } from '@/utils/functions/translationLanguages';
interface ButtonLearnMoreProps {
  path: string;
  styleName?: string;
  stylePeopleName?: string;
}

const ButtonLearnMore = ({
  path,
  styleName,
  stylePeopleName,
}: ButtonLearnMoreProps) => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const handleClikLink = () => {
    dispatch(resetAll());
    navigate(path);
    if (styleName) {
      dispatch(setStyleName(styleName));
    }
    if (stylePeopleName) {
      dispatch(setPeopleEnslavedStyleName(stylePeopleName));
    }
  };
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedHomepage = translationHomepage(languageValue);
  return (
    <div
      className="learn-more-btn"
      role="button"
      tabIndex={0}
      onClick={handleClikLink}
      onKeyDown={(e) => e.key === 'Enter' && handleClikLink()}
    >
      <span>{translatedHomepage.learnMore}</span>
    </div>
  );
};
export default ButtonLearnMore;
