export type HomeSettings = {
  rows: number;
  cols: number;
  heroTitle: string;
  heroBanner: string;
};

export type HomeProduct = {
  _id: string;
  name: string;
  category: string;
  price: number;
  imageCover: string;
  availability: string;
};

export const defaultHomeSettings: HomeSettings = {
  rows: 2,
  cols: 4,
  heroTitle: "Featured Plants",
  heroBanner: "/frontend/Home%20Page/landingImage.webp",
};

const clamp = (value: number) => Math.min(6, Math.max(1, value));

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:5000";

export async function getHomeSettingsFromApi(): Promise<HomeSettings> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/home-settings`, {
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      return defaultHomeSettings;
    }

    const payload = (await response.json()) as {
      data?: { settings?: Partial<HomeSettings> };
    };

    const settings = payload.data?.settings;
    if (!settings) {
      return defaultHomeSettings;
    }

    return {
      rows: clamp(Number(settings.rows ?? defaultHomeSettings.rows)),
      cols: clamp(Number(settings.cols ?? defaultHomeSettings.cols)),
      heroTitle: settings.heroTitle ?? defaultHomeSettings.heroTitle,
      heroBanner: settings.heroBanner ?? defaultHomeSettings.heroBanner,
    };
  } catch {
    return defaultHomeSettings;
  }
}

export async function getHomeProducts(limit: number): Promise<HomeProduct[]> {
  try {
    const safeLimit = Math.min(36, Math.max(1, limit));
    const response = await fetch(
      `${getApiBaseUrl()}/api/plants?page=1&limit=${safeLimit}`,
      { next: { revalidate: 120 } },
    );

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      data?: { plants?: HomeProduct[] };
    };
    return payload.data?.plants ?? [];
  } catch {
    return [];
  }
}
