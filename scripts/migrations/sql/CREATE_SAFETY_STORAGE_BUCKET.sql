-- Criar bucket de storage para evidências de segurança

-- Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('safety-evidence', 'safety-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'safety-evidence');

CREATE POLICY "Evidências são públicas para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'safety-evidence');

CREATE POLICY "Apenas uploader pode deletar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'safety-evidence' AND auth.uid()::text = owner);

SELECT 'Bucket safety-evidence criado com sucesso!' AS status;
