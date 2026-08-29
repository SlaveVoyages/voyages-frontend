import {
  AllSchemas,
  Property,
  PropertyAccessLevel,
} from '@slavevoyages/voyages-contribute';

/**
 * Schema properties by uid, which is how a stored change names the thing it
 * changed.
 *
 * `getSchemaProp` looks up by label and needs the schema in hand; a change
 * carries neither. Built once — the schemas are static — and first writer
 * wins, since a uid is unique within the schema that minted it.
 */
const byUid = new Map<string, Property>();
for (const schema of AllSchemas) {
  for (const property of schema.properties) {
    if (!byUid.has(property.uid)) {
      byUid.set(property.uid, property);
    }
  }
}

/** The property a change refers to, or undefined if nothing declares that uid. */
export const propertyForUid = (uid: string): Property | undefined =>
  byUid.get(uid);

/**
 * How a change reads to a person: the property's own label, so "Voyage ID"
 * rather than the uid it is stored under.
 */
export const propertyLabelForUid = (uid: string): string | undefined =>
  byUid.get(uid)?.label;

/**
 * Whether someone at `accessLevel` is allowed to see this property at all.
 *
 * The same comparison `EntityForm` makes when deciding which fields to render,
 * applied to the changes list — otherwise a contributor is shown an editor's
 * edit to a field the form never offered them, with no way to act on it. A uid
 * nothing declares is left visible: it is not evidence of a restriction.
 */
export const isPropertyVisibleAt = (
  uid: string,
  accessLevel: PropertyAccessLevel,
): boolean => {
  const property = byUid.get(uid);
  return (
    property?.accessLevel === undefined || property.accessLevel <= accessLevel
  );
};
