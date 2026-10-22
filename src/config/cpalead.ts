/**
 * CPAlead Live API Configuration
 * Endpoint documentation: https://www.cpalead.com/api
 * Real live publisher credentials
 */

export const CPALEAD_CONFIG = {
  // Publisher Account Details
  PUBLISHER_ID: 3367742,
  API_KEY: 'c0d96f3192ce4440b5f2e65254bb0ee1',

  // Currency & Reward Mapping
  CURRENCY_NAME: 'Points',
  POINTS_PER_USD: 100, // A $1.00 offer shows as 100 Points

  // UI Strings & Branding
  INTERNAL_TITLE: 'Task',
  PUBLIC_HEADLINE: 'Earn rewards by completing offers',
  INSTRUCTIONS: 'Choose an offer, complete the steps, and your rewards will appear here.',
  LOGO_URL: 'https://cdndn.s3.us-west-1.amazonaws.com/tools/offerwall-v2/reward-wall-logo-light-v2.webp',

  DEFAULT_LIMIT: 30,

  /**
   * Build client-side or server-side URL to fetch live CPA/CPI/CPE offers for a specific user
   * Passing `subid={userId}` allows CPAlead to tie completions to the user
   */
  getOffersUrl(userId: string, limit: number = 30): string {
    const cleanUserId = encodeURIComponent(userId || 'guest');
    return `https://www.cpalead.com/api/offers?id=${this.PUBLISHER_ID}&country=user&device=android&subid=${cleanUserId}&limit=${limit}&format=json`;
  },

  /**
   * Build Conversions API URL to check user lead conversions
   */
  getConversionsUrl(subid: string): string {
    const cleanSubid = encodeURIComponent(subid || 'user');
    return `https://www.cpalead.com/api/conversions?id=${this.PUBLISHER_ID}&api_key=${this.API_KEY}&subid=${cleanSubid}&format=json`;
  },

  /**
   * Calculate Points from USD payout
   * Example: $0.08 -> 8 Points, $1.20 -> 120 Points
   */
  usdToPoints(usd: number): number {
    return Math.max(1, Math.round((usd || 0) * this.POINTS_PER_USD));
  },

  /**
   * High-Paying CPAlead Link / File Locker Configuration
   * Tool ID: 67493, Slug: suMfPdJ
   */
  LOCKER: {
    TOOL_ID: '67493',
    TOOL_SLUG: 'suMfPdJ',
    HIGH_PAYING_REWARD_USD: 2.50, // High paying reward ($2.50)
    HIGH_PAYING_POINTS: 250,      // 250 Points
    TITLE: 'VIP Fast-Track: High-Payout Offer Locker',
    DESCRIPTION: 'Complete a quick verified sponsor option to unlock the maximum reward ($2.50 / 250 Points).',

    /**
     * Get direct locker URL for mobile visitors
     */
    getDirectUrl(userId: string): string {
      const cleanSubid = encodeURIComponent(userId || 'guest');
      return `https://www.fastsvr.com/unlock/suMfPdJ?publisherUserId=3367742&subid=${cleanSubid}`;
    },
  },
};
