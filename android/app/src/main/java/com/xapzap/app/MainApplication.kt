package com.xapzap.app

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

import android.util.Log
import com.inmobi.sdk.InMobiSdk
import com.inmobi.sdk.SdkInitializationListener
import org.json.JSONObject

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
          override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages.toMutableList()
            packages.add(InAppUpdatePackage())
            packages.add(InAppReviewPackage())
            packages.add(GooglePlayBillingPackage())
            packages.add(FirebasePushPackage())
            packages.add(InMobiPackage())
            return packages
          }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
          override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)

    // Pre-initialize InMobi SDK natively at startup
    try {
      InMobiSdk.setLogLevel(InMobiSdk.LogLevel.DEBUG)
      val consent = JSONObject()
      InMobiSdk.init(this, "e72372e29e4b41a5a68bc2513221d560", consent, object : SdkInitializationListener {
        override fun onInitializationComplete(error: Error?) {
          if (error == null) {
            Log.d("InMobi", "InMobi SDK pre-initialized successfully in MainApplication")
          } else {
            Log.w("InMobi", "InMobi SDK pre-init warning: ${error.message}")
          }
        }
      })
    } catch (e: Exception) {
      Log.e("InMobi", "Failed to pre-init InMobi SDK in MainApplication: ${e.message}")
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
