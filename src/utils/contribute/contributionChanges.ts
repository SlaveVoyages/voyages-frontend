import {
  EntityChange,
  EntityUpdate,
  PropertyChange,
} from '@slavevoyages/voyages-contribute';

export function combineOwnedChanges(
  changes: PropertyChange[],
): PropertyChange[] {
  const seen: Record<string, PropertyChange> = {};
  changes.forEach((change) => {
    seen[change.property] = change;
  });
  return Object.values(seen);
}

export function combineEntityChanges(changes: EntityChange[]): EntityChange[] {
  const entityMap: Record<string, EntityUpdate> = {};
  const otherChanges: EntityChange[] = [];

  changes.forEach((change) => {
    if (change.type === 'update') {
      const key = `${change.entityRef.schema}_${change.entityRef.id}`;

      if (!entityMap[key]) {
        entityMap[key] = { ...change, changes: [] };
      }

      const propertyMap: Record<string, PropertyChange> = {};
      entityMap[key].changes.forEach((propChange) => {
        propertyMap[propChange.property] = propChange;
      });

      change.changes.forEach((propertyChange) => {
        if (propertyChange.kind === 'owned') {
          propertyMap[propertyChange.property] = {
            ...propertyChange,
            changes: propertyChange.changes
              ? combineOwnedChanges(propertyChange.changes)
              : [],
          };
        } else {
          propertyMap[propertyChange.property] = propertyChange;
        }
      });

      entityMap[key].changes = Object.values(propertyMap);
    } else {
      otherChanges.push(change);
    }
  });

  return [...Object.values(entityMap), ...otherChanges];
}
