export const RACING_CONTRACT = {
  requiredEntities: ["player_vehicle", "track", "finish_line"],
  requiredSystems: [
    "PhysicsSystem",
    "CollisionSystem",
    "CameraSystem",
    "UISystem",
    "TimerSystem",
    "ScoreSystem",
  ],
} as const;
