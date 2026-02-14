/**
 * VirtualDJ Network Control Plugin API Client
 *
 * Communicates with VirtualDJ via its HTTP API running on the KJ's local machine.
 * The Network Control Plugin exposes two endpoints:
 *   GET /query?script=<VDJscript>   — returns plain text result
 *   GET /execute?script=<VDJscript> — returns "true" or "false"
 *
 * Docs: https://www.virtualdj.com/wiki/NetworkControlPlugin.html
 */

export interface VDJConfig {
  host: string;
  port: number;
  password?: string;
}

export interface VDJNowPlaying {
  title: string;
  artist: string;
  position: number; // seconds
  length: number; // seconds
  isPlaying: boolean;
  bpm: number;
  key: string;
}

const DEFAULT_CONFIG: VDJConfig = {
  host: "127.0.0.1",
  port: 80,
};

function buildUrl(config: VDJConfig, endpoint: "query" | "execute", script: string): string {
  const base = `http://${config.host}:${config.port}`;
  const params = new URLSearchParams({ script });
  if (config.password) {
    params.set("bearer", config.password);
  }
  return `${base}/${endpoint}?${params.toString()}`;
}

async function vdjQuery(config: VDJConfig, script: string): Promise<string> {
  const url = buildUrl(config, "query", script);
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`VDJ query failed: ${res.status}`);
  return (await res.text()).trim();
}

async function vdjExecute(config: VDJConfig, script: string): Promise<boolean> {
  const url = buildUrl(config, "execute", script);
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`VDJ execute failed: ${res.status}`);
  const text = (await res.text()).trim();
  return text === "true";
}

/**
 * Test connection to VirtualDJ. Returns version string on success.
 */
export async function testConnection(
  config: VDJConfig = DEFAULT_CONFIG
): Promise<{ success: boolean; version?: string; error?: string }> {
  try {
    const version = await vdjQuery(config, "get_version");
    return { success: true, version };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

/**
 * Get the currently playing track info from VirtualDJ.
 */
export async function getNowPlaying(
  config: VDJConfig = DEFAULT_CONFIG
): Promise<VDJNowPlaying | null> {
  try {
    const [title, artist, position, length, bpm, key] = await Promise.all([
      vdjQuery(config, "get_title"),
      vdjQuery(config, "get_artist"),
      vdjQuery(config, "get_position"),
      vdjQuery(config, "get_songlength"),
      vdjQuery(config, "get_bpm").catch(() => "0"),
      vdjQuery(config, "get_key").catch(() => ""),
    ]);

    // Check if anything is loaded
    if (!title && !artist) return null;

    // VDJ returns position as a decimal (0.0 to 1.0 of total length)
    const lengthSec = parseFloat(length) || 0;
    const positionRatio = parseFloat(position) || 0;
    const positionSec = positionRatio * lengthSec;

    // Check if playing by querying elapsed time changes (or use loaded state)
    let isPlaying = false;
    try {
      const loaded = await vdjQuery(config, "deck 1 get_loaded");
      isPlaying = loaded === "1" || loaded === "true";
      if (isPlaying) {
        // Double check by seeing if it's actually moving
        const firstPos = positionRatio;
        await new Promise((r) => setTimeout(r, 100));
        const secondPos = parseFloat(await vdjQuery(config, "get_position")) || 0;
        isPlaying = Math.abs(secondPos - firstPos) > 0.0001;
      }
    } catch {
      // Fall back to assuming playing if we got track data
      isPlaying = lengthSec > 0 && positionSec < lengthSec;
    }

    return {
      title,
      artist,
      position: positionSec,
      length: lengthSec,
      isPlaying,
      bpm: parseFloat(bpm) || 0,
      key,
    };
  } catch {
    return null;
  }
}

/**
 * Search VirtualDJ's library for a track and load it to deck 1.
 */
export async function searchAndLoad(
  config: VDJConfig,
  title: string,
  artist: string
): Promise<boolean> {
  try {
    // Use browser_search to find the track in VDJ's library
    const query = `${artist} ${title}`.replace(/'/g, "\\'");
    await vdjExecute(config, `browser_search '${query}'`);

    // Small delay to let VDJ process the search
    await new Promise((r) => setTimeout(r, 500));

    // Load the first search result to deck 1
    const loaded = await vdjExecute(config, "deck 1 browser_loaded_song");
    return loaded;
  } catch {
    return false;
  }
}

/**
 * Load a specific file path into deck 1.
 */
export async function loadFile(config: VDJConfig, filepath: string): Promise<boolean> {
  try {
    const escaped = filepath.replace(/'/g, "\\'");
    return await vdjExecute(config, `deck 1 load '${escaped}'`);
  } catch {
    return false;
  }
}

/**
 * Play the current deck.
 */
export async function play(config: VDJConfig): Promise<boolean> {
  try {
    return await vdjExecute(config, "play");
  } catch {
    return false;
  }
}

/**
 * Pause the current deck.
 */
export async function pause(config: VDJConfig): Promise<boolean> {
  try {
    return await vdjExecute(config, "pause");
  } catch {
    return false;
  }
}

/**
 * Remove vocals using AI stems separation.
 */
export async function muteVocals(config: VDJConfig): Promise<boolean> {
  try {
    return await vdjExecute(config, "stem 'vocal' mute");
  } catch {
    return false;
  }
}

/**
 * Restore vocals (undo stems separation).
 */
export async function unmuteVocals(config: VDJConfig): Promise<boolean> {
  try {
    return await vdjExecute(config, "stem 'vocal' unmute");
  } catch {
    return false;
  }
}

/**
 * Get the volume level (0-100).
 */
export async function getVolume(config: VDJConfig): Promise<number> {
  try {
    const vol = await vdjQuery(config, "get_volume");
    return Math.round(parseFloat(vol) * 100) || 0;
  } catch {
    return 0;
  }
}

/**
 * Set the volume level (0-100).
 */
export async function setVolume(config: VDJConfig, level: number): Promise<boolean> {
  try {
    const normalized = Math.max(0, Math.min(100, level)) / 100;
    return await vdjExecute(config, `volume ${normalized}`);
  } catch {
    return false;
  }
}

/**
 * Check if a track has finished playing (position near end).
 */
export function isTrackFinished(nowPlaying: VDJNowPlaying): boolean {
  if (!nowPlaying.isPlaying) return false;
  if (nowPlaying.length <= 0) return false;
  // Consider finished when within 2 seconds of the end
  return nowPlaying.position >= nowPlaying.length - 2;
}

export { DEFAULT_CONFIG };
