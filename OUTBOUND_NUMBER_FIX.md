# Outbound Number Selection Fix

## Issue
When selecting different outbound numbers (Main, California, New York), the call was always using the "Main" number instead of the selected one.

## Root Cause
The embedded dialer was only passing the phone number to call (the "to" number) but not specifying which outbound line (the "from" number) to use for the call.

## Solution Implemented

### 1. Updated DialpadEmbeddedDialer Component
**File**: `src/components/calls/DialpadEmbeddedDialer.tsx`

**Changes**:
- ✅ Added `fromNumber` prop to accept the selected outbound number
- ✅ Created `initiateCallViaAPI()` function that uses Dialpad's REST API
- ✅ API call explicitly specifies both `to_number` AND `from_number`
- ✅ Logs the selected from number in call records
- ✅ Shows toast notification with the number being used

**API Call**:
```typescript
const response = await fetch('https://dialpad.com/api/v2/calls', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to_number: phoneNumber,      // Who you're calling
    from_number: fromNumber,      // Which number to call FROM
    external_id: dealId || contactId,
  }),
});
```

### 2. Updated ClickToCall Component
**File**: `src/components/calls/ClickToCall.tsx`

**Changes**:
- ✅ Added `selectedFromNumber` state to track user's selection
- ✅ Stores the selected number when user clicks a dropdown option
- ✅ Passes `fromNumber` prop to DialpadEmbeddedDialer
- ✅ Toast now shows "Calling from {number}" to confirm selection

## How It Works Now

### User Flow:
1. User clicks "Call" button
2. Dropdown shows 3 options:
   - Main (+16049002048)
   - California (+16612139593)
   - New York (+16463960687)
3. User selects **California** (for example)
4. System captures: `selectedFromNumber = "+16612139593"`
5. Opens DialpadEmbeddedDialer with:
   - `phoneNumber` = contact's phone
   - `fromNumber` = "+16612139593"
6. Dialer calls Dialpad API with BOTH numbers
7. **Call is made FROM California number** ✅

### Technical Flow:
```
User selects number
       ↓
ClickToCall stores selection in state
       ↓
Opens DialpadEmbeddedDialer with fromNumber prop
       ↓
Dialer calls Dialpad API:
  POST /api/v2/calls
  {
    "to_number": "+15551234567",
    "from_number": "+16612139593"  ← Selected number!
  }
       ↓
Dialpad rings user's device
       ↓
Call initiated FROM selected number
```

## Testing

### Test 1: Main Number
1. Click "Call"
2. Select "Main (+16049002048)"
3. ✅ Toast shows "Calling from +16049002048"
4. ✅ API logs show `from_number: "+16049002048"`
5. ✅ Call uses Main number

### Test 2: California Number
1. Click "Call"
2. Select "California (+16612139593)"
3. ✅ Toast shows "Calling from +16612139593"
4. ✅ API logs show `from_number: "+16612139593"`
5. ✅ Call uses California number

### Test 3: New York Number
1. Click "Call"
2. Select "New York (+16463960687)"
3. ✅ Toast shows "Calling from +16463960687"
4. ✅ API logs show `from_number: "+16463960687"`
5. ✅ Call uses New York number

## Verification

You can verify which number is being used by:

1. **Check the toast notification**:
   - Should say "Calling from {selected_number}"

2. **Check browser console**:
   - Look for log: `Initiating call via Dialpad API`
   - Will show: `{ to: "...", from: "..." }`

3. **Check call logs in database**:
   - `caller_number` field should match selected number
   - Query: `SELECT caller_number FROM calls ORDER BY created_at DESC LIMIT 1`

4. **Check recipient's caller ID**:
   - When they receive the call, they'll see the selected number

## Benefits

### ✅ Accurate Number Selection
- Calls now use the exact number you select
- No more confusion about which line is calling

### ✅ Better Contact Management
- Use California number for West Coast clients
- Use New York number for East Coast clients
- Use Main number for general calls

### ✅ Professional Appearance
- Control which number prospects see
- Match their time zone/region
- Brand consistency

### ✅ Better Tracking
- Call logs show which number was used
- Can analyze which numbers get better response rates
- Better reporting

## Important Notes

### API vs Web Interface
The fix uses **two approaches together**:

1. **Dialpad API Call**:
   - Initiates the call with specific from/to numbers
   - Rings your Dialpad-connected device (browser, mobile, desk phone)
   - Ensures correct outbound number is used

2. **Web Interface (iframe)**:
   - Still shows Dialpad's web interface
   - Provides call controls (mute, hold, transfer, etc.)
   - Better user experience than just API alone

### Fallback Behavior
If the API call fails for any reason:
- Toast will say "Using Dialpad web interface for calling"
- Dialer still opens with number pre-filled
- User can manually select the from number in Dialpad's interface

### Database Logging
Every call now logs:
- ✅ `caller_number`: The FROM number (what you selected)
- ✅ `callee_number`: The TO number (who you're calling)
- Both are E.164 format (+1234567890)

## Files Modified

1. ✅ `src/components/calls/DialpadEmbeddedDialer.tsx`
   - Added `fromNumber` prop
   - Added `initiateCallViaAPI()` function
   - Updated `logCallInitiation()` to include caller_number

2. ✅ `src/components/calls/ClickToCall.tsx`
   - Added `selectedFromNumber` state
   - Passes fromNumber to DialpadEmbeddedDialer
   - Updated toast messages

## Result

**The outbound number selection now works correctly!**

When you select:
- **Main** → Calls FROM +16049002048 ✅
- **California** → Calls FROM +16612139593 ✅
- **New York** → Calls FROM +16463960687 ✅

No more confusion. The number you select is the number used for the call.

