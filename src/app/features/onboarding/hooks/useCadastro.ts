import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/core/auth/services/AuthService';
import { HibpService } from '@/core/auth/services/HibpService';
import { getAuthErrorMessage } from '@/core/auth/utils/authMessages';
import { setPendingSignupEmail } from '@/core/auth/utils/pendingSignup';
import { validateAuthPassword } from '@/core/auth/utils/passwordPolicy';
import { useToast } from '@/shared/hooks/use-toast';

export interface CadastroFormData {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  // IDs canônicos da tabela locations
  stateId: string;
  stateName: string;
  cityId: string;
  cityName: string;
  neighborhoodId: string;
  neighborhoodName: string;
  street: string;
}

const initialFormData: CadastroFormData = {
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  stateId: '',
  stateName: '',
  cityId: '',
  cityName: '',
  neighborhoodId: '',
  neighborhoodName: '',
  street: '',
};

export function useCadastro() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CadastroFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CadastroFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const updateField = useCallback((field: keyof CadastroFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // Selecionar estado limpa cidade e bairro
  const selectState = useCallback((id: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      stateId: id,
      stateName: name,
      cityId: '',
      cityName: '',
      neighborhoodId: '',
      neighborhoodName: '',
    }));
    setErrors(prev => ({ ...prev, stateId: undefined, cityId: undefined, neighborhoodId: undefined }));
  }, []);

  // Selecionar cidade limpa bairro
  const selectCity = useCallback((id: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      cityId: id,
      cityName: name,
      neighborhoodId: '',
      neighborhoodName: '',
    }));
    setErrors(prev => ({ ...prev, cityId: undefined, neighborhoodId: undefined }));
  }, []);

  const selectNeighborhood = useCallback((id: string, name: string) => {
    setFormData(prev => ({ ...prev, neighborhoodId: id, neighborhoodName: name }));
    setErrors(prev => ({ ...prev, neighborhoodId: undefined }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Partial<Record<keyof CadastroFormData, string>> = {};

    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
      else if (formData.name.trim().length < 3) newErrors.name = 'Nome deve ter pelo menos 3 caracteres';

      if (!formData.username.trim()) {
        newErrors.username = 'Nome de usuário é obrigatório';
      } else if (!/^[a-z][a-z0-9_]{2,29}$/.test(formData.username)) {
        newErrors.username = 'Deve começar com letra e ter 3-30 chars (letras minúsculas, números e _)';
      }

      if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'E-mail inválido';
      }

      const passwordError = validateAuthPassword(formData.password);
      if (passwordError) newErrors.password = passwordError;

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não conferem';
      }
    }

    if (step === 1) {
      if (!formData.stateId) newErrors.stateId = 'Selecione o estado';
      if (!formData.cityId) newErrors.cityId = 'Selecione a cidade';
      if (!formData.neighborhoodId) newErrors.neighborhoodId = 'Selecione seu bairro';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback((totalSteps: number) => {
    if (!validateStep(currentStep)) return;
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(0) || !validateStep(1)) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // 🔒 Verificar senha contra vazamentos conhecidos (HIBP)
      try {
        const hibp = await HibpService.checkPassword(formData.password);
        if (hibp.isPwned) {
          toast({
            title: 'Senha comprometida',
            description: `Esta senha apareceu ${hibp.count.toLocaleString('pt-BR')} vez(es) em vazamentos de dados. Escolha uma senha diferente.`,
            variant: 'destructive',
          });
          return;
        }
      } catch {
        // Falha na API HIBP não bloqueia o cadastro
      }

      await AuthService.signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        display_name: formData.name,
        handle: formData.username,
        // Strings legíveis para exibição no perfil
        city: formData.cityName,
        neighborhood: formData.neighborhoodName,
        state: formData.stateName,
        street: formData.street.trim(),
        // UUID canônico — cria user_residence com integridade referencial
        neighborhood_id: formData.neighborhoodId || undefined,
      });
      setPendingSignupEmail(formData.email);
      navigate('/cadastro/confirmacao', { state: { email: formData.email } });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: getAuthErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [formData, validateStep, toast, navigate]);

  return {
    currentStep,
    formData,
    errors,
    loading,
    updateField,
    selectState,
    selectCity,
    selectNeighborhood,
    validateStep,
    handleNext,
    handleBack,
    handleSubmit,
  };
}

