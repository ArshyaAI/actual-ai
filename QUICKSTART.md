# 🚀 Quick Start Guide

Your Swiss Bookkeeping Agent is ready to deploy! Your Claude API key has been configured and tested successfully.

## ✅ What's Ready

- ✅ Claude API key configured and working
- ✅ Swiss accounting intelligence built
- ✅ Document processing system ready
- ✅ Modern web interface created
- ✅ Export functionality implemented
- ✅ Deployment configurations set

## 🚀 Deploy Now

### Option 1: Railway (Recommended)
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project
railway init

# 4. Deploy
railway up
```

### Option 2: Vercel
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel deploy
```

### Option 3: Local Development
```bash
# 1. Install dependencies (may need to fix npm permissions first)
npm install

# 2. Install frontend dependencies
cd frontend && npm install

# 3. Build the project
npm run build
cd frontend && npm run build

# 4. Start the server
npm start
```

## 🔧 If you encounter npm permission issues:
Run this command in Terminal:
```bash
sudo chown -R $(whoami) ~/.npm
```

## 📋 What Your App Does

1. **Upload** your chart of accounts (CSV format)
2. **Upload** financial documents (invoices, receipts, bank statements)
3. **Process** documents with Claude AI
4. **Get** Swiss-compliant categorization
5. **Export** reports (General Ledger, Tax Report, Compliance, Audit Trail)

## 🌐 Live Demo URLs

After deployment, you'll get URLs like:
- Railway: `https://your-app.up.railway.app`
- Vercel: `https://your-app.vercel.app`

## 🆘 Need Help?

Check the main README-Swiss-Bookkeeping.md for detailed documentation.

---

**Your Swiss Bookkeeping Agent is ready to go! 🇨🇭**