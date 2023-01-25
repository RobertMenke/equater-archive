package com.equater.equater.searchUsers

import android.os.Parcelable
import com.equater.equater.authentication.User
import kotlinx.parcelize.Parcelize
import kotlinx.serialization.Serializable

@Serializable
@Parcelize
data class UserSearchResponse(
    val friends: List<User>,
    val users: List<User>
) : Parcelable
