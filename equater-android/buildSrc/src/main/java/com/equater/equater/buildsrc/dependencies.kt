package com.equater.equater.buildsrc

object Libs {
    const val androidGradlePlugin = "com.android.tools.build:gradle:7.0.4"
    const val jdkDesugar = "com.android.tools:desugar_jdk_libs:1.0.9"
    const val junit = "junit:junit:4.13"
    const val material = "com.google.android.material:material:1.1.0"

    object Android {
        private const val pluginVersion = "7.3.0"
        private const val webkitVersion = "1.4.0"
        const val gradlePlugin = "com.android.tools.build:gradle:$pluginVersion"
        const val webkit = "androidx.webkit:webkit:$webkitVersion"
    }

    object Emoji {
        private const val version = "1.2.0"

        const val emoji2 = "androidx.emoji2:emoji2:$version"
        const val emoji2Views = "androidx.emoji2:emoji2-views:$version"
        const val emoji2ViewsHelper = "androidx.emoji2:emoji2-views-helper:$version"
    }

    object Accompanist {
        private const val version = "0.26.5-rc"
        const val webview = "com.google.accompanist:accompanist-webview:$version"
        const val swipeRefresh = "com.google.accompanist:accompanist-swiperefresh:$version"
        const val navigation = "com.google.accompanist:accompanist-navigation-animation:$version"
    }

    object Kotlin {
        private const val version = "1.7.20"
        const val stdlib = "org.jetbrains.kotlin:kotlin-stdlib-jdk8:$version"
        const val gradlePlugin = "org.jetbrains.kotlin:kotlin-gradle-plugin:$version"
        const val extensions = "org.jetbrains.kotlin:kotlin-android-extensions:$version"
        const val reflection = "org.jetbrains.kotlin:kotlin-reflect:$version"
        const val serialization = "org.jetbrains.kotlinx:kotlinx-serialization-json:1.3.2"
    }

    object KtLint {
        private const val pluginVersion = "9.4.0"
        const val gradlePlugin = "org.jlleitschuh.gradle:ktlint-gradle:$pluginVersion"
    }

    // https://github.com/Kotlin/kotlinx.coroutines
    object Coroutines {
        private const val version = "1.6.4"
        const val core = "org.jetbrains.kotlinx:kotlinx-coroutines-core:$version"
        const val android = "org.jetbrains.kotlinx:kotlinx-coroutines-android:$version"
        const val test = "org.jetbrains.kotlinx:kotlinx-coroutines-test:$version"
    }

    // https://github.com/FasterXML/jackson
    object Jackson {
        private const val version = "2.13.4"
        const val databind = "com.fasterxml.jackson.core:jackson-databind:$version"
        const val core = "com.fasterxml.jackson.core:jackson-core:$version"
        const val annotations = "com.fasterxml.jackson.core:jackson-annotations:$version"
        const val kotlinSupport = "com.fasterxml.jackson.module:jackson-module-kotlin:$version"
    }

    // https://github.com/square/okhttp
    object OkHttp {
        private const val version = "4.10.0"
        const val okhttp = "com.squareup.okhttp3:okhttp:$version"
        const val logging = "com.squareup.okhttp3:logging-interceptor:$version"
    }

    // https://github.com/square/retrofit
    object Retrofit {
        private const val version = "2.9.0"
        const val retrofit = "com.squareup.retrofit2:retrofit:$version"
        const val jacksonConverter = "com.squareup.retrofit2:converter-jackson:$version"
    }

    // https://github.com/greenrobot/EventBus
    object GreenRobotEventBus {
        private const val version = "3.2.0"
        const val eventBus = "org.greenrobot:eventbus:$version"
        const val annotationProcessor = "org.greenrobot:eventbus-annotation-processor:$version"
    }

    // https://github.com/plaid/plaid-link-android
    object Plaid {
        private const val version = "3.10.1"
        const val linkKit = "com.plaid.link:sdk-core:$version"
    }

    // https://github.com/google/dagger
    object Hilt {
        private const val version = "2.38.1"
        private const val androidxVersion = "1.0.0"

        const val hilt = "com.google.dagger:hilt-android:$version"
        const val gradlePlugin = "com.google.dagger:hilt-android-gradle-plugin:$version"

        const val workManager = "androidx.hilt:hilt-work:$androidxVersion"
        const val navigation = "androidx.hilt:hilt-navigation-fragment:$androidxVersion"
        const val navigationCompose = "androidx.hilt:hilt-navigation-compose:$androidxVersion"
        // const val lifecycle = "androidx.hilt:hilt-lifecycle-viewmodel:$androidxVersion"
        const val androidxCompiler = "androidx.hilt:hilt-compiler:$androidxVersion"
        const val compiler = "com.google.dagger:hilt-compiler:$version"
        const val testAndroid = "com.google.dagger:hilt-android-testing:$version"
    }

    // https://github.com/JakeWharton/timber
    object Timber {
        private const val version = "5.0.1"
        const val timber = "com.jakewharton.timber:timber:$version"
    }

