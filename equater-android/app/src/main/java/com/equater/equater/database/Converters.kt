package com.equater.equater.database

import androidx.room.TypeConverter
import com.equater.equater.authentication.Institution
import com.equater.equater.authentication.PlaidLinkToken
import com.equater.equater.sharedExpenseCreation.SharedExpenseStory
import com.equater.equater.sharedExpenseCreation.TransactionStory
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class Converters {
    @ExperimentalSerializationApi
    @TypeConverter
    fun fromList(value: List<String>) = Json.encodeToString(value)

    @ExperimentalSerializationApi
    @TypeConverter
    fun toList(value: String) = Json.decodeFromString<List<String>>(value)

    @ExperimentalSerializationApi
    @TypeConverter
    fun fromLinkTokenList(value: List<PlaidLinkToken>) = Json.encodeToString(value)

    @ExperimentalSerializationApi
    @TypeConverter
    fun toLinkTokenList(value: String) = Json.decodeFromString<List<PlaidLinkToken>>(value)

    @ExperimentalSerializationApi
    @TypeConverter
    fun fromInstitution(value: Institution) = Json.encodeToString(value)

    @ExperimentalSerializationApi
    @TypeConverter
    fun toInstitution(value: String) = Json.decodeFromString<Institution>(value)

    @ExperimentalSerializationApi
    @TypeConverter
    fun fromSharedExpenseStory(value: SharedExpenseStory) = Json.encodeToString(value)

    @ExperimentalSerializationApi
    @TypeConverter
    fun toSharedExpenseStory(value: String) = Json.decodeFromString<SharedExpenseStory>(value)

    @ExperimentalSerializationApi
    @TypeConverter
    fun fromTransactionStory(value: TransactionStory) = Json.encodeToString(value)

    @ExperimentalSerializationApi
    @TypeConverter
    fun toTransactionStory(value: String) = Json.decodeFromString<TransactionStory>(value)
}
