/**
 * CPAGrip Real Offer Feed Configuration
 * Live CPA micro-tasks and monetization feed
 */

export const CPAGRIP_CONFIG = {
  // Your CPAGrip Affiliate ID
  USER_ID: '2562057',

  // Public Access Key (Client-side JSON integration with live geo/IP detection and view tracking)
  PUB_KEY: '91d72ec7105a456434a2f85c9692c1c8',

  // Private Access Key (Server-to-server integration)
  PRIVATE_KEY: '1c71566c97b27f014dee78cd80f800db',

  // Base JSON Feed Endpoint
  BASE_URL: 'https://www.cpagrip.com/common/offer_feed_json.php',

  // Default number of offers to fetch
  DEFAULT_LIMIT: 30,

  /**
   * Builds direct client-side feed URL for the specific user visitor
   * Automatically passes user ID into tracking_id for conversion attribution
   */
  getClientFeedUrl(trackingId: string, limit: number = 30): string {
    const encodedTrackingId = encodeURIComponent(trackingId || '');
    return `${this.BASE_URL}?user_id=${this.USER_ID}&pubkey=${this.PUB_KEY}&tracking_id=${encodedTrackingId}&limit=${limit}`;
  },
};
