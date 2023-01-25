package com.equater.equater.searchUsers

import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Button
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.ui.frameFillWidth
import org.apache.commons.validator.routines.EmailValidator

@Composable
fun AddByEmailPrompt(viewModel: UserSearchViewModel = hiltViewModel()) {
    val context = LocalContext.current
    val query by viewModel.debouncedSearchQuery.collectAsState()
    val emailIsValid = EmailValidator.getInstance().isValid(query.trim())

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = "Invite your friends",
            style = MaterialTheme.typography.body1.copy(fontSize = 22.sp, fontWeight = FontWeight.ExtraBold),
            modifier = Modifier.padding(vertical = 8.dp)
        )
        Text(
            text = "We didn't find $query in our database. Type their email in the search box to add them.",
            style = MaterialTheme.typography.body1.copy(fontSize = 16.sp, lineHeight = 24.sp)
        )
        Button(
            modifier = Modifier
                .padding(top = 12.dp)
                .frameFillWidth(52.dp),
            onClick = {
                if (emailIsValid) {
                    viewModel.selectEmail(query)
                } else {
                    Toast.makeText(context, "Enter a valid email address", Toast.LENGTH_SHORT).show()
                }
            }
        ) {
            Text(text = "Add By Email", style = MaterialTheme.typography.body1.copy(color = Color.White))
        }
    }
}
