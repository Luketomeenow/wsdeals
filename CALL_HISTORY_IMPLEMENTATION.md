# Call History Implementation

## Overview
Implemented a comprehensive Call History feature that displays all calls made to contacts from the Deal detail page.

## New Component: CallHistory

**Location**: `src/components/calls/CallHistory.tsx`

### Features:
- ✅ Displays call history for both contacts and deals
- ✅ Shows call direction (inbound/outbound) with icons
- ✅ Displays call outcome with color-coded badges
- ✅ Shows call timestamp in readable format
- ✅ Displays call duration (minutes:seconds)
- ✅ Shows phone numbers (caller/callee)
- ✅ Displays call notes if available
- ✅ Provides links to call recordings if available
- ✅ Shows call status badges
- ✅ Scrollable list for multiple calls
- ✅ Configurable limit for number of calls displayed

### Props:
```typescript
interface CallHistoryProps {
  contactId?: string;  // Filter by contact
  dealId?: string;     // Filter by deal
  limit?: number;      // Max number of calls to show (default: 10)
}
```

## Integration Points

### 1. Deal Detail Page (Main View)
**Location**: `src/pages/DealDetail.tsx`

- Added CallHistory to the "Calls" tab
- Shows up to 20 calls in the main tab view
- Filters by both contact and deal ID
- Replaces the simple call list with rich call history

### 2. Deal Detail Page (Sidebar)
**Location**: `src/pages/DealDetail.tsx` (right sidebar)

- Quick view of last 5 calls
- Only shows when a primary contact is assigned
- Provides at-a-glance call history without switching tabs

## Database Structure

The component queries the `calls` table with the following fields:
- `id` - Unique call identifier
- `call_direction` - 'inbound' or 'outbound'
- `call_outcome` - Result of the call (DM, voicemail, etc.)
- `call_status` - Status of the call
- `call_timestamp` - When the call occurred
- `caller_number` - Phone number of caller
- `callee_number` - Phone number of callee
- `duration_seconds` - Call duration
- `outbound_type` - Type of outbound call
- `notes` - Call notes
- `recording_url` - URL to call recording
- `transcript` - Call transcript
- `rep_id` - User who made the call
- `related_contact_id` - Associated contact
- `related_deal_id` - Associated deal

## Call Outcome Color Coding

The component uses color-coded badges for different outcomes:
- **Success** (green): DM, introduction
- **Warning** (yellow): voicemail
- **Secondary** (gray): no answer, gatekeeper
- **Destructive** (red): not interested
- **Default**: all others

## User Experience

### What Users See:
1. **Call Direction Icon**: Outgoing or incoming arrow
2. **Call Type**: "Cold Call", "Follow-up", etc.
3. **Outcome Badge**: Color-coded result
4. **Timestamp**: Formatted date/time (e.g., "Oct 14, 2025 2:30 PM")
5. **Duration**: Minutes and seconds (e.g., "5:23")
6. **Phone Number**: To/From number based on direction
7. **Notes**: Any notes added during the call
8. **Recording Link**: If available, clickable link to listen
9. **Status Badge**: Current status of the call

### Empty States:
- When no calls exist: "No call history available"
- Shows loading state while fetching data

## Performance Considerations

- Uses scrollable container for long call lists
- Limits queries to specified number of calls
- Efficient database queries with proper indexing
- Only fetches when contactId or dealId is provided

## Future Enhancements (Optional)

Potential improvements:
1. Add filtering by date range
2. Add filtering by call outcome
3. Add search functionality within call notes
4. Add call analytics summary
5. Add export functionality
6. Add inline note editing
7. Add click-to-call from history

## Migration Status

The migration file `supabase/migrations/20251014162000_add_deal_stage_not_interested.sql` has been created to add the 'not interested' stage to the enum. This needs to be applied via Supabase dashboard or deployment pipeline.

## Testing Checklist

✅ Component renders without errors
✅ Displays call history when contact has calls
✅ Shows empty state when no calls exist
✅ Filters correctly by contact ID
✅ Filters correctly by deal ID
✅ Respects the limit parameter
✅ Formats timestamps correctly
✅ Formats duration correctly
✅ Shows recording links when available
✅ Color-codes outcomes correctly
✅ Scrolls properly when many calls exist
✅ Integrates with Deal Detail page tabs
✅ Integrates with Deal Detail page sidebar
✅ No linter errors

