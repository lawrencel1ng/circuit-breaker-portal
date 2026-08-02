/**
 * Database Seed Script
 * Creates default users and data for development
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo users
  const users = [
    {
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      roles: JSON.stringify(['super_admin']),
      isActive: true
    },
    {
      username: 'operator',
      email: 'operator@example.com',
      password: 'operator123',
      firstName: 'Operator',
      lastName: 'User',
      roles: JSON.stringify(['operator']),
      isActive: true
    },
    {
      username: 'viewer',
      email: 'viewer@example.com',
      password: 'viewer123',
      firstName: 'Viewer',
      lastName: 'User',
      roles: JSON.stringify(['viewer']),
      isActive: true
    },
    {
      username: 'swgadmin',
      email: 'swgadmin@example.com',
      password: 'swgadmin123',
      firstName: 'SWG',
      lastName: 'Admin',
      roles: JSON.stringify(['swg_admin']),
      isActive: true
    },
    {
      username: 'deployadmin',
      email: 'deployadmin@example.com',
      password: 'deployadmin123',
      firstName: 'Deployment',
      lastName: 'Admin',
      roles: JSON.stringify(['deployment_admin']),
      isActive: true
    }
  ];

  for (const userData of users) {
    const existing = await prisma.user.findUnique({
      where: { username: userData.username }
    });

    if (existing) {
      console.log(`User ${userData.username} already exists, skipping...`);
      continue;
    }

    const hashedPassword = await hash(userData.password, 10);
    
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        passwordHash: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roles: userData.roles,
        isActive: userData.isActive
      }
    });

    console.log(`Created user: ${user.username} (${userData.roles})`);
  }

  // Create default lanes if they don't exist
  const lanes = [
    {
      id: 'lane-1',
      name: 'Lane 1',
      edgeStatus: 'active',
      enterpriseStatus: 'active',
      trafficDistribution: 100,
      healthStatus: 'healthy'
    },
    {
      id: 'lane-2',
      name: 'Lane 2',
      edgeStatus: 'inactive',
      enterpriseStatus: 'inactive',
      trafficDistribution: 0,
      healthStatus: 'healthy'
    },
    {
      id: 'lane-3',
      name: 'Lane 3',
      edgeStatus: 'inactive',
      enterpriseStatus: 'inactive',
      trafficDistribution: 0,
      healthStatus: 'healthy'
    }
  ];

  for (const laneData of lanes) {
    const existing = await prisma.lane.findUnique({
      where: { id: laneData.id }
    });

    if (existing) {
      console.log(`Lane ${laneData.name} already exists, skipping...`);
      continue;
    }

    await prisma.lane.create({
      data: {
        id: laneData.id,
        name: laneData.name,
        edgeStatus: laneData.edgeStatus,
        enterpriseStatus: laneData.enterpriseStatus,
        edgeLoadBalancer: JSON.stringify({ virtualServers: [], pools: [] }),
        enterpriseLoadBalancer: JSON.stringify({ virtualServers: [], pools: [] }),
        edgeCircuitBreaker: JSON.stringify({ wideIPs: [], pools: [] }),
        enterpriseCircuitBreaker: JSON.stringify({ wideIPs: [], pools: [] }),
        trafficDistribution: laneData.trafficDistribution,
        healthStatus: laneData.healthStatus
      }
    });

    console.log(`Created lane: ${laneData.name}`);
  }

  // Create default SWG config if it doesn't exist
  const swgConfig = await prisma.sWGConfig.findUnique({
    where: { id: 'default' }
  });

  if (!swgConfig) {
    await prisma.sWGConfig.create({
      data: {
        id: 'default',
        proxyIp: '10.1.10.51',
        proxyPort: 8080,
        proxyEnabled: true,
        vlans: JSON.stringify(['vlan30', 'vlan40']),
        sslIntercept: true,
        bypassList: JSON.stringify(['microsoft.com']),
        authEnabled: true,
        authScheme: 'ntlm',
        authRealm: 'CORP.LOCAL'
      }
    });
    console.log('Created default SWG config');
  }

  // Create sample applications
  const apps = [
    {
      id: 'app-1',
      name: 'Mobile Banking API',
      description: 'OCBC Mobile Banking API',
      status: 'deployed'
    },
    {
      id: 'app-2',
      name: 'Web Portal',
      description: 'Customer Web Portal',
      status: 'deployed'
    },
    {
      id: 'app-3',
      name: 'Payment Gateway',
      description: 'Payment Processing Service',
      status: 'deployed'
    }
  ];

  for (const app of apps) {
    const existing = await prisma.application.findUnique({
      where: { id: app.id }
    });

    if (existing) {
      console.log(`Application ${app.name} already exists, skipping...`);
      continue;
    }

    await prisma.application.create({
      data: {
        id: app.id,
        name: app.name,
        description: app.description,
        deployedLanes: 'lane-1',
        status: app.status
      }
    });

    console.log(`Created application: ${app.name}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
