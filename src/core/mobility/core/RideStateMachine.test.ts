import { describe, expect, it } from 'vitest';

import { RideStateMachine, RIDE_STATE, type RideState } from './RideStateMachine';

describe('RideStateMachine cancellation rules', () => {
  const passengerCancelable: RideState[] = [
    RIDE_STATE.REQUESTED,
    RIDE_STATE.SEARCHING_DRIVER,
    RIDE_STATE.DRIVER_ASSIGNED,
    RIDE_STATE.DRIVER_ACCEPTED,
    RIDE_STATE.DRIVER_ARRIVING,
  ];
  const passengerBlocked: RideState[] = [
    RIDE_STATE.PASSENGER_BOARDED,
    RIDE_STATE.IN_PROGRESS,
    RIDE_STATE.PICKUP_CONFIRMED,
    RIDE_STATE.IN_DELIVERY,
    RIDE_STATE.COMPLETED,
    RIDE_STATE.CANCELLED_BY_PASSENGER,
    RIDE_STATE.CANCELLED_BY_DRIVER,
    RIDE_STATE.EXPIRED,
    RIDE_STATE.FAILED,
  ];
  const driverCancelable: RideState[] = [
    RIDE_STATE.DRIVER_ASSIGNED,
    RIDE_STATE.DRIVER_ACCEPTED,
    RIDE_STATE.DRIVER_ARRIVING,
    RIDE_STATE.PASSENGER_BOARDED,
    RIDE_STATE.PICKUP_CONFIRMED,
  ];
  const driverBlocked: RideState[] = [
    RIDE_STATE.IN_PROGRESS,
    RIDE_STATE.IN_DELIVERY,
    RIDE_STATE.COMPLETED,
    RIDE_STATE.CANCELLED_BY_PASSENGER,
    RIDE_STATE.CANCELLED_BY_DRIVER,
    RIDE_STATE.EXPIRED,
    RIDE_STATE.FAILED,
  ];

  it.each(passengerCancelable)('allows passenger cancellation from %s', (state) => {
    expect(RideStateMachine.canPassengerCancel(state)).toBe(true);
  });

  it.each(passengerBlocked)('blocks passenger cancellation from %s', (state) => {
    expect(RideStateMachine.canPassengerCancel(state)).toBe(false);
  });

  it.each(driverCancelable)('allows driver cancellation from %s', (state) => {
    expect(RideStateMachine.canDriverCancel(state)).toBe(true);
  });

  it.each(driverBlocked)('blocks driver cancellation from %s', (state) => {
    expect(RideStateMachine.canDriverCancel(state)).toBe(false);
  });
});
