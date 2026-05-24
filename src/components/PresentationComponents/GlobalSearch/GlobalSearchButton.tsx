import { useEffect } from 'react';

import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useDispatch, useSelector } from 'react-redux';

import { usePageRouter } from '@/hooks/usePageRouter';
import { setInputSearchValue } from '@/redux/getCommonGlobalSearchResultSlice';
import { resetAll } from '@/redux/resetAllSlice';
import { AppDispatch, RootState } from '@/redux/store';
import '@/style/homepage.scss';
import {
  getColorBackground,
  getColorHoverBackgroundCollection,
} from '@/utils/functions/getColorStyle';

const GlobalSearchButton = () => {
  const dispatch: AppDispatch = useDispatch();
  const { inputSearchValue } = useSelector(
    (state: RootState) => state.getCommonGlobalSearch,
  );

  useEffect(() => {
    const storedValue = localStorage.getItem('global_search');
    if (storedValue) {
      if (storedValue) {
        dispatch(setInputSearchValue(storedValue));
      }
    }
  }, []);

  const handleExitGlobalSearch = () => {
    dispatch(setInputSearchValue(''));
    dispatch(resetAll());
    localStorage.removeItem('global_search');
  };

  const { styleName } = usePageRouter();

  useEffect(() => {
    const boxColor = getColorBackground(styleName!);
    document.documentElement.style.setProperty(
      '--btn-global-search--',
      boxColor,
    );
    const shadow = getColorHoverBackgroundCollection(styleName!);
    document.documentElement.style.setProperty('--btn-global-shadow--', shadow);
  }, []);

  return (
    <span className="global-search-button">
      <span className="global-search-text">
        Global Search Active: <strong>{`   ${inputSearchValue} `}</strong>
      </span>
      <span
        className="global-search-exit"
        role="button"
        tabIndex={0}
        onClick={handleExitGlobalSearch}
        onKeyDown={(e) => e.key === 'Enter' && handleExitGlobalSearch()}
      >
        <ExitToAppIcon />
        Exit global search
      </span>
    </span>
  );
};
export default GlobalSearchButton;
