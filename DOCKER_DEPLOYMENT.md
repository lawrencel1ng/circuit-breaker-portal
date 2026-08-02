# F5 Automation Control Center - Docker Deployment

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- SSH access to the target server

## Quick Deployment

1. **Transfer files to server:**
   ```bash
   scp -r . lawrence@172.16.0.1:/opt/f5-control-center/
   ```

2. **SSH into the server:**
   ```bash
   ssh lawrence@172.16.0.1
   ```

3. **Navigate to the application directory:**
   ```bash
   cd /opt/f5-control-center
   ```

4. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

## Manual Deployment

If you prefer to run the commands manually:

1. **Build and start the application:**
   ```bash
   docker-compose up --build -d
   ```

2. **Check the status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

## Accessing the Application

- **URL:** http://172.16.0.1:3000
- **Health Check:** http://172.16.0.1:3000/health

## Configuration

The application will:
- Run on port 3000
- Automatically restart on failure
- Persist data in the `./data` directory
- Include health checks for monitoring

## Troubleshooting

1. **Check if the application is running:**
   ```bash
   docker-compose ps
   ```

2. **View application logs:**
   ```bash
   docker-compose logs f5-control-center
   ```

3. **Restart the application:**
   ```bash
   docker-compose restart
   ```

4. **Rebuild and restart:**
   ```bash
   docker-compose up --build -d
   ```

## Security Notes

- The application runs as a non-root user inside the container
- Data is persisted in the `./data` directory
- Consider setting up a reverse proxy (nginx) for production use
- Ensure proper firewall rules are in place

## Monitoring

The container includes health checks that monitor:
- Application availability
- Response time
- Automatic restart on failure

You can monitor the health status using:
```bash
docker-compose ps
```


