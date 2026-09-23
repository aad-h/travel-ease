# TravelEase smart planner implementation

## Goal

Expand TravelEase from a saved-places map into a practical, personalized trip planner while keeping the new planning features free to run. The first version is deterministic and local: it does not call a paid LLM, embedding provider, travel-booking API, or any other new billable service.

## Features in this implementation

### Trip preferences

- Total trip budget and currency
- Number of travelers
- Hotel or home base
- Daily start and end times
- Travel pace
- Interests, dietary preferences, accessibility notes, and free-form notes
- A hidden-gems preference

### Local itinerary engine

- Scores selected places against the traveler's interests
- Gives less-popular, well-rated places a hidden-gem boost when requested
- Uses the hotel location as a distance signal when coordinates are available
- Respects relaxed, balanced, and packed daily stop limits
- Distributes selected places across the available trip dates
- Produces morning, afternoon, and evening time slots
- Calculates a simple per-day budget target
- Generates Google Maps and official-booking search links without making API requests

### Retrieval foundation (RAG-ready)

- Retrieves relevant guidance from a small, version-controlled travel knowledge base
- Uses keyword scoring locally; no embeddings or hosted AI are required
- Returns the guidance used by the itinerary so future AI responses can remain grounded
- Can later be upgraded to vector search or a local model without changing the trip data model

### Saved trip experience

- Stores preferences, generated daily itineraries, estimated daily budgets, and retrieved guidance in MongoDB
- Restores preferences when editing an existing trip
- Shows budget, hotel, interests, hidden-gem status, and daily schedules in My Trips

## Cost controls

- The itinerary endpoint is local application code and has no per-request provider cost.
- No OpenAI, Gemini, hosted embedding, hotel, flight, restaurant-booking, or affiliate API is added.
- Itinerary generation never calls Google APIs.
- Google Maps, Places, and Routes remain optional existing features and are only called through their existing user-triggered map/search actions.
- External links are ordinary URLs opened by the user; creating them does not call an API.
- `.env.example` receives no new paid-provider credentials.

## Implementation sequence

1. Add this guide and define the cost boundary.
2. Add typed planner models, local knowledge retrieval, deterministic scoring, scheduling, links, validation, and automated tests.
3. Add the local itinerary API and connect the new preference form to trip creation and persistence.
4. Add saved-itinerary presentation, update documentation, and run tests, type checking, production build, and secret checks.

## Future phases

- Weather-aware alternatives using a free weather source
- Drag-and-drop itinerary editing and route-aware reordering
- Export to calendar and PDF
- Optional local Ollama model for natural-language changes
- Optional vector retrieval when the knowledge base becomes large
- Live hotel, flight, restaurant, or event availability only after a provider and cost policy are explicitly selected

Live prices and booking availability are intentionally out of scope for this no-cost phase. TravelEase will provide useful search and map links without claiming that a price or reservation is current.
