import { useState } from "react";

export function usePollForm() {
  const [perguntaEnquete, setPerguntaEnquete] = useState("");
  const [opcoesEnquete, setOpcoesEnquete] = useState<string[]>(["", ""]);
  const [duracaoEnquete, setDuracaoEnquete] = useState("7");

  const handleAdicionarOpcao = () => {
    if (opcoesEnquete.length < 6) {
      setOpcoesEnquete([...opcoesEnquete, ""]);
    }
  };

  const handleRemoverOpcao = (index: number) => {
    if (opcoesEnquete.length > 2) {
      setOpcoesEnquete(opcoesEnquete.filter((_, i) => i !== index));
    }
  };

  const handleOpcaoChange = (index: number, value: string) => {
    const newOptions = opcoesEnquete.map((option, optionIndex) =>
      optionIndex === index ? value : option,
    );
    setOpcoesEnquete(newOptions);
  };

  const validatePoll = () => {
    if (!perguntaEnquete || perguntaEnquete.trim().length < 10) {
      return {
        valid: false,
        error: "Pergunta da enquete deve ter no mínimo 10 caracteres",
      };
    }

    const opcoesValidas = opcoesEnquete.filter((opt) => opt.trim().length > 0);
    if (opcoesValidas.length < 2) {
      return { valid: false, error: "Enquete deve ter no mínimo 2 opções" };
    }

    return { valid: true };
  };

  const getPollData = () => ({
    question: perguntaEnquete,
    options: opcoesEnquete.filter((opt) => opt.trim().length > 0),
    duration: duracaoEnquete,
  });

  return {
    perguntaEnquete,
    setPerguntaEnquete,
    opcoesEnquete,
    duracaoEnquete,
    setDuracaoEnquete,
    handleAdicionarOpcao,
    handleRemoverOpcao,
    handleOpcaoChange,
    validatePoll,
    getPollData,
  };
}
