# OCBC Circuit Breaker Management Portal

A comprehensive Circuit Breaker Management Portal built with SvelteKit, showcasing F5 resiliency architecture for multi-lane traffic management with full Secure Web Gateway (SWG) integration.

## 🎯 Features Overview

### Phase 1: Circuit Breaker Management ✅
- **Multi-lane traffic management** with circuit breakers at two levels:
  - Edge Circuit Breaker (GSLB): Routes incoming traffic to the correct edge lane
  - Enterprise Circuit Breaker (GSLB): Routes traffic from edge servers to enterprise server farm lanes
- **3 traffic lanes** (Lane 1, Lane 2, Lane 3) with independent control
- **Real-time health monitoring** with automatic failover
- **Application deployment** via F5 AS3 declarative API

### Phase 2: Secure Web Gateway (SWG) ✅
- **Explicit Proxy**: HTTP/HTTPS forward proxy with authentication
- **SSL Interception**: Decrypt and inspect TLS traffic
- **URL Filtering**: Block/allow lists with category-based filtering
- **Authentication**: NTLM, Kerberos, LDAP, SAML support via APM
- **Layered Security Policies**: Layer 2 (SSLO) and Layer 3 (SWG) policies
- **Session Monitoring**: Real-time user session tracking
- **Access Logging**: Comprehensive request/response logging
- **Threat Intelligence**: Automated threat feed updates
- **SIEM Integration**: Export logs to Splunk, QRadar, ArcSight
- **ICAP Integration**: DLP and Anti-Malware scanning

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Circuit Breaker Portal                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Lane 1     │  │   Lane 2     │  │   Lane 3     │      │
│  │  (Active)    │  │  (Standby)   │  │  (Standby)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                    F5 Integration Layer                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  iControl   │ │    AS3      │ │    APM      │           │
│  │   REST      │ │Declarative  │ │   Access    │           │
│  │   API       │ │   API       │ │   Policy    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│                    SWG Components                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   SSLO      │ │    SWG      │ │   URL       │           │
│  │  (Layer 2)  │ │  (Layer 3)  │ │  Filtering  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- F5 BIG-IP with iControl REST, AS3 Extension (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lawrencel1ng/f5acc.git
cd f5acc
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your F5 BIG-IP credentials and configuration
```

4. Initialize the database:
```bash
npm run db:migrate
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 📊 Dashboard Features

### Circuit Breaker Dashboard
- **Lane Overview**: Visual representation of all 3 lanes with real-time status
- **Traffic Flow Diagram**: Animated Client → Edge → Enterprise flow
- **Quick Stats**: Overview of lanes, deployments, and server health
- **Recent Activity**: Real-time log of system events
- **Health Monitoring**: Continuous health checks with automatic updates

### SWG Dashboard
- **Active Sessions**: Real-time user session monitoring
- **Blocked Requests**: Statistics on blocked traffic
- **Bandwidth Saved**: Caching and compression metrics
- **Threat Intelligence**: Feed status and updates

## 🎛️ Control Panel

### Lane Control
- Toggle switches for Edge and Enterprise circuit breakers
- Quick Actions: Activate all lanes, failover to specific lanes
- Maintenance mode with custom messages
- Flip Down Lane: Manual lane closure with confirmation

### SWG Configuration
- **Proxy Config**: Explicit proxy settings, SSL interception
- **URL Filtering**: Manage blocked URLs and categories
- **Policies**: Layer 2 (SSLO) and Layer 3 (SWG) security policies
- **Authentication**: Configure NTLM, Kerberos, LDAP, SAML
- **Logging**: Local/remote syslog, SIEM export settings
- **Integrations**: ICAP, Threat Intelligence, SIEM

## 🔧 Configuration

### Environment Variables

#### F5 BIG-IP Connection
```env
F5_HOST=https://bigip-mgmt.bank.com
F5_USERNAME=admin
F5_PASSWORD=your-secure-password
F5_VERIFY_SSL=true
```

#### SSL Orchestrator (SSLO)
```env
SSLO_ENABLED=true
SSLO_TOPOLOGY_NAME=swg-topology
SSLO_SERVICE_CHAIN=swg-service-chain
```

#### Secure Web Gateway (SWG)
```env
SWG_ENABLED=true
SWG_EXPLICIT_PROXY_IP=10.1.10.51
SWG_EXPLICIT_PROXY_PORT=8080
```

#### Access Policy Manager (APM)
```env
APM_ENABLED=true
APM_ACCESS_PROFILE=swg-access-profile
APM_NTLM_SERVERS=10.1.10.10,10.1.10.11
APM_LDAP_SERVER=ldap://10.1.10.10:389
```

#### AS3 Configuration
```env
AS3_ENABLED=true
AS3_TENANT=SWG
AS3_APPLICATION=SecureWebGateway
```

See `.env.example` for complete configuration options.

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   └── swg/            # SWG-specific components
│   ├── server/             # Server-side code
│   │   ├── f5/            # F5 integration services
│   │   ├── validation.ts  # Input validation schemas
│   │   └── logger.ts      # Structured logging
│   ├── stores/             # Svelte stores
│   ├── types.ts            # TypeScript definitions
│   └── utils/              # Utility functions
├── routes/                 # SvelteKit routes
│   ├── api/               # API endpoints
│   │   ├── f5/           # F5 integration APIs
│   │   └── swg/          # SWG APIs
│   └── (app)/             # Application pages
└── test-setup.ts          # Test configuration
```

## 🔒 Security Features

- **Input Validation**: Zod schemas for all API inputs
- **Authentication**: Session-based auth with role support
- **HTTPS Enforcement**: Secure connections to F5
- **Secrets Management**: Environment-based configuration
- **Audit Logging**: All actions logged with user tracking

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries for large datasets
- **Caching Layer**: In-memory caching for F5 API responses
- **Pagination**: Efficient handling of large log datasets
- **Request Deduplication**: Prevents duplicate API calls
- **Lazy Loading**: Components loaded on demand

## 🔌 API Endpoints

### Circuit Breaker APIs
- `GET /api/config` - Get configuration
- `PUT /api/lanes/:id` - Update lane status
- `POST /api/deployments` - Deploy application

### SWG APIs
- `GET/POST /api/swg/config` - SWG configuration
- `GET/POST /api/swg/url-filtering` - URL filtering
- `GET/POST /api/swg/policies` - Security policies
- `GET /api/swg/sessions` - Active sessions
- `GET /api/swg/logs` - Access logs

### F5 Integration APIs
- `GET /api/f5` - F5 connectivity status
- `POST /api/f5/deploy` - Deploy to F5

## 🐳 Docker Deployment

Build and run with Docker:

```bash
docker-compose up -d
```

Or build manually:

```bash
docker build -t circuit-breaker-portal .
docker run -p 3000:3000 --env-file .env circuit-breaker-portal
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Tests pass (`npm test`)
- Code follows the existing style
- Documentation is updated

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or support:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting guide

## 🗺️ Roadmap

### Phase 3 (In Progress)
- Blue/Green Deployments
- Multi-Cloud Routing
- Declarative Onboarding (DO)
- Telemetry Streaming (TS)
- Pool Member Auto-Remediation

### Phase 4 (Planned)
- Cloud Auto-Scaling
- Advanced Analytics
- BIG-IQ Integration
- Kubernetes Integration (CIS)
- Terraform Provider

---

**Built with ❤️ using SvelteKit, TypeScript, and F5 Technologies**
