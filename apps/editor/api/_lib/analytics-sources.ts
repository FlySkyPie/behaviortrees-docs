// Server-side fetchers for the Plausible Stats API and PostHog Query API.
// Used only by the admin dashboard endpoint.

export type PlausibleStats = {
  range30d: {
    visitors: number;
    pageviews: number;
    visitDuration: number;
    bounceRate: number;
  };
  today: { visitors: number; pageviews: number };
  timeseries: { date: string; visitors: number; pageviews: number }[];
  topPages: { page: string; visitors: number }[];
  topSources: { source: string; visitors: number }[];
};

export type PostHogStats = {
  events: { event: string; editor: string; count: number }[];
  daily: { date: string; count: number }[];
  funnel: { event: string; users: number }[];
  retention: {
    d7: { eligible: number; returned: number; rate: number };
    d30: { eligible: number; returned: number; rate: number };
  };
};

type PlausibleRow = { dimensions: (string | number)[]; metrics: number[] };

async function plausibleQuery(body: Record<string, unknown>): Promise<PlausibleRow[]> {
  const apiKey = process.env.PLAUSIBLE_API_KEY;
  const siteId = process.env.PLAUSIBLE_SITE_ID;
  if (!apiKey || !siteId) throw new Error('Plausible is not configured');

  const response = await fetch('https://plausible.io/api/v2/query', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ site_id: siteId, ...body }),
  });
  if (!response.ok) {
    throw new Error(`Plausible query failed (${response.status})`);
  }
  const json = (await response.json()) as { results: PlausibleRow[] };
  return json.results;
}

export async function fetchPlausibleStats(): Promise<PlausibleStats> {
  const [aggregate, today, timeseries, pages, sources] = await Promise.all([
    plausibleQuery({
      date_range: '30d',
      metrics: ['visitors', 'pageviews', 'visit_duration', 'bounce_rate'],
    }),
    plausibleQuery({ date_range: 'day', metrics: ['visitors', 'pageviews'] }),
    plausibleQuery({
      date_range: '30d',
      metrics: ['visitors', 'pageviews'],
      dimensions: ['time:day'],
    }),
    plausibleQuery({
      date_range: '30d',
      metrics: ['visitors'],
      dimensions: ['event:page'],
      pagination: { limit: 8 },
    }),
    plausibleQuery({
      date_range: '30d',
      metrics: ['visitors'],
      dimensions: ['visit:source'],
      pagination: { limit: 8 },
    }),
  ]);

  return {
    range30d: {
      visitors: aggregate[0]?.metrics[0] ?? 0,
      pageviews: aggregate[0]?.metrics[1] ?? 0,
      visitDuration: aggregate[0]?.metrics[2] ?? 0,
      bounceRate: aggregate[0]?.metrics[3] ?? 0,
    },
    today: {
      visitors: today[0]?.metrics[0] ?? 0,
      pageviews: today[0]?.metrics[1] ?? 0,
    },
    timeseries: timeseries.map((row) => ({
      date: String(row.dimensions[0]),
      visitors: row.metrics[0],
      pageviews: row.metrics[1],
    })),
    topPages: pages.map((row) => ({
      page: String(row.dimensions[0]),
      visitors: row.metrics[0],
    })),
    topSources: sources.map((row) => ({
      source: String(row.dimensions[0]),
      visitors: row.metrics[0],
    })),
  };
}

const TRACKED_EVENTS = [
  'example_loaded',
  'tree_created',
  'project_created',
  'project_saved',
  'import',
  'export',
  'custom_node_created',
  'app_session_started',
  'editor_session_started',
  'user_signed_in',
  'cloud_sync_started',
  'cloud_sync_succeeded',
  'cloud_sync_failed',
  'project_became_substantial',
  'activation_completed',
  'pricing_viewed',
  'pricing_cta_clicked',
  'commercial_interest_submitted',
  'commercial_interest_failed',
];

