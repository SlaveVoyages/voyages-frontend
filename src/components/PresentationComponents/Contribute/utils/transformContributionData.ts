import {
  Contribution,
  PublicationBatch,
} from '@slavevoyages/voyages-contribute';

import { extractItineraryData } from './extractItineraryData';
import { extractLinkedShipData } from './extractLinkedShipData';
import { extractShipData } from './extractShipData';
export type TransformedContribution = Contribution & {
  changeSetId: string;
  id: string;
  voyage_id: string | number;
  status: number;
  shipName?: string;
  portOfDeparture?: string;
  nationality?: string;
  tonnage?: string;
  batch?: PublicationBatch;
  type?: string;
};

export const transformContributionData = (
  contribution: Contribution,
): TransformedContribution => {
  const changeSetData = contribution.changeSet || {};

  return {
    ...contribution,
    ...changeSetData,
    changeSetId: changeSetData?.id ?? '',
    id: contribution?.id ?? '',
    voyage_id: contribution?.root?.id ?? '',
    status: contribution?.status,
    shipName: extractShipData(changeSetData, 'VoyageShip_ship_name'),
    portOfDeparture: extractItineraryData(changeSetData),
    nationality: extractLinkedShipData(
      changeSetData,
      'VoyageShip_nationality_ship_id',
      'Nation name',
    ),
    tonnage: extractShipData(changeSetData, 'VoyageShip_tonnage'),
    batch: contribution?.batch,
    type: contribution?.root?.type,
  };
};
