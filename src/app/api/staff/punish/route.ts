import { NextRequest, NextResponse } from "next/server";
import { ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";
import { addRole, sendContainer, PUNISHMENT_ROLES } from "@/lib/discord";
import { logStaffAction } from "@/lib/activity-log";

const PUNISH_LOG_CHANNEL = "1504840539990786130";

export async function POST(req: NextRequest) {
  const actorId = req.headers.get("x-user-id");
  const actorName = req.headers.get("x-user-name");

  if (!actorId || !actorName) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { targetId, targetName, roleId, reason } = body;

    if (!targetId || !roleId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const punishment = PUNISHMENT_ROLES.find((r) => r.id === roleId);
    if (!punishment) {
      return NextResponse.json({ error: "Invalid punishment role" }, { status: 400 });
    }

    // Assign the punishment role
    const success = await addRole(targetId, roleId);
    if (!success) {
      return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
    }

    // Log the action
    logStaffAction({
      actorId,
      actorName,
      action: "punish",
      targetId,
      targetName: targetName || targetId,
      reason,
      metadata: { roleId, roleName: punishment.name },
    });

    // Post v2 container to punishment log channel
    const container = new ContainerBuilder()
      .setAccentColor(parseInt(punishment.color.replace("#", ""), 16))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Punishment Issued**\n**Target:** <@${targetId}>\n**Action:** ${punishment.name}\n**Staff:** <@${actorId}>\n**Reason:** ${reason}`,
        ),
      );

    await sendContainer(PUNISH_LOG_CHANNEL, [container.toJSON()]);

    return NextResponse.json({ success: true, punishment: punishment.name });
  } catch (e) {
    console.error("[punish] Error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
