package com.xapzap.app

import android.app.Activity
import android.util.Log
import com.facebook.react.bridge.*
import com.inmobi.ads.AdMetaInfo
import com.inmobi.ads.InMobiAdRequestStatus
import com.inmobi.ads.InMobiInterstitial
import com.inmobi.ads.listeners.InterstitialAdEventListener
import com.inmobi.sdk.InMobiSdk
import com.inmobi.sdk.SdkInitializationListener
import org.json.JSONObject

class InMobiModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val TAG = "InMobiModule"
    private var isInitialized = false
    private var activeRewardedAd: InMobiInterstitial? = null
    private var activeInterstitialAd: InMobiInterstitial? = null

    override fun getName(): String {
        return "InMobiModule"
    }

    @ReactMethod
    fun initialize(accountId: String, promise: Promise) {
        val activity: Activity? = currentActivity
        val context = activity ?: reactContext

        UiThreadUtil.runOnUiThread {
            try {
                InMobiSdk.setLogLevel(InMobiSdk.LogLevel.DEBUG)
                Log.d(TAG, "Initializing InMobi SDK with Account ID: $accountId")
                val consent = JSONObject()
                InMobiSdk.init(context, accountId, consent, object : SdkInitializationListener {
                    override fun onInitializationComplete(error: Error?) {
                        if (error == null) {
                            Log.d(TAG, "InMobi SDK Initialized Successfully for account: $accountId")
                            isInitialized = true
                            promise.resolve(true)
                        } else {
                            Log.e(TAG, "InMobi SDK Init Failed: ${error.message}")
                            promise.reject("INIT_FAILED", error.message)
                        }
                    }
                })
            } catch (e: Exception) {
                Log.e(TAG, "InMobi SDK Init Exception: ${e.message}", e)
                promise.reject("INIT_EXCEPTION", e.message)
            }
        }
    }

    @ReactMethod
    fun isInitialized(promise: Promise) {
        promise.resolve(isInitialized)
    }

    @ReactMethod
    fun preloadRewarded(placementIdStr: String, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }

        val placementId = placementIdStr.toLongOrNull() ?: 10000844851L

        UiThreadUtil.runOnUiThread {
            try {
                if (activeRewardedAd != null && activeRewardedAd?.isReady() == true) {
                    promise.resolve(true)
                    return@runOnUiThread
                }

                activeRewardedAd = InMobiInterstitial(activity, placementId, object : InterstitialAdEventListener() {
                    override fun onAdLoadSucceeded(ad: InMobiInterstitial, info: AdMetaInfo) {
                        super.onAdLoadSucceeded(ad, info)
                        Log.d(TAG, "Preloaded InMobi Rewarded Ad successfully ($placementId)")
                    }

                    override fun onAdLoadFailed(ad: InMobiInterstitial, status: InMobiAdRequestStatus) {
                        super.onAdLoadFailed(ad, status)
                        Log.w(TAG, "Preload InMobi Rewarded failed: [${status.statusCode}] ${status.message}")
                    }
                })

                activeRewardedAd?.load()
                promise.resolve(true)
            } catch (e: Exception) {
                Log.e(TAG, "InMobi preloadRewarded Exception: ${e.message}", e)
                promise.reject("PRELOAD_EXCEPTION", e.message)
            }
        }
    }

    @ReactMethod
    fun showInterstitial(placementIdStr: String, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }

        val placementId = placementIdStr.toLongOrNull() ?: 10000844849L

        UiThreadUtil.runOnUiThread {
            try {
                var isSettled = false

                activeInterstitialAd = InMobiInterstitial(activity, placementId, object : InterstitialAdEventListener() {
                    override fun onAdLoadSucceeded(ad: InMobiInterstitial, info: AdMetaInfo) {
                        super.onAdLoadSucceeded(ad, info)
                        if (ad.isReady()) {
                            ad.show()
                        }
                    }

                    override fun onAdLoadFailed(ad: InMobiInterstitial, status: InMobiAdRequestStatus) {
                        super.onAdLoadFailed(ad, status)
                        Log.w(TAG, "InMobi Interstitial load failed: [${status.statusCode}] ${status.message}")
                        if (!isSettled) {
                            isSettled = true
                            promise.reject("AD_LOAD_FAILED", "[${status.statusCode}] ${status.message}")
                        }
                    }

                    override fun onAdDisplayFailed(ad: InMobiInterstitial) {
                        super.onAdDisplayFailed(ad)
                        Log.w(TAG, "InMobi Interstitial display failed")
                        if (!isSettled) {
                            isSettled = true
                            promise.reject("AD_DISPLAY_FAILED", "Failed to display ad")
                        }
                    }

                    override fun onAdDismissed(ad: InMobiInterstitial) {
                        super.onAdDismissed(ad)
                        if (!isSettled) {
                            isSettled = true
                            promise.resolve(true)
                        }
                    }
                })

                activeInterstitialAd?.load()
            } catch (e: Exception) {
                Log.e(TAG, "InMobi showInterstitial Exception: ${e.message}", e)
                promise.reject("INTERSTITIAL_EXCEPTION", e.message)
            }
        }
    }

    @ReactMethod
    fun showRewarded(placementIdStr: String, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }

        val placementId = placementIdStr.toLongOrNull() ?: 10000844851L

        UiThreadUtil.runOnUiThread {
            try {
                var isSettled = false
                var rewardEarned = false

                val interstitial = InMobiInterstitial(activity, placementId, object : InterstitialAdEventListener() {
                    override fun onAdLoadSucceeded(ad: InMobiInterstitial, info: AdMetaInfo) {
                        super.onAdLoadSucceeded(ad, info)
                        if (ad.isReady()) {
                            ad.show()
                        }
                    }

                    override fun onAdLoadFailed(ad: InMobiInterstitial, status: InMobiAdRequestStatus) {
                        super.onAdLoadFailed(ad, status)
                        Log.w(TAG, "InMobi Rewarded load failed: [${status.statusCode}] ${status.message}")
                        if (!isSettled) {
                            isSettled = true
                            val map = Arguments.createMap()
                            map.putBoolean("rewardEarned", false)
                            map.putString("error", "[${status.statusCode}] ${status.message}")
                            map.putString("statusCode", status.statusCode.name)
                            promise.resolve(map)
                        }
                    }

                    override fun onRewardsUnlocked(ad: InMobiInterstitial, rewards: Map<Any, Any>?) {
                        super.onRewardsUnlocked(ad, rewards)
                        rewardEarned = true
                    }

                    override fun onAdDisplayFailed(ad: InMobiInterstitial) {
                        super.onAdDisplayFailed(ad)
                        Log.w(TAG, "InMobi Rewarded display failed")
                        if (!isSettled) {
                            isSettled = true
                            val map = Arguments.createMap()
                            map.putBoolean("rewardEarned", false)
                            map.putString("error", "Display failed")
                            promise.resolve(map)
                        }
                    }

                    override fun onAdDismissed(ad: InMobiInterstitial) {
                        super.onAdDismissed(ad)
                        if (!isSettled) {
                            isSettled = true
                            val map = Arguments.createMap()
                            map.putBoolean("rewardEarned", rewardEarned)
                            promise.resolve(map)
                        }
                    }
                })

                activeRewardedAd = interstitial

                if (interstitial.isReady()) {
                    interstitial.show()
                } else {
                    interstitial.load()
                }
            } catch (e: Exception) {
                Log.e(TAG, "InMobi showRewarded Exception: ${e.message}", e)
                promise.reject("REWARDED_EXCEPTION", e.message)
            }
        }
    }
}
