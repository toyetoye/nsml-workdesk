import type {
  CorrespondenceMessageRow,
  CorrespondenceThreadRow,
} from "@/lib/persistence/types";

export type ThreadMatchKind =
  | "references"
  | "in-reply-to"
  | "message-id"
  | "subject"
  | "sender-date"
  | "none";

export type ThreadMatchResult = {
  threadId: string | null;
  matchKind: ThreadMatchKind;
  possibleRelatedThreadIds: string[];
  explanation: string;
};

function normalizeHeaderValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function normalizeCorrespondenceSender(value: string | null | undefined) {
  const text = normalizeHeaderValue(value);
  const emailMatch = text.match(/<([^>]+)>/);

  if (emailMatch?.[1]) {
      return emailMatch[1].trim().toLowerCase();
  }

  const extractedEmail = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  if (extractedEmail?.[0]) {
    return extractedEmail[0].trim().toLowerCase();
  }

  return text.replace(/\s+/g, " ");
}

export function normalizeThreadSubject(subject: string | null | undefined) {
  const text = normalizeHeaderValue(subject)
    .replace(/^(re|fw|fwd)\s*:\s*/gi, "")
    .replace(/^\[[^\]]+\]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

function normalizeMessageId(value: string | null | undefined) {
  return normalizeHeaderValue(value).replace(/^<|>$/g, "");
}

function parseDateTime(value: string | null | undefined) {
  const parsed = value ? new Date(value) : null;

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.getTime();
}

function collectIdentifiers(values: Array<string | null | undefined>) {
  return values.map((value) => normalizeMessageId(value)).filter(Boolean);
}

function buildThreadIndex(
  threadRows: CorrespondenceThreadRow[],
  messageRows: CorrespondenceMessageRow[],
) {
  const messagesByThread = new Map<string, CorrespondenceMessageRow[]>();
  for (const message of messageRows) {
    const list = messagesByThread.get(message.thread_id) ?? [];
    list.push(message);
    messagesByThread.set(message.thread_id, list);
  }

  return threadRows.map((thread) => {
    const messages = (messagesByThread.get(thread.thread_id) ?? []).sort(
      (left, right) => left.sort_order - right.sort_order,
    );
    const identifiers = collectIdentifiers([
      thread.message_id_header,
      thread.in_reply_to,
      ...thread.references,
      ...messages.flatMap((message) => [message.message_id_header, message.in_reply_to, ...message.references]),
    ]);

    const messageIds = new Set<string>(identifiers);
    const senderMessages = messages.length ? messages : [null];

    return {
      threadId: thread.thread_id,
      messageIds: [...messageIds],
      sender: thread.sender,
      normalizedSender: normalizeCorrespondenceSender(thread.sender),
      normalizedSubject: normalizeThreadSubject(thread.subject),
      sentAt: parseDateTime(thread.date_time) ?? Date.now(),
      workspaceKey: thread.workspace_key,
      caseId: thread.case_id ?? thread.linked_case_id ?? null,
      sourceEvidenceId: thread.source_evidence_id ?? null,
      parseStatus: thread.parse_status,
      messageCount: messages.length,
      lastMessageSender: senderMessages[senderMessages.length - 1]?.sender ?? thread.sender,
    };
  });
}

function uniqueSortedIds(ids: string[]) {
  return [...new Set(ids)].sort();
}

export function matchParsedThreadToExistingThreads(
  parsed: {
    messageId: string | null;
    inReplyTo: string | null;
    references: string[];
    subject: string;
    from: string;
    sentAtIso: string;
    workspaceKey: string;
    caseId: string | null;
  },
  threadRows: CorrespondenceThreadRow[],
  messageRows: CorrespondenceMessageRow[],
): ThreadMatchResult {
  const index = buildThreadIndex(threadRows, messageRows);
  const subject = normalizeThreadSubject(parsed.subject);
  const sender = normalizeCorrespondenceSender(parsed.from);
  const parsedMessageId = normalizeMessageId(parsed.messageId);
  const parsedInReplyTo = normalizeMessageId(parsed.inReplyTo);
  const parsedReferences = collectIdentifiers(parsed.references);
  const parsedDateMs = parseDateTime(parsed.sentAtIso) ?? Date.now();
  const relatedThreadIds = new Set<string>();

  const referenceIds = [...parsedReferences].reverse();
  for (const referenceId of referenceIds) {
    const match = index.find((thread) => thread.messageIds.includes(referenceId));
    if (match) {
      return {
        threadId: match.threadId,
        matchKind: "references",
        possibleRelatedThreadIds: [],
        explanation: "Matched via reference chain.",
      };
    }
  }

  if (parsedInReplyTo) {
    const match = index.find((thread) => thread.messageIds.includes(parsedInReplyTo));
    if (match) {
      return {
        threadId: match.threadId,
        matchKind: "in-reply-to",
        possibleRelatedThreadIds: [],
        explanation: "Matched via In-Reply-To header.",
      };
    }
  }

  if (parsedMessageId) {
    const match = index.find((thread) => thread.messageIds.includes(parsedMessageId));
    if (match) {
      return {
        threadId: match.threadId,
        matchKind: "message-id",
        possibleRelatedThreadIds: [],
        explanation: "Matched via Message-ID header.",
      };
    }
  }

  const subjectCandidates = index.filter((thread) => thread.normalizedSubject === subject);
  const conservativeMatches = subjectCandidates.filter((candidate) => {
    const sameSender = candidate.normalizedSender === sender;
    const sameWorkspace = candidate.workspaceKey === parsed.workspaceKey;
    const sameCase = parsed.caseId ? candidate.caseId === parsed.caseId : false;
    const timeDeltaHours = Math.abs(candidate.sentAt - parsedDateMs) / (60 * 60 * 1000);

    return (sameSender && (sameWorkspace || sameCase) && timeDeltaHours <= 24) || (sameSender && timeDeltaHours <= 6);
  });

  if (conservativeMatches.length === 1) {
    return {
      threadId: conservativeMatches[0].threadId,
      matchKind: "subject",
      possibleRelatedThreadIds: [],
      explanation: "Matched conservatively by normalized subject, sender, and time proximity.",
    };
  }

  for (const candidate of subjectCandidates.slice(0, 3)) {
    relatedThreadIds.add(candidate.threadId);
  }

  return {
    threadId: null,
    matchKind: subjectCandidates.length > 0 ? "sender-date" : "none",
    possibleRelatedThreadIds: uniqueSortedIds([...relatedThreadIds]),
    explanation:
      subjectCandidates.length > 0
        ? "Possible related thread based on normalized subject and sender/date proximity."
        : "No deterministic thread match found.",
  };
}

export function buildPossibleRelatedThreadIds(
  currentThreadId: string,
  subject: string,
  sender: string,
  sentAtIso: string,
  threadRows: CorrespondenceThreadRow[],
  messageRows: CorrespondenceMessageRow[],
) {
  const index = buildThreadIndex(threadRows, messageRows);
  const normalizedSubject = normalizeThreadSubject(subject);
  const normalizedSender = normalizeCorrespondenceSender(sender);
  const parsedDateMs = parseDateTime(sentAtIso) ?? Date.now();

  return index
    .filter((candidate) => candidate.threadId !== currentThreadId)
    .filter((candidate) => candidate.normalizedSubject === normalizedSubject)
    .filter((candidate) => {
      const sameSender = candidate.normalizedSender === normalizedSender;
      const timeDeltaHours = Math.abs(candidate.sentAt - parsedDateMs) / (60 * 60 * 1000);

      return sameSender && timeDeltaHours <= 24;
    })
    .slice(0, 3)
    .map((candidate) => candidate.threadId);
}
