import { describe, expect, it } from "vitest";
import {
  createDriverRegistrationFormValues,
  parseDriverRegistrationForm,
  sanitizeLicenseNumber,
  sanitizeVehiclePlate,
  validateDriverRegistrationInput,
} from "@/modules/mobility/utils/driverRegistration";

describe("driverRegistration", () => {
  it("hidrata valores iniciais com defaults do perfil sem hardcode territorial", () => {
    const values = createDriverRegistrationFormValues({
      name: "  Maria Souza  ",
      state: "ba",
    });

    expect(values.name).toBe("Maria Souza");
    expect(values.licenseState).toBe("BA");
    expect(values.licenseCategory).toBe("B");
  });

  it("normaliza o formulário para o contrato canônico de driver_data", () => {
    const parsed = parseDriverRegistrationForm(
      {
        name: "  João Motorista ",
        licenseNumber: "123.456.789-00",
        licenseCategory: "D",
        licenseExpiry: "2030-05-10",
        licenseState: "sp",
        vehicleType: "motorcycle",
        vehiclePlate: "abc-1d23",
        vehicleModel: "  CG 160 ",
        vehicleYear: "2024",
        vehicleColor: "  preta ",
      },
      {
        city: "Salvador",
        avatarUrl: "https://example.com/avatar.png",
      },
    );

    expect(parsed).toEqual({
      name: "João Motorista",
      licenseNumber: "12345678900",
      licenseCategory: "D",
      licenseExpiry: "2030-05-10",
      licenseState: "SP",
      vehicleType: "motorcycle",
      vehiclePlate: "ABC-1D23",
      vehicleModel: "CG 160",
      vehicleYear: 2024,
      vehicleColor: "preta",
      city: "Salvador",
      avatarUrl: "https://example.com/avatar.png",
    });
  });

  it("rejeita driver data inválido antes de chegar na RPC", () => {
    const nextYear = new Date().getFullYear() + 1;

    expect(() =>
      validateDriverRegistrationInput({
        name: "Ana",
        licenseNumber: sanitizeLicenseNumber("12345678900"),
        licenseCategory: "B",
        licenseExpiry: "2031-01-01",
        licenseState: "XX",
        vehicleType: "car",
        vehiclePlate: sanitizeVehiclePlate("ABC1D23"),
        vehicleModel: "Onix",
        vehicleYear: nextYear,
        vehicleColor: "Branco",
      }),
    ).toThrow("UF da CNH inválida");
  });
});
