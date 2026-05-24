import { Dispatch } from '@reduxjs/toolkit';

import { resetSlice as resetAutoCompleteData } from './getAutoCompleteSlice';
import { resetSlice as resetSliceGlobalSearch } from './getCommonGlobalSearchResultSlice';
import {
  resetSlice as resetDataSetCollectionData,
  resetSlice as resetAllStateSliceDataVoyage,
} from './getDataSetCollectionSlice';
import { resetAllStateSlice as resetEstimateAssesment } from './getEstimateAssessmentSlice';
import { resetSlice as resetVoyagesFilter } from './getFilterSlice';
import { resetSlice as resetGeoTreeData } from './getGeoTreeDataSlice';
import { resetSlice as resetNodeEdgesAggroutesMapData } from './getNodeEdgesAggroutesMapDataSlice';
import { resetSlice as resetOptionDataPastEnslaved } from './getOptionsDataPastPeopleEnslavedSlice';
import { resetSlice as resetOptionsData } from './getOptionsDataSlice';
import {
  resetSlice as resetPeopleEnslavedDataSetCollection,
  resetAllStateSlice as resetAllStateSliceDataEnslaved,
} from './getPeopleEnslavedDataSetCollectionSlice';
import {
  resetSlice as resetPeopleEnslaversDataSetCollection,
  resetAllStateSlice as resetAllStateSliceDataEnslavers,
} from './getPeopleEnslaversDataSetCollectionSlice';
import { resetSlice as resetRangeSliderData } from './getRangeSliderSlice';
import { resetSliceSaveSearch } from './getSaveSearchSlice';
import { resetSlice as resetScrollEnslaved } from './getScrollEnslavedPageSlice';
import {
  resetSlice as resetScroolVoyages,
  resetSliceCurrentPageAndDialog,
} from './getScrollPageSlice';
import { resetSliceShowHideFilter } from './getShowFilterObjectSlice';
import { resetSliceTable } from './getTableSlice';

export const resetAll = () => (dispatch: Dispatch) => {
  dispatch(resetOptionsData());
  dispatch(resetGeoTreeData());
  dispatch(resetRangeSliderData());
  dispatch(resetAutoCompleteData());
  dispatch(resetDataSetCollectionData());
  dispatch(resetVoyagesFilter());
  dispatch(resetNodeEdgesAggroutesMapData());
  dispatch(resetOptionDataPastEnslaved());
  dispatch(resetPeopleEnslavedDataSetCollection());
  dispatch(resetPeopleEnslaversDataSetCollection());
  dispatch(resetScroolVoyages());
  dispatch(resetScrollEnslaved());
  dispatch(resetEstimateAssesment());
  dispatch(resetSliceSaveSearch());
  dispatch(resetSliceShowHideFilter());
  dispatch(resetSliceTable());
};

export const resetAllStateToInitailState = () => (dispatch: Dispatch) => {
  dispatch(resetOptionsData());
  dispatch(resetGeoTreeData());
  dispatch(resetRangeSliderData());
  dispatch(resetAutoCompleteData());
  dispatch(resetAllStateSliceDataVoyage());
  dispatch(resetVoyagesFilter());
  dispatch(resetNodeEdgesAggroutesMapData());
  dispatch(resetOptionDataPastEnslaved());
  dispatch(resetAllStateSliceDataEnslaved());
  dispatch(resetAllStateSliceDataEnslavers());
  dispatch(resetSliceCurrentPageAndDialog());
  dispatch(resetScrollEnslaved());
  dispatch(resetSliceGlobalSearch());
  dispatch(resetEstimateAssesment());
  dispatch(resetSliceSaveSearch());
  dispatch(resetSliceShowHideFilter());
  dispatch(resetSliceTable());

  // Clear all localStorage
  const keysToRemove = Object.keys(localStorage);
  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
};