    // https://github.com/airbnb/lottie-android
    // http://airbnb.io/lottie/#/android
    object Lottie {
        private const val version = "5.2.0"
        const val lottie = "com.airbnb.android:lottie:$version"
        const val lottieCompose = "com.airbnb.android:lottie-compose:$version"
    }

    object Arrow {
        private const val version = "1.1.2"
        const val core = "io.arrow-kt:arrow-core:$version"
        const val optics = "io.arrow-kt:arrow-optics:$version"
        const val kapt = "io.arrow-kt:arrow-meta:$version"
    }

    object GooglePlaces {
        private const val version = "2.6.0"
        const val api = "com.google.android.libraries.places:places:$version"
    }

    object Firebase {
        private const val googleServicesVersion = "4.3.14"
        private const val analyticsVersion = "21.2.0"
        private const val cloudMessagingVersion = "23.1.0"
        private const val crashlyticsVersion = "18.3.0"

        const val googleServices = "com.google.gms:google-services:$googleServicesVersion"
        const val firebase = "com.google.firebase:firebase-analytics:$analyticsVersion"
        const val crashlytics = "com.google.firebase:firebase-crashlytics:$crashlyticsVersion"
        const val cloudMessaging = "com.google.firebase:firebase-messaging:$cloudMessagingVersion"
    }

    object Validation {
        private const val apacheCommonsVersion = "1.7"
        const val apacheCommonsValidation = "commons-validator:commons-validator:$apacheCommonsVersion"
    }

    object SocketIO {
        private const val version = "2.0.0"
        const val socketIoClient = "io.socket:socket.io-client:$version"
    }

    object Konfetti {
        private const val version = "2.0.2"
        const val konfetti = "nl.dionsegijn:konfetti-compose:$version"
    }

    object DataDog {
        private const val version = "1.14.1"
        const val logger = "com.datadoghq:dd-sdk-android:$version"
        const val timber = "com.datadoghq:dd-sdk-android-timber:$version"
    }

    object AndroidX {
        const val coreVersion = "1.6.0"
        const val appcompat = "androidx.appcompat:appcompat:1.3.1"
        const val palette = "androidx.palette:palette:1.0.0"

        const val core = "androidx.core:core:$coreVersion"
        const val coreKtx = "androidx.core:core-ktx:$coreVersion"

        const val constraintLayout = "androidx.constraintlayout:constraintlayout:2.1.0"

        private const val activityVersion = "1.6.0"
        const val activity = "androidx.activity:activity-ktx:$activityVersion"
        const val activityCompose = "androidx.activity:activity-compose:$activityVersion"

        object Compose {
            const val snapshot = ""
            const val version = "1.3.0-rc01"
            const val compilerVersion = "1.3.2"
            const val coilCompose = "2.2.2"

            const val runtime = "androidx.compose.runtime:runtime:$version"
            const val foundation = "androidx.compose.foundation:foundation:$version"
            const val layout = "androidx.compose.foundation:foundation-layout:$version"

            const val ui = "androidx.compose.ui:ui:$version"
            const val material = "androidx.compose.material:material:$version"
//            const val material3 = "androidx.compose.material:material3:${version}"
            const val materialIconsExtended = "androidx.compose.material:material-icons-extended:${version}"

            const val animation = "androidx.compose.animation:animation:$version"

            const val tooling = "androidx.compose.ui:ui-tooling:$version"
            const val test = "androidx.compose.ui:ui-test:$version"
            const val coil = "io.coil-kt:coil-compose:$coilCompose"
        }

        object Test {
            private const val version = "1.4.0"
            const val core = "androidx.test:core:$version"
            const val rules = "androidx.test:rules:$version"
            const val espressoCore = "androidx.test.espresso:espresso-core:3.4.0"
        }

        object Room {
            private const val version = "2.4.3"
            const val runtime = "androidx.room:room-runtime:${version}"
            const val ktx = "androidx.room:room-ktx:${version}"
            const val compiler = "androidx.room:room-compiler:${version}"
        }

        object Lifecycle {
            private const val version = "2.5.1"
            const val extensions = "androidx.lifecycle:lifecycle-extensions:$version"
            const val viewModel = "androidx.lifecycle:lifecycle-viewmodel-ktx:$version"
            const val viewModelCompose = "androidx.lifecycle:lifecycle-viewmodel-compose:$version"
        }

        object Navigation {
            private const val version = "2.5.2"
            const val fragment = "androidx.navigation:navigation-fragment-ktx:$version"
            const val ui = "androidx.navigation:navigation-ui-ktx:$version"
            const val dynamicFeatures = "androidx.navigation:navigation-dynamic-features-fragment:$version"
            const val testing = "androidx.navigation:navigation-testing:$version"
            const val safeArgs = "androidx.navigation:navigation-safe-args-gradle-plugin:$version"
            const val navigationCompose = "androidx.navigation:navigation-compose:$version"
        }

        object WorkManager {
            private const val version = "2.7.1"
            const val workManager = "androidx.work:work-runtime-ktx:$version"
            const val gcmNetworkManager = "androidx.work:work-gcm:$version"
            const val test = "androidx.work:work-testing:$version"
        }
    }
}
