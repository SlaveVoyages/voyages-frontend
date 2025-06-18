//https://www.slavevoyages.org/contribute/interim/new/2976
import { createElement } from 'react';
import { Add, Edit, Merge, Delete, List } from '@mui/icons-material';
const generateId = '';
export const getDisplayButtons = (translatedContribute: any) => [
  {
    nameBtn: translatedContribute.contributeNewVoyage,
    path: `/contribute/interim/new/${generateId}`,
    icon: createElement(Add),
  },
  {
    nameBtn: translatedContribute.contributeEditExistingVoyage,
    path: `/contribute/edit_voyage`,
    icon: createElement(Edit),
  },
  {
    nameBtn: translatedContribute.contributeMergeVoyages,
    path: `/contribute/merge_voyages`,
    icon: createElement(Merge),
  },
  {
    nameBtn: translatedContribute.contributeDeleteVoyage,
    path: `/contribute/delete_voyage`,
    icon: createElement(Delete),
  },
  {
    nameBtn: 'TEMP EDITORIAL PLAT',
    path: `/contribute/TEMP_EDITORIAL`,
    icon: createElement(List),
  },
];
