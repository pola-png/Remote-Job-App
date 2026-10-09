# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native & Native Modules
-keepclassmembers class * extends com.facebook.react.bridge.ReactContextBaseJavaModule {
   public <methods>;
}
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.xapzap.app.** { *; }

# Google Play Billing Library
-keep class com.android.billingclient.api.** { *; }
-keep class com.google.android.play.core.** { *; }

# Google Mobile Ads
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.mediation.** { *; }
-dontwarn com.google.android.gms.ads.**

# Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# Firebase & Google Services
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Supabase / OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
