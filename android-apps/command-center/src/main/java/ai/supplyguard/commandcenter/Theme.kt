package ai.supplyguard.commandcenter

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Command Center palette — deep purple / indigo — authority, command, oversight
private val ccPrimary            = Color(0xFF4527A0) // deep purple
private val ccOnPrimary          = Color(0xFFFFFFFF)
private val ccPrimaryContainer   = Color(0xFFEDE7F6)
private val ccOnPrimaryContainer = Color(0xFF21005D)

private val ccSecondary          = Color(0xFF283593) // indigo
private val ccOnSecondary        = Color(0xFFFFFFFF)
private val ccSecondaryContainer = Color(0xFFE8EAF6)
private val ccOnSecondaryContainer = Color(0xFF00105C)

private val ccTertiary           = Color(0xFF6200EA)
private val ccOnTertiary         = Color(0xFFFFFFFF)

// Dark scheme
private val CommandCenterDarkColorScheme = darkColorScheme(
    primary             = Color(0xFFCFBCFF),
    onPrimary           = Color(0xFF21005D),
    primaryContainer    = Color(0xFF381E72),
    onPrimaryContainer  = Color(0xFFEADDFF),
    secondary           = Color(0xFFB0C6FF),
    onSecondary         = Color(0xFF002D6F),
    secondaryContainer  = Color(0xFF00419C),
    onSecondaryContainer = Color(0xFFD7E2FF),
    tertiary            = Color(0xFFE0B0FF),
    onTertiary          = Color(0xFF4A0072),
    error               = Color(0xFFFFB4AB),
    onError             = Color(0xFF690005),
    errorContainer      = Color(0xFF93000A),
    onErrorContainer    = Color(0xFFFFDAD6),
    background          = Color(0xFF131318),
    onBackground        = Color(0xFFE4E1EA),
    surface             = Color(0xFF131318),
    onSurface           = Color(0xFFE4E1EA),
    surfaceVariant      = Color(0xFF231F2E),
    onSurfaceVariant    = Color(0xFFC9C4D0),
    outline             = Color(0xFF938F99),
)

// Light scheme
private val CommandCenterLightColorScheme = lightColorScheme(
    primary             = ccPrimary,
    onPrimary           = ccOnPrimary,
    primaryContainer    = ccPrimaryContainer,
    onPrimaryContainer  = ccOnPrimaryContainer,
    secondary           = ccSecondary,
    onSecondary         = ccOnSecondary,
    secondaryContainer  = ccSecondaryContainer,
    onSecondaryContainer = ccOnSecondaryContainer,
    tertiary            = ccTertiary,
    onTertiary          = ccOnTertiary,
)

@Composable
fun CommandCenterTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) CommandCenterDarkColorScheme else CommandCenterLightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        content = content,
    )
}
