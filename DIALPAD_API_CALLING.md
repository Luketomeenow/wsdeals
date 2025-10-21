# Dialpad API-Based Calling - Updated Implementation

## Overview

The calling system now uses **Dialpad's REST API** to initiate calls directly, avoiding deep links that open the desktop application.

## How It Works

### Call Flow

1. User clicks "Call" button
2. System checks if user has Dialpad OAuth token
3. If yes: Makes API call to `https://dialpad.com/api/v2/calls`
4. Dialpad initiates the call on user's connected device
5. Call is logged to your database
6. If API fails: Falls back to `tel:` link

### API Request

```javascript
POST https://dialpad.com/api/v2/calls
Headers:
  Authorization: Bearer {user_access_token}
  Content-Type: application/json
Body:
{
  "to_number": "+15551234567",
  "external_id": "deal_123" // optional
}
```

### Response

```json
{
  "id": "call_xyz123",
  "to_number": "+15551234567",
  "status": "initiated",
  "created_at": "2024-01-01T12:00:00Z"
}
```

## Benefits of API Approach

✅ **No Desktop App Launch** - Calls initiate on user's active Dialpad device  
✅ **No Popups Required** - Direct API call, no windows/iframes  
✅ **Better Control** - Full programmatic control over calls  
✅ **Automatic Logging** - Call ID returned for tracking  
✅ **Device Flexibility** - Works with web, mobile, or desktop Dialpad  
✅ **CORS Compliant** - Standard API calls, no iframe issues  

## User Experience

### When User Clicks "Call":

1. **If Dialpad Connected:**
   - API call initiates immediately
   - User's Dialpad rings on their active device
   - Could be: Dialpad web app, mobile app, or desktop app
   - Toast notification: "Call Initiated - Calling +1234567890 via Dialpad"

2. **If Not Connected:**
   - Falls back to system dialer
   - Opens `tel:` link
   - Toast notification: "Opening Phone - Calling +1234567890..."

3. **If API Fails:**
   - Automatic fallback to `tel:` link
   - User sees standard phone dialer

## Required Scopes

Your Dialpad OAuth app must have these scopes:
- `calls.write` - To initiate calls
- `calls.read` - To read call status (optional)
- `user.read` - To identify the user

## Setup

### 1. Verify OAuth Scopes

Check your Dialpad Developer Portal:
- Go to your app settings
- Ensure `calls.write` scope is enabled
- If not, add it and have users reconnect

### 2. User Connection

Users must connect Dialpad via OAuth:
- Settings → Integrations → Connect Dialpad
- Authorize with required scopes
- Token stored in `dialpad_tokens` table

### 3. Active Dialpad Session

Users need Dialpad running somewhere:
- **Option 1**: Dialpad web app open in browser
- **Option 2**: Dialpad mobile app on phone
- **Option 3**: Dialpad desktop app running
- **Option 4**: Dialpad connected via desk phone

The API call will ring on whichever device is active.

## Testing

### Test the Integration

1. **Connect Dialpad** via OAuth
2. **Open Dialpad** (web, mobile, or desktop)
3. **Click "Call"** on any contact/deal
4. **Expected**: Your Dialpad device rings
5. **Answer** and make the call
6. **Check**: Call logged in CRM database

### Troubleshooting

**Call Not Ringing:**
- Check user has active Dialpad session
- Verify OAuth scopes include `calls.write`
- Check browser console for API errors
- Ensure access token hasn't expired

**API Error "Forbidden":**
- OAuth token missing `calls.write` scope
- Have user reconnect Dialpad with updated scopes

**API Error "Unauthorized":**
- Access token expired
- User needs to reconnect Dialpad

**Falls Back to tel: link:**
- Dialpad not connected
- API call failed (check console)
- No active Dialpad session

## Call Logging

Every call is logged to the `calls` table:

```sql
{
  direction: 'outbound',
  to_number: '+15551234567',
  status: 'initiated',
  started_at: '2024-01-01T12:00:00Z',
  rep_id: 'user_abc',
  related_contact_id: 'contact_123',
  related_deal_id: 'deal_456',
  external_call_id: 'call_xyz' // from Dialpad API
}
```

## Device Behavior

### Where Does The Call Ring?

Dialpad uses "device priority" logic:
1. **Most recently active device** gets the call first
2. **All connected devices** may ring simultaneously
3. User can answer on any device
4. First to answer takes the call

### Common Scenarios:

**Scenario 1: Web Only**
- User has Dialpad web app open
- API call rings in web app
- User answers in browser

**Scenario 2: Mobile + Desktop**
- Both devices connected
- API call rings on both
- User answers whichever is convenient

**Scenario 3: Desk Phone**
- User has physical desk phone connected
- API call rings desk phone
- User picks up handset

## Error Handling

The system has multiple fallback layers:

```
1. Try Dialpad CTI makeCall() 
   ↓ (if available)
2. Try Dialpad API call
   ↓ (if connected)
3. Try tel: link
   ↓ (always works)
4. Show error to user
```

## Security

- **Access Tokens**: Stored securely in database
- **API Calls**: Made from client with user's token
- **Token Refresh**: Handled by OAuth flow
- **Scope Verification**: Required scopes checked at connection time

## Comparison: Old vs New

### Old Approach (Deep Links)
```javascript
// ❌ Opened desktop app
window.location.href = 'dialpad://call?to=+1234567890';
```

### New Approach (API)
```javascript
// ✅ Uses Dialpad API
fetch('https://dialpad.com/api/v2/calls', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ to_number: '+1234567890' })
});
```

## API Documentation

For more details, see:
- [Dialpad API Docs](https://developers.dialpad.com/reference/callspost)
- [OAuth Scopes](https://developers.dialpad.com/docs/oauth#scopes)
- [Call Management](https://developers.dialpad.com/docs/managing-calls)

## Support

If calls still aren't working:

1. **Check console** for API errors
2. **Verify scopes** in Dialpad Developer Portal
3. **Test with Postman** using same API call
4. **Check Dialpad status** at status.dialpad.com
5. **Contact Dialpad support** if API is down

