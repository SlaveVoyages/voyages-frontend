import React from 'react';

import '@/style/landing.scss';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import AFRICANORIGINS from '@/assets/People_of_the_Atlantic.svg';
import ButtonLearnMore from '@/components/SelectorComponents/ButtonComponents/ButtonLearnMore';
import { RootState } from '@/redux/store';
import { AFRICANORIGINSPAGE, ENSALVEDPAGE } from '@/share/CONST_DATA';
import { translationHomepage } from '@/utils/functions/translationLanguages';

const AfricanOrigins: React.FC = () => {
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedHomepage = translationHomepage(languageValue);

  return (
    <div className="container-african">
      <div className="african-content">
        <div className="african-content-bg">
          <Link
            to={`${ENSALVEDPAGE}${AFRICANORIGINSPAGE}#map`}
            className="enslavers-content-bg"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={AFRICANORIGINS}
              alt="African Origins"
              className="african-img"
            />
          </Link>
        </div>
        <div className="african-content-detail">
          <h1>{translatedHomepage.homeAfrican}</h1>
          <p>{translatedHomepage.homeAfricanDes}</p>
          <ButtonLearnMore
            path={`${ENSALVEDPAGE}${AFRICANORIGINSPAGE}#map`}
            stylePeopleName={'african-origins'}
          />
        </div>
      </div>
    </div>
  );
};

export default AfricanOrigins;
