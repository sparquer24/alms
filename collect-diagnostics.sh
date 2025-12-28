#!/bin/bash

# ALMS Backend Diagnostic Collection Script
# Run this on your EC2 instance to collect diagnostic information

echo "================================================================="
echo "ALMS Backend Diagnostics"
echo "Generated: $(date)"
echo "================================================================="
echo ""

echo "### SYSTEM INFORMATION ###"
echo "Hostname: $(hostname)"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "Kernel: $(uname -r)"
echo "Uptime: $(uptime)"
echo ""

echo "### DOCKER VERSION ###"
docker --version
docker compose version
echo ""

echo "### CONTAINER STATUS ###"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.RestartCount}}\t{{.Ports}}"
echo ""

echo "### CONTAINER RESOURCE USAGE ###"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}"
echo ""

echo "### BACKEND CONTAINER DETAILS ###"
if docker ps | grep -q alms-backend; then
    echo "Container is RUNNING"
    docker inspect alms-backend | jq '.[0] | {
        RestartCount: .RestartCount,
        Status: .State.Status,
        Health: .State.Health,
        OOMKilled: .State.OOMKilled,
        ExitCode: .State.ExitCode,
        StartedAt: .State.StartedAt,
        RestartPolicy: .HostConfig.RestartPolicy
    }'
else
    echo "Container is NOT RUNNING"
fi
echo ""

echo "### PM2 STATUS (if container is running) ###"
if docker ps | grep -q alms-backend; then
    docker exec alms-backend pm2 status 2>/dev/null || echo "PM2 not available or not responding"
    echo ""
    docker exec alms-backend pm2 describe alms-backend 2>/dev/null | head -30 || echo "Cannot get PM2 details"
else
    echo "Container not running - cannot check PM2"
fi
echo ""

echo "### BACKEND LOGS (Last 50 lines) ###"
docker logs --tail 50 alms-backend 2>&1
echo ""

echo "### HEALTH CHECK ###"
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health check PASSED (HTTP $HEALTH_RESPONSE)"
    curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health
else
    echo "❌ Health check FAILED (HTTP $HEALTH_RESPONSE)"
fi
echo ""

echo "### ENVIRONMENT VARIABLES (sanitized) ###"
if docker ps | grep -q alms-backend; then
    docker exec alms-backend env | grep -v "PASSWORD\|SECRET\|KEY" | sort
else
    echo "Container not running - cannot check environment"
fi
echo ""

echo "### NETWORK CONNECTIVITY ###"
echo "Testing internal network..."
docker exec alms-backend ping -c 2 alms-frontend 2>/dev/null && echo "✅ Can reach frontend" || echo "❌ Cannot reach frontend"
echo ""

echo "### DISK USAGE ###"
df -h | grep -E "Filesystem|/$"
echo ""
echo "Docker disk usage:"
docker system df
echo ""

echo "### MEMORY USAGE ###"
free -h
echo ""

echo "### SYSTEM LOAD ###"
uptime
top -bn1 | head -20
echo ""

echo "### RECENT CONTAINER EVENTS ###"
docker events --since 1h --until 1s 2>/dev/null | tail -20 || echo "No recent events"
echo ""

echo "### ERROR SUMMARY ###"
echo "Checking logs for errors in last 100 lines..."
ERROR_COUNT=$(docker logs --tail 100 alms-backend 2>&1 | grep -iE "error|exception|fatal|crash" | wc -l)
echo "Found $ERROR_COUNT lines with errors/exceptions"
if [ $ERROR_COUNT -gt 0 ]; then
    echo "Recent errors:"
    docker logs --tail 100 alms-backend 2>&1 | grep -iE "error|exception|fatal|crash" | tail -10
fi
echo ""

echo "### OOM KILLER CHECK ###"
echo "Checking for out-of-memory kills..."
dmesg | grep -i "oom\|killed" | tail -5 || echo "No OOM kills detected"
echo ""

echo "### DOCKER COMPOSE STATUS ###"
cd ~/alms 2>/dev/null || cd /home/ubuntu/alms 2>/dev/null || echo "Cannot find alms directory"
if [ -f "docker-compose.yml" ]; then
    echo "Docker Compose configuration found"
    docker compose ps
else
    echo "docker-compose.yml not found"
fi
echo ""

echo "================================================================="
echo "Diagnostic collection complete"
echo "================================================================="
echo ""
echo "To save this output to a file, run:"
echo "  ./collect-diagnostics.sh > diagnostics-\$(date +%Y%m%d_%H%M%S).txt"
echo ""
echo "To share with support:"
echo "  cat diagnostics-*.txt"
