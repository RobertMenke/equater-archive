package com.equater.equater

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.util.Log
import androidx.core.app.NotificationManagerCompat
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.datadog.android.Datadog
import com.datadog.android.core.configuration.Configuration.Builder
import com.datadog.android.core.configuration.Credentials
import com.datadog.android.log.Logger
import com.datadog.android.privacy.TrackingConsent
import com.datadog.android.timber.DatadogTree
import com.google.android.libraries.places.api.Places
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber
import java.util.*
import javax.inject.Inject

var logger: Logger? = null

@HiltAndroidApp
class App : Application(), Configuration.Provider {

    @Inject lateinit var workerFactory: HiltWorkerFactory

    override fun onCreate() {
        super.onCreate()

        logger = createDataDogLogger().also {
            Timber.plant(DatadogTree(it))
        }

        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }

        if (!Places.isInitialized()) {
            Places.initialize(this, BuildConfig.GOOGLE_API_KEY, Locale.US)
        }

        createNotificationChannel()
    }

    override fun getWorkManagerConfiguration(): Configuration =
        Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    // Create the NotificationChannel, but only on API 26+ because
    // the NotificationChannel class is new and not in the support library
    // https://developer.android.com/training/notify-user/build-notification
    private fun createNotificationChannel() {
        val name = getString(R.string.channel_name)
        val descriptionText = getString(R.string.channel_description)
        val importance = NotificationManager.IMPORTANCE_HIGH
        val channel = NotificationChannel(getString(R.string.default_notification_channel_id), name, importance).apply {
            description = descriptionText
        }
        // Register the channel with the system
        val notificationManager = NotificationManagerCompat.from(applicationContext)
        notificationManager.createNotificationChannel(channel)
    }

    private fun createDataDogLogger(): Logger {
        val configuration = Builder(
            logsEnabled = true,
            tracesEnabled = true,
            crashReportsEnabled = true,
            rumEnabled = false
        ).build()

        val credentials = Credentials(
            clientToken = BuildConfig.DATA_DOG_API_KEY,
            envName = BuildConfig.ENVIRONMENT,
            variant = BuildConfig.ENVIRONMENT,
            rumApplicationId = null,
            serviceName = "Equater Android"
        )
        Datadog.initialize(
            this,
            credentials,
            configuration,
            TrackingConsent.GRANTED
        )

        Datadog.setVerbosity(Log.WARN)

        return Logger
            .Builder()
            .setNetworkInfoEnabled(true)
            .setLogcatLogsEnabled(true)
            .setDatadogLogsEnabled(true)
            .setLoggerName("Android Logger")
            .setServiceName("Equater Android")
            .build()
    }
}
