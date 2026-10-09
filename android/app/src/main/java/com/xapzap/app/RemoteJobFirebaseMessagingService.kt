package com.xapzap.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class RemoteJobFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "FCM_Service"
        const val CHANNEL_ID = "remote_job_alerts_channel"
        const val CHANNEL_NAME = "Remote Job Alerts"
        const val CHANNEL_DESC = "Real-time alerts for high-paying remote jobs and application updates"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM Registration Token: $token")
        
        // Automatically subscribe device to the 'all-users' topic
        FirebaseMessaging.getInstance().subscribeToTopic("all-users")
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.d(TAG, "Successfully subscribed to topic: all-users")
                } else {
                    Log.w(TAG, "Failed to subscribe to topic all-users", task.exception)
                }
            }

        // Send event to React Native JS if context is active
        try {
            val reactApp = application as? ReactApplication
            val reactContext = reactApp?.reactNativeHost?.reactInstanceManager?.currentReactContext
            if (reactContext != null && reactContext.hasActiveReactInstance()) {
                val params = Arguments.createMap().apply {
                    putString("token", token)
                }
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onFcmTokenRefresh", params)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not emit token to JS context: ${e.message}")
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "FCM Message Received from: ${remoteMessage.from}")

        // 1. Extract title and body from notification payload or data payload
        val title = remoteMessage.notification?.title
            ?: remoteMessage.data["title"]
            ?: "Remote Job Alert"
        val body = remoteMessage.notification?.body
            ?: remoteMessage.data["message"]
            ?: remoteMessage.data["body"]
            ?: "New opportunities are available now. Tap to view."
        val targetScreen = remoteMessage.data["targetScreen"] ?: "REMOTE_JOBS"

        Log.d(TAG, "Displaying notification: Title='$title', Body='$body'")

        // 2. Show native system notification (for both background and foreground states)
        sendNotification(title, body, targetScreen, remoteMessage.data)

        // 3. Emit in-app notification event to React Native UI
        try {
            val reactApp = application as? ReactApplication
            val reactContext = reactApp?.reactNativeHost?.reactInstanceManager?.currentReactContext
            if (reactContext != null && reactContext.hasActiveReactInstance()) {
                val map = Arguments.createMap().apply {
                    putString("title", title)
                    putString("body", body)
                    putString("targetScreen", targetScreen)
                    remoteMessage.data.forEach { (k, v) ->
                        putString(k, v)
                    }
                }
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onRemotePushNotificationReceived", map)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not emit push event to JS: ${e.message}")
        }
    }

    private fun sendNotification(
        title: String,
        body: String,
        targetScreen: String,
        data: Map<String, String>
    ) {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra("targetScreen", targetScreen)
            data.forEach { (k, v) ->
                putExtra(k, v)
            }
        }

        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_ONE_SHOT
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            intent,
            pendingIntentFlags
        )

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create Notification Channel for Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_DESC
                enableLights(true)
                lightColor = Color.parseColor("#38BDF8")
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 150, 250)
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setVibrate(longArrayOf(0, 250, 150, 250))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setContentIntent(pendingIntent)
            .setColor(Color.parseColor("#0284C7"))

        val notificationId = (System.currentTimeMillis() % 100000).toInt()
        notificationManager.notify(notificationId, notificationBuilder.build())
    }
}
