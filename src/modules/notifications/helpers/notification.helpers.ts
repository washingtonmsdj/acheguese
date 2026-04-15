 
/**
 * ============================================
 * NOTIFICATION HELPERS
 * ============================================
 * Funções auxiliares para criar notificações específicas
 */

import { notificationService } from "../services/notification.service";
import {
  NotificationType,
  NotificationPriority,
} from "../types/notification.types";
import type {
  CreateNotificationParams,
  RideNotificationMetadata,
  CommunityNotificationMetadata,
  AppointmentNotificationMetadata,
  GamificationNotificationMetadata,
} from "../types/notification.types";

// ============================================
// MOBILIDADE
// ============================================

export async function notifyRideRequest(
  driverProfileId: string,
  rideData: {
    ride_id: string;
    origin: string;
    destination: string;
    price: number;
  },
) {
  return notificationService.createNotification({
    user_id: driverProfileId,
    type: NotificationType.RIDE_REQUEST,
    title: "Nova solicitação de corrida",
    message: `De ${rideData.origin} para ${rideData.destination}`,
    priority: NotificationPriority.HIGH,
    metadata: {
      ride_id: rideData.ride_id,
      origin: rideData.origin,
      destination: rideData.destination,
      price: rideData.price,
    } as RideNotificationMetadata,
  });
}

export async function notifyRideAccepted(
  passengerId: string,
  rideData: {
    ride_id: string;
    driver_profile_id: string;
    driver_name: string;
    vehicle_plate: string;
    vehicle_model: string;
  },
) {
  return notificationService.createNotification({
    user_id: passengerId,
    type: NotificationType.RIDE_ACCEPTED,
    title: "Corrida aceita!",
    message: `${rideData.driver_name} aceitou sua corrida`,
    priority: NotificationPriority.HIGH,
    metadata: {
      ride_id: rideData.ride_id,
      driver_profile_id: rideData.driver_profile_id,
      driver_name: rideData.driver_name,
      vehicle_plate: rideData.vehicle_plate,
      vehicle_model: rideData.vehicle_model,
    } as RideNotificationMetadata,
  });
}

export async function notifyRideCompleted(
  userId: string,
  rideData: {
    ride_id: string;
    price: number;
  },
) {
  return notificationService.createNotification({
    user_id: userId,
    type: NotificationType.RIDE_COMPLETED,
    title: "Corrida concluída",
    message: `Corrida finalizada. Valor: R$ ${rideData.price.toFixed(2)}`,
    priority: NotificationPriority.MEDIUM,
    metadata: {
      ride_id: rideData.ride_id,
      price: rideData.price,
    } as RideNotificationMetadata,
  });
}

export async function notifyNewRating(
  driverProfileId: string,
  ratingData: {
    ride_id: string;
    rating: number;
  },
) {
  return notificationService.createNotification({
    user_id: driverProfileId,
    type: NotificationType.NEW_RATING,
    title: "Nova avaliação recebida",
    message: `Você recebeu ${ratingData.rating} estrelas`,
    priority: NotificationPriority.LOW,
    metadata: {
      ride_id: ratingData.ride_id,
      rating: ratingData.rating,
    } as RideNotificationMetadata,
  });
}

// ============================================
// COMUNIDADE
// ============================================

export async function notifyPostLike(
  authorProfileId: string,
  likeData: {
    post_id: string;
    actor_id: string;
    actor_name: string;
    actor_avatar?: string;
  },
) {
  return notificationService.createNotification({
    user_id: authorProfileId,
    type: NotificationType.POST_LIKE,
    title: "Nova curtida",
    message: `${likeData.actor_name} curtiu seu post`,
    priority: NotificationPriority.LOW,
    metadata: {
      post_id: likeData.post_id,
      actor_id: likeData.actor_id,
      actor_name: likeData.actor_name,
      actor_avatar: likeData.actor_avatar,
    } as CommunityNotificationMetadata,
  });
}

