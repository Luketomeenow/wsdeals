# Dialpad Embedded CTI Setup Guide

This guide explains how to set up Dialpad's Embedded CTI (Computer Telephony Integration) for in-app calling.

## Prerequisites

1. **Dialpad Developer Account** with OAuth credentials
2. **Dialpad Client ID and Secret** (from your Dialpad app registration)
3. Users must have connected their Dialpad accounts via OAuth

## Environment Variables

### Frontend (.env or Vite environment)

Add to your frontend environment (or set in your hosting provider):

```bash
VITE_DIALPAD_CLIENT_ID=your_dialpad_client_id_here
```

### Backend (Supabase Edge Functions)

These should already be set in your Supabase project:

```bash
DIALPAD_CLIENT_ID=your_dialpad_client_id_here
DIALPAD_CLIENT_SECRET=your_dialpad_client_secret_here
```

## How to Get Dialpad Credentials

1. Go to [Dialpad Developer Portal](https://developers.dialpad.com/)
2. Create or select your app
3. Navigate to OAuth settings
4. Copy your **Client ID** and **Client Secret**
5. Add the redirect URI: `https://your-app-domain.com/oauth/dialpad/callback`

## Setup Steps

### 1. Set Environment Variables

#### For Local Development:
Create a `.env` file in the root directory:

```bash
VITE_DIALPAD_CLIENT_ID=your_client_id_here
```

#### For Production (Netlify):
1. Go to your Netlify dashboard
2. Site settings → Build & deploy → Environment
3. Add environment variable:
   - Key: `VITE_DIALPAD_CLIENT_ID`
   - Value: Your Dialpad Client ID

#### For Supabase Edge Functions:
1. Go to Supabase Dashboard
2. Project Settings → Edge Functions
3. Add secrets:
   - `DIALPAD_CLIENT_ID`
   - `DIALPAD_CLIENT_SECRET`

### 2. Enable Dialpad Mini Dialer

In your Dialpad Developer Portal:
1. Enable the **Mini Dialer** feature for your app
2. Configure the allowed origins to include your app domain
3. Set the appropriate scopes:
   - `call:read`
   - `call:write`
   - `user:read`

### 3. User Connection Flow

Users need to connect their Dialpad account:

1. Navigate to Settings or Integrations page
2. Click "Connect to Dialpad"
3. Authorize the app
4. OAuth flow will store access token in `dialpad_tokens` table

### 4. Verify Setup

After setup, the CTI widget should:

1. ✅ Appear in the bottom-right corner (only for authenticated users)
2. ✅ Show minimized by default (small phone icon)
3. ✅ Expand to show Dialpad Mini Dialer when clicked
4. ✅ Allow making calls directly from the browser
5. ✅ Log all calls to the database

## How It Works

### Architecture

```
User clicks "Call" button
    ↓
ClickToCall component checks for CTI
    ↓
If CTI available → Use in-app calling
If not → Fallback to edge function or tel: link
    ↓
CTI sends postMessage to Dialpad iframe
    ↓
Dialpad initiates call through their infrastructure
    ↓
Call events sent back to app
    ↓
App logs call to database and shows notifications
```

### CTI Features

- **Floating Widget**: Minimizable dialer in bottom-right corner
- **In-App Calling**: Make calls without leaving the browser
- **Call Logging**: Automatic logging to your database
- **Real-time Events**: Listen to call status (ringing, answered, ended)
- **Toast Notifications**: Visual feedback for call actions
- **Call Duration**: Tracks and displays call length

### Call Events Handled

- `call.started` - Call initiated
- `call.ringing` - Call is ringing
- `call.answered` - Call was answered
- `call.ended` - Call completed
- `call.failed` - Call failed to connect

## Troubleshooting

### CTI Widget Not Appearing

**Check:**
1. User is logged in to your app
2. User has connected Dialpad via OAuth
3. `VITE_DIALPAD_CLIENT_ID` is set correctly
4. You're on an admin route (not EOD portal or public pages)

**Debug:**
```javascript
// Open browser console and check:
console.log(import.meta.env.VITE_DIALPAD_CLIENT_ID); // Should show your client ID
```

### Calls Still Using Desktop App

**Possible causes:**
1. CTI iframe not loading properly
2. Browser permissions denied (microphone access)
3. Dialpad Mini Dialer not enabled in your app settings
4. CORS issues - check allowed origins in Dialpad Developer Portal

**Solutions:**
1. Check browser console for errors
2. Allow microphone access when prompted
3. Verify Mini Dialer is enabled in Dialpad Developer Portal
4. Add your domain to allowed origins in Dialpad settings

### Token Expired

If users see "Not Connected" errors:
1. OAuth token may have expired
2. User needs to reconnect Dialpad
3. Go to Settings → Integrations → Reconnect Dialpad

### Iframe Not Loading

**Check:**
- Browser blocks third-party cookies → Enable for dialpad.com
- Content Security Policy restrictions
- Network connectivity to dialpad.com

## Browser Permissions

The CTI requires the following permissions:
- 🎤 **Microphone** (for voice calls)
- 🔊 **Speaker** (for audio output)
- 📹 **Camera** (optional, for video calls)

Users will be prompted to grant these when making their first call.

## Security Considerations

1. **Access Tokens**: Stored securely in Supabase database
2. **Token Expiration**: Checked before loading CTI
3. **Sandbox Iframe**: CTI runs in a sandboxed environment
4. **Origin Validation**: Only accepts messages from dialpad.com
5. **User Authentication**: CTI only loads for authenticated users

## Call Logging

All calls are automatically logged to the `calls` table with:
- Direction (outbound)
- Phone numbers (from/to)
- Status (in-progress, completed, failed)
- Duration (in seconds)
- Related contact and deal IDs
- Timestamps (started_at, ended_at)

## Testing

### Local Testing

1. Ensure `VITE_DIALPAD_CLIENT_ID` is set in `.env`
2. Run `npm run dev`
3. Log in and connect Dialpad
4. Look for CTI widget in bottom-right
5. Try making a call

### Production Testing

1. Deploy with environment variable set
2. Clear cache and reload
3. Connect Dialpad account
4. Test calling functionality

## Support

If you encounter issues:

1. **Check Browser Console**: Look for error messages
2. **Verify Environment Variables**: Ensure all variables are set correctly
3. **Test OAuth Flow**: Make sure Dialpad connection works
4. **Contact Dialpad Support**: For issues with their Mini Dialer
5. **Check Database Logs**: Review call logs in `calls` table

## Additional Resources

- [Dialpad Developer Documentation](https://developers.dialpad.com/)
- [Dialpad Mini Dialer Docs](https://developers.dialpad.com/docs/dialpad-mini-dialer)
- [OAuth 2.0 Documentation](https://developers.dialpad.com/docs/oauth)

