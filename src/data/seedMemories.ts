import type { JournalEntry } from '../types';

export const SAMPLE_MEMORIES_DATA: Omit<JournalEntry, 'id' | 'userId'>[] = [
  {
    title: 'Sunrise Walk at Miramar Beach, Goa',
    rawContent: 'Woke up at 5:45 AM to catch the quiet dawn over Miramar Beach in Goa. The tide was pulling back, leaving glassy sand reflecting the morning pastel pink and amber sky. There was a gentle breeze and just a few local fishermen hauling in their morning nets. Felt an overwhelming sense of stillness and presence that I have not felt in months. Promised myself to maintain this morning routine even once I return to Bangalore.',
    createdAt: '2024-09-06T06:15:00.000Z',
    updatedAt: '2024-09-06T06:15:00.000Z',
    location: {
      placeName: 'Miramar Beach, Panaji, Goa',
      lat: 15.4833,
      lng: 73.8083,
      address: 'Miramar, Panaji, Goa, India',
    },
    media: [
      {
        id: 'med-goa-1',
        name: 'miramar-dawn.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
        size: 145000,
        createdAt: '2024-09-06T06:20:00.000Z',
      }
    ],
    aiInterpretation: {
      summary: 'Serene sunrise walk along Miramar beach in Goa creating deep inner peace and a commitment to maintain early morning mindfulness rituals.',
      emotions: ['peaceful', 'grounded', 'grateful', 'rejuvenated'],
      people: ['local fishermen'],
      places: ['Miramar Beach', 'Goa', 'Bangalore'],
      events: ['Morning sunrise walk', 'Goa coastal getaway'],
      topics: ['Mindfulness', 'Morning habits', 'Nature', 'Mental clarity'],
      ideas: ['Establish 6 AM morning walking habit after returning home'],
      goals: ['Wake up early 5 days a week', 'Disconnect from screens before breakfast'],
      openLoops: [
        {
          id: 'loop-goa-1',
          title: 'Establish 6 AM morning walking habit consistently',
          sourceEntryId: 'seed',
        }
      ],
      generatedAt: '2024-09-06T06:25:00.000Z',
      isAiDerived: true,
    },
    isFavorite: true,
  },
  {
    title: 'Coffee & Product Architecture with Priya at Third Wave',
    rawContent: 'Met Priya at Third Wave Coffee Roasters in Indiranagar. We spent almost three hours sketching distributed systems on paper napkins. We argued over event sourcing vs transactional outbox for the audit log service. Priya gave brilliant feedback on simplifying our state machines and warned against premature optimization before our first 10,000 active users. Need to follow up with a concrete design doc on Monday.',
    createdAt: '2025-03-14T15:30:00.000Z',
    updatedAt: '2025-03-14T15:30:00.000Z',
    location: {
      placeName: 'Third Wave Coffee, Indiranagar, Bengaluru',
      lat: 12.9784,
      lng: 77.6408,
      address: '100 Feet Rd, Indiranagar, Bengaluru, Karnataka',
    },
    media: [
      {
        id: 'med-coffee-1',
        name: 'coffee-napkin-sketch.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
        size: 128000,
        createdAt: '2025-03-14T15:35:00.000Z',
      }
    ],
    aiInterpretation: {
      summary: 'Deep architectural working session with Priya over coffee discussing distributed systems, transaction management, and practical engineering milestones.',
      emotions: ['stimulated', 'focused', 'energized', 'collaborative'],
      people: ['Priya'],
      places: ['Third Wave Coffee', 'Indiranagar', 'Bengaluru'],
      events: ['Tech brainstorm session'],
      topics: ['Software architecture', 'Event sourcing', 'Startup engineering', 'Simplicity'],
      ideas: ['Use simple outbox pattern instead of full Kafka cluster initially'],
      goals: ['Ship MVP design doc by next Monday'],
      openLoops: [
        {
          id: 'loop-arch-1',
          title: 'Draft architectural design doc on transactional outbox pattern by Monday',
          sourceEntryId: 'seed',
        }
      ],
      generatedAt: '2025-03-14T15:40:00.000Z',
      isAiDerived: true,
    },
    isFavorite: false,
  },
  {
    title: 'Rainy Afternoon Reading at Cubbon Park',
    rawContent: 'Escaped the laptop screen and spent two hours under the giant bamboo groves in Cubbon Park reading Cal Newport\'s Deep Work. Sudden drizzle started around 4 PM, filling the air with the unmistakable petrichor scent of wet red soil. Felt a reassuring realization: most urgent notifications are completely inconsequential in the long run. My best thinking only happens when I am inaccessible.',
    createdAt: '2025-07-22T16:00:00.000Z',
    updatedAt: '2025-07-22T16:00:00.000Z',
    location: {
      placeName: 'Cubbon Park, Bengaluru',
      lat: 12.9763,
      lng: 77.5929,
      address: 'Kasturba Road, Bengaluru, Karnataka',
    },
    media: [
      {
        id: 'med-cubbon-1',
        name: 'cubbon-trees.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
        size: 165000,
        createdAt: '2025-07-22T16:05:00.000Z',
      }
    ],
    aiInterpretation: {
      summary: 'Quiet afternoon reading Deep Work in Cubbon Park during a monsoon shower, reinforcing the necessity of digital minimalism and unplugged deep thought.',
      emotions: ['calm', 'reflective', 'unplugged', 'inspired'],
      people: ['Cal Newport (author)'],
      places: ['Cubbon Park', 'Bengaluru'],
      events: ['Afternoon reading escape'],
      topics: ['Deep work', 'Digital detox', 'Solitude', 'Reading'],
      ideas: ['Block off 9 AM to 12 PM every Tuesday and Thursday with zero Slack notifications'],
      goals: ['Finish Deep Work chapter 3', 'Schedule weekly focus blocks in calendar'],
      openLoops: [
        {
          id: 'loop-focus-1',
          title: 'Implement 3-hour phone-free focus blocks on Tuesday mornings',
          sourceEntryId: 'seed',
        }
      ],
      generatedAt: '2025-07-22T16:10:00.000Z',
      isAiDerived: true,
    },
    isFavorite: true,
  },
  {
    title: 'Autumn Evening in Kyoto Gion District',
    rawContent: 'Walked through the narrow paved stone alleys of Gion as paper lanterns flickered to life. The autumn maple leaves (momiji) had turned vivid scarlet. Stopped at a small tea house near Shirakawa Canal for hojicha and warabi mochi. Felt deeply moved by the centuries of preserved craftsmanship and deliberate slowness in every wooden beam and garden rake pattern.',
    createdAt: '2025-11-12T19:30:00.000Z',
    updatedAt: '2025-11-12T19:30:00.000Z',
    location: {
      placeName: 'Gion District, Kyoto, Japan',
      lat: 35.0037,
      lng: 135.7772,
      address: 'Gion, Higashiyama Ward, Kyoto, Japan',
    },
    media: [
      {
        id: 'med-kyoto-1',
        name: 'kyoto-lanterns.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
        size: 152000,
        createdAt: '2025-11-12T19:35:00.000Z',
      }
    ],
    aiInterpretation: {
      summary: 'Evening exploration of Gion Kyoto surrounded by illuminated lanterns and scarlet autumn foliage, admiring Japanese artisanal craftsmanship and intentional pace of living.',
      emotions: ['awe', 'contemplative', 'wonder', 'serene'],
      people: ['Tea master'],
      places: ['Gion', 'Shirakawa Canal', 'Kyoto', 'Japan'],
      events: ['Autumn journey to Japan'],
      topics: ['Craftsmanship', 'Travel', 'Architecture', 'Culture', 'Slow living'],
      ideas: ['Incorporate wabi-sabi aesthetics and deliberate restraint into software UI design'],
      goals: ['Send postcards to parents from Kyoto central post office'],
      openLoops: [
        {
          id: 'loop-kyoto-1',
          title: 'Send hand-written postcards to family from Kyoto post office',
          sourceEntryId: 'seed',
        }
      ],
      generatedAt: '2025-11-12T19:40:00.000Z',
      isAiDerived: true,
    },
    isFavorite: true,
  },
  {
    title: 'Shipping Our First Production API Milestone',
    rawContent: 'At 11:45 PM tonight, our team executed the zero-downtime deployment for the core v1 API. The latency graph dropped from 320ms to 48ms under mock synthetic load. Everyone on the video call cheered when the health check turned green across all multi-region clusters. It took four weeks of relentless debugging and database index optimization, but seeing it perform flawlessly makes every late hour worth it.',
    createdAt: '2026-01-20T23:45:00.000Z',
    updatedAt: '2026-01-20T23:45:00.000Z',
    location: {
      placeName: 'Koramangala, Bengaluru',
      lat: 12.9352,
      lng: 77.6245,
      address: '80 Feet Road, Koramangala 4th Block, Bengaluru',
    },
    media: [
      {
        id: 'med-ship-1',
        name: 'terminal-green.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
        size: 139000,
        createdAt: '2026-01-20T23:50:00.000Z',
      }
    ],
    aiInterpretation: {
      summary: 'Late night triumphant release of v1 API achieving 48ms latency drop across multi-region clusters with team celebration.',
      emotions: ['proud', 'exhilarated', 'relieved', 'grateful'],
      people: ['Dev team', 'SRE lead'],
      places: ['Koramangala', 'Bengaluru'],
      events: ['Production Release v1.0'],
      topics: ['Software engineering', 'Team accomplishment', 'Milestones', 'Performance'],
      ideas: ['Write engineering blog post about our database latency tuning experience'],
      goals: ['Treat the engineering team to celebratory lunch on Friday'],
      openLoops: [
        {
          id: 'loop-prod-1',
          title: 'Write retrospective tech blog post on database query optimization',
          sourceEntryId: 'seed',
        }
      ],
      generatedAt: '2026-01-20T23:55:00.000Z',
      isAiDerived: true,
    },
    isFavorite: false,
  },
  {
    title: 'Hike to Arthur\'s Seat in Mahabaleshwar',
    rawContent: 'Woke up at 6 AM for the mountain trek to Arthur\'s Seat viewpoint in Mahabaleshwar. Dense mist veiled the Sahyadri valley until 9 AM when the sunlight pierced through, unveiling dramatic 600-meter cliffs and the ribbon-like Savitri river below. Caught up with Vikram on long-term family plans and investing principles. Physical exertion in cool mountain air cleanses mental fog better than anything else.',
    createdAt: '2026-04-18T10:30:00.000Z',
    updatedAt: '2026-04-18T10:30:00.000Z',
    location: {
      placeName: 'Arthur\'s Seat, Mahabaleshwar, Maharashtra',
      lat: 17.9856,
      lng: 73.6127,
      address: 'Arthur\'s Seat Point, Mahabaleshwar, Maharashtra 412806',
    },
    media: [
      {
        id: 'med-trek-1',
        name: 'sahyadri-cliffs.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
        size: 158000,
        createdAt: '2026-04-18T10:35:00.000Z',
      }
    ],
    aiInterpretation: {
      summary: 'Morning trek to Arthur\'s Seat in Mahabaleshwar overlooking Sahyadri ravines, having meaningful discussions on life and investment values with Vikram.',
      emotions: ['invigorated', 'inspired', 'adventurous', 'bonded'],
      people: ['Vikram'],
      places: ['Mahabaleshwar', 'Arthur\'s Seat', 'Savitri River', 'Maharashtra'],
      events: ['Mountain trek'],
      topics: ['Hiking', 'Friendship', 'Investments', 'Nature', 'Mental health'],
      ideas: ['Plan one multi-day wilderness trek every quarter'],
      goals: ['Review index fund monthly allocation with Vikram\'s checklist'],
      openLoops: [
        {
          id: 'loop-trek-1',
          title: 'Review quarterly automated index fund allocations',
          sourceEntryId: 'seed',
        }
      ],
      generatedAt: '2026-04-18T10:40:00.000Z',
      isAiDerived: true,
    },
    isFavorite: true,
  },
  {
    title: 'Reflections on Simplicity & Eliminating Commitments',
    rawContent: 'Reviewed my personal task boards and calendar commitments today. Realized that almost 40% of meetings and obligations were things I agreed to out of politeness rather than genuine conviction or mutual value. Going to practice the "Hell Yeah or No" rule from Derek Sivers. Declining three non-essential networking calls this week created 6 hours of focused creative time.',
    createdAt: '2026-08-15T18:00:00.000Z',
    updatedAt: '2026-08-15T18:00:00.000Z',
    location: {
      placeName: 'Home Workspace, Bengaluru',
      lat: 12.9716,
      lng: 77.5946,
      address: 'Bengaluru, Karnataka, India',
    },
    aiInterpretation: {
      summary: 'Strategic personal audit pruning non-essential commitments using the "Hell Yeah or No" rule to reclaim 6 hours of creative focus weekly.',
      emotions: ['liberated', 'decisive', 'protective', 'focused'],
      people: ['Derek Sivers (author)'],
      places: ['Bengaluru'],
      events: ['Mid-year priority audit'],
      topics: ['Time management', 'Essentialism', 'Boundaries', 'Creative focus'],
      ideas: ['Audit calendar on the 1st of every month to decline low-leverage requests'],
      goals: ['Protect 20 hours of maker time every week'],
      openLoops: [
        {
          id: 'loop-audit-1',
          title: 'Conduct monthly calendar audit on the first Sunday of each month',
          sourceEntryId: 'seed',
        }
      ],
      generatedAt: '2026-08-15T18:05:00.000Z',
      isAiDerived: true,
    },
    isFavorite: false,
  }
];
