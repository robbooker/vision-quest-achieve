
# Trip Logistics Tracking - Implementation Plan

## Overview
Add the ability to log and retrieve travel logistics (hotels, flights, car rentals, etc.) for any trip. All logistics data will be embedded into the vector memory system, making it searchable via SMS/Voice with Toasty.

---

## What You'll Be Able to Ask Toasty

- "What is my flight number for my trip to Atlanta?"
- "What hotel am I staying at in Miami?"
- "What's the confirmation number for my rental car?"
- "When does my flight to Denver leave?"
- "What's the address of my hotel in Nashville?"

---

## Logistics Categories to Track

### 1. Stay/Accommodation
- **Property name** (hotel, Airbnb, etc.)
- **Address**
- **Check-in / Check-out dates & times**
- **Confirmation number**
- **Contact phone**
- **Notes** (room type, parking info, amenities, etc.)

### 2. Flights (if `has_flight` is true)
- **Airline**
- **Flight number**
- **Departure airport & time**
- **Arrival airport & time**
- **Confirmation/record locator**
- **Seat assignment**
- **Notes** (layovers, terminal info, etc.)
- Support for **multiple legs** (outbound, return, connections)

### 3. Car Rental
- **Company**
- **Pickup location & time**
- **Dropoff location & time**
- **Confirmation number**
- **Vehicle type** (if known)
- **Notes**

### 4. Other Transportation
- **Type** (train, shuttle, Uber reservation, ferry, etc.)
- **Provider/service**
- **Time & location details**
- **Confirmation number**
- **Notes**

### 5. Activities/Reservations (optional, nice to have)
- Restaurant reservations
- Tours/excursions
- Event tickets
- Spa appointments
- Each with: name, date/time, confirmation, address, notes

---

## Technical Implementation

### Database Changes

**New table: `trip_logistics`**
```text
id              UUID (primary key)
trip_id         UUID (foreign key to trips)
user_id         UUID (for RLS)
logistics_type  TEXT (stay, flight, car_rental, transportation, activity)
provider_name   TEXT (hotel name, airline, rental company)
confirmation_code TEXT
start_datetime  TIMESTAMPTZ (check-in, departure, pickup)
end_datetime    TIMESTAMPTZ (check-out, arrival, dropoff)
start_location  TEXT (address, airport code)
end_location    TEXT (address, airport code for arrival)
flight_number   TEXT (for flights only)
seat_assignment TEXT (for flights only)
vehicle_type    TEXT (for car rentals)
contact_phone   TEXT
notes           TEXT
metadata        JSONB (for any extra fields)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

RLS: Users can only see/edit their own logistics entries.

### Frontend Changes

**PackingListView Enhancement**
- Add a new "Logistics" tab or accordion section at the top
- Collapsible sections for each logistics type
- Forms to add/edit each type with appropriate fields
- Display confirmation codes prominently
- Quick-copy button for confirmation codes

**New Components**
- `TripLogisticsSection.tsx` - Main container with accordions
- `LogisticsForm.tsx` - Dynamic form that adapts to logistics type
- `LogisticsCard.tsx` - Display card for each entry
- `AddLogisticsDialog.tsx` - Modal for adding new logistics

### Vector Memory Integration

**Embedding Generation**
- Add new source type: `trip_logistics`
- When a logistics entry is saved/updated, generate an embedding
- Content text format example:
  ```
  Atlanta trip flight: Delta DL1234 departing Miami (MIA) Feb 15 at 8:30am, 
  arriving Atlanta (ATL) at 11:45am. Confirmation: ABC123. Seat 12A.
  ```
- Activity date = trip start date (so it clusters with the trip)
- Metadata includes: trip_id, logistics_type, destination

**Twilio Integration**
- Add `get_trip_logistics` tool to both SMS and Voice webhooks
- Tool parameters: destination (optional), logistics_type (optional)
- Searches embeddings first, then falls back to direct query
- Returns formatted, conversational response

---

## User Experience Flow

1. User creates a trip to "Atlanta" (Feb 15-18)
2. Opens the trip and sees the packing list + new "Logistics" section
3. Clicks "Add Flight" → enters Delta DL1234, times, confirmation ABC123
4. Clicks "Add Stay" → enters Marriott Midtown, address, confirmation XYZ789
5. All entries are saved and embedded automatically
6. Later, user texts Toasty: "What's my flight number for Atlanta?"
7. Toasty searches embeddings, finds the match, responds: "Your Atlanta flight is Delta DL1234, departing Miami at 8:30am on Feb 15. Confirmation: ABC123"

---

## Implementation Order

1. Create database table with RLS policies
2. Create hook `useTripLogistics.ts` for CRUD operations
3. Build UI components for the logistics section
4. Add embedding generation on save/update
5. Add Toasty SMS/Voice tool for retrieval
6. Test end-to-end: add logistics → SMS query → verify response
