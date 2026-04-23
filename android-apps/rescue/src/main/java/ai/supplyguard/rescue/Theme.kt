package ai.supplyguard.rescue

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Rescue palette — trustworthy blues and teals, calm & professional
private val rescuePrimary        = Color(0xFF0277BD) // strong blue
private val rescueOnPrimary      = Color(0xFFFFFFFF)
private val rescuePrimaryContainer  = Color(0xFFCCE5FF)
private val rescueOnPrimaryContainer = Color(0xFF001D36)

private val rescueSecondary      = Color(0xFF00897B) // teal
private val rescueOnSecondary    = Color(0xFFFFFFFF)
private val rescueSecondaryContainer = Color(0xFFB2DFDB)
private val rescueOnSecondaryContainer = Color(0xFF002019)

private val rescueTertiary       = Color(0xFF00796B)
private val rescueOnTertiary     = Color(0xFFFFFFFF)

// Dark scheme
private val RescueDarkColorScheme = darkColorScheme(
    primary             = Color(0xFF90CAF9),
    onPrimary           = Color(0xFF003258),
    primaryContainer    = Color(0xFF00497D),
    onPrimaryContainer  = Color(0xFFD1E4FF),
    secondary           = Color(0xFF80CBC4),
    onSecondary         = Color(0xFF003733),
    secondaryContainer  = Color(0xFF005048),
    onSecondaryContainer = Color(0xFF9EF2EA),
    tertiary            = Color(0xFF80CBC4),
    onTertiary          = Color(0xFF00201D),
    error               = Color(0xFFFFB4AB),
    onError             = Color(0xFF690005),
    errorContainer      = Color(0xFF93000A),
    onErrorContainer    = Color(0xFFFFDAD6),
    background          = Color(0xFF0F1419),
    onBackground        = Color(0xFFE1E3E8),
    surface             = Color(0xFF0F1419),
    onSurface           = Color(0xFFE1E3E8),
    surfaceVariant      = Color(0xFF1C2B38),
    onSurfaceVariant    = Color(0xFFBDC7D0),
    outline             = Color(0xFF87919A),
)

// Light scheme
private val RescueLightColorScheme = lightColorScheme(
    primary             = rescuePrimary,
    onPrimary           = rescueOnPrimary,
    primaryContainer    = rescuePrimaryContainer,
    onPrimaryContainer  = rescueOnPrimaryContainer,
    secondary           = rescueSecondary,
    onSecondary         = rescueOnSecondary,
    secondaryContainer  = rescueSecondaryContainer,
    onSecondaryContainer = rescueOnSecondaryContainer,
    tertiary            = rescueTertiary,
    onTertiary          = rescueOnTertiary,
)

@Composable
fun RescueTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) RescueDarkColorScheme else RescueLightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        content = content,
    )
}
