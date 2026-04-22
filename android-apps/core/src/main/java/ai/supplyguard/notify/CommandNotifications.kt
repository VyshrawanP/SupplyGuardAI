package ai.supplyguard.notify

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import ai.supplyguard.data.CommandPayload
import ai.supplyguard.data.CommandPriority

object CommandNotifications {
  private const val CHANNEL_DEFAULT_ID = "sg_commands"
  private const val CHANNEL_URGENT_ID = "sg_commands_urgent"

  private fun ensureChannels(context: Context) {
    if (Build.VERSION.SDK_INT < 26) return
    val manager = context.getSystemService(NotificationManager::class.java) ?: return

    val defaultChannel = NotificationChannel(
      CHANNEL_DEFAULT_ID,
      "SupplyGuard Commands",
      NotificationManager.IMPORTANCE_DEFAULT,
    ).apply {
      description = "Command Center updates for field devices."
    }

    val urgentChannel = NotificationChannel(
      CHANNEL_URGENT_ID,
      "SupplyGuard Urgent Commands",
      NotificationManager.IMPORTANCE_HIGH,
    ).apply {
      description = "Warning and critical command updates."
    }

    manager.createNotificationChannel(defaultChannel)
    manager.createNotificationChannel(urgentChannel)
  }

  private fun buildLaunchIntent(context: Context): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    return PendingIntent.getActivity(
      context,
      0,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0),
    )
  }

  fun notifyCommand(context: Context, messageId: String, payload: CommandPayload) {
    ensureChannels(context)

    val channelId = when (payload.priority) {
      CommandPriority.CRITICAL, CommandPriority.WARNING -> CHANNEL_URGENT_ID
      CommandPriority.INFO -> CHANNEL_DEFAULT_ID
    }

    val title = payload.title?.takeIf { it.isNotBlank() }
      ?: when (payload.priority) {
        CommandPriority.CRITICAL -> "CRITICAL update"
        CommandPriority.WARNING -> "WARNING update"
        CommandPriority.INFO -> "Update"
      }

    val body = payload.message
    val pendingIntent = buildLaunchIntent(context)

    val notification = NotificationCompat.Builder(context, channelId)
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setAutoCancel(true)
      .setPriority(
        when (payload.priority) {
          CommandPriority.CRITICAL -> NotificationCompat.PRIORITY_MAX
          CommandPriority.WARNING -> NotificationCompat.PRIORITY_HIGH
          CommandPriority.INFO -> NotificationCompat.PRIORITY_DEFAULT
        },
      )
      .apply {
        if (pendingIntent != null) setContentIntent(pendingIntent)
      }
      .build()

    NotificationManagerCompat.from(context).notify(messageId.hashCode(), notification)
  }
}

