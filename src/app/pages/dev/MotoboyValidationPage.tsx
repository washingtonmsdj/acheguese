
/**
 * MotoboyValidationPage - runtime validation for motoboy flow
 *
 * Dev-only page: /dev/mobility/motoboy-validation
 */

import { useCallback, useEffect, useState } from 'react';
import { AddressService } from '@/core/address/services/AddressService';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { profileService } from '@/core/profiles/services/ProfileService';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  Car,
  Bike,
  PlayCircle,
  CheckSquare,
  XSquare,
  RefreshCw,
  Route,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMotoboy, type DeliveryProof } from '@/modules/mobility';
import { RIDE_MODE, RIDE_STATUS } from '@/modules/mobility/constants';
import { RIDE_STATE } from '@/modules/mobility/core/RideStateMachine';
import { RideOperationalService } from '@/modules/mobility/core/RideOperationalService';
import { MobilityOfferService } from '@/modules/mobility/services/MobilityOfferService';
import { DriverAvailabilityService } from '@/modules/mobility/services/DriverAvailabilityService';
import { mobilityLocationService } from '@/modules/mobility/services/MobilityLocationService';
import {
  getAvailableRides,
  getDriverData,
  getMotoboyRuntimeDatabaseChecks,
  getOperationalVerificationEntries,
  getRideById,
  getRideStateAuditEntries,
  getRidesByDriverProfile,
  type MotoboyRuntimeDatabaseChecks,
} from '@/modules/mobility/services/mobility.queries';

type LogStatus = 'success' | 'error' | 'info';

interface ValidationLog {
  timestamp: string;
  action: string;
  status: LogStatus;
  message: string;
}

interface ProfileSummary {
  id: string;
  fullName: string | null;
  profileType: string | null;
}

interface DriverDataSummary {
  profile_id: string;
  can_do_delivery: boolean | null;
  can_do_rides: boolean | null;
  is_online: boolean | null;
  is_available: boolean | null;
  is_verified: boolean | null;
  subscription_active: boolean | null;
}

interface RideSummary {
  id: string;
  status: string;
  ride_mode: string | null;
  driver_profile_id: string | null;
  recipient_name: string | null;
  package_size: string | null;
  created_at: string;
}

interface RideAuditEntry {
  id: string;
  fromState: string | null;
  toState: string | null;
  reason: string | null;
  changedBy: string | null;
  changedAt: string | null;
}

interface VerificationEntry {
  id: string;
  status: string;
  isRequired: boolean;
  attempts: number;
  createdAt: string | null;
  expiresAt: string | null;
  verifiedAt: string | null;
}

interface GenericDbRow {
  [key: string]: unknown;
}

const ACTIVE_DELIVERY_STATUSES = [
  RIDE_STATUS.DRIVER_ASSIGNED,
  RIDE_STATUS.DRIVER_ACCEPTED,
  RIDE_STATUS.DRIVER_ARRIVING,
  RIDE_STATUS.PICKUP_CONFIRMED,
  RIDE_STATUS.IN_DELIVERY,
] as const;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
  }

  return 'Unknown error';
}

function parseBoolean(value: unknown): boolean {
  return value === true;
}

function toRideSummary(row: unknown): RideSummary | null {
  const typed = row as GenericDbRow;
  if (typeof typed.id !== 'string' || typeof typed.status !== 'string') {
    return null;
  }

  return {
    id: typed.id,
    status: typed.status,
    ride_mode: typeof typed.ride_mode === 'string' ? typed.ride_mode : null,
    driver_profile_id: typeof typed.driver_profile_id === 'string' ? typed.driver_profile_id : null,
    recipient_name: typeof typed.recipient_name === 'string' ? typed.recipient_name : null,
    package_size: typeof typed.package_size === 'string' ? typed.package_size : null,
    created_at: typeof typed.created_at === 'string' ? typed.created_at : new Date(0).toISOString(),
  };
}

