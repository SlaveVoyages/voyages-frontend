/**
 * The sex of an enslaved person.
 *
 * Stored on `past_enslaved.gender_int` as a bare integer (the schema field is
 * `Enslaved_gender_int`). voyages-api keeps a separate `gender` FK to a `Gender`
 * lookup, but that table is populated by no migration, so `gender_int` is the
 * value the data actually carries -- edited, until now, as a raw number with
 * nothing on screen saying what it means (DD-0550).
 *
 * So the field is presented as the two-way choice it is, labelled "Sex". The
 * codes below (1 = Male, 2 = Female) are the SlaveVoyages convention; like the
 * dataset codes they are not written down in the codebase, so they should be
 * confirmed with Daniel Domingues. The stored value is unchanged; only the way
 * it is picked and shown differs.
 */

export interface SexOption {
  value: number;
  label: string;
}

export const SEX_OPTIONS: SexOption[] = [
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
];

/** The property a sex choice is recorded against (schema name + backing field). */
export const SEX_PROPERTY = 'Enslaved_gender_int';

/** How the field is labelled in the forms -- "Sex", not "Gender" (DD-0550). */
export const SEX_LABEL = 'Sex';

export const sexLabel = (value: number | null | undefined) =>
  SEX_OPTIONS.find((o) => o.value === value)?.label;
