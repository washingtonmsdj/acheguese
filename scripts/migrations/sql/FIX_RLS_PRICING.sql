-- Adicionar policies de INSERT/UPDATE para admins e authenticated users

-- Permitir admins gerenciarem pricing_rules
CREATE POLICY "Admins can manage pricing rules" 
  ON pricing_rules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- Permitir admins gerenciarem multipliers
CREATE POLICY "Admins can manage peak hour multipliers" 
  ON pricing_peak_hour_multipliers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- Permitir admins gerenciarem fees
CREATE POLICY "Admins can manage additional fees" 
  ON pricing_additional_fees FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- Permitir admins visualizarem audit logs
CREATE POLICY "Admins can view all audit logs" 
  ON pricing_audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

SELECT 'RLS policies criadas com sucesso!' AS status;
