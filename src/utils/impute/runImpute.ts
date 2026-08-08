/**
 * The imputation calculation.
 *
 * Domingos ported the SPSS script to TypeScript in voyages-contribute
 * (`src/impute/generated/impute.ts`), but that module is not part of the
 * published package — the bundle entry is `src/models/index.ts`, which does not
 * re-export it. Until it ships, this stands in.
 *
 * **It throws rather than returning placeholder values on purpose.** Fake
 * numbers here would be written into a real contribution as a bot review, and
 * imputed columns full of invented values are worse than a disabled button.
 *
 * To finish the wiring once the package ships it, replace the body below with:
 *
 * ```ts
 * import { finalizeEnv, runImpute as run } from '@slavevoyages/voyages-contribute';
 * export const runImpute: RunImpute = (input, isIam) => finalizeEnv(run(input, isIam));
 * ```
 *
 * Note the `finalizeEnv` wrapper — the raw `runImpute` output still needs the
 * recodes the original script applies over its locals.
 *
 * @see https://github.com/SlaveVoyages/voyages-contribute/issues/7
 */

import { RunImpute } from './types';

export class ImputeUnavailableError extends Error {
  constructor() {
    super(
      'The imputation calculation is not available yet — it has been ported ' +
        'but is not exported from @slavevoyages/voyages-contribute. Everything ' +
        'around it is wired and tested; this is the only missing piece.',
    );
    this.name = 'ImputeUnavailableError';
  }
}

/** True once the real calculation is wired in. */
export const isImputeAvailable = false;

export const runImpute: RunImpute = () => {
  throw new ImputeUnavailableError();
};
