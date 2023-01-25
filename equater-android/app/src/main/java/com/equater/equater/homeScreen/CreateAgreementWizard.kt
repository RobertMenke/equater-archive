package com.equater.equater.homeScreen

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import coil.compose.rememberAsyncImagePainter
import com.equater.equater.R
import com.equater.equater.extensions.asFloat
import com.equater.equater.navigation.Route
import com.equater.equater.ui.frameFillParent
import com.equater.equater.ui.frameFillWidth

@Composable
fun CreateAgreementWizard(navController: NavController) {
    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val cardVerticalPadding = 16.dp
        val numberOfCards = 2
        val cardHeight = (maxHeight / 2) - (cardVerticalPadding * numberOfCards)

        Column(
            modifier = frameFillParent.padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.SpaceAround,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            SharedBillCard(
                onClick = { navController.navigate(Route.SharedBill.route) },
                modifier = Modifier.frameFillWidth(height = cardHeight)
            )

            ScheduledPaymentsCard(
                onClick = { navController.navigate(Route.ScheduledPayment.route) },
                modifier = Modifier.frameFillWidth(height = cardHeight)
            )
        }
    }
}

@Composable
fun SharedBillCard(onClick: () -> Unit, modifier: Modifier = Modifier) {
    val colors = remember { listOf(Color(0xffB91794), Color(0xff7924CB)) }
    val imageRepresentationPainter = rememberAsyncImagePainter(R.drawable.teamwork_carry_bitmap)
    val forwardIconPainter = rememberAsyncImagePainter(R.drawable.forward_white_filled_bitmap)
    val context = LocalContext.current

    RadialGradientCard(
        colors = colors,
        modifier = modifier.fillMaxWidth(),
        onClick = onClick
    ) {
        Box(modifier = Modifier.padding(16.dp)) {
            Box(contentAlignment = Alignment.BottomStart, modifier = Modifier.fillMaxHeight()) {
                Image(
                    painter = imageRepresentationPainter,
                    contentDescription = "Shared bill image representation",
                    modifier = Modifier.fillMaxHeight(0.6f)
                )
            }

            Box(
                contentAlignment = Alignment.BottomEnd,
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth()
            ) {
                Image(painter = forwardIconPainter, contentDescription = "Navigate to shared bill agreement wizard")
            }

            Box(contentAlignment = Alignment.TopStart, modifier = Modifier.fillMaxHeight()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .fillMaxHeight()
                ) {
                    Text(
                        text = "Set Up a Shared Bill",
                        style = MaterialTheme.typography.h4.copy(
                            color = Color(0xffffffff),
                            shadow = Shadow(blurRadius = 8f, offset = Offset(0f, 4f))
                        )
                    )
                    Text(
                        text = context.getString(R.string.shared_bill_description),
                        style = MaterialTheme.typography.body1.copy(
                            color = Color(0xffffffff),
                            shadow = Shadow(blurRadius = 8f, offset = Offset(0f, 6f))
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun ScheduledPaymentsCard(onClick: () -> Unit, modifier: Modifier = Modifier) {
    val colors = remember { listOf(Color(0xff2C6EFF), Color(0xff252FCA)) }
    val imageRepresentationPainter = rememberAsyncImagePainter(R.drawable.credit_card_3d_bitmap)
    val forwardIconPainter = rememberAsyncImagePainter(R.drawable.forward_white_filled_bitmap)
    val context = LocalContext.current

    RadialGradientCard(
        colors = colors,
        modifier = modifier.fillMaxWidth(),
        onClick = onClick
    ) {
        Box(modifier = Modifier.padding(16.dp)) {
            Box(contentAlignment = Alignment.BottomStart, modifier = Modifier.fillMaxHeight()) {
                Image(
                    painter = imageRepresentationPainter,
                    contentDescription = "Scheduled payments image representation",
                    modifier = Modifier.fillMaxHeight(0.6f)
                )
            }

            Box(
                contentAlignment = Alignment.BottomEnd,
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth()
            ) {
                Image(
                    painter = forwardIconPainter,
                    contentDescription = "Navigate to scheduled payments agreement wizard"
                )
            }

            Box(contentAlignment = Alignment.TopStart, modifier = Modifier.fillMaxHeight()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .fillMaxHeight()
                ) {
                    Text(
                        text = "Set Up Scheduled Payments",
                        style = MaterialTheme.typography.h4.copy(
                            color = Color(0xffffffff),
                            shadow = Shadow(blurRadius = 8f, offset = Offset(0f, 4f))
                        )
                    )
                    Text(
                        text = context.getString(R.string.scheduled_payment_description),
                        style = MaterialTheme.typography.body1.copy(
                            color = Color(0xffffffff),
                            shadow = Shadow(blurRadius = 8f, offset = Offset(0f, 6f))
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun RadialGradientCard(
    colors: List<Color>,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    BoxWithConstraints(modifier = modifier.shadow(12.dp)) {
        val widthInPixels = maxWidth.asFloat()
        val heightInPixels = maxHeight.asFloat()

        Box(
            modifier = Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(8.dp))
                .background(
                    brush = Brush.radialGradient(
                        colors = colors,
                        center = Offset(widthInPixels / 2, heightInPixels),
                        radius = heightInPixels / 2
                    )
                )
                .clickable { onClick() }
        ) {
            content()
        }
    }
}
