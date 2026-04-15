 
import React from "react";
import { Business } from "@/modules/business/types";

interface BusinessAboutProps {
  business: Business;
}

export function BusinessAbout({ business }: BusinessAboutProps) {
  if (!business.description && !business.specialties?.length) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre</h2>

      {business.description && (
        <p className="text-gray-600 mb-4 whitespace-pre-line">
          {business.description}
        </p>
      )}

      {business.specialties && business.specialties.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Especialidades
          </h3>
          <div className="flex flex-wrap gap-2">
            {business.specialties.map((specialty, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
