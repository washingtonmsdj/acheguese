import React from "react";
interface AlertConfirmButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AlertConfirmButton({
  onClick,
  disabled,
}: AlertConfirmButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      Confirmar Alerta
    </button>
  );
}
