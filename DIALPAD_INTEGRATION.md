# Dialpad API Integration Documentation

## Overview

This CRM integrates with Dialpad's API to provide comprehensive call management, click-to-call functionality, and automated call logging.

## Features Implemented

### 1. Database Schema

The `calls` table has been extended with Dialpad-specific fields:

- `dialpad_call_id` - Unique identifier from Dialpad
- `recording_url` - URL to call recording
- `transcript` - AI-generated call transcript
- `call_direction` - 'inbound' or 'outbound'
- `caller_number` - Caller's phone number
- `callee_number` - Recipient's phone number
- `call_status` - Current status of the call
- `dialpad_metadata` - Full JSON payload from Dialpad

A `dialpad_webhooks` table tracks webhook events for processing.

### 2. Edge Functions

Three Supabase edge functions handle Dialpad integration:

#### `dialpad-sync`
- **Purpose**: Sync calls from Dialpad to CRM
- **Authentication**: Required (JWT)
- **Usage**: 
  ```typescript
  await supabase.functions.invoke('dialpad-sync', {
    body: {
      limit: 100,
      start_time: '2024-01-01T00:00:00Z',
      end_time: '2024-01-31T23:59:59Z'
    }
  });
  ```

#### `dialpad-webhook`
- **Purpose**: Receive real-time call events from Dialpad
- **Authentication**: Not required (public endpoint)
- **Webhook URL**: `https://qzxuhefnyskdtdfrcrtg.supabase.co/functions/v1/dialpad-webhook`

#### `dialpad-make-call`
- **Purpose**: Initiate calls through Dialpad
- **Authentication**: Required (JWT)
- **Usage**:
  ```typescript
  await supabase.functions.invoke('dialpad-make-call', {
    body: {
      to_number: '+15551234567',
      contact_id: 'uuid',
      deal_id: 'uuid'
    }
  });
  ```

### 3. UI Components

#### `ClickToCall`
Reusable component for initiating calls from anywhere in the CRM:

```tsx
<ClickToCall 
  phoneNumber="+15551234567"
  contactId="uuid"
  dealId="uuid"
  variant="outline"
  size="sm"
/>
```

**Props:**
- `phoneNumber` (required) - Phone number to call
- `contactId` (optional) - Associate call with contact
- `dealId` (optional) - Associate call with deal
- `companyId` (optional) - Associate call with company
- `variant` - Button variant
- `size` - Button size
- `showIcon` - Show/hide phone icon
- `label` - Custom button label

#### `CallsSyncButton`
Button component for syncing calls from Dialpad:

```tsx
<CallsSyncButton 
  onSyncComplete={() => console.log('Sync done')}
  variant="outline"
/>
```

#### `DialpadStats`
Dashboard widget showing call statistics and Dialpad sync status.

### 4. Hooks

#### `useDialpadSync`
Custom hook for managing Dialpad operations:

```typescript
const { syncing, syncCalls, makeCall } = useDialpadSync();

// Sync calls
await syncCalls({
  limit: 50,
  startTime: '2024-01-01T00:00:00Z'
});

// Make a call
await makeCall('+15551234567', {
  contactId: 'uuid',
  dealId: 'uuid'
});
```

### 5. Integration Points

Click-to-call buttons are available in:
- **Contacts List** - Next to phone numbers
- **Companies List** - Next to company phone numbers
- **Deal Detail Page** - In contact information cards
- **Calls Page** - Manual sync button

## Setup Instructions

### 1. Configure Dialpad API Key

The `DIALPAD_API_KEY` secret must be configured in Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qzxuhefnyskdtdfrcrtg/settings/functions)
2. Add a new secret: `DIALPAD_API_KEY`
3. Enter your Dialpad API key

### 2. Configure Dialpad Webhooks

To receive real-time call events:

1. Log in to your Dialpad admin portal
2. Navigate to Developer Settings
3. Add webhook URL: `https://qzxuhefnyskdtdfrcrtg.supabase.co/functions/v1/dialpad-webhook`
4. Select events to subscribe to:
   - `call.ended`
   - `call.completed`

### 3. Test the Integration

1. **Manual Sync**: Click "Sync Dialpad" button on Calls page
2. **Click-to-Call**: Click phone icon next to any phone number
3. **View Recordings**: Recordings appear in call cards when available
4. **View Transcripts**: AI transcripts display below call details

## API Endpoints

### Dialpad API (v2)

Base URL: `https://dialpad.com/api/v2`

**Get Calls:**
```
GET /calls?limit=100&start_time=2024-01-01T00:00:00Z
Authorization: Bearer YOUR_API_KEY
```

**Make Call:**
```
POST /calls
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "to": "+15551234567",
  "from": "+15559876543",
  "external_id": "deal-123"
}
```

## Data Flow

1. **Outbound Calls**:
   - User clicks call button → `dialpad-make-call` edge function
   - Edge function calls Dialpad API → Dialpad initiates call
   - Call data stored in CRM with `dialpad_call_id`

2. **Inbound/Completed Calls**:
   - Call ends in Dialpad → Webhook sent to `dialpad-webhook`
   - Webhook stores event → Processes call data
   - Call record created/updated in CRM

3. **Manual Sync**:
   - User clicks sync button → `dialpad-sync` edge function
   - Edge function fetches calls from Dialpad API
   - Batch insert/update call records in CRM

## Security Considerations

- API key stored securely in Supabase secrets (never in frontend code)
- JWT authentication required for sync and make-call functions
- Webhook endpoint is public but validates Dialpad signatures
- Row-level security policies protect call data

## Troubleshooting

### Calls Not Syncing

1. Check if `DIALPAD_API_KEY` is configured
2. View edge function logs: [Sync Logs](https://supabase.com/dashboard/project/qzxuhefnyskdtdfrcrtg/functions/dialpad-sync/logs)
3. Verify API key has correct permissions

### Click-to-Call Not Working

1. Check browser console for errors
2. Verify `DIALPAD_API_KEY` is set
3. Ensure phone number is in E.164 format (+1XXXYYYZZZZ)
4. View edge function logs: [Make Call Logs](https://supabase.com/dashboard/project/qzxuhefnyskdtdfrcrtg/functions/dialpad-make-call/logs)

### Webhooks Not Received

1. Verify webhook URL is correct in Dialpad portal
2. Check webhook processing logs: [Webhook Logs](https://supabase.com/dashboard/project/qzxuhefnyskdtdfrcrtg/functions/dialpad-webhook/logs)
3. Ensure events are subscribed in Dialpad settings

## Future Enhancements

Potential improvements for future development:

- **SMS Integration**: Add text messaging capabilities
- **Voicemail Management**: Display and manage voicemails
- **Real-time Call Status**: Show live call status in UI
- **Call Analytics**: Enhanced reporting with Dialpad data
- **Auto-dialer**: Sequential calling from lists
- **Call Recording Player**: In-app playback of recordings
- **Sentiment Analysis**: Analyze call transcripts for sentiment
- **Call Routing**: Smart routing based on deal stage

## Support Resources

- [Dialpad API Documentation](https://developers.dialpad.com/docs/welcome)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Edge Function Logs](https://supabase.com/dashboard/project/qzxuhefnyskdtdfrcrtg/functions)