export function MotoboyValidationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [driverData, setDriverData] = useState<DriverDataSummary | null>(null);
  const [deliveries, setDeliveries] = useState<RideSummary[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<RideSummary[]>([]);
  const [rides, setRides] = useState<RideSummary[]>([]);
  const [logs, setLogs] = useState<ValidationLog[]>([]);
  const [testDeliveryId, setTestDeliveryId] = useState<string | null>(null);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [databaseChecks, setDatabaseChecks] = useState<MotoboyRuntimeDatabaseChecks | null>(null);
  const [auditEntries, setAuditEntries] = useState<RideAuditEntry[]>([]);
  const [verificationEntries, setVerificationEntries] = useState<VerificationEntry[]>([]);
  const [isPreparingDriver, setIsPreparingDriver] = useState(false);

  const [confirmDeliveryModal, setConfirmDeliveryModal] = useState<{ open: boolean; deliveryId: string | null }>({
    open: false,
    deliveryId: null,
  });
  const [failDeliveryModal, setFailDeliveryModal] = useState<{ open: boolean; deliveryId: string | null }>({
    open: false,
    deliveryId: null,
  });

  const [proofData, setProofData] = useState<DeliveryProof>({});
  const [failReason, setFailReason] = useState('');

  const motoboy = useMotoboy({ sourceType: 'passenger' });

  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';

  const addLog = useCallback((action: string, status: LogStatus, message: string) => {
    setLogs((prev) => [
      {
        timestamp: new Date().toISOString(),
        action,
        status,
        message,
      },
      ...prev,
    ].slice(0, 60));
  }, []);

  const canDoDelivery = parseBoolean(driverData?.can_do_delivery);
  const canDoRides = driverData?.can_do_rides !== false;

  const fetchDatabaseChecks = useCallback(async (): Promise<MotoboyRuntimeDatabaseChecks> => {
    return getMotoboyRuntimeDatabaseChecks();
  }, []);

  const loadRideOperationalData = useCallback(async (rideId: string) => {
    try {
      const auditRows = await getRideStateAuditEntries(rideId, 30);
      const mappedAudit = (auditRows ?? []).map((row) => {
        const typedRow = row as GenericDbRow;
        return {
          id: String(typedRow.id ?? ''),
          fromState: typeof typedRow.from_state === 'string' ? typedRow.from_state : null,
          toState: typeof typedRow.to_state === 'string' ? typedRow.to_state : null,
          reason: typeof typedRow.reason === 'string' ? typedRow.reason : null,
          changedBy: typeof typedRow.changed_by === 'string' ? typedRow.changed_by : null,
          changedAt:
            typeof typedRow.changed_at === 'string'
              ? typedRow.changed_at
              : typeof typedRow.created_at === 'string'
                ? typedRow.created_at
                : null,
        };
      });
      setAuditEntries(mappedAudit);
    } catch (error) {
      addLog('audit_load', 'error', getErrorMessage(error));
      setAuditEntries([]);
    }

    try {
      const verificationRows = await getOperationalVerificationEntries(rideId, 5);
      const mappedVerifications = (verificationRows ?? []).map((row) => {
        const typedRow = row as GenericDbRow;
        return {
          id: String(typedRow.id ?? ''),
          status: typeof typedRow.status === 'string' ? typedRow.status : 'unknown',
          isRequired: typedRow.is_required === true,
          attempts: typeof typedRow.verification_attempts === 'number' ? typedRow.verification_attempts : 0,
          createdAt: typeof typedRow.created_at === 'string' ? typedRow.created_at : null,
          expiresAt: typeof typedRow.pin_expires_at === 'string' ? typedRow.pin_expires_at : null,
          verifiedAt: typeof typedRow.verified_at === 'string' ? typedRow.verified_at : null,
        };
      });
      setVerificationEntries(mappedVerifications);
    } catch (error) {
      addLog('verification_load', 'error', getErrorMessage(error));
      setVerificationEntries([]);
    }
  }, [addLog]);

  const loadData = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);

    try {
      const activeProfile = await profileService.getActiveProfile(user.id);

      if (!activeProfile?.id) {
        throw new Error('Active profile not found for authenticated user');
      }

      const profileSummary: ProfileSummary = {
        id: activeProfile.id,
        fullName: activeProfile.full_name ?? activeProfile.display_name ?? null,
        profileType: activeProfile.profile_type ?? null,
      };

      setProfile(profileSummary);

      if (profileSummary.profileType === 'driver') {
        const driverDataResult = (await getDriverData(profileSummary.id)) as DriverDataSummary | null;
        setDriverData(driverDataResult ?? null);

        const driverRides = (await getRidesByDriverProfile(profileSummary.id)) as unknown[];
        const activeMyDeliveries = (driverRides ?? [])
          .map(toRideSummary)
          .filter((ride): ride is RideSummary => Boolean(ride))
          .filter(
            (ride) =>
              ride.ride_mode === RIDE_MODE.MOTOBOY &&
              ACTIVE_DELIVERY_STATUSES.includes(ride.status as (typeof ACTIVE_DELIVERY_STATUSES)[number]),
          )
          .sort((a, b) => b.created_at.localeCompare(a.created_at));

        setMyDeliveries(activeMyDeliveries);
      } else {
        setDriverData(null);
        setMyDeliveries([]);
      }

      const availableOffers = (await getAvailableRides(30)) as unknown[];
      const summarizedOffers = (availableOffers ?? [])
        .map(toRideSummary)
        .filter((ride): ride is RideSummary => Boolean(ride))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      setDeliveries(
        summarizedOffers
          .filter((ride) => ride.ride_mode === RIDE_MODE.MOTOBOY)
          .slice(0, 10),
      );

      setRides(
        summarizedOffers
          .filter((ride) => ride.ride_mode === RIDE_MODE.RIDE)
          .slice(0, 10),
      );

      const checks = await fetchDatabaseChecks();
      setDatabaseChecks(checks);

      if (selectedRideId) {
        await loadRideOperationalData(selectedRideId);
      }

      addLog('load_data', 'success', 'Data and runtime checks loaded successfully');
    } catch (error) {
      const message = getErrorMessage(error);
      addLog('load_data', 'error', message);
      toast.error('Failed to load validation data', { description: message });
    } finally {
      setLoading(false);
    }
  }, [addLog, fetchDatabaseChecks, loadRideOperationalData, selectedRideId, user]);

  useEffect(() => {
    if (!isDev) {
      window.location.href = '/';
      return;
    }

    void loadData();
  }, [isDev, loadData]);

  const resolveTestLocationId = useCallback(async (): Promise<string> => {
    if (profile?.id) {
      const profileData = await profileService.getProfileById(profile.id);
      const profileRecord = profileData as unknown as Record<string, unknown> | null;
      const locationId =
        typeof profileRecord?.location_id === 'string' ? profileRecord.location_id : null;
      if (locationId) {
        return locationId;
      }
    }

    const operationalLocationId = await mobilityLocationService.getOperationalLocationId();
    if (operationalLocationId) {
      return operationalLocationId;
    }

    return '00000000-0000-0000-0000-000000000001';
  }, [profile?.id]);

  const createTestDelivery = useCallback(async () => {
    if (!profile?.id) {
      toast.error('Active profile not found');
      return;
    }

    try {
      addLog('create_delivery', 'info', 'Creating delivery test payload...');

      const locationId = await resolveTestLocationId();
      const addressService = new AddressService();

      const pickupAddress = await addressService.createAddress({
        location_id: locationId,
        street: 'Av. Paulista, 1000',
        address_type: 'approximate',
        latitude: -23.5505,
        longitude: -46.6333,
        geocoding_source: 'manual',
      });

      const dropoffAddress = await addressService.createAddress({
        location_id: locationId,
        street: 'Av. Paulista, 2000',
        address_type: 'approximate',
        latitude: -23.5489,
        longitude: -46.6388,
        geocoding_source: 'manual',
      });

      const result = await motoboy.requestDelivery({
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupLocationId: locationId,
        dropoffLocationId: locationId,
        originLat: -23.5505,
        originLng: -46.6333,
        destinationLat: -23.5489,
        destinationLng: -46.6388,
        recipientName: 'Motoboy Runtime Test',
        recipientPhone: '11999999999',
        packageSize: 'small',
        packageDescription: 'Validation package',
        deliveryNotes: 'Created by dev validation page',
        sourceType: 'passenger',
      });

      if (!result.success || !result.rideId) {
        throw new Error(result.error || 'Unable to create delivery request');
      }

      setTestDeliveryId(result.rideId);
      setSelectedRideId(result.rideId);
      addLog('create_delivery', 'success', `Delivery created: ${result.rideId}`);
      toast.success('Delivery test request created', { description: result.rideId });

      await loadData();
      await loadRideOperationalData(result.rideId);
    } catch (error) {
      const message = getErrorMessage(error);
      addLog('create_delivery', 'error', message);
      toast.error('Failed to create test delivery', { description: message });
    }
  }, [addLog, loadData, loadRideOperationalData, motoboy, profile?.id, resolveTestLocationId]);

  const ensureDriverReadyForOffers = useCallback(async (delivery: RideSummary) => {
    if (!profile?.id) {
      throw new Error('Driver profile is required');
    }

    setIsPreparingDriver(true);

    try {
      const onlineResult = await DriverAvailabilityService.goOnline(profile.id);
      if (!onlineResult.success) {
        throw new Error(onlineResult.error || 'Unable to set driver online');
      }

      const rideCoordinates = (await getRideById(delivery.id)) as
        | { origin_lat?: unknown; origin_lng?: unknown }
        | null;

      const lat = typeof rideCoordinates?.origin_lat === 'number' ? rideCoordinates.origin_lat : -23.5505;
      const lng = typeof rideCoordinates?.origin_lng === 'number' ? rideCoordinates.origin_lng : -46.6333;

      const availableResult = await DriverAvailabilityService.setAvailable(profile.id, { lat, lng });
      if (!availableResult.success) {
        throw new Error(availableResult.error || 'Unable to set driver available');
      }

      addLog('prepare_driver', 'success', 'Driver availability prepared for offer acceptance');
    } finally {
      setIsPreparingDriver(false);
    }
  }, [addLog, profile?.id]);

  const acceptDelivery = useCallback(async (delivery: RideSummary) => {
    if (!profile || profile.profileType !== 'driver') {
      toast.error('Only driver profiles can accept deliveries');
      return;
    }

    if (!canDoDelivery) {
      toast.error('Driver is not enabled for delivery capability');
      return;
    }

    try {
      addLog('accept_delivery', 'info', `Preparing driver availability for ${delivery.id}...`);
      await ensureDriverReadyForOffers(delivery);

      addLog('accept_delivery', 'info', `Accepting delivery ${delivery.id} via MobilityOfferService...`);
      const result = await MobilityOfferService.acceptOffer(delivery.id, profile.id, 'open_board');

      if (!result.success) {
        throw new Error(result.error || result.reason || 'Offer acceptance failed');
      }

      setSelectedRideId(delivery.id);
      addLog('accept_delivery', 'success', `Delivery accepted: ${delivery.id}`);
      toast.success('Delivery accepted', { description: delivery.id });

      await loadData();
      await loadRideOperationalData(delivery.id);
    } catch (error) {
      const message = getErrorMessage(error);
      addLog('accept_delivery', 'error', message);
      toast.error('Failed to accept delivery', { description: message });
    }
  }, [addLog, canDoDelivery, ensureDriverReadyForOffers, loadData, loadRideOperationalData, profile]);

  const handleSetDriverArriving = useCallback(async (deliveryId: string) => {
    if (!profile?.id) {
      return;
    }

    try {
      addLog('set_driver_arriving', 'info', `Transitioning to ${RIDE_STATE.DRIVER_ARRIVING}...`);
      const result = await RideOperationalService.transitionTo(
        deliveryId,
        RIDE_STATE.DRIVER_ARRIVING,
        profile.id,
        'Driver en route to pickup',
      );

      if (!result.success) {
        throw new Error(result.error || 'Transition to driver_arriving failed');
      }

      addLog('set_driver_arriving', 'success', `Ride ${deliveryId} is now ${RIDE_STATE.DRIVER_ARRIVING}`);

      await loadData();
      await loadRideOperationalData(deliveryId);
    } catch (error) {
      const message = getErrorMessage(error);
      addLog('set_driver_arriving', 'error', message);
      toast.error('Failed to set driver_arriving', { description: message });
    }
  }, [addLog, loadData, loadRideOperationalData, profile?.id]);

  const handleConfirmPickup = useCallback(async (deliveryId: string) => {
    if (!profile?.id) {
      return;
    }

    try {
      addLog('confirm_pickup', 'info', `Confirming pickup for ${deliveryId}...`);
      const result = await motoboy.confirmPickup(deliveryId, profile.id);

      if (!result.success) {
        throw new Error(result.error || 'Pickup confirmation failed');
      }

      addLog('confirm_pickup', 'success', `Pickup confirmed: ${deliveryId}`);

      await loadData();
      await loadRideOperationalData(deliveryId);
    } catch (error) {
      const message = getErrorMessage(error);
      addLog('confirm_pickup', 'error', message);
      toast.error('Failed to confirm pickup', { description: message });
    }
  }, [addLog, loadData, loadRideOperationalData, motoboy, profile?.id]);

  const handleStartDelivery = useCallback(async (deliveryId: string) => {
    if (!profile?.id) {
      return;
    }

    try {
      addLog('start_delivery', 'info', `Starting delivery ${deliveryId}...`);
      const result = await motoboy.startDelivery(deliveryId, profile.id);

      if (!result.success) {
        throw new Error(result.error || 'Start delivery failed');
      }

      addLog('start_delivery', 'success', `Delivery started: ${deliveryId}`);

      await loadData();
      await loadRideOperationalData(deliveryId);
    } catch (error) {
      const message = getErrorMessage(error);
      addLog('start_delivery', 'error', message);
      toast.error('Failed to start delivery', { description: message });
    }
  }, [addLog, loadData, loadRideOperationalData, motoboy, profile?.id]);

  const handleConfirmDelivery = useCallback(async () => {
    if (!profile?.id || !confirmDeliveryModal.deliveryId) {
      return;
    }

    try {
      addLog('confirm_delivery', 'info', `Confirming delivery ${confirmDeliveryModal.deliveryId}...`);
      const result = await motoboy.confirmDelivery(confirmDeliveryModal.deliveryId, profile.id, proofData);

      if (!result.success) {
        throw new Error(result.error || 'Confirm delivery failed');
      }

      addLog('confirm_delivery', 'success', `Delivery confirmed: ${confirmDeliveryModal.deliveryId}`);
      setConfirmDeliveryModal({ open: false, deliveryId: null });
      setProofData({});

      await loadData();
      await loadRideOperationalData(confirmDeliveryModal.deliveryId);
    } catch (error) {
      const message = getErrorMessage(error);
      addLog('confirm_delivery', 'error', message);
      toast.error('Failed to confirm delivery', { description: message });
    }
  }, [addLog, confirmDeliveryModal.deliveryId, loadData, loadRideOperationalData, motoboy, profile?.id, proofData]);

  const handleFailDelivery = useCallback(async () => {
    if (!profile?.id || !failDeliveryModal.deliveryId) {
      return;
    }

    if (!failReason.trim()) {
      toast.error('Failure reason is required');
      return;
    }

    try {
      addLog('fail_delivery', 'info', `Registering failed delivery ${failDeliveryModal.deliveryId}...`);
      const result = await motoboy.failDelivery(failDeliveryModal.deliveryId, profile.id, failReason.trim());

      if (!result.success) {
        throw new Error(result.error || 'Fail delivery operation failed');
      }

      addLog('fail_delivery', 'success', `Failed delivery registered: ${failDeliveryModal.deliveryId}`);
      setFailDeliveryModal({ open: false, deliveryId: null });
      setFailReason('');

      await loadData();
      await loadRideOperationalData(failDeliveryModal.deliveryId);
    } catch (error) {
      const message = getErrorMessage(error);
      addLog('fail_delivery', 'error', message);
      toast.error('Failed to register delivery failure', { description: message });
    }
  }, [addLog, failDeliveryModal.deliveryId, failReason, loadData, loadRideOperationalData, motoboy, profile?.id]);

  const handleRefreshSelectedRideLogs = useCallback(async () => {
    if (!selectedRideId) {
      toast.error('Select or create a delivery first');
      return;
    }

    addLog('refresh_ride_logs', 'info', `Refreshing logs for ${selectedRideId}`);
    await loadRideOperationalData(selectedRideId);
    addLog('refresh_ride_logs', 'success', `Ride logs refreshed: ${selectedRideId}`);
  }, [addLog, loadRideOperationalData, selectedRideId]);

  if (!isDev) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Motoboy Runtime Validation</h1>
          <p className="text-muted-foreground">Real backend checks and full operational cycle for motoboy.</p>
        </div>
        <Badge variant="destructive">DEV ONLY</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Runtime Database Checks</CardTitle>
          <CardDescription>Live validation of schema and runtime configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {databaseChecks?.rideRequestsColumnsOk ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            ride_requests motoboy columns
          </div>
          <div className="flex items-center gap-2 text-sm">
            {databaseChecks?.driverDataColumnsOk ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            driver_data capability columns
          </div>
          <div className="flex items-center gap-2 text-sm">
            {databaseChecks?.driverAvailabilityColumnsOk ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            driver_availability operational columns
          </div>
          <div className="flex items-center gap-2 text-sm">
            {databaseChecks?.motoboyPricingActive ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            active motoboy pricing rule
          </div>
          <div className="flex items-center gap-2 text-sm">
            {databaseChecks && databaseChecks.motoboyEnabledDrivers > 0 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            motoboy-enabled drivers: {databaseChecks?.motoboyEnabledDrivers ?? 0}
          </div>
          {(databaseChecks?.details.length ?? 0) > 0 && (
            <Alert variant="destructive">
              <AlertDescription className="space-y-1">
                {databaseChecks?.details.map((detail) => (
                  <p key={detail} className="text-xs">{detail}</p>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{profile?.fullName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profile type</p>
              <Badge>{profile?.profileType || 'N/A'}</Badge>
            </div>
          </div>

          {profile?.profileType === 'driver' && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2">
                {canDoDelivery ? (
                  <>
                    <Bike className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Delivery capability enabled</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Delivery capability disabled</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {canDoRides ? (
                  <>
                    <Car className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Ride capability enabled</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Ride capability disabled</span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>can_do_delivery: {String(driverData?.can_do_delivery ?? null)}</div>
                <div>can_do_rides: {String(driverData?.can_do_rides ?? null)}</div>
                <div>is_online: {String(driverData?.is_online ?? null)}</div>
                <div>is_available: {String(driverData?.is_available ?? null)}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => void createTestDelivery()} className="w-full">
            <Package className="mr-2 h-4 w-4" />
            Create Test Delivery
          </Button>

          <Button variant="outline" onClick={() => void loadData()} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Runtime Data
          </Button>

          {testDeliveryId && (
            <Alert>
              <AlertDescription>
                Last created delivery: <code className="text-xs">{testDeliveryId}</code>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Deliveries ({deliveries.length})</CardTitle>
          <CardDescription>ride_mode = 'motoboy'</CardDescription>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No available deliveries</p>
          ) : (
            <div className="space-y-2">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between rounded border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{delivery.recipient_name || delivery.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {delivery.package_size || 'unknown package size'} - {delivery.status}
                    </p>
                  </div>

                  {profile?.profileType === 'driver' && canDoDelivery ? (
                    <Button
                      size="sm"
                      disabled={isPreparingDriver}
                      onClick={() => void acceptDelivery(delivery)}
                    >
                      {isPreparingDriver ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                      Accept
                    </Button>
                  ) : (
                    <Badge variant="outline">No delivery permission</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {profile?.profileType === 'driver' && myDeliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Active Deliveries ({myDeliveries.length})</CardTitle>
            <CardDescription>Full operational cycle in runtime order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myDeliveries.map((delivery) => (
                <div key={delivery.id} className="space-y-3 rounded border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{delivery.recipient_name || delivery.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {delivery.package_size || 'unknown package size'} - <Badge variant="outline">{delivery.status}</Badge>
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedRideId(delivery.id);
                        void loadRideOperationalData(delivery.id);
                      }}
                    >
                      Inspect Logs
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {delivery.status === RIDE_STATUS.DRIVER_ACCEPTED && (
                      <Button size="sm" variant="outline" onClick={() => void handleSetDriverArriving(delivery.id)}>
                        <Route className="mr-1 h-4 w-4" />
                        Go To Pickup
                      </Button>
                    )}

                    {delivery.status === RIDE_STATUS.DRIVER_ARRIVING && (
                      <Button size="sm" variant="outline" onClick={() => void handleConfirmPickup(delivery.id)}>
                        <CheckSquare className="mr-1 h-4 w-4" />
                        Confirm Pickup
                      </Button>
                    )}

                    {delivery.status === RIDE_STATUS.PICKUP_CONFIRMED && (
                      <Button size="sm" variant="outline" onClick={() => void handleStartDelivery(delivery.id)}>
                        <PlayCircle className="mr-1 h-4 w-4" />
                        Start Delivery
                      </Button>
                    )}

                    {delivery.status === RIDE_STATUS.IN_DELIVERY && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setConfirmDeliveryModal({ open: true, deliveryId: delivery.id })}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Confirm Delivery
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setFailDeliveryModal({ open: true, deliveryId: delivery.id })}
                        >
                          <XSquare className="mr-1 h-4 w-4" />
                          Fail Delivery
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Ride Requests ({rides.length})</CardTitle>
          <CardDescription>
            ride_mode = 'ride' {canDoRides ? '(visible for this profile)' : '(profile should not accept rides)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rides.length === 0 ? (
            <p className="text-sm text-muted-foreground">No available rides</p>
          ) : (
            <div className="space-y-2">
              {rides.map((ride) => (
                <div key={ride.id} className="flex items-center justify-between rounded border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Ride #{ride.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{ride.status}</p>
                  </div>
                  <Badge variant={canDoRides ? 'outline' : 'destructive'}>
                    {canDoRides ? 'Ride-capable profile' : 'Ride capability disabled'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ride Audit And Verification</CardTitle>
          <CardDescription>
            {selectedRideId ? `Selected ride: ${selectedRideId}` : 'Select a ride to inspect operational audit.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={selectedRideId ?? ''}
              onChange={(event) => setSelectedRideId(event.target.value || null)}
              placeholder="Ride ID for audit inspection"
            />
            <Button variant="outline" onClick={() => void handleRefreshSelectedRideLogs()}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">State Audit ({auditEntries.length})</h4>
            {auditEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No audit entries loaded.</p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {auditEntries.map((entry) => (
                  <div key={entry.id} className="rounded border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {entry.fromState || 'null'} -&gt; {entry.toState || 'null'}
                      </span>
                      <span className="text-muted-foreground">
                        {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : 'no timestamp'}
                      </span>
                    </div>
                    {entry.reason && <p className="text-muted-foreground">{entry.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Operational Verification ({verificationEntries.length})</h4>
            {verificationEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No verification rows loaded for this ride.</p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {verificationEntries.map((entry) => (
                  <div key={entry.id} className="rounded border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">status: {entry.status}</span>
                      <span className="text-muted-foreground">attempts: {entry.attempts}</span>
                    </div>
                    <p className="text-muted-foreground">
                      required: {String(entry.isRequired)} | created: {entry.createdAt || '-'} | expires: {entry.expiresAt || '-'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions recorded yet.</p>
            ) : (
              logs.map((log, index) => (
                <div key={`${log.timestamp}-${index}`} className="flex items-start gap-2 border-l-2 border-l-muted p-2">
                  {log.status === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />}
                  {log.status === 'error' && <XCircle className="mt-0.5 h-4 w-4 text-red-600" />}
                  {log.status === 'info' && <AlertTriangle className="mt-0.5 h-4 w-4 text-blue-600" />}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{log.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={confirmDeliveryModal.open}
        onOpenChange={(open) => setConfirmDeliveryModal({ open, deliveryId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
            <DialogDescription>Register proof of delivery (optional fields)</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proof-code">Verification Code</Label>
              <Input
                id="proof-code"
                placeholder="Ex: 1234"
                value={proofData.code || ''}
                onChange={(event) => setProofData({ ...proofData, code: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof-photo">Photo URL</Label>
              <Input
                id="proof-photo"
                placeholder="https://..."
                value={proofData.photo_url || ''}
                onChange={(event) => setProofData({ ...proofData, photo_url: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof-obs">Observation</Label>
              <Textarea
                id="proof-obs"
                placeholder="Delivered to concierge..."
                value={proofData.observation || ''}
                onChange={(event) => setProofData({ ...proofData, observation: event.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeliveryModal({ open: false, deliveryId: null })}>
              Cancel
            </Button>
            <Button onClick={() => void handleConfirmDelivery()}>Confirm Delivery</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={failDeliveryModal.open}
        onOpenChange={(open) => setFailDeliveryModal({ open, deliveryId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Delivery Failure</DialogTitle>
            <DialogDescription>Failure reason is mandatory</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fail-reason">Failure Reason *</Label>
              <Textarea
                id="fail-reason"
                placeholder="Recipient unavailable, wrong address..."
                value={failReason}
                onChange={(event) => setFailReason(event.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFailDeliveryModal({ open: false, deliveryId: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleFailDelivery()}>
              Register Failure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
