import {
  EntitySchema,
  MaterializedEntity,
  materializeNew,
} from '@slavevoyages/voyages-contribute';

/**
 * A root entity for a contribution, without a placeholder id sitting in the
 * field an editor has to assign.
 *
 * `materializeNew` seeds whatever id it is given into the primary key's own
 * slot. A new voyage's id is a uuid — the contribution's handle, not a voyage
 * id — so the form opened with `Voyage ID: 8bbe7f55-…` in a numeric field that
 * validates 1..99999999999.
 *
 * That is not cosmetic. Publication builds a new row out of the changes alone
 * (`_process_new_entity` sets `obj.id = obj.voyage_id` from them, and the uuid
 * is only a temporary handle for remapping foreign keys), so the uuid either
 * reached the database as a voyage id or nothing did. Voyage ids come from
 * blocks an editor controls, so the field starts empty and the editor fills it
 * in before accepting — which the schema now requires of them.
 *
 * Only a non-numeric id is cleared: editing an existing voyage materializes it
 * under its real id, and that one belongs in the field.
 */
export const materializeContributionRoot = (
  schema: EntitySchema,
  id: string | number,
): MaterializedEntity => {
  const entity = materializeNew(schema, id);
  if (/^\d+$/.test(String(id))) {
    return entity;
  }
  const pk = schema.properties.find(
    (p) => (p as { backingField?: string }).backingField === schema.pkField,
  );
  if (pk) {
    entity.data[pk.label] = null;
  }
  return entity;
};
