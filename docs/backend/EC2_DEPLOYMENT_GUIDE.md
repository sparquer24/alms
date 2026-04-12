# EC2 Deployment - Step by Step Guide

Your application is tested locally and ready for EC2! Follow these steps carefully.

## 📋 Pre-Deployment Checklist

Before you start, make sure you have:
- [ ] AWS Account created
- [ ] Credit card added to AWS
- [ ] Your application works at http://localhost
- [ ] All local tests pass

---

## Part 1: Setup EC2 Instance (15 minutes)

### Step 1: Launch EC2 Instance

1. **Login to AWS Console**
   - Go to https://console.aws.amazon.com
   - Navigate to EC2 Dashboard

2. **Click "Launch Instance"**

3. **Configure Instance:**
   
   **Name:** `alms-production`
   
   **Application and OS Images (AMI):**
   - Choose: **Ubuntu Server 22.04 LTS** (Free tier eligible)
   
   **Instance Type:**
   - Choose: **t2.medium** (4GB RAM) - Minimum recommended
   - Or **t3.medium** (better performance)
   - ⚠️ **Not t2.micro** - too small for your app
   
   **Key pair:**
   - Click "Create new key pair"
   - Name: `alms-key`
   - Type: RSA
   - Format: `.pem` (for SSH)
   - Click "Create key pair" - **SAVE THIS FILE SECURELY!**
   
   **Network Settings:**
   - Click "Edit"
   - Enable "Auto-assign public IP"
   - Firewall (Security Group): Create new
   - Security group name: `alms-security-group`
   
   **Add these Security Group Rules:**
   | Type | Port | Source | Description |
   |------|------|--------|-------------|
   | SSH | 22 | My IP | SSH access |
   | HTTP | 80 | 0.0.0.0/0 | Web access |
   | HTTPS | 443 | 0.0.0.0/0 | SSL (future) |
   
   **Configure Storage:**
   - Size: **20 GB** minimum (30 GB recommended)
   - Volume type: gp3
   
4. **Click "Launch Instance"**

5. **Wait for instance to start** (2-3 minutes)
   - Status should show "Running"
   - Note your **Public IPv4 address** - you'll need this!

### Step 2: Allocate Elastic IP (Recommended)

This gives you a permanent IP address:

1. In EC2 Dashboard, go to **"Elastic IPs"**
2. Click **"Allocate Elastic IP address"**
3. Click **"Allocate"**
4. Select the new IP → **Actions** → **"Associate Elastic IP address"**
5. Select your instance → Click **"Associate"**
6. **Note this IP** - this is your permanent public IP!

---

## Part 2: Connect to EC2 (5 minutes)

### Option A: Using PowerShell (Windows)

1. **Set permissions on your key file:**
```powershell
# Replace with your actual key path
$keyPath = "C:\Users\kajal\Downloads\alms-key.pem"

# Set correct permissions
icacls $keyPath /inheritance:r
icacls $keyPath /grant:r "$($env:USERNAME):(R)"
```

2. **Connect to EC2:**
```powershell
# Replace with your EC2 public IP
ssh -i "C:\Users\kajal\Downloads\alms-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

Example:
```powershell
ssh -i "C:\Users\kajal\Downloads\alms-key.pem" ubuntu@54.123.45.67
```

### Option B: Using PuTTY (Windows Alternative)

1. Download PuTTY: https://www.putty.org/
2. Convert .pem to .ppk using PuTTYgen
3. Use PuTTY to connect

### First Connection

You'll see:
```
Are you sure you want to continue connecting (yes/no)? 
```
Type `yes` and press Enter.

You should now see:
```
ubuntu@ip-xxx-xxx-xxx-xxx:~$
```

✅ **You're connected to EC2!**

---

## Part 3: Install Docker on EC2 (5 minutes)

Run these commands on EC2:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git (if needed)
sudo apt install git -y

# IMPORTANT: Logout and login again for docker group to take effect
exit
```

