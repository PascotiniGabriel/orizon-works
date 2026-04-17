import { db } from "@/lib/db";
import { agents, agentBriefings, companyBriefings } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export interface AgentWithBriefings {
  agent: {
    id: string;
    type: string;
    customName: string | null;
    avatarUrl: string | null;
  };
  companyBriefing: {
    companyName: string | null;
    segment: string | null;
    mission: string | null;
    values: string | null;
    communicationTone: string | null;
    targetAudience: string | null;
    mainProducts: string | null;
    additionalContext: string | null;
    compiledPrompt: string | null;
  } | null;
  agentBriefing: {
    sectorContext: string | null;
    specificInstructions: string | null;
    restrictedTopics: string | null;
    preferredExamples: string | null;
    compiledPrompt: string | null;
    isComplete: boolean;
  } | null;
}

export async function getAgentWithBriefings(
  agentId: string,
  companyId: string
): Promise<AgentWithBriefings | null> {
  const [agent] = await db
    .select({
      id: agents.id,
      type: agents.type,
      customName: agents.customName,
      avatarUrl: agents.avatarUrl,
    })
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.companyId, companyId)));

  if (!agent) return null;

  const [cb] = await db
    .select({
      companyName: companyBriefings.companyName,
      segment: companyBriefings.segment,
      mission: companyBriefings.mission,
      values: companyBriefings.values,
      communicationTone: companyBriefings.communicationTone,
      targetAudience: companyBriefings.targetAudience,
      mainProducts: companyBriefings.mainProducts,
      additionalContext: companyBriefings.additionalContext,
      compiledPrompt: companyBriefings.compiledPrompt,
    })
    .from(companyBriefings)
    .where(eq(companyBriefings.companyId, companyId));

  const [ab] = await db
    .select({
      sectorContext: agentBriefings.sectorContext,
      specificInstructions: agentBriefings.specificInstructions,
      restrictedTopics: agentBriefings.restrictedTopics,
      preferredExamples: agentBriefings.preferredExamples,
      compiledPrompt: agentBriefings.compiledPrompt,
      isComplete: agentBriefings.isComplete,
    })
    .from(agentBriefings)
    .where(eq(agentBriefings.agentId, agentId));

  return {
    agent,
    companyBriefing: cb ?? null,
    agentBriefing: ab ?? null,
  };
}
