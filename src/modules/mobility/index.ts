/**
 * Mobility Module - Public API
 *
 * Exports only the public API of the mobility module.
 * Internal implementation details are not exported.
 */

// Components - Main
export { MobilidadeFeed } from "./components/MobilidadeFeed";
export { MobilidadeLeftSidebar } from "./components/MobilidadeLeftSidebar";
export { MobilidadeRightSidebar } from "./components/MobilidadeRightSidebar";
export { CreateRideModal } from "./components/CreateRideModal";
export { CreateDeliveryModal } from "./components/CreateDeliveryModal";
export {
  RideRequestCard,
  DriverOfferCard,
  RouteEstimateCard,
  RouteEstimateCardSkeleton
} from "./components";
export { RideTrackingMap } from "./components/RideTrackingMap";
export { ActiveRideWidget } from "./components/ActiveRideWidget";
export { RideHistoryList } from "./components/RideHistoryList";
export { EmergencyButton } from "./components/EmergencyButton";
export { ShareRideButton } from "./components/ShareRideButton";
export { StatusBadge } from "./components/StatusBadge";
export { StatusTimeline } from "./components/StatusTimeline";

// Components - Driver
export { DriverHeader } from "./components/driver/DriverHeader";
export { DriverStatsCard } from "./components/driver/DriverStatsCard";
export { DriverEarningsCard } from "./components/driver/DriverEarningsCard";
export { DriverRidesList } from "./components/driver/DriverRidesList";
export { DriverRegistrationModal } from "./components/DriverRegistrationModal";
export { DriverRegistrationCTA } from "./components/driver/DriverRegistrationCTA";
export { DriverProfileCard } from "./components/driver/DriverProfileCard";
export { MotoboyDeliveryActions } from "./components/driver/MotoboyDeliveryActions";

// Components - Passenger
export { ActiveRideCard } from "./components/passenger/ActiveRideCard";
export { PassengerRideHistory } from "./components/passenger/PassengerRideHistory";
export { RateDriverModal } from "./components/passenger/RateDriverModal";

// Components - Chat
export { RideChatDialog } from "./components/RideChatDialog";
export { PassengerRideChatButton } from "./components/PassengerRideChatButton";

// Components - Landing
export { HeroBanner } from "./components/landing/HeroBanner";
export { HowItWorksSteps } from "./components/landing/HowItWorksSteps";
export { MobilidadeTabs } from "./components/landing/MobilidadeTabs";

// Services
export { rideService } from "./services/RideService";
export { driverService } from "./services/DriverService";
export { chatService } from "./services/ChatService";
export { MobilityService, mobilityService } from "./services/MobilityService";

// Hooks - Rides (exports básicos apenas)
export { useActiveRide } from "./hooks/useActiveRide";
export { useRideHistory } from "./hooks/useRideHistory";
export { useDelivery } from "./hooks/useDelivery";
export { useMotoboy } from "./hooks/useMotoboy";
export type { CreateDeliveryData, DeliveryProof } from "./hooks/useDelivery";

// Hooks - Driver (exports básicos apenas)
export { useDriverProfile } from "./hooks/useDriverProfile";
export { useDriverLocation } from "./hooks/useDriverLocation";

// Hooks - Chat (stub - export básico apenas)
export { useChat } from "./hooks/useChat";
export { useRideChat } from "./hooks/useRideChat";

// Pages
export { default as MobilidadeLandingPage } from "./pages/MobilidadeLandingPage";
export { default as PassageiroPage } from "./pages/PassageiroPage";
export { default as DriverProfilePage } from "./pages/DriverProfilePage";
export { default as HistoricoPage } from "./pages/HistoricoPage";
export { default as TrackRidePage } from "./pages/TrackRidePage";

// Types
export type {
  RideRequest,
  CreateRideData,
  UpdateRideData,
} from "./services/RideService";

export type {
  DriverProfile,
  DriverStats,
  WeeklyEarning,
} from "./services/DriverService";

export type {
  RideDispatchContextRow as DriverLocation,
} from "./services/mobility.queries";

export type RideStats = {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  averageRating: number;
};

export type {
  ChatMessage,
  Conversation,
  CreateMessageData,
} from "./services/ChatService";

// Schemas
export * from "./schemas/mobilitySchemas";
