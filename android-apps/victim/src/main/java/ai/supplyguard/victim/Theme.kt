package ai.supplyguard.victim

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Emergency / Victim palette — warm reds and oranges signalling urgency
private val victimPrimary       = Color(0xFFE53935) // vivid red
private val victimOnPrimary     = Color(0xFFFFFFFF)
private val victimPrimaryContainer  = Color(0xFFFFDAD6)
private val victimOnPrimaryContainer = Color(0xFF410002)

private val victimSecondary     = Color(0xFFFF6D00) // deep orange accent
private val victimOnSecondary   = Color(0xFFFFFFFF)
private val victimSecondaryContainer = Color(0xFFFFDBCC)
private val victimOnSecondaryContainer = Color(0xFF331200)

private val victimTertiary      = Color(0xFFF9A825) // amber warning
private val victimOnTertiary    = Color(0xFF000000)

private val victimError         = Color(0xFFB71C1C)
private val victimOnError       = Color(0xFFFFFFFF)
private val victimErrorContainer    = Color(0xFFFFDAD6)
private val victimOnErrorContainer  = Color(0xFF410002)

// Dark scheme
private val VictimDarkColorScheme = darkColorScheme(
    primary             = Color(0xFFFFB4AB),
    onPrimary           = Color(0xFF690005),
    primaryContainer    = Color(0xFF93000A),
    onPrimaryContainer  = Color(0xFFFFDAD6),
    secondary           = Color(0xFFFFB787),
    onSecondary         = Color(0xFF4E2500),
    secondaryContainer  = Color(0xFF6E3800),
    onSecondaryContainer = Color(0xFFFFDBCC),
    tertiary            = Color(0xFFFFD54F),
    onTertiary          = Color(0xFF3E2800),
    error               = Color(0xFFFFB4AB),
    onError             = Color(0xFF690005),
    errorContainer      = Color(0xFF93000A),
    onErrorContainer    = Color(0xFFFFDAD6),
    background          = Color(0xFF141218),
    onBackground        = Color(0xFFEAE0E8),
    surface             = Color(0xFF141218),
    onSurface           = Color(0xFFEAE0E8),
    surfaceVariant      = Color(0xFF2C2422),
    onSurfaceVariant    = Color(0xFFD8BDB8),
    outline             = Color(0xFFA08783),
)

// Light scheme
private val VictimLightColorScheme = lightColorScheme(
    primary             = victimPrimary,
    onPrimary           = victimOnPrimary,
    primaryContainer    = victimPrimaryContainer,
    onPrimaryContainer  = victimOnPrimaryContainer,
    secondary           = victimSecondary,
    onSecondary         = victimOnSecondary,
    secondaryContainer  = victimSecondaryContainer,
    onSecondaryContainer = victimOnSecondaryContainer,
    tertiary            = victimTertiary,
    onTertiary          = victimOnTertiary,
    error               = victimError,
    onError             = victimOnError,
    errorContainer      = victimErrorContainer,
    onErrorContainer    = victimOnErrorContainer,
)

@Composable
fun VictimTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) VictimDarkColorScheme else VictimLightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        content = content,
    )
}
