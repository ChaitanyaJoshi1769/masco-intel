# 🔌 Chrome Extension Deployment Guide

Complete guide to build, test, and publish the Masco Intel Chrome extension.

## Local Testing (5 minutes)

### 1. Build the Extension
```bash
cd apps/extension
pnpm build
```

Output: `apps/extension/dist/` folder is created

### 2. Load in Chrome (Unpacked)
```bash
1. Open Chrome
2. Go to: chrome://extensions
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select: apps/extension/dist
6. ✓ Extension appears in toolbar
```

### 3. Test the Extension
```
1. Click Masco Intel icon in toolbar
2. You should see popup with dark theme
3. Navigate to supported retailer:
   - Home Depot (homedepot.com)
   - Lowe's (lowes.com)
   - Amazon (amazon.com)
   - Wayfair (wayfair.com)
   - Wayfair Pro (wfpro.com)
   - BuildTrade (buildtrade.com)
   - PlumbingSupply (plumbingsupply.com)
   - Supply Direct (supplydirect.com)

4. When on product page, icon should show product data
5. Check browser console (F12) for errors
```

## Chrome Web Store Submission

### Prerequisites
- Google account
- $5 developer fee (one-time)
- Extension tested and working

### Step 1: Register as Chrome Web Store Developer
1. Go to https://chrome.google.com/webstore/devconsole
2. Click "Register as developer"
3. Accept terms and pay $5 fee
4. Verify email

### Step 2: Prepare for Submission

#### Create Required Assets

**Icon (128x128 PNG)**
```bash
# Create icon if you don't have one
# Recommended: Use high-quality PNG with transparency
# Size: exactly 128x128 pixels
```

**Screenshots (1280x800 PNG)**
```bash
1. Take 2-3 screenshots of the extension in action
2. Resize to 1280x800
3. Show key features:
   - Popup UI
   - Product detection
   - Quality analysis
```

**Promotional Images**
```bash
Small tile: 440x280 (optional but recommended)
Large tile: 920x680 (optional but recommended)
```

#### Update manifest.json
```bash
# Verify icons are properly set in manifest.json
cd apps/extension
cat manifest.json | grep -A 5 '"icons"'

# Should look like:
# "icons": {
#   "16": "icons/icon-16.png",
#   "48": "icons/icon-48.png",
#   "128": "icons/icon-128.png"
# }
```

### Step 3: Create Submission Package
```bash
# Create zip file with built extension
cd apps/extension
pnpm build
zip -r masco-intel-release.zip dist/

# Verify size (should be < 150MB, usually 2-5MB)
ls -lh masco-intel-release.zip
```

### Step 4: Submit to Chrome Web Store

1. **Go to Web Store Developer Dashboard**
   - https://chrome.google.com/webstore/devconsole

2. **Click "Create new item"**

3. **Upload the ZIP file**
   - Select `masco-intel-release.zip`
   - Wait for upload to complete

4. **Fill in Store Listing**

   **Name**
   ```
   Masco Intel - Plumbing Intelligence
   ```

   **Short description** (132 characters max)
   ```
   Real-time price tracking and product intelligence for professional plumbers
   ```

   **Full description**
   ```
   Masco Intel brings Bloomberg Terminal-like intelligence to plumbing products.
   
   FEATURES:
   • Real-time price tracking across 4 major retailers
   • Quality analysis and builder-grade detection
   • Contractor intelligence scoring
   • Product compatibility matching
   • Dark theme UI for extended use
   
   SUPPORTED RETAILERS:
   • Home Depot
   • Lowe's
   • Amazon
   • Wayfair
   • Wayfair Pro
   • BuildTrade
   • PlumbingSupply
   • Supply Direct
   
   PERFECT FOR:
   • Professional plumbers
   • Contractors
   • Supply house managers
   • Product specification tracking
   
   Get pricing intelligence and product data instantly while shopping online.
   ```

   **Category**
   ```
   Select: Productivity
   ```

   **Icon (128x128)**
   ```
   Upload your icon PNG
   ```

   **Screenshots**
   ```
   Upload 2-3 screenshots (1280x800)
   ```

   **Language**
   ```
   English (en)
   ```

   **Permissions Explanation**
   ```
   This extension requires:
   - Access to supported retailer websites (to extract product data)
   - Storage API (to cache product information locally)
   - Network access (to communicate with Masco Intel API)
   
   We do NOT:
   - Collect personal information
   - Track user behavior
   - Share data with third parties
   ```

5. **Set Privacy Policy**
   ```
   Add your privacy policy URL
   (Create one at: privacypolicygenerator.info or similar)
   ```

