import React from "react";
interface AlertResolveButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AlertResolveButton({
  onClick,
  disabled,
}: AlertResolveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      Marcar como Resolvido
    </button>
  );
}
