package com.xapzap.app

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.view.Gravity
import android.widget.FrameLayout
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.inmobi.ads.InMobiBanner
import com.inmobi.ads.InMobiAdRequestStatus
import com.inmobi.ads.AdMetaInfo
import com.inmobi.ads.listeners.BannerAdEventListener
import com.inmobi.sdk.InMobiSdk
import com.inmobi.sdk.SdkInitializationListener
import org.json.JSONObject

class InMobiBannerViewManager : SimpleViewManager<FrameLayout>() {
    private val TAG = "InMobiBannerView"

    override fun getName(): String {
        return "InMobiBannerView"
    }

    override fun createViewInstance(reactContext: ThemedReactContext): FrameLayout {
        return FrameLayout(reactContext)
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? {
        return mapOf(
            "topAdLoaded" to mapOf("registrationName" to "onAdLoaded"),
            "topAdFailedToLoad" to mapOf("registrationName" to "onAdFailedToLoad")
        )
    }

    private fun resolveActivity(context: Context?): Activity? {
        if (context == null) return null
        if (context is Activity) return context
        if (context is ContextWrapper) return resolveActivity(context.baseContext)
        return null
    }

    @ReactProp(name = "placementId")
    fun setPlacementId(container: FrameLayout, placementIdStr: String?) {
        val placementId = placementIdStr?.toLongOrNull() ?: 10000844850L
        val themedCtx = container.context as? ThemedReactContext
        val activity = themedCtx?.currentActivity ?: resolveActivity(container.context)
        if (activity == null) {
            Log.w(TAG, "Current activity is null, cannot attach InMobiBanner for placement $placementId")
            return
        }

        container.post {
            loadBannerWithSdkCheck(container, activity, placementId)
        }
    }

    private fun loadBannerWithSdkCheck(container: FrameLayout, activity: Activity, placementId: Long) {
        if (!InMobiSdk.isSDKInitialized()) {
            Log.d(TAG, "InMobi SDK not initialized yet. Initializing before loading banner $placementId...")
            try {
                val consent = JSONObject()
                InMobiSdk.init(activity.applicationContext, "e72372e29e4b41a5a68bc2513221d560", consent, object : SdkInitializationListener {
                    override fun onInitializationComplete(error: Error?) {
                        activity.runOnUiThread {
                            setupAndLoadBanner(container, activity, placementId)
                        }
                    }
                })
            } catch (e: Exception) {
                Log.e(TAG, "InMobi on-demand init failed: ${e.message}")
                setupAndLoadBanner(container, activity, placementId)
            }
        } else {
            setupAndLoadBanner(container, activity, placementId)
        }
    }

    private fun setupAndLoadBanner(container: FrameLayout, activity: Activity, placementId: Long) {
        try {
            container.removeAllViews()
            val banner = InMobiBanner(activity, placementId)
            val isNativeMrec = (placementId == 10000844853L)
            val widthDp = if (isNativeMrec) 300 else 320
            val heightDp = if (isNativeMrec) 250 else 50

            banner.setBannerSize(widthDp, heightDp)
            banner.setAnimationType(InMobiBanner.AnimationType.ANIMATION_OFF)
            banner.setEnableAutoRefresh(true)

            banner.setListener(object : BannerAdEventListener() {
                override fun onAdLoadSucceeded(ad: InMobiBanner, info: AdMetaInfo) {
                    Log.d(TAG, "InMobi banner loaded successfully for placement: $placementId")
                    try {
                        val reactContext = container.context as? ThemedReactContext
                        val event = Arguments.createMap()
                        event.putBoolean("loaded", true)
                        reactContext?.getJSModule(RCTEventEmitter::class.java)?.receiveEvent(
                            container.id,
                            "topAdLoaded",
                            event
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to send topAdLoaded event: ${e.message}")
                    }
                }

                override fun onAdLoadFailed(ad: InMobiBanner, status: InMobiAdRequestStatus) {
                    val errorMsg = "[${status.statusCode}] ${status.message}"
                    Log.w(TAG, "InMobi banner failed to load ($placementId): $errorMsg")
                    try {
                        val reactContext = container.context as? ThemedReactContext
                        val event = Arguments.createMap()
                        event.putString("error", errorMsg)
                        event.putString("statusCode", status.statusCode.name)
                        reactContext?.getJSModule(RCTEventEmitter::class.java)?.receiveEvent(
                            container.id,
                            "topAdFailedToLoad",
                            event
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to send topAdFailedToLoad event: ${e.message}")
                    }
                }
            })

            val density = activity.resources.displayMetrics.density
            val widthPx = (widthDp * density).toInt()
            val heightPx = (heightDp * density).toInt()
            val layoutParams = FrameLayout.LayoutParams(widthPx, heightPx)
            layoutParams.gravity = Gravity.CENTER
            container.addView(banner, layoutParams)
            Log.d(TAG, "Calling banner.load() for placement: $placementId ($widthDp x $heightDp)")
            banner.load()
        } catch (e: Exception) {
            Log.e(TAG, "Exception initializing InMobiBanner: ${e.message}", e)
            try {
                val reactContext = container.context as? ThemedReactContext
                val event = Arguments.createMap()
                event.putString("error", e.message ?: "Unknown error")
                reactContext?.getJSModule(RCTEventEmitter::class.java)?.receiveEvent(
                    container.id,
                    "topAdFailedToLoad",
                    event
                )
            } catch (ignored: Exception) {}
        }
    }
}
