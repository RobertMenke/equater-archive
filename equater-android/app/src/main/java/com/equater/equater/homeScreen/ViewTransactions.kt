package com.equater.equater.homeScreen

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavHostController
import com.equater.equater.R
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.components.NotFound
import com.equater.equater.components.PhotoAvatar
import com.equater.equater.profile.LocalImage
import com.equater.equater.profile.Photo
import com.equater.equater.profile.VendorLogo
import com.equater.equater.searchVendors.Vendor
import com.equater.equater.sharedExpenseCreation.TransactionStory
import com.equater.equater.transaction.TransactionListItem
import com.equater.equater.transaction.TransactionViewModel
import com.equater.equater.ui.textPrimaryColor
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState

@Composable
fun ViewTransactions(
    navController: NavHostController,
    authViewModel: AuthenticationViewModel,
    transactionViewModel: TransactionViewModel,
    initialTransactionFilter: TransactionFilter? = null
) {
    val context = LocalContext.current
    val transactions by transactionViewModel.transactions.collectAsState()
    val filters by derivedStateOf { TransactionFilter.unique(transactions) }
    var selectedFilter by remember { mutableStateOf(initialTransactionFilter) }
    val isRefreshing by transactionViewModel.isRefreshingAgreements.collectAsState()
    val isLoading by transactionViewModel.isLoading.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp)
                .padding(vertical = 8.dp, horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            filters.forEach { filter ->
                item(filter.identifier()) {
                    var boxModifier = Modifier
                        .fillMaxHeight()
                        .padding(2.dp)

                    if (filter.isSame(selectedFilter)) {
                        boxModifier = boxModifier
                            .clip(RoundedCornerShape(4.dp))
                            .border(2.dp, textPrimaryColor())
                    }

                    Box(modifier = boxModifier, contentAlignment = Alignment.Center) {
                        PhotoAvatar(
                            photo = filter.getPhoto(),
                            modifier = Modifier
                                .size(70.dp)
                                .padding(10.dp),
                            onClick = {
                                selectedFilter = if (selectedFilter?.isSame(filter) == true) null else filter
                            }
                        )
                    }
                }
            }
        }

        val listState = rememberLazyListState()
        SwipeRefresh(
            state = rememberSwipeRefreshState(isRefreshing),
            onRefresh = {
                transactionViewModel.refreshTransactions(context) {
                    listState.animateScrollToItem(0)
                }
            }
        ) {
            when {
                isLoading && transactions.isEmpty() -> {
                    Row(
                        modifier = Modifier.fillMaxWidth().height(250.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(color = textPrimaryColor(), strokeWidth = 1.dp)
                    }
                }
                transactions.isEmpty() -> {
                    NotFound(text = "Awaiting your first transaction")
                }
                else -> {
                    LazyColumn(state = listState, modifier = Modifier.padding(horizontal = 14.dp)) {
                        val filter = selectedFilter
                        val filteredTransactions =
                            if (filter == null) transactions else transactions.filter { filter.belongs(it) }

                        items(
                            filteredTransactions.size,
                            { index -> filteredTransactions[index].transaction.id }
                        ) { index ->
                            val transaction = filteredTransactions[index]
                            TransactionListItem(authViewModel, transaction) {
                                navController.navigate("transaction/detail/${transaction.transaction.id}")
                            }
                        }
                    }
                }
            }
        }
    }
}

sealed class TransactionFilter {
    @Composable
    fun getPhoto(): Photo {
        val context = LocalContext.current

        return remember {
            when (this) {
                is MerchantFilter -> VendorLogo(context, vendor)
                is ScheduledPaymentFilter -> LocalImage(context, R.drawable.clock_icon_white_clipped)
            }
        }
    }

    fun isSame(other: TransactionFilter?): Boolean {
        if (other == null) {
            return false
        }

        return when (this) {
            is MerchantFilter -> if (other is MerchantFilter) vendor.id == other.vendor.id else false
            is ScheduledPaymentFilter -> other is ScheduledPaymentFilter
        }
    }

    fun belongs(story: TransactionStory): Boolean {
        return when (this) {
            is MerchantFilter -> vendor.id == story.vendor?.id
            is ScheduledPaymentFilter -> story.vendor == null
        }
    }

    fun identifier() = when (this) {
        is MerchantFilter -> vendor.id
        ScheduledPaymentFilter -> 0
    }

    companion object {
        private fun fromTransaction(story: TransactionStory): TransactionFilter {
            val vendor = story.vendor

            return if (vendor != null) MerchantFilter(vendor) else ScheduledPaymentFilter
        }

        fun fromBackStackEntry(
            backStackEntry: NavBackStackEntry,
            transactionViewModel: TransactionViewModel
        ): TransactionFilter? {
            val vendorId = backStackEntry.arguments?.getString("filter") ?: return null

            val id = Integer.parseInt(vendorId)

            if (id == 0) {
                return ScheduledPaymentFilter
            }

            val vendor = transactionViewModel.findVendorById(id)

            return if (vendor != null) MerchantFilter(vendor) else null
        }

        fun unique(list: List<TransactionStory>): List<TransactionFilter> {
            val filters = list.map(TransactionFilter::fromTransaction)
            val filteredList = mutableListOf<TransactionFilter>()
            val seen = hashMapOf<Int, Boolean>()
            var hasSeenScheduled = false

            filters.forEach { item ->
                when (item) {
                    is MerchantFilter -> {
                        if (!seen.containsKey(item.vendor.id)) {
                            seen[item.vendor.id] = true
                            filteredList.add(item)
                        }
                    }
                    is ScheduledPaymentFilter -> {
                        if (!hasSeenScheduled) {
                            hasSeenScheduled = true
                            filteredList.add(0, item)
                        }
                    }
                }
            }

            return filteredList
        }
    }
}

class MerchantFilter(val vendor: Vendor) : TransactionFilter()
object ScheduledPaymentFilter : TransactionFilter()
