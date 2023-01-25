package com.equater.equater.manageAgreements

import android.os.Parcelable
import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.PrimaryKey
import com.equater.equater.authentication.User
import com.equater.equater.sharedExpenseCreation.SharedExpenseStory
import kotlinx.parcelize.Parcelize
import kotlinx.serialization.ExperimentalSerializationApi

@OptIn(ExperimentalSerializationApi::class)
@Parcelize
@Entity(
    tableName = "agreement",
    foreignKeys = [
        ForeignKey(
            entity = User::class,
            parentColumns = arrayOf("id"),
            childColumns = arrayOf("authenticatedUserId"),
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class SharedExpenseEntity(
    // primary key is the shared expense id
    @PrimaryKey
    val id: Int,
    @ColumnInfo(index = true)
    val authenticatedUserId: Int,
    // TODO: Consider using @Embedded here instead of relying on a json string
    val story: SharedExpenseStory,
    val dateTime: Long
) : Parcelable
