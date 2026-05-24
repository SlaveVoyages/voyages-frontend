import { useSelector } from 'react-redux';

import voyageLogo from '@/assets/sv-logo.png';
import { RootState } from '@/redux/store';
import { translationHomepage } from '@/utils/functions/translationLanguages';

const SlaveVoyageLogo = () => {
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedHomepage = translationHomepage(languageValue);
  return (
    <div className="header-logo-slave-voyages">
      <div className="voyageLogo-img">
        <img src={voyageLogo} alt="" />
        <div className="voyage-description">{translatedHomepage.header}</div>
      </div>
    </div>
  );
};
export default SlaveVoyageLogo;
