export interface TravelKnowledgeEntry {
  id: string;
  tags: string[];
  guidance: string;
}

export const travelKnowledge: TravelKnowledgeEntry[] = [
  {
    id: 'budget-daily-buffer',
    tags: ['budget', 'money', 'cost', 'all'],
    guidance: 'Keep 10–15% of the trip budget unassigned for transit changes, tips, and spontaneous stops.'
  },
  {
    id: 'hotel-clustering',
    tags: ['hotel', 'route', 'distance', 'all'],
    guidance: 'Group stops near the hotel or home base on the arrival and departure days to reduce backtracking.'
  },
  {
    id: 'hidden-gems',
    tags: ['hidden', 'gems', 'local', 'food', 'history', 'nature'],
    guidance: 'Treat a hidden gem as a well-reviewed place with fewer ratings, and verify its current hours before visiting.'
  },
  {
    id: 'food-reservations',
    tags: ['food', 'restaurant', 'dietary'],
    guidance: 'Check the restaurant’s official menu for dietary needs and reserve popular dinner spots directly.'
  },
  {
    id: 'outdoor-backup',
    tags: ['nature', 'adventure', 'weather'],
    guidance: 'Pair outdoor plans with a nearby indoor backup because weather and trail access can change.'
  },
  {
    id: 'museum-hours',
    tags: ['history', 'museum', 'culture'],
    guidance: 'Confirm timed-entry rules and closing days on the attraction’s official website before the trip.'
  },
  {
    id: 'accessible-routing',
    tags: ['accessibility', 'mobility', 'route'],
    guidance: 'Verify step-free entrances and accessible transit directly with the venue and local transit operator.'
  },
  {
    id: 'pace-breaks',
    tags: ['relaxed', 'family', 'accessibility'],
    guidance: 'Leave at least one flexible break between major activities and avoid scheduling every hour.'
  },
  {
    id: 'booking-safety',
    tags: ['booking', 'tickets', 'all'],
    guidance: 'Use official venue or provider pages for final prices, availability, refunds, and reservations.'
  }
];
