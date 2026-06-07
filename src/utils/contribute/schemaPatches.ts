import { VoyageDatesSchema } from '@slavevoyages/voyages-contribute';

let applied = false;

// Date fields in the desired display order — before the length/imputed fields.
const VOYAGE_DATE_FIELDS_ORDER = [
  'voyage_began_sparsedate_id',
  'slave_purchase_began_sparsedate_id',
  'vessel_left_port_sparsedate_id',
  'date_departed_africa_sparsedate_id',
  'first_dis_of_slaves_sparsedate_id',
  'arrival_at_second_place_landing_sparsedate_id',
  'third_dis_of_slaves_sparsedate_id',
  'departure_last_place_of_landing_sparsedate_id',
  'voyage_completed_sparsedate_id',
  'imp_voyage_began_sparsedate_id',
  'imp_arrival_at_port_of_dis_sparsedate_id',
  'imp_departed_africa_sparsedate_id',
];

// Mutates VoyageDatesSchema.properties in-place so date fields appear first
// and length fields (length_middle_passage_days, imp_length_*) follow after.
// Must be called before any Contribute form renders. No-ops after the first run.
export function applySchemaPatches() {
  if (applied) return;
  applied = true;

  const props = VoyageDatesSchema.properties;
  const dateFieldSet = new Set(VOYAGE_DATE_FIELDS_ORDER);

  const dateProps = VOYAGE_DATE_FIELDS_ORDER.map((field) =>
    props.find((p) => 'backingField' in p && p.backingField === field),
  ).filter((p): p is NonNullable<typeof p> => p !== undefined);

  const lengthProps = props.filter(
    (p) => !('backingField' in p) || !dateFieldSet.has(p.backingField),
  );

  props.splice(0, props.length, ...dateProps, ...lengthProps);
}
