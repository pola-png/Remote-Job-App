package com.xapzap.app

import android.app.Activity
import android.util.Log
import com.facebook.react.bridge.*
import com.google.android.play.core.review.ReviewManager
import com.google.android.play.core.review.ReviewManagerFactory

class InAppReviewModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val TAG = "InAppReviewModule"

    override fun getName(): String {
        return "InAppReviewModule"
    }

    @ReactMethod
    fun requestReview(promise: Promise) {
        val activity: Activity? = currentActivity
        if (activity == null) {
            Log.w(TAG, "Current activity is null, cannot launch In-App Review.")
            promise.resolve(false)
            return
        }

        UiThreadUtil.runOnUiThread {
            try {
                val manager: ReviewManager = ReviewManagerFactory.create(activity)
                val requestTask = manager.requestReviewFlow()
                requestTask.addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        val reviewInfo = task.result
                        val flowTask = manager.launchReviewFlow(activity, reviewInfo)
                        flowTask.addOnCompleteListener { _ ->
                            // The Google Play In-App Review API completes whether the user
                            // gave a rating, wrote a review, or closed the sheet.
                            Log.d(TAG, "In-App Review flow finished.")
                            promise.resolve(true)
                        }
                    } else {
                        Log.w(TAG, "In-App Review request failed: ${task.exception?.message}")
                        promise.resolve(false)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "In-App Review exception: ${e.message}", e)
                promise.resolve(false)
            }
        }
    }
}
