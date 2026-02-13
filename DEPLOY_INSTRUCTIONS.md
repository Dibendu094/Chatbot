# Deploying ChatBot to Vercel

### Step 1: Ensure GitHub is Synced

1. Open your terminal in VS Code (Ctrl + `).
2. Run this command to ensure your latest code is on GitHub:
   ```bash
   cd c:\Users\monda\Documents\chatbot
   git push -u origin main --force
   ```
   _(Note: This might ask you to log in to GitHub in your browser. Please do so.)_

### Step 2: Configure Vercel Project

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your project **"chatbot"**.
3. Go to **Settings** -> **General**.
4. Scroll down to **Root Directory**.
5. Click **Edit** and set it to: `frontend`
   _(This is crucial because your Next.js app is inside the `frontend` folder, not the root.)_
6. Click **Save**.

### Step 3: Add Environment Variables

1. While still in **Settings**, go to **Environment Variables** (left sidebar).
2. Add the following variable for your API connection:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-url.onrender.com` (or wherever your Python backend is hosted).
     _(If you are just testing the frontend UI, you can skip this for now, but Voice Mode needs a backend connection)._

### Step 4: Deploy

1. Go to the **Deployments** tab at the top.
2. You should see a deployment building automatically if you just pushed.
3. If not, or if the last one failed, click the **three dots** (⋮) next to the latest commit and select **Redeploy**.
4. Check "Redeploy with existing build cache" (default) and click **Redeploy**.

### Step 5: Verify

1. Wait for the build to complete (should take ~1-2 minutes).
2. Once the status says **Ready** (Green), click the **Visit** button.
3. Your app is live!

---

**Troubleshooting:**

- If build fails with `Error: No Next.js version detected`, double-check Step 2 (Root Directory = `frontend`).
- If Voice Mode crashes, ensure your browser allows microphone access on the deployed site.
