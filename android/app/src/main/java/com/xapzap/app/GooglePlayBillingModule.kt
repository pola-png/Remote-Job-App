package com.xapzap.app

import android.app.Activity
import android.util.Log
import com.android.billingclient.api.*
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class GooglePlayBillingModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), PurchasesUpdatedListener {

    private val TAG = "PlayBillingModule"
    private var billingClient: BillingClient? = null
    private var isConnected = false
    private val scope = CoroutineScope(Dispatchers.IO)
    private var currentPurchasePromise: Promise? = null

    private val productDetailsMap = mutableMapOf<String, ProductDetails>()

    init {
        setupBillingClient()
    }

    override fun getName(): String = "GooglePlayBillingModule"

    private fun setupBillingClient() {
        billingClient = BillingClient.newBuilder(reactContext)
            .setListener(this)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .enablePrepaidPlans()
                    .build()
            )
            .build()

        startConnection(null)
    }

    private fun startConnection(onConnected: (() -> Unit)?) {
        billingClient?.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    isConnected = true
                    Log.d(TAG, "BillingClient connected successfully")
                    preloadProductDetails()
                    onConnected?.invoke()
                } else {
                    isConnected = false
                    Log.w(TAG, "Billing setup failed: ${billingResult.debugMessage} (code ${billingResult.responseCode})")
                }
            }

            override fun onBillingServiceDisconnected() {
                isConnected = false
                Log.w(TAG, "BillingService disconnected. Reconnecting...")
            }
        })
    }

    private fun preloadProductDetails() {
        val subscriptionList = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("premium_monthly")
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("premium_yearly")
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("pro_monthly")
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("pro_yearly")
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        )

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(subscriptionList)
            .build()

        billingClient?.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && productDetailsList.isNotEmpty()) {
                productDetailsList.forEach { details ->
                    productDetailsMap[details.productId] = details
                    Log.d(TAG, "Loaded product details for: ${details.productId}")
                }
            } else {
                Log.w(TAG, "Failed to load product details: ${billingResult.debugMessage}")
            }
        }
    }

    @ReactMethod
    fun getProductDetails(promise: Promise) {
        val ensureConnected: (() -> Unit) = {
            val subscriptionList = listOf(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId("premium_monthly")
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build(),
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId("premium_yearly")
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build(),
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId("pro_monthly")
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build(),
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId("pro_yearly")
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build()
            )

            val params = QueryProductDetailsParams.newBuilder()
                .setProductList(subscriptionList)
                .build()

            billingClient?.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    val array = Arguments.createArray()
                    productDetailsList.forEach { details ->
                        productDetailsMap[details.productId] = details
                        val map = Arguments.createMap()
                        map.putString("productId", details.productId)
                        map.putString("title", details.title)
                        map.putString("description", details.description)
                        map.putString("productType", details.productType)
                        
                        val offer = details.subscriptionOfferDetails?.firstOrNull()
                        val pricing = offer?.pricingPhases?.pricingPhaseList?.firstOrNull()
                        if (pricing != null) {
                            map.putString("formattedPrice", pricing.formattedPrice)
                            map.putDouble("priceAmountMicros", pricing.priceAmountMicros.toDouble())
                            map.putString("priceCurrencyCode", pricing.priceCurrencyCode)
                            map.putString("billingPeriod", pricing.billingPeriod)
                        }
                        array.pushMap(map)
                    }
                    promise.resolve(array)
                } else {
                    promise.reject("BILLING_ERROR", "Failed to query products: ${billingResult.debugMessage}")
                }
            }
        }

        if (isConnected && billingClient?.isReady == true) {
            ensureConnected()
        } else {
            startConnection(ensureConnected)
        }
    }

    @ReactMethod
    fun purchaseSubscription(productId: String, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("ACTIVITY_NULL", "Activity is null")
            return
        }

        currentPurchasePromise = promise

        val launchFlow: () -> Unit = {
            val productDetails = productDetailsMap[productId]
            if (productDetails == null) {
                // If not in cache, query directly then launch
                val params = QueryProductDetailsParams.newBuilder()
                    .setProductList(
                        listOf(
                            QueryProductDetailsParams.Product.newBuilder()
                                .setProductId(productId)
                                .setProductType(BillingClient.ProductType.SUBS)
                                .build()
                        )
                    )
                    .build()

                billingClient?.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
                    val details = productDetailsList.firstOrNull()
                    if (details != null) {
                        productDetailsMap[productId] = details
                        executeBillingFlow(activity, details)
                    } else {
                        currentPurchasePromise?.reject(
                            "PRODUCT_NOT_FOUND",
                            "Subscription '$productId' is still propagating on Google Play. Please try again in a few moments."
                        )
                        currentPurchasePromise = null
                    }
                }
            } else {
                executeBillingFlow(activity, productDetails)
            }
        }

        if (isConnected && billingClient?.isReady == true) {
            launchFlow()
        } else {
            startConnection(launchFlow)
        }
    }

    private fun executeBillingFlow(activity: Activity, productDetails: ProductDetails) {
        val offerToken = productDetails.subscriptionOfferDetails?.firstOrNull()?.offerToken
        if (offerToken == null) {
            currentPurchasePromise?.reject("NO_OFFER_TOKEN", "No subscription offer available for ${productDetails.productId}")
            currentPurchasePromise = null
            return
        }

        val productDetailsParamsList = listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .setOfferToken(offerToken)
                .build()
        )

        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(productDetailsParamsList)
            .build()

        val result = billingClient?.launchBillingFlow(activity, billingFlowParams)
        if (result?.responseCode != BillingClient.BillingResponseCode.OK) {
            currentPurchasePromise?.reject("LAUNCH_FAILED", "Failed to launch billing flow: ${result?.debugMessage}")
            currentPurchasePromise = null
        }
    }

    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: List<Purchase>?) {
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (purchase in purchases) {
                handlePurchase(purchase)
            }
        } else if (billingResult.responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
            currentPurchasePromise?.reject("USER_CANCELED", "Purchase was canceled by the user.")
            currentPurchasePromise = null
        } else {
            currentPurchasePromise?.reject("PURCHASE_FAILED", "Purchase error: ${billingResult.debugMessage} (code ${billingResult.responseCode})")
            currentPurchasePromise = null
        }
    }

    private fun handlePurchase(purchase: Purchase) {
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            if (!purchase.isAcknowledged) {
                val acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.purchaseToken)
                    .build()

                billingClient?.acknowledgePurchase(acknowledgePurchaseParams) { billingResult ->
                    if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                        Log.d(TAG, "Purchase acknowledged successfully: ${purchase.orderId}")
                    }
                }
            }

            val map = Arguments.createMap()
            map.putString("orderId", purchase.orderId ?: "")
            map.putString("packageName", purchase.packageName)
            map.putString("productId", purchase.products.firstOrNull() ?: "")
            map.putString("purchaseToken", purchase.purchaseToken)
            map.putDouble("purchaseTime", purchase.purchaseTime.toDouble())
            map.putBoolean("isAcknowledged", purchase.isAcknowledged)

            currentPurchasePromise?.resolve(map)
            currentPurchasePromise = null

            // Emit purchase event to JavaScript
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onPlayStorePurchaseSuccess", map)
        }
    }
}
