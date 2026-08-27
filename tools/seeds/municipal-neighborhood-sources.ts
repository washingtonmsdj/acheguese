export interface MunicipalNeighborhoodSource {
  key: string;
  cityPath: string;
  serviceUrl: string;
  nameField: string;
  objectIdField: string;
  officeField?: string;
  areaField?: string;
  lengthField?: string;
  sourceName: string;
}

/**
 * Manifesto SSOT de fontes municipais oficiais de bairros.
 *
 * Observacao: o IBGE nao publica uma base nacional oficial de bairros municipais.
 * Por isso, bairros entram por fonte municipal validada; quando uma cidade ainda
 * nao tem fonte cadastrada, o sistema usa distritos IBGE como fallback territorial.
 */
export const MUNICIPAL_NEIGHBORHOOD_SOURCES: MunicipalNeighborhoodSource[] = [
  {
    key: "salvador-ba-geosalvador-2022",
    cityPath: "/br/ba/salvador",
    serviceUrl:
      "https://services6.arcgis.com/GP5qdNaePRPh2SdT/arcgis/rest/services/bairros_app_dados_2010_e_2022/FeatureServer/0",
    nameField: "NOME_BAIRR",
    objectIdField: "OBJECTID",
    officeField: "PREF_BAIRR",
    areaField: "Shape__Area",
    lengthField: "Shape__Length",
    sourceName: "GeoSalvador bairros_app_dados_2010_e_2022",
  },
];
