import {
  ChangeSet,
  Contribution,
  PublicationBatch,
} from '@dotproductdev/voyages-contribute';

import { extractItineraryData } from './extractItineraryData';
import { extractLinkedShipData } from './extractLinkedShipData';
import { extractShipData } from './extractShipData';
export type TransformedContribution = ChangeSet & {
  changeSetId: string;
  id: string;
  voyageId: string | number;
  status: number;
  shipName: string;
  portOfDeparture: string;
  nationality: string;
  tonnage: string;
  batch?: PublicationBatch;
};

export const transformContributionData = (
  contribution: Contribution,
): TransformedContribution => {
  const changeSetData = contribution.changeSet || contribution;
  return {
    ...changeSetData,
    changeSetId: changeSetData?.id,
    id: contribution?.id,
    voyageId: changeSetData.changes?.[0]?.entityRef?.id || '',
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
  };
};
