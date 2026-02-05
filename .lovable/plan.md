

# Morning Briefing - Unified System

## Status: ✅ Complete

The Morning Briefing Lab has been upgraded to be the unified Morning Briefing page, incorporating all features from the original settings-based system.

## Features Integrated

### Scheduling & Delivery (from old briefing)
- ✅ Default Wake Time
- ✅ Evening Reminder Time  
- ✅ Timezone selection
- ✅ Reminder Method (SMS, Call, Both)
- ✅ Weekend Briefings toggle
- ✅ SMS Delivery toggle with phone validation

### Content Customization (from Lab)
- ✅ Weather Location (zip code + geolocation)
- ✅ Voice selection (8 ElevenLabs voices)
- ✅ Max Duration slider (2-10 min)
- ✅ News Categories with depth controls (Off/Brief/Full)
  - Sports (ESPN + The Athletic)
  - Tech/AI (Hacker News + TechCrunch)
  - Business (Bloomberg + Yahoo Finance)
  - Trading/Markets (Bloomberg + MarketWatch)
  - Politics (Reuters + AP News)
  - Science (Phys.org + ScienceDaily)
  - Health (Healthline + Medical News Today)
  - Film/TV (Variety + Deadline)
  - Music (Pitchfork + Billboard)
  - Gaming (IGN + Kotaku)
  - Books (BookRiot)
- ✅ Extras toggles (Short Scout, Weather, Calendar, Monthly Intention)
- ✅ Custom Topics freeform input
- ✅ Generate Briefing button with live preview

## Navigation Updates
- ✅ Announcement bar links to `/morning-briefing` 
- ✅ Morning Briefing added to user dropdown menu
- ✅ Settings page links to `/morning-briefing` for configuration

## Technical Notes
- Uses both `briefing_preferences` table (scheduling) and `briefing_lab_preferences` table (content)
- Location synced to both tables for weather in automation
- Browserless-first news scraping (see previous plan for source details)
