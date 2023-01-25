package com.equater.equater.firebase

import android.app.Notification
import android.net.Uri
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.equater.equater.R
import com.equater.equater.database.repository.UserRepository
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@AndroidEntryPoint
class RemoteMessagingService : FirebaseMessagingService() {
    private val ioScope = CoroutineScope(Job() + Dispatchers.IO)

    @Inject
    lateinit var userRepository: UserRepository

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val notificationManager = NotificationManagerCompat.from(applicationContext)

        if (!notificationManager.areNotificationsEnabled()) {
            return
        }

        val data = PushNotificationData.fromMessage(applicationContext, message) ?: return
        val displayNotification = createNotification(data)
        notificationManager.notify(data.getNotificationId(), displayNotification)
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Timber.d("onNewToken $token")
        ioScope.launch {
            userRepository.registerDeviceIfSignedIn(token)
        }
    }

    private fun createNotification(data: PushNotificationData): Notification {
        val sound = Uri.parse("android.resource://" + this.packageName + "/" + R.raw.push_notification_sound)

        return NotificationCompat
            .Builder(this, getString(R.string.default_notification_channel_id))
            .setSmallIcon(R.drawable.wallet_logo_no_background)
            .setContentTitle(data.getTitle())
            .setContentText(data.getBody())
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(data.createNavigationIntent())
            .setSound(sound)
            .build()
    }
}
