# GitHub Actions Workflows - Setup Guide

## 📋 Available Workflows

### 1. **android-build.yml** (Local Build)
Traditional Android build using GitHub Actions runners.

**Pros:**
- ✅ Free for public repos
- ✅ Full control over build process
- ✅ No external dependencies

**Cons:**
- ❌ Requires manual setup
- ❌ Longer build times
- ❌ More complex configuration

### 2. **eas-build.yml** (Cloud Build - RECOMMENDED)
Uses Expo's EAS Build service (cloud-based).

**Pros:**
- ✅ Simple setup
- ✅ Faster builds
- ✅ Managed infrastructure
- ✅ Built-in caching

**Cons:**
- ❌ Requires Expo account
- ❌ Limited free tier

---

## 🚀 Setup Instructions

### Option A: EAS Build (Recommended)

#### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

#### 2. Login to Expo
```bash
eas login
```

#### 3. Configure project
```bash
eas build:configure
```

#### 4. Get Expo Token
```bash
eas whoami
# Then go to: https://expo.dev/accounts/[username]/settings/access-tokens
# Create a new token
```

#### 5. Add GitHub Secret
- Go to: `GitHub Repo → Settings → Secrets and variables → Actions`
- Click `New repository secret`
- Name: `EXPO_TOKEN`
- Value: (paste your token from step 4)

#### 6. Trigger Build
```bash
# Manually via GitHub UI
# Go to: Actions → EAS Build → Run workflow

# Or push to main branch
git push origin main

# Or via command line
eas build --platform android --profile production
```

---

### Option B: Local Build (Advanced)

#### 1. Required GitHub Secrets

Add these in `Settings → Secrets and variables → Actions`:

**Required:**
- `EXPO_TOKEN` - Expo access token (optional for local builds)

**Optional (for signing):**
- `ANDROID_KEYSTORE` - Base64 encoded keystore file
- `ANDROID_KEY_ALIAS` - Keystore alias
- `ANDROID_KEYSTORE_PASSWORD` - Keystore password
- `ANDROID_KEY_PASSWORD` - Key password

**Optional (Firebase):**
- `GOOGLE_SERVICES_JSON` - google-services.json content

#### 2. Generate Keystore (for signing)

```bash
# Generate keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias release-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Convert to base64 for GitHub Secret
base64 release.keystore > release.keystore.base64

# Copy content and add as ANDROID_KEYSTORE secret
cat release.keystore.base64 | pbcopy  # macOS
cat release.keystore.base64 | xclip   # Linux
```

#### 3. Update android/app/build.gradle

Add signing config:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

---

## 📦 Build Outputs

### APK Location
```
android/app/build/outputs/apk/release/app-release.apk
```

### AAB Location
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Download from GitHub
1. Go to: `Actions → [Workflow Run]`
2. Scroll to `Artifacts`
3. Download `app-release-[SHA]`

---

## 🔄 Workflow Triggers

### Automatic Triggers
- Push to `main` branch
- Push to `develop` branch
- Pull requests to `main`

### Manual Triggers
1. Go to: `Actions → [Workflow Name]`
2. Click `Run workflow`
3. Select options and run

### Tag-based Release
```bash
# Create version tag
git tag v1.0.0
git push origin v1.0.0

# Workflow will automatically create GitHub Release
```

---

## 🐛 Troubleshooting

### Build Fails: "Expo token not found"
**Solution:** Add `EXPO_TOKEN` secret in GitHub repo settings

### Build Fails: "Keystore not found"
**Solution:** 
1. Check `ANDROID_KEYSTORE` secret is base64 encoded
2. Verify all keystore secrets are set

### Build Fails: "Gradle permission denied"
**Solution:** The workflow includes `chmod +x android/gradlew` step

### Build Times Out
**Solution:**
- Use EAS Build instead (faster)
- Or upgrade to GitHub Actions paid plan

---

## 📊 Build Status Badge

Add to your README.md:

```markdown
![Android Build](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/android-build.yml/badge.svg)
```

---

## 🔗 Useful Links

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Android Signing Guide](https://developer.android.com/studio/publish/app-signing)
- [EAS Build Pricing](https://expo.dev/pricing)

---

## 💡 Best Practices

1. **Use EAS Build for production** - More reliable and faster
2. **Version your builds** - Use semantic versioning (v1.0.0)
3. **Test before release** - Use `preview` profile first
4. **Secure your secrets** - Never commit keystores or tokens
5. **Cache dependencies** - Already configured in workflows
6. **Monitor build times** - Optimize if builds are too slow

---

## 🎯 Next Steps

After successful build:

1. **Download APK** - From GitHub Actions artifacts
2. **Test on device** - Install and test thoroughly
3. **Prepare for store** - Follow Google Play submission guide
4. **Setup auto-deploy** - Use `eas submit` for automation

---

## 📝 Notes

- First build may take 10-15 minutes (dependency installation)
- Subsequent builds are faster (cached dependencies)
- EAS Build free tier: 30 builds/month
- GitHub Actions free tier: 2000 minutes/month (public repos unlimited)