**Now reconnect to EC2:**
```powershell
ssh -i "C:\Users\kajal\Downloads\alms-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

**Verify installation:**
```bash
docker --version
docker compose version
```

You should see version numbers. ✅

---

## Part 4: Deploy Your Application (10 minutes)

### Step 1: Clone Your Repository

```bash
cd ~
git clone https://github.com/sparquer24/alms.git
cd alms
git checkout frontend/build/issues-1
```

### Step 2: Create Production Environment File

```bash
nano .env
```

**Copy and paste this (edit the values):**

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:CHANGE_THIS_PASSWORD@postgres:5432/alms
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
POSTGRES_DB=alms

# JWT Secret - GENERATE A NEW ONE FOR PRODUCTION!
JWT_SECRET=CHANGE_THIS_TO_STRONG_SECRET_64_CHARACTERS_LONG

# API URL - MUST be /api for Nginx routing
NEXT_PUBLIC_API_URL=/api

# Environment
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_PORT=5000
```

**To save in nano:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### Step 3: Generate Strong Secrets

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it for `JWT_SECRET` in your `.env` file.

**Generate Database Password:**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, ''))"
```

Copy the output and use it for `POSTGRES_PASSWORD` and in `DATABASE_URL`.

**Edit .env again to add the secrets:**
```bash
nano .env
```

Update the values, then save (Ctrl+X, Y, Enter).

### Step 4: Create Backend Environment File

```bash
nano backend/.env
```

**Paste this (use SAME values as root .env):**

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@postgres:5432/alms

# JWT Configuration
JWT_SECRET=YOUR_JWT_SECRET_HERE
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Password Security
BCRYPT_SALT_ROUNDS=12

# CORS Configuration
CORS_ORIGIN=*

# File Upload Configuration
MAX_FILE_SIZE=5mb
UPLOAD_DESTINATION=./uploads

# Logging Configuration
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Save (Ctrl+X, Y, Enter).

### Step 5: Build and Start Application

```bash
cd ~/alms

# Build and start all services
docker compose up --build -d
```

**This will take 10-15 minutes on first build.** ☕

You'll see:
```
[+] Building ...
[+] Running 4/4
 ✔ Container alms-postgres   Started
 ✔ Container alms-backend    Started
 ✔ Container alms-frontend   Started
 ✔ Container alms-nginx      Started
```

### Step 6: Run Database Migrations

```bash
# Wait a few seconds for containers to be ready
sleep 10

# Run migrations
docker compose exec backend npm run prisma:migrate
```

You should see:
```
All migrations have been successfully applied.
```

### Step 7: Verify Everything is Running

```bash
# Check container status
docker compose ps
```

All should show "Up":
```
NAME            STATUS
alms-backend    Up
alms-frontend   Up
alms-nginx      Up
alms-postgres   Up
```

**Check logs:**
```bash
docker compose logs --tail=50
```

Look for:
- No critical errors
- "Nest application successfully started"

---

## Part 5: Test Your Application (5 minutes)

### Test from EC2 (Internal)

```bash
# Test frontend
curl -I http://localhost

# Test backend
curl http://localhost/api
```

### Test from Your Browser (External)

**Open your browser and go to:**
```
http://YOUR_EC2_PUBLIC_IP
```

Example: `http://54.123.45.67`

✅ **Your application should load!**

### Test Features:
- [ ] Homepage loads
- [ ] Can register a new user
- [ ] Can login
- [ ] Dashboard loads
- [ ] All navigation works
- [ ] Forms work
- [ ] No errors in browser console (F12)

---

## Part 6: Setup Domain (Optional)

If you have a domain name:

### Step 1: Add DNS Record

In your domain registrar (GoDaddy, Namecheap, etc.):

1. Add an **A Record**:
   - Host: `@` (or your subdomain like `app`)
   - Points to: `YOUR_EC2_ELASTIC_IP`
   - TTL: 3600

2. Wait 5-60 minutes for DNS propagation

### Step 2: Update Nginx (Later)

Once DNS works, you can add SSL with Let's Encrypt.

---

## Part 7: Setup SSL/HTTPS (Optional but Recommended)

### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Stop Nginx Container

```bash
cd ~/alms
docker compose stop nginx
```

### Get SSL Certificate

```bash
# Replace yourdomain.com with your actual domain
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose whether to share email

### Update Nginx Configuration

```bash
nano ~/alms/nginx/nginx.conf
```

Add SSL configuration (detailed guide available in docs).

### Update Docker Compose

```bash
nano ~/alms/docker-compose.yml
```

Add volume mount for SSL certificates to nginx service:

```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
  ports:
    - "80:80"
    - "443:443"
