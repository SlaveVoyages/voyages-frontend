import { Contribution } from '@dotproductdev/voyages-contribute';

import { extractItineraryData } from './extractItineraryData';
import { extractLinkedShipData } from './extractLinkedShipData';
import { extractShipData } from './extractShipData';

export const transformContributionData = (contribution: Contribution) => {
  const changeSetData = contribution.changeSet || contribution;
  const changeStatus = contribution?.status;
  return {
    ...changeSetData,
    changeSetId: changeSetData?.id,
    id: contribution?.id,
    voyageId: changeSetData.changes?.[0]?.entityRef?.id || '',
    status: changeStatus,
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
