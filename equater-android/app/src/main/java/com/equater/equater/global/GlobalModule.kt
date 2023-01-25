package com.equater.equater.global

import android.content.Context
import android.content.SharedPreferences
import androidx.room.Room
import com.equater.equater.BuildConfig
import com.equater.equater.database.EquaterDatabase
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.PropertyNamingStrategies
import com.fasterxml.jackson.module.kotlin.KotlinFeature
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.net.PlacesClient
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.jackson.JacksonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
class GlobalModule {
    @Provides
    fun provideSharedPreferences(
        @ApplicationContext context: Context
    ): SharedPreferences {
        return context.getSharedPreferences(
            SHARED_PREFERENCES_KEY,
            Context.MODE_PRIVATE
        )
    }

    @Provides
    @Singleton
    fun retrofit(jackson: ObjectMapper, httpClient: OkHttpClient): Retrofit {
        val converter = JacksonConverterFactory.create(jackson)

        return Retrofit
            .Builder()
            .baseUrl(BuildConfig.API_BASE)
            .client(httpClient)
            .addConverterFactory(converter)
            .build()
    }

    @Provides
    @Singleton
    fun jackson(): ObjectMapper {
        return jacksonObjectMapper()
            .registerModule(
                KotlinModule.Builder()
                    .configure(KotlinFeature.NullToEmptyCollection, true)
                    .configure(KotlinFeature.NullToEmptyMap, false)
                    .configure(KotlinFeature.NullIsSameAsDefault, true)
                    .configure(KotlinFeature.StrictNullChecks, false)
                    .build()
            )
            .setPropertyNamingStrategy(
                PropertyNamingStrategies.LOWER_CAMEL_CASE
            )
    }

    @Provides
    @Singleton
    fun okHttp(preferences: SharedPreferences): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor()

        loggingInterceptor.level = if (EnvironmentService.isProduction()) {
            HttpLoggingInterceptor.Level.NONE
        } else {
            HttpLoggingInterceptor.Level.BASIC
        }

        val client = OkHttpClient.Builder()
        client.addInterceptor(loggingInterceptor)
        client.addInterceptor(AuthorizationInterceptor(preferences))
        client.connectTimeout(1, TimeUnit.SECONDS)
        client.writeTimeout(30, TimeUnit.SECONDS)
        client.readTimeout(30, TimeUnit.SECONDS)

        return client.build()
    }

    @Provides
    fun context(@ApplicationContext context: Context) = context

    @Provides
    @Singleton
    fun createPlacesClient(context: Context): PlacesClient {
        Places.initialize(context, BuildConfig.GOOGLE_API_KEY)

        return Places.createClient(context)
    }

    @Provides
    @Singleton
    fun createDatabase(@ApplicationContext context: Context): EquaterDatabase {
        return Room
            .databaseBuilder(context, EquaterDatabase::class.java, "equater")
            .build()
    }
}
