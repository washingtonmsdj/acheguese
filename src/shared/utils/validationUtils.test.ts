/**
 * @fileoverview Testes unitários para utilitários de validação
 * @module shared/utils/validationUtils.test
 */

import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPhone,
  isValidCEP,
  isValidCPF,
  isValidCNPJ,
  isValidUUID,
  isValidURL,
  isValidLength,
  isInRange,
  isInFuture,
  isInPast,
  isNotEmpty,
  isObjectNotEmpty,
} from './validation';

describe('validationUtils', () => {
  describe('isValidEmail', () => {
    it('deve retornar true para email válido', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('deve retornar false para email inválido', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null as any)).toBe(false);
    });
  });

  describe('isValidCNPJ', () => {
    it('deve validar CNPJ formatado', () => {
      // CNPJ válido
      const validCNPJ = '11.222.333/0001-81';
      expect(isValidCNPJ(validCNPJ)).toBe(true);
    });

    it('deve validar dígitos verificadores', () => {
      // Testa um CNPJ que falha na validação de dígitos
      expect(isValidCNPJ('11222333000182')).toBe(false);
    });

    it('deve retornar false para CNPJ inválido', () => {
      expect(isValidCNPJ('00000000000000')).toBe(false);
      expect(isValidCNPJ('11111111111111')).toBe(false);
      expect(isValidCNPJ('12345678901234')).toBe(false);
      expect(isValidCNPJ('')).toBe(false);
      expect(isValidCNPJ('123')).toBe(false);
    });

    it('deve validar CNPJ sem formatação', () => {
      const validCNPJ = '11222333000181';
      expect(isValidCNPJ(validCNPJ)).toBe(true);
    });
  });

  describe('isValidCPF', () => {
    it('deve validar CPF formatado', () => {
      // CPF válido
      const validCPF = '529.982.247-25';
      expect(isValidCPF(validCPF)).toBe(true);
    });

    it('deve retornar false para CPF inválido', () => {
      expect(isValidCPF('00000000000')).toBe(false);
      expect(isValidCPF('11111111111')).toBe(false);
      expect(isValidCPF('')).toBe(false);
      expect(isValidCPF('123')).toBe(false);
    });

    it('deve validar CPF sem formatação', () => {
      const validCPF = '52998224725';
      expect(isValidCPF(validCPF)).toBe(true);
    });
  });

  describe('isValidPhone', () => {
    it('deve retornar true para telefone válido', () => {
      expect(isValidPhone('71999999999')).toBe(true);
      expect(isValidPhone('(71) 99999-9999')).toBe(true);
      expect(isValidPhone('7132224444')).toBe(true);
      expect(isValidPhone('(71) 3222-4444')).toBe(true);
    });

    it('deve retornar false para telefone inválido', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('0000000000')).toBe(false);
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('abc')).toBe(false);
    });

    it('deve rejeitar formatos inválidos', () => {
      // CEP 00 não é aceito pela regex (deve começar com 1-9)
      expect(isValidPhone('00999999999')).toBe(false);
    });
  });

  describe('isValidCEP', () => {
    it('deve retornar true para CEP válido', () => {
      expect(isValidCEP('41810000')).toBe(true);
      expect(isValidCEP('41810-000')).toBe(true);
    });

    it('deve validar CEPs corretamente', () => {
      // A função valida apenas formato (8 dígitos), não se CEP existe
      expect(isValidCEP('00000000')).toBe(true); // Formato válido
      expect(isValidCEP('1234567')).toBe(false); // Muito curto
      expect(isValidCEP('123456789')).toBe(false); // Muito longo
      expect(isValidCEP('')).toBe(false); // Vazio
    });
  });

  describe('isValidUUID', () => {
    it('deve retornar true para UUID válido', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('deve retornar false para UUID inválido', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('123456789')).toBe(false);
    });
  });

  describe('isValidURL', () => {
    it('deve retornar true para URL válida', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://example.com/path')).toBe(true);
      expect(isValidURL('https://example.com:8080/path?query=1')).toBe(true);
    });

    it('deve validar URLs corretamente', () => {
      expect(isValidURL('not-a-url')).toBe(false);
      // URL construtor aceita ftp://
      expect(isValidURL('ftp://example.com')).toBe(true);
      expect(isValidURL('')).toBe(false);
    });
  });

  describe('isValidLength', () => {
    it('deve retornar true quando string está dentro dos limites', () => {
      expect(isValidLength('abc', 2, 10)).toBe(true);
      expect(isValidLength('abcd', 3, 5)).toBe(true);
    });

    it('deve retornar false quando string é muito curta', () => {
      expect(isValidLength('a', 3, 10)).toBe(false);
    });

    it('deve retornar false quando string é muito longa', () => {
      expect(isValidLength('abcdef', 2, 4)).toBe(false);
    });

    it('deve considerar espaços ao validar', () => {
      expect(isValidLength('  abc  ', 3, 5)).toBe(true);
    });
  });

  describe('isInRange', () => {
    it('deve retornar true quando número está no intervalo', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
    });

    it('deve retornar false quando número está fora do intervalo', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
    });

    it('deve funcionar com números negativos', () => {
      expect(isInRange(-5, -10, -1)).toBe(true);
      expect(isInRange(0, -10, -1)).toBe(false);
    });
  });

  describe('isInFuture', () => {
    it('deve retornar true para data futura', () => {
      const future = new Date(Date.now() + 86400000);
      expect(isInFuture(future)).toBe(true);
    });

    it('deve retornar false para data passada', () => {
      const past = new Date(Date.now() - 86400000);
      expect(isInFuture(past)).toBe(false);
    });
  });

  describe('isInPast', () => {
    it('deve retornar true para data passada', () => {
      const past = new Date(Date.now() - 86400000);
      expect(isInPast(past)).toBe(true);
    });

    it('deve retornar false para data futura', () => {
      const future = new Date(Date.now() + 86400000);
      expect(isInPast(future)).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('deve retornar true para array com elementos', () => {
      expect(isNotEmpty([1, 2, 3])).toBe(true);
      expect(isNotEmpty(['a'])).toBe(true);
    });

    it('deve retornar false para array vazio', () => {
      expect(isNotEmpty([])).toBe(false);
    });
  });

  describe('isObjectNotEmpty', () => {
    it('deve retornar true para objeto com propriedades', () => {
      expect(isObjectNotEmpty({ a: 1 })).toBe(true);
      expect(isObjectNotEmpty({ name: 'João' })).toBe(true);
    });

    it('deve retornar false para objeto vazio', () => {
      expect(isObjectNotEmpty({})).toBe(false);
    });
  });
});
