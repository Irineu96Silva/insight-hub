import { DataSource } from 'typeorm';
import { System, AuthType } from '../../modules/systems/entities/system.entity';
import { Endpoint } from '../../modules/endpoints/entities/endpoint.entity';

export const seedCrmMenu = async (dataSource: DataSource) => {
  const systemRepo = dataSource.getRepository(System);
  const endpointRepo = dataSource.getRepository(Endpoint);

  // 1. Check if CRMMenu exists
  let crmSystem = await systemRepo.findOne({ where: { slug: 'crmmenu' } });

  if (!crmSystem) {
    console.log('Seeding CRMMenu system...');
    crmSystem = systemRepo.create({
      name: 'CRMMenu',
      slug: 'crmmenu',
      description: 'Sistema de CRM para gestão de cartões fidelidade, pontos e resgates',
      base_url: 'https://crediativos.mensageiro.gx360.com.br',
      auth_type: AuthType.NONE,
      is_active: true,
    });
    await systemRepo.save(crmSystem);
  } else {
    console.log('CRMMenu system already exists.');
  }

  // 2. See Endpoints
  const endpointsData = [
    {
      name: 'Cartões Ativos',
      url_template: '/ords/gx360_prd/mensageiro/cartoes-ativos/:mes/:ano',
      method: 'GET',
      params_schema: {
        mes: { type: 'number', description: 'Mês (1-12)' },
        ano: { type: 'number', description: 'Ano' },
      },
    },
    {
      name: 'Cartões Resgatados',
      url_template: '/ords/gx360_prd/mensageiro/cartoes_resgatados/:mes/:ano',
      method: 'GET',
      params_schema: {
        mes: { type: 'number', description: 'Mês (1-12)' },
        ano: { type: 'number', description: 'Ano' },
      },
    },
    {
      name: 'Pontos Distribuídos',
      url_template: '/ords/gx360_prd/mensageiro/pontos-dia/:mes/:ano',
      method: 'GET',
      params_schema: {
        mes: { type: 'number', description: 'Mês (1-12)' },
        ano: { type: 'number', description: 'Ano' },
      },
    },
  ];

  for (const epData of endpointsData) {
    const exists = await endpointRepo.findOne({
      where: {
        system_id: crmSystem.id,
        url_template: epData.url_template,
      },
    });

    if (!exists) {
      console.log(`Seeding endpoint: ${epData.name}...`);
      const endpoint = endpointRepo.create({
        ...epData,
        system: crmSystem,
        is_active: true,
      });
      await endpointRepo.save(endpoint);
    } else {
      console.log(`Endpoint ${epData.name} already exists.`);
    }
  }
};
