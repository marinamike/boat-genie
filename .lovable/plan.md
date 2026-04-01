

## Plan: Update LeadStream empty state message

### Summary
The LeadStream component already only shows open wishes and pending quoted leads — no past quotes section exists. The only change is updating the empty state text.

### Change (`src/components/provider/LeadStream.tsx`)

Update lines 173-176: change the empty state heading and description.

- **Current**: `"No Leads"` / `"New leads matching your services will appear here."`
- **New**: `"No Leads"` / `"No leads matching your service menu right now."`

Single line change, no other modifications needed.

