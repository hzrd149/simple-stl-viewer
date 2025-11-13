/**
 * CORS Proxy Utility
 *
 * Provides utilities for fetching resources through a CORS proxy to bypass
 * CORS restrictions when loading models from external sources.
 */

import { getSettings } from "../services/settings";

// Track hosts that have failed on clear net
const clearNetFailedHosts = new Set<string>();

// Track hosts that have failed through proxy
const proxyFailedHosts = new Set<string>();

/**
 * Creates a proxied URL from a given URL and CORS proxy configuration
 *
 * Supports three proxy URL formats:
 * - With <url> placeholder: "https://proxy.com/<url>"
 * - With <encoded_url> placeholder: "https://proxy.com/<encoded_url>"
 * - Direct concatenation: "https://proxy.com/" + url
 *
 * @param url - The URL to proxy
 * @param corsProxy - Optional CORS proxy URL (uses settings if not provided)
 * @returns The proxied URL or original URL if no proxy is configured
 */
export function createRequestProxyUrl(
  url: URL | string,
  corsProxy?: string,
): string {
  const settings = getSettings();

  // Use provided corsProxy, or fall back to settings
  if (!corsProxy && settings.corsProxy) {
    corsProxy = settings.corsProxy;
  }

  if (!corsProxy) return url.toString();

  const urlString = url.toString();

  if (corsProxy.includes("<url>")) {
    return corsProxy.replace("<url>", urlString);
  } else if (corsProxy.includes("<encoded_url>")) {
    return corsProxy.replace("<encoded_url>", encodeURIComponent(urlString));
  } else {
    return corsProxy.endsWith("/")
      ? corsProxy + urlString
      : corsProxy + "/" + urlString;
  }
}

/**
 * Fetches a resource with automatic CORS proxy fallback
 *
 * Strategy:
 * 1. For .onion/.i2p domains: Try proxy first, fallback to direct
 * 2. For previously failed hosts: Use proxy directly
 * 3. For other hosts: Try direct first, fallback to proxy on failure
 *
 * @param url - The URL to fetch
 * @param opts - Fetch options
 * @param corsProxy - Optional CORS proxy URL (overrides settings)
 * @returns Promise resolving to the Response
 */
export async function fetchWithProxy(
  url: URL | string,
  opts?: RequestInit,
  corsProxy?: string,
): Promise<Response> {
  const settings = getSettings();

  // Use provided corsProxy parameter, or fall back to settings
  const proxyUrl = corsProxy || settings.corsProxy;

  // If no proxy is configured, just use regular fetch
  if (!proxyUrl) {
    return fetch(url, opts);
  }

  const urlObj = typeof url === "string" ? new URL(url) : url;
  const host = urlObj.host;

  // If it's an onion or i2p domain, try the proxy first
  if (
    (host.endsWith(".onion") || host.endsWith(".i2p")) &&
    !proxyFailedHosts.has(host)
  ) {
    try {
      return await fetch(createRequestProxyUrl(url, proxyUrl), opts);
    } catch (e) {
      console.warn(`Proxy failed for ${host}, trying direct connection`, e);
      proxyFailedHosts.add(host);
      return fetch(url, opts);
    }
  }

  // If the clear net request has previously failed, use the proxy
  if (clearNetFailedHosts.has(host)) {
    return fetch(createRequestProxyUrl(url, proxyUrl), opts);
  }

  // Try clear net first and fallback to proxy on failure
  try {
    return await fetch(url, opts);
  } catch (e) {
    console.warn(`Direct fetch failed for ${host}, trying proxy`, e);
    clearNetFailedHosts.add(host);
    return fetch(createRequestProxyUrl(url, proxyUrl), opts);
  }
}

/**
 * Clears the failed hosts cache
 * Useful for testing or when network conditions change
 */
export function clearFailedHostsCache(): void {
  clearNetFailedHosts.clear();
  proxyFailedHosts.clear();
}
