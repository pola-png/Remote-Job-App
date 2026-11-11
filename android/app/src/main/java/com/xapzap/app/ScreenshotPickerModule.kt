package com.xapzap.app

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.roundToInt

class ScreenshotPickerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val TAG = "ScreenshotPickerModule"
    private val PICK_IMAGE_REQUEST = 49201
    private var pendingPromise: Promise? = null

    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?
        ) {
            if (requestCode != PICK_IMAGE_REQUEST) return

            val promise = pendingPromise ?: return
            pendingPromise = null

            if (resultCode != Activity.RESULT_OK || data?.data == null) {
                val cancelledMap = Arguments.createMap().apply {
                    putBoolean("cancelled", true)
                }
                promise.resolve(cancelledMap)
                return
            }

            val uri: Uri = data.data!!
            Thread {
                try {
                    val resolver = reactContext.contentResolver
                    var fileName = "youtube_subscribed_proof.jpg"
                    resolver.query(uri, null, null, null, null)?.use { cursor ->
                        val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                        if (nameIndex >= 0 && cursor.moveToFirst()) {
                            fileName = cursor.getString(nameIndex) ?: fileName
                        }
                    }

                    // Decode bounds first for memory safety
                    val boundsOptions = BitmapFactory.Options().apply {
                        inJustDecodeBounds = true
                    }
                    resolver.openInputStream(uri)?.use { stream ->
                        BitmapFactory.decodeStream(stream, null, boundsOptions)
                    }

                    val maxDimension = 720
                    var sampleSize = 1
                    val rawW = boundsOptions.outWidth
                    val rawH = boundsOptions.outHeight
                    if (rawW > maxDimension || rawH > maxDimension) {
                        val halfW = rawW / 2
                        val halfH = rawH / 2
                        while ((halfW / sampleSize) >= maxDimension || (halfH / sampleSize) >= maxDimension) {
                            sampleSize *= 2
                        }
                    }

                    val decodeOptions = BitmapFactory.Options().apply {
                        inSampleSize = sampleSize
                    }
                    val decodedBitmap = resolver.openInputStream(uri)?.use { stream ->
                        BitmapFactory.decodeStream(stream, null, decodeOptions)
                    }

                    if (decodedBitmap == null) {
                        promise.reject("DECODE_ERROR", "Could not read the selected screenshot image.")
                        return@Thread
                    }

                    // Scale down proportionally so max side <= 720px to keep DB/egress footprint under ~40KB
                    val largestSide = max(decodedBitmap.width, decodedBitmap.height)
                    val finalBitmap = if (largestSide > maxDimension) {
                        val ratio = maxDimension.toFloat() / largestSide.toFloat()
                        val targetW = (decodedBitmap.width * ratio).roundToInt().coerceAtLeast(1)
                        val targetH = (decodedBitmap.height * ratio).roundToInt().coerceAtLeast(1)
                        Bitmap.createScaledBitmap(decodedBitmap, targetW, targetH, true)
                    } else {
                        decodedBitmap
                    }

                    val outputStream = ByteArrayOutputStream()
                    finalBitmap.compress(Bitmap.CompressFormat.JPEG, 68, outputStream)
                    val byteArray = outputStream.toByteArray()
                    val base64Str = Base64.encodeToString(byteArray, Base64.NO_WRAP)
                    val dataUrl = "data:image/jpeg;base64,$base64Str"

                    val resultMap = Arguments.createMap().apply {
                        putBoolean("cancelled", false)
                        putString("base64DataUrl", dataUrl)
                        putString("fileName", fileName)
                        putInt("width", finalBitmap.width)
                        putInt("height", finalBitmap.height)
                        putInt("sizeBytes", byteArray.size)
                    }
                    promise.resolve(resultMap)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to process selected screenshot: ${e.message}", e)
                    promise.reject("PICK_IMAGE_ERROR", e.message ?: "Failed to process screenshot")
                }
            }.start()
        }
    }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String {
        return "ScreenshotPickerModule"
    }

    @ReactMethod
    fun pickScreenshot(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Current activity is not available.")
            return
        }

        pendingPromise = promise
        try {
            val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                type = "image/*"
                addCategory(Intent.CATEGORY_OPENABLE)
            }
            activity.startActivityForResult(
                Intent.createChooser(intent, "Select Subscribed Screenshot"),
                PICK_IMAGE_REQUEST
            )
        } catch (e: Exception) {
            pendingPromise = null
            promise.reject("LAUNCH_PICKER_FAILED", e.message ?: "Unable to open image gallery.")
        }
    }
}
