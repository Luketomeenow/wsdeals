# Stage Mapping Reference

## Exact Database Enum Values

These are the ONLY valid values that can be stored in the `deals.stage` column:

### Base Enum (from initial migration)
- `not contacted`
- `no answer / gatekeeper`
- `decision maker`
- `nurturing`
- `interested`
- `strategy call booked`
- `strategy call attended`
- `proposal / scope`
- `closed won`
- `closed lost`

### Extended Enum (from migrations)
- `uncontacted`
- `dm connected`
- `not qualified`
- `not interested`
- `bizops audit agreement sent`
- `bizops audit paid / booked`
- `bizops audit attended`
- `ms agreement sent`
- `balance paid / deal won`
- `onboarding call booked`
- `onboarding call attended`
- `active client (operator)`
- `active client - project in progress`
- `paused client`
- `candidate replacement`
- `project rescope / expansion`
- `active client - project maintenance`
- `cancelled / completed`

## Spreadsheet to Database Mapping

### "No Answer/Gatekeeper" Variants
All these map to: `no answer / gatekeeper`
- "No Answer/Gatekeeper"
- "No Answers/Gatekeeper"
- "No Answer-Gatekeeper"
- "No Answers-Gatekeeper"
- "Gatekeeper"

### "Not Qualified/Disqualified" Variants
All these map to: `not qualified`
- "Not Qualified/Disqualified"
- "Not Qualified-Disqualified"
- "Disqualified"

### "Do Not Call" Variants
All these map to: `not interested`
- "Do Not Call"
- "Do not call"
- "DNC"

## Important Notes

1. The normalization function first converts to lowercase and trims
2. Then it replaces `/` or `-` with ` / ` (space-slash-space)
3. Then it looks up in the mapping table
4. If not found, falls back to `not contacted` as safe default

## Testing

When bulk uploading, check browser console for:
```
[BulkImport] ✓ Stage mapped correctly: { original: "...", canonical: "...", valid: true }
```

When dragging deals, check browser console for:
```
[DragDrop] Updating deal stage: { displayLabel: "...", normalized: "...", willSaveTo: "..." }
[DragDrop] Successfully updated stage
```

