package com.equater.equater.firebase

import android.app.PendingIntent
import android.app.TaskStackBuilder
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.material.ExperimentalMaterialApi
import androidx.core.net.toUri
import com.equater.equater.BuildConfig
import com.equater.equater.MainActivity
import com.google.firebase.messaging.RemoteMessage

sealed class PushNotificationData(
    private val context: Context,
    private val notification: RemoteMessage.Notification
) {
    fun getTitle() = notification.title
    fun getBody() = notification.body

    // https://proandroiddev.com/open-composables-via-notification-with-jetpack-navigation-b922384f4091
    // https://developer.android.com/training/notify-user/navigation
    @OptIn(ExperimentalMaterialApi::class)
    fun createNavigationIntent(): PendingIntent {
        val deepLinkIntent = Intent(Intent.ACTION_VIEW, getLink(), context, MainActivity::class.java)

        return TaskStackBuilder.create(context).run {
            addNextIntentWithParentStack(deepLinkIntent)
            getPendingIntent(0, PendingIntent.FLAG_UPDATE_CURRENT)
        }
    }

    fun getNotificationId() = java.util.Calendar.getInstance().timeInMillis.toInt()

    private fun getLink(): Uri {
        val base = BuildConfig.WEB_BASE
        val url = when (this) {
            is AgreementNotification -> "$base/app/agreement/detail/$sharedExpenseId"
            is DefaultNotification -> base
            is PlaidUpdateAccountNotification -> base
            is TransactionNotification -> "$base/app/transaction/detail/$transactionId"
        }

        return url.toUri()
    }

    companion object {
        fun fromMessage(context: Context, message: RemoteMessage): PushNotificationData? {
            val notification = message.notification ?: return null
            val tag = notification.tag ?: return DefaultNotification(context, notification)

            when (tag) {
                "EXPENSE_AGREEMENT" -> {
                    try {
                        val sharedExpenseId = message.data["sharedExpenseId"]?.toInt() ?: return DefaultNotification(
                            context,
                            notification
                        )

                        return AgreementNotification(context, notification, sharedExpenseId)
                    } catch (e: Throwable) {
                        return DefaultNotification(context, notification)
                    }
                }
                "EXPENSE_TRANSACTION" -> {
                    try {
                        val transactionId = message.data["sharedExpenseTransactionId"]?.toInt()
                            ?: return DefaultNotification(
                                context,
                                notification
                            )

                        return TransactionNotification(context, notification, transactionId)
                    } catch (e: Throwable) {
                        return DefaultNotification(context, notification)
                    }
                }
                "PLAID_AUTHENTICATION" -> return PlaidUpdateAccountNotification(context, notification)
                else -> return DefaultNotification(context, notification)
            }
        }
    }
}

// On tap, navigate to the agreement
class AgreementNotification(
    context: Context,
    notification: RemoteMessage.Notification,
    val sharedExpenseId: Int
) : PushNotificationData(
    context,
    notification
)

// On tap, navigate to the transaction
class TransactionNotification(
    context: Context,
    notification: RemoteMessage.Notification,
    val transactionId: Int
) : PushNotificationData(
    context,
    notification
)

// On tap, sync user state to prompt the user to re-link their account
class PlaidUpdateAccountNotification(
    context: Context,
    notification: RemoteMessage.Notification
) : PushNotificationData(
    context,
    notification
)

// A notification that we won't handle on tap
class DefaultNotification(context: Context, notification: RemoteMessage.Notification) : PushNotificationData(
    context,
    notification
)
