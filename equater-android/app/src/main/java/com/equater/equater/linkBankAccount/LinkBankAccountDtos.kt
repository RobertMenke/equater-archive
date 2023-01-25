package com.equater.equater.linkBankAccount

import com.equater.equater.authentication.User
import com.equater.equater.authentication.UserAccount
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.core.JsonProcessingException
import com.fasterxml.jackson.databind.JsonMappingException
import com.fasterxml.jackson.databind.ObjectMapper

data class PlaidLinkResponse(
    val token: String,
    val metaData: PlaidMetaData
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class PlaidMetaData(
    val account: PlaidAccount,
    val institution: PlaidInstitution
) {
    companion object {
        @Throws(JsonProcessingException::class, JsonMappingException::class)
        fun fromJson(mapper: ObjectMapper, json: String): PlaidMetaData {
            return mapper.readValue(json, PlaidMetaData::class.java)
        }
    }
}

data class PlaidAccount(
    val id: String,
    val name: String,
    val subtype: String,
    val type: String,
    val mask: String
)

data class PlaidInstitution(
    val institution_id: String,
    val name: String,
    var institutionId: String = ""
) {
    // Ugly hack working around limitations in jackson
    init {
        institutionId = institution_id
    }
}

data class PatchBankAccountResponse(
    val user: User,
    val userAccounts: ArrayList<UserAccount>
)

sealed class LinkAccountAction
class NewPlaidAccount(val dto: PlaidLinkResponse) : LinkAccountAction()
class UpdatedPlaidAccount(val account: UserAccount) : LinkAccountAction()
class LinkAccountError(val error: Throwable) : LinkAccountAction()
