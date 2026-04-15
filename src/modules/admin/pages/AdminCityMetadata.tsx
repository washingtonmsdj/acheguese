/**
 * AdminCityMetadata
 * 
 * Página de administração para gerenciar metadados das cidades.
 * Permite atualizar população, número de bairros, empresas, etc.
 * 
 * ✅ SSOT COMPLIANT - Usa CityService para acesso ao banco
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CityService, type CityMetadata } from '@/core/city/services/CityService';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { useToast } from '@/shared/components/ui/use-toast';
import { Loader2, Save, MapPin, Users, Building2, GraduationCap, Wrench, Bus } from 'lucide-react';

export default function AdminCityMetadata() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCity, setSelectedCity] = useState<string>('salvador-ba');

  // Busca metadados da cidade
  const { data: cityData, isLoading } = useQuery({
    queryKey: ['admin-city-metadata', selectedCity],
    queryFn: () => CityService.getCityMetadataById(selectedCity),
  });

  // Mutation para atualizar metadados
  const updateMutation = useMutation({
    mutationFn: (values: Partial<CityMetadata>) => 
      CityService.updateCityMetadata(selectedCity, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-city-metadata'] });
      queryClient.invalidateQueries({ queryKey: ['city-metadata'] });
      toast({
        title: 'Sucesso!',
        description: 'Metadados da cidade atualizados.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Falha ao atualizar: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const values = {
      population: parseInt(formData.get('population') as string) || 0,
      districts_count: parseInt(formData.get('districts_count') as string) || 0,
      active_businesses: parseInt(formData.get('active_businesses') as string) || 0,
      schools_count: parseInt(formData.get('schools_count') as string) || 0,
      professionals_count: parseInt(formData.get('professionals_count') as string) || 0,
      bus_lines_count: parseInt(formData.get('bus_lines_count') as string) || 0,
      description: formData.get('description') as string,
      founded_year: parseInt(formData.get('founded_year') as string) || null,
      area_km2: parseFloat(formData.get('area_km2') as string) || null,
    };

    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Metadados da Cidade</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie informações sobre a cidade exibidas na landing page
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {cityData?.city.charAt(0).toUpperCase() + cityData?.city.slice(1)}, {cityData?.state.toUpperCase()}
          </CardTitle>
          <CardDescription>
            Atualize os dados estatísticos da cidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Estatísticas principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="population" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  População
                </Label>
                <Input
                  id="population"
                  name="population"
                  type="number"
                  defaultValue={cityData?.population}
                  placeholder="2900000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="districts_count" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Número de Bairros
                </Label>
                <Input
                  id="districts_count"
                  name="districts_count"
                  type="number"
                  defaultValue={cityData?.districts_count}
                  placeholder="163"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="active_businesses" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-warning" />
                  Empresas Ativas
                </Label>
                <Input
                  id="active_businesses"
                  name="active_businesses"
                  type="number"
                  defaultValue={cityData?.active_businesses}
                  placeholder="45000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schools_count" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-success" />
                  Escolas
                </Label>
                <Input
                  id="schools_count"
                  name="schools_count"
                  type="number"
                  defaultValue={cityData?.schools_count}
                  placeholder="1200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professionals_count" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-violet-500" />
                  Profissionais
                </Label>
                <Input
                  id="professionals_count"
                  name="professionals_count"
                  type="number"
                  defaultValue={cityData?.professionals_count}
                  placeholder="8000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bus_lines_count" className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-rose-500" />
                  Linhas de Ônibus
                </Label>
                <Input
                  id="bus_lines_count"
                  name="bus_lines_count"
                  type="number"
                  defaultValue={cityData?.bus_lines_count}
                  placeholder="450"
                />
              </div>
            </div>

            {/* Informações adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="founded_year">Ano de Fundação</Label>
                <Input
                  id="founded_year"
                  name="founded_year"
                  type="number"
                  defaultValue={cityData?.founded_year}
                  placeholder="1549"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area_km2">Área (km²)</Label>
                <Input
                  id="area_km2"
                  name="area_km2"
                  type="number"
                  step="0.01"
                  defaultValue={cityData?.area_km2}
                  placeholder="693.00"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Cidade</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={cityData?.description}
                placeholder="Primeira capital do Brasil, patrimônio cultural da humanidade..."
                rows={4}
              />
            </div>

            {/* Botão de salvar */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Informações sobre atualização */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Sobre os Metadados</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            • Estes dados são exibidos na página principal da cidade (/cidade)
          </p>
          <p>
            • Os valores devem refletir dados reais da cidade, não apenas do app
          </p>
          <p>
            • A IA pode sugerir atualizações baseadas em fontes oficiais
          </p>
          <p>
            • Última atualização: {cityData?.updated_at ? new Date(cityData.updated_at).toLocaleString('pt-BR') : 'N/A'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