6. **Review & Submit**
   - Check all fields are complete (marked with ✓)
   - Click "Submit for review"

### Step 5: Wait for Review
```
Google Review Process:
- Usually 1-3 business days
- You'll receive email when approved
- Extension becomes available in Chrome Web Store
```

### Step 6: After Approval

**Get Your Extension ID**
```
1. Go to Chrome Web Store
2. Search for "Masco Intel"
3. Copy the extension ID from URL:
   chrome.google.com/webstore/detail/[ID]

4. Update environment variables:
   VITE_EXTENSION_ID=[your-extension-id]
```

**Configure Auto-Updates** (Optional)
```bash
# In manifest.json, add update URL:
"update_url": "https://your-server.com/updates.xml"

# Create updates.xml:
<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="[extension-id]">
    <updatecheck codebase="https://your-server.com/masco-intel-release.zip" version="1.0.0" />
  </app>
</gupdate>
```

## Updating Your Extension

### When You Make Changes
```bash
# 1. Update version in manifest.json
nano apps/extension/manifest.json
# Change: "version": "1.0.1"

# 2. Rebuild
pnpm build

# 3. Create new zip
zip -r masco-intel-release-1.0.1.zip dist/

# 4. Upload to Web Store Developer Dashboard
# - Click your extension
# - Click "Package"
# - Upload new zip
# - Submit for review
```

### Version Numbering
```
Format: MAJOR.MINOR.PATCH
- MAJOR: New features/significant changes
- MINOR: Small features/improvements
- PATCH: Bug fixes

Examples:
1.0.0 - Initial release
1.1.0 - Add new retailer
1.1.1 - Fix bug
2.0.0 - Complete rewrite
```

## Monitoring & Analytics

### Chrome Web Store Dashboard Shows
```
- Installation count
- Active users
- User ratings (1-5 stars)
- User reviews and feedback
- Crash reports
- Performance metrics
```

### Respond to User Reviews
```
1. Check dashboard regularly
2. Respond to negative reviews (fix issues)
3. Thank positive reviewers
4. Update extension based on feedback
```

### Common Issues & Fixes
```
Issue: "Extension not working"
→ Check error logs
→ Verify API URL is set
→ Ensure retailer domain is supported

Issue: "Slow performance"
→ Optimize content scripts
→ Cache product data in storage
→ Reduce API calls

Issue: "Won't load on some sites"
→ Update content_scripts in manifest.json
→ Add new URL patterns
→ Test locally first
```

## Promotion & Distribution

### Marketing Your Extension
```
1. Share on:
   - Product Hunt
   - HackerNews
   - Reddit (/r/plumbing, /r/contractors)
   - LinkedIn
   - Twitter

2. Create tutorial videos showing:
   - How to install
   - How to use features
   - Benefits for professionals

3. Partner with:
   - Plumbing suppliers
   - Contractor associations
   - Supply house chains
```

### Alternative Distribution
```
# If you want to distribute outside Chrome Web Store:

1. Host ZIP file on your server
2. Provide installation instructions:
   - Download masco-intel.zip
   - Unzip the file
   - Go to chrome://extensions
   - Load unpacked → select the folder

3. Update manifest.json:
   "update_url": "https://your-server.com/updates.xml"
```

## Troubleshooting

### Extension Won't Load
```bash
# Check for errors in manifest.json
node -e "console.log(JSON.parse(require('fs').readFileSync('apps/extension/manifest.json', 'utf8')))"

# Common issues:
- Missing "manifest_version": 3
- Invalid JSON
- Missing required permissions
- Duplicate script entries
```

### Permission Errors
```
If users see "This extension is not available on this site":
1. Add URL pattern to content_scripts
2. Rebuild extension
3. Users need to update (reload extension or reinstall)
```

### API Not Responding
```bash
# Check API endpoint in manifest.json
grep -r "api\." apps/extension/src/

# Verify API URL:
# Should match: https://api.yourdomain.com/api/

# If changed, rebuild and resubmit
```

## Security & Privacy

### Best Practices
```
1. Never store user credentials
2. Use HTTPS only
3. Validate all inputs
4. Limit permissions to minimum needed
5. Be transparent about data collection
6. Provide clear privacy policy
```

### Handle User Data Safely
```javascript
// Good
localStorage.setItem('products', JSON.stringify(productsData));

// Bad (don't do this)
localStorage.setItem('api_key', apiKey); // Never store secrets!
```

## Support

- **Deployment**: See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
- **Quick Reference**: See [DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md)
- **GitHub**: https://github.com/ChaitanyaJoshi1769/masco-intel

---

**Need help?** Check the [Chrome Web Store Publishing Guide](https://developer.chrome.com/docs/webstore/)