async function posthogQuery(query: string): Promise<unknown[][]> {
  const apiKey = process.env.POSTHOG_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!apiKey || !projectId) throw new Error('PostHog is not configured');

  const response = await fetch(
    `https://us.posthog.com/api/projects/${projectId}/query/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
    }
  );
  if (!response.ok) {
    throw new Error(`PostHog query failed (${response.status})`);
  }
  const json = (await response.json()) as { results: unknown[][] };
  return json.results;
}

export async function fetchPostHogStats(): Promise<PostHogStats> {
  const eventList = TRACKED_EVENTS.map((name) => `'${name}'`).join(',');
  const [events, daily, funnel, retentionRows] = await Promise.all([
    posthogQuery(
      `select event, coalesce(toString(properties.editor), 'unknown') as editor, count() as c
       from events
       where timestamp >= now() - interval 30 day and event in (${eventList})
       group by event, editor
       order by c desc`
    ),
    posthogQuery(
      `select toString(toDate(timestamp)) as day, count() as c
       from events
       where timestamp >= now() - interval 30 day and event in (${eventList})
       group by day
       order by day asc`
    ),
    posthogQuery(
      `select event, count(distinct distinct_id) as users
       from events
       where timestamp >= now() - interval 30 day
         and event in ('app_session_started','activation_completed','pricing_viewed',
                       'pricing_cta_clicked','commercial_interest_submitted',
                       'user_signed_in','cloud_sync_succeeded')
       group by event
       order by users desc`
    ),
    posthogQuery(
      `select distinct_id, event, toString(toDate(timestamp)) as day
       from events
       where timestamp >= now() - interval 70 day
         and event in ('activation_completed','app_session_started')
       group by distinct_id, event, day
       order by day asc
       limit 50000`
    ),
  ]);

  const users = new Map<string, { activatedAt: number | null; sessions: number[] }>();
  for (const row of retentionRows) {
    const id = String(row[0]);
    const event = String(row[1]);
    const day = Date.parse(`${String(row[2])}T00:00:00Z`);
    if (Number.isNaN(day)) continue;
    const user = users.get(id) ?? { activatedAt: null, sessions: [] };
    if (event === 'activation_completed') {
      user.activatedAt =
        user.activatedAt === null ? day : Math.min(user.activatedAt, day);
    } else {
      user.sessions.push(day);
    }
    users.set(id, user);
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const today = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const retention = {
    d7: { eligible: 0, returned: 0, rate: 0 },
    d30: { eligible: 0, returned: 0, rate: 0 },
  };

  for (const user of users.values()) {
    if (user.activatedAt === null) continue;
    const age = Math.floor((today - user.activatedAt) / dayMs);
    const returnedIn = (from: number, through: number) =>
      user.sessions.some((session) => {
        const offset = Math.floor((session - user.activatedAt!) / dayMs);
        return offset >= from && offset <= through;
      });

    if (age >= 13) {
      retention.d7.eligible += 1;
      if (returnedIn(7, 13)) retention.d7.returned += 1;
    }
    if (age >= 35) {
      retention.d30.eligible += 1;
      if (returnedIn(28, 35)) retention.d30.returned += 1;
    }
  }

  retention.d7.rate =
    retention.d7.eligible > 0
      ? (retention.d7.returned / retention.d7.eligible) * 100
      : 0;
  retention.d30.rate =
    retention.d30.eligible > 0
      ? (retention.d30.returned / retention.d30.eligible) * 100
      : 0;

  return {
    events: events.map((row) => ({
      event: String(row[0]),
      editor: String(row[1]),
      count: Number(row[2]),
    })),
    daily: daily.map((row) => ({
      date: String(row[0]),
      count: Number(row[1]),
    })),
    funnel: funnel.map((row) => ({
      event: String(row[0]),
      users: Number(row[1]),
    })),
    retention,
  };
}
