package com.equater.equater.transaction

import android.os.Parcelable
import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.PrimaryKey
import com.equater.equater.authentication.User
import com.equater.equater.sharedExpenseCreation.TransactionStory
import kotlinx.parcelize.Parcelize

@Parcelize
@Entity(
    tableName = "agreement_transaction",
    foreignKeys = [
        ForeignKey(
            entity = User::class,
            parentColumns = arrayOf("id"),
            childColumns = arrayOf("authenticatedUserId"),
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class TransactionEntity(
    // Primary key is the transaction id
    @PrimaryKey
    val id: Int,
    @ColumnInfo(index = true)
    val authenticatedUserId: Int,
    val story: TransactionStory,
    val dateTime: Long
) : Parcelable
