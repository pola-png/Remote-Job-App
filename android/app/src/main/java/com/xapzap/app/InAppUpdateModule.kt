package com.xapzap.app

import android.app.Activity
import android.content.Intent
import android.content.IntentSender
import com.facebook.react.bridge.*
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability

class InAppUpdateModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private val appUpdateManager: AppUpdateManager = AppUpdateManagerFactory.create(reactContext)
    private var cachedUpdateInfo: AppUpdateInfo? = null
    private val UPDATE_REQUEST_CODE = 9001
    private var updatePromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "InAppUpdateModule"
    }

    @ReactMethod
    fun checkForPlayStoreUpdate(promise: Promise) {
        val appUpdateInfoTask = appUpdateManager.appUpdateInfo

        appUpdateInfoTask.addOnSuccessListener { appUpdateInfo ->
            cachedUpdateInfo = appUpdateInfo
            val map = Arguments.createMap()
            val isAvailable = appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
            val isImmediateAllowed = appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)
            val isFlexibleAllowed = appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)

            map.putBoolean("updateAvailable", isAvailable)
            map.putInt("availableVersionCode", appUpdateInfo.availableVersionCode())
            map.putBoolean("isImmediateAllowed", isImmediateAllowed)
            map.putBoolean("isFlexibleAllowed", isFlexibleAllowed)
            map.putInt("updateAvailabilityCode", appUpdateInfo.updateAvailability())

            promise.resolve(map)
        }.addOnFailureListener { error ->
            promise.reject("UPDATE_CHECK_FAILED", error.localizedMessage ?: "Failed to check update", error)
        }
    }

    @ReactMethod
    fun startInAppUpdate(updateType: String, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }

        val type = if (updateType.equals("FLEXIBLE", ignoreCase = true)) {
            AppUpdateType.FLEXIBLE
        } else {
            AppUpdateType.IMMEDIATE
        }

        val info = cachedUpdateInfo
        if (info != null && info.isUpdateTypeAllowed(type)) {
            try {
                updatePromise = promise
                val options = AppUpdateOptions.newBuilder(type).build()
                appUpdateManager.startUpdateFlow(info, activity, options)
                    .addOnSuccessListener {
                        // Flow started
                    }
                    .addOnFailureListener { e ->
                        updatePromise?.reject("START_FLOW_FAILED", e.localizedMessage, e)
                        updatePromise = null
                    }
            } catch (e: Exception) {
                promise.reject("START_UPDATE_FAILED", e.localizedMessage, e)
            }
        } else {
            // Re-fetch info and start
            appUpdateManager.appUpdateInfo.addOnSuccessListener { newInfo ->
                cachedUpdateInfo = newInfo
                if (newInfo.isUpdateTypeAllowed(type)) {
                    try {
                        updatePromise = promise
                        val options = AppUpdateOptions.newBuilder(type).build()
                        appUpdateManager.startUpdateFlow(newInfo, activity, options)
                    } catch (e: Exception) {
                        promise.reject("START_UPDATE_FAILED", e.localizedMessage, e)
                    }
                } else {
                    promise.reject("UPDATE_NOT_ALLOWED", "Update type $updateType is not allowed for this app version.")
                }
            }.addOnFailureListener { e ->
                promise.reject("UPDATE_INFO_FAILED", e.localizedMessage, e)
            }
        }
    }

    @ReactMethod
    fun completeFlexibleUpdate(promise: Promise) {
        appUpdateManager.completeUpdate()
            .addOnSuccessListener {
                promise.resolve(true)
            }
            .addOnFailureListener { e ->
                promise.reject("COMPLETE_UPDATE_FAILED", e.localizedMessage, e)
            }
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == UPDATE_REQUEST_CODE) {
            if (resultCode == Activity.RESULT_OK) {
                updatePromise?.resolve("UPDATE_SUCCESS")
            } else if (resultCode == Activity.RESULT_CANCELED) {
                updatePromise?.resolve("UPDATE_CANCELED")
            } else {
                updatePromise?.resolve("UPDATE_FAILED")
            }
            updatePromise = null
        }
    }

    override fun onNewIntent(intent: Intent?) {}
}
