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
  timestamp?: number;
  shipName?: string;
  portOfDeparture?: string;
  nationality?: string;
  tonnage?: string;
  batch?: PublicationBatch;
  type?: string;
};

const MIN_VALID_TIMESTAMP = new Date('2000-01-01').getTime();

export const transformContributionData = (
  contribution: Contribution,
): TransformedContribution => {
  const changeSetData = contribution.changeSet || {};

  // The backend sometimes returns a voyage's historical departure date instead
  // of the contribution save time. Guard against pre-2000 values and fall back
  // to 0 (sentinel) so the UI can render "—" and sort these rows to the bottom.
  const rawTs = changeSetData.timestamp;
  const ts =
    rawTs && Number(new Date(rawTs)) >= MIN_VALID_TIMESTAMP ? rawTs : 0;

  return {
    ...contribution,
    ...changeSetData,
    timestamp: ts,
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
    batch: contribution?.batch ?? undefined,
    type: contribution?.root?.type,
  };
};
