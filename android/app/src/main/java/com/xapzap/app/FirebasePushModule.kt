package com.xapzap.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.graphics.Color
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.firebase.messaging.FirebaseMessaging

class FirebasePushModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val TAG = "FirebasePushModule"

    init {
        createNotificationChannel()
        autoSubscribeTopic()
    }

    override fun getName(): String = "FirebasePushModule"

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager =
                reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            val channel = NotificationChannel(
                RemoteJobFirebaseMessagingService.CHANNEL_ID,
                RemoteJobFirebaseMessagingService.CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = RemoteJobFirebaseMessagingService.CHANNEL_DESC
                enableLights(true)
                lightColor = Color.parseColor("#38BDF8")
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 150, 250)
                setShowBadge(true)
            }
            notificationManager?.createNotificationChannel(channel)
            Log.d(TAG, "Notification channel '${RemoteJobFirebaseMessagingService.CHANNEL_ID}' initialized")
        }
    }

    private fun autoSubscribeTopic() {
        FirebaseMessaging.getInstance().subscribeToTopic("all-users")
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.d(TAG, "Subscribed automatically to topic: all-users")
                } else {
                    Log.w(TAG, "Failed auto-subscribe to topic all-users", task.exception)
                }
            }
    }

    @ReactMethod
    fun getFcmToken(promise: Promise) {
        FirebaseMessaging.getInstance().token
            .addOnCompleteListener { task ->
                if (task.isSuccessful && task.result != null) {
                    val token = task.result
                    Log.d(TAG, "Retrieved FCM Token: $token")
                    promise.resolve(token)
                } else {
                    val errorMsg = task.exception?.message ?: "Failed to retrieve FCM token"
                    Log.w(TAG, errorMsg)
                    promise.reject("FCM_TOKEN_ERROR", errorMsg)
                }
            }
    }

    @ReactMethod
    fun subscribeToTopic(topic: String, promise: Promise) {
        FirebaseMessaging.getInstance().subscribeToTopic(topic)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.d(TAG, "Subscribed to topic: $topic")
                    promise.resolve(true)
                } else {
                    val errorMsg = task.exception?.message ?: "Failed to subscribe to topic $topic"
                    Log.w(TAG, errorMsg)
                    promise.reject("TOPIC_SUB_ERROR", errorMsg)
                }
            }
    }

    @ReactMethod
    fun unsubscribeFromTopic(topic: String, promise: Promise) {
        FirebaseMessaging.getInstance().unsubscribeFromTopic(topic)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.d(TAG, "Unsubscribed from topic: $topic")
                    promise.resolve(true)
                } else {
                    val errorMsg = task.exception?.message ?: "Failed to unsubscribe from topic $topic"
                    Log.w(TAG, errorMsg)
                    promise.reject("TOPIC_UNSUB_ERROR", errorMsg)
                }
            }
    }
}