export async function notifyPostComment(
  authorProfileId: string,
  commentData: {
    post_id: string;
    comment_id: string;
    actor_id: string;
    actor_name: string;
    content_preview: string;
  },
) {
  return notificationService.createNotification({
    user_id: authorProfileId,
    type: NotificationType.POST_COMMENT,
    title: "Novo comentário",
    message: `${commentData.actor_name}: ${commentData.content_preview}`,
    priority: NotificationPriority.MEDIUM,
    metadata: {
      post_id: commentData.post_id,
      comment_id: commentData.comment_id,
      actor_id: commentData.actor_id,
      actor_name: commentData.actor_name,
      content_preview: commentData.content_preview,
    } as CommunityNotificationMetadata,
  });
}

export async function notifyMention(
  userId: string,
  mentionData: {
    post_id: string;
    actor_id: string;
    actor_name: string;
    content_preview: string;
  },
) {
  return notificationService.createNotification({
    user_id: userId,
    type: NotificationType.MENTION,
    title: "Você foi mencionado",
    message: `${mentionData.actor_name} mencionou você`,
    priority: NotificationPriority.MEDIUM,
    metadata: {
      post_id: mentionData.post_id,
      actor_id: mentionData.actor_id,
      actor_name: mentionData.actor_name,
      content_preview: mentionData.content_preview,
    } as CommunityNotificationMetadata,
  });
}

// ============================================
// AGENDAMENTOS
// ============================================

export async function notifyNewAppointment(
  businessOwnerId: string,
  appointmentData: {
    appointment_id: string;
    business_id: string;
    business_name: string;
    service_name: string;
    appointment_date: string;
    appointment_time: string;
    client_name: string;
  },
) {
  return notificationService.createNotification({
    user_id: businessOwnerId,
    type: NotificationType.APPOINTMENT_NEW,
    title: "Novo agendamento",
    message: `${appointmentData.client_name} agendou ${appointmentData.service_name}`,
    priority: NotificationPriority.HIGH,
    metadata: appointmentData as AppointmentNotificationMetadata,
  });
}

export async function notifyAppointmentReminder(
  userId: string,
  appointmentData: {
    appointment_id: string;
    business_name: string;
    service_name: string;
    appointment_date: string;
    appointment_time: string;
  },
) {
  return notificationService.createNotification({
    user_id: userId,
    type: NotificationType.APPOINTMENT_REMINDER,
    title: "Lembrete de agendamento",
    message: `Seu agendamento é amanhã às ${appointmentData.appointment_time}`,
    priority: NotificationPriority.HIGH,
    metadata: appointmentData as AppointmentNotificationMetadata,
  });
}

// ============================================
// GAMIFICAÇÃO
// ============================================

export async function notifyBadgeEarned(
  userId: string,
  badgeData: {
    badge_id: string;
    badge_name: string;
    badge_icon: string;
  },
) {
  return notificationService.createNotification({
    user_id: userId,
    type: NotificationType.BADGE_EARNED,
    title: "Novo badge conquistado!",
    message: `Você ganhou o badge "${badgeData.badge_name}"`,
    priority: NotificationPriority.MEDIUM,
    metadata: badgeData as GamificationNotificationMetadata,
  });
}

export async function notifyLevelUp(
  userId: string,
  levelData: {
    level: number;
    points_earned: number;
  },
) {
  return notificationService.createNotification({
    user_id: userId,
    type: NotificationType.LEVEL_UP,
    title: "Level Up!",
    message: `Você alcançou o nível ${levelData.level}`,
    priority: NotificationPriority.MEDIUM,
    metadata: levelData as GamificationNotificationMetadata,
  });
}

// ============================================
// SISTEMA
// ============================================

export async function notifySystemAlert(
  userId: string,
  alertData: {
    title: string;
    message: string;
    priority?: NotificationPriority;
    action_url?: string;
  },
) {
  return notificationService.createNotification({
    user_id: userId,
    type: NotificationType.SYSTEM_ALERT,
    title: alertData.title,
    message: alertData.message,
    priority: alertData.priority || NotificationPriority.MEDIUM,
    metadata: {
      action_url: alertData.action_url,
    },
  });
}
