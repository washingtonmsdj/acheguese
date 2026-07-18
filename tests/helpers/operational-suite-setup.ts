import { assertOperationalTargetAuthorized } from './operational-env';

export function setup(): void {
  assertOperationalTargetAuthorized();
}