```

### Restart Services

```bash
docker compose up -d
```

---

## 🎯 Your Application is Live!

### Access URLs:
- **HTTP:** http://YOUR_EC2_PUBLIC_IP
- **HTTPS:** https://yourdomain.com (if configured)

### Next Steps:

1. **Test thoroughly** - Try all features
2. **Monitor logs** - Check for errors
3. **Setup backups** - Database backup strategy
4. **Monitor resources** - CPU/Memory usage

---

## 📊 Monitoring & Maintenance

### View Logs
```bash
cd ~/alms

# All logs
docker compose logs -f

# Specific service
docker compose logs backend -f
docker compose logs frontend -f
```

### Check Resource Usage
```bash
# Container stats
docker stats

# System resources
htop

# Disk space
df -h
```

### Restart Services
```bash
cd ~/alms

# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
```

### Stop Services
```bash
cd ~/alms
docker compose down
```

### Update Application
```bash
cd ~/alms

# Pull latest code
git pull origin frontend/build/issues-1

# Rebuild and restart
docker compose up --build -d

# Run new migrations if any
docker compose exec backend npm run prisma:migrate
```

---

## 🔒 Security Best Practices

### Firewall Setup
```bash
# Enable UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
cd ~/alms
docker compose pull
docker compose up -d
```

### Backup Database
```bash
# Create backup
docker compose exec postgres pg_dump -U postgres alms > backup_$(date +%Y%m%d).sql

# Download to your computer
scp -i "alms-key.pem" ubuntu@YOUR_EC2_IP:~/backup_*.sql C:\Users\kajal\backups\
```

---

## 🆘 Troubleshooting

### Application not loading?
```bash
# Check containers
docker compose ps

# Check logs
docker compose logs --tail=100

# Restart
docker compose restart
```

### Out of memory?
```bash
# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Port 80 blocked?
- Check Security Group in AWS Console
- Verify port 80 is open to 0.0.0.0/0

### Database errors?
```bash
# Check database logs
docker compose logs postgres

# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

---

## 💰 Cost Estimation

**Monthly AWS Costs (Approximate):**

| Service | Size | Cost/Month |
|---------|------|------------|
| EC2 t2.medium | 4GB RAM | ~$30-35 |
| Elastic IP | Static IP | $0 (when attached) |
| EBS Storage | 20GB | ~$2 |
| Data Transfer | First 100GB | Free |
| **Total** | | **~$32-40/month** |

**Cost Saving Tips:**
- Use t3.medium instead (better performance/cost)
- Reserve instances for 1-3 years (up to 75% discount)
- Stop instance when not needed (testing only)

---

## 🎉 Success Checklist

Before you consider deployment complete:

- [ ] EC2 instance running
- [ ] All 4 containers running
- [ ] Application loads at http://YOUR_IP
- [ ] Can register/login
- [ ] All features work
- [ ] No critical errors in logs
- [ ] Database persists after restart
- [ ] Domain pointing to EC2 (optional)
- [ ] SSL configured (optional)
- [ ] Firewall enabled
- [ ] Backup strategy in place

---

## 📞 Quick Command Reference

```bash
# SSH to EC2
ssh -i "alms-key.pem" ubuntu@YOUR_EC2_IP

# Navigate to app
cd ~/alms

# View status
docker compose ps

# View logs
docker compose logs -f

# Restart app
docker compose restart

# Stop app
docker compose down

# Start app
docker compose up -d

# Rebuild app
docker compose up --build -d

# Run migrations
docker compose exec backend npm run prisma:migrate

# Database backup
docker compose exec postgres pg_dump -U postgres alms > backup.sql
```

---

## 🎓 You're Done!

Your application is now live on AWS EC2! 🚀

**Share your application:**
- URL: http://YOUR_EC2_IP
- Or: https://yourdomain.com

**Need help?**
- Check logs: `docker compose logs -f`
- Review troubleshooting section above
- Check AWS CloudWatch for system metrics

**Good luck with your deployment!** 🎉
